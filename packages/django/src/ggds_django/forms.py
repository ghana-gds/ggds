"""Render Django forms with GGDS.

Set FORM_RENDERER = "ggds_django.forms.GGDSFormRenderer" in settings, or give one form the renderer with
GGDSFormMixin. Then {{ form }} renders an error summary and every field in GGDS markup, and
{{ form.my_field.as_field_group }} renders one field.
"""
import calendar
from datetime import date

from django import forms
from django.core.exceptions import ValidationError
from django.forms.renderers import DjangoTemplates


class GGDSFormRenderer(DjangoTemplates):
    form_template_name = "ggds/forms/form.html"
    field_template_name = "ggds/forms/field.html"


class GGDSFormMixin:
    """Use GGDS for this form only: class ComplaintForm(GGDSFormMixin, forms.Form)."""

    default_renderer = GGDSFormRenderer()


# --- Date input --------------------------------------------------------------------------------------------

PARTS = ("day", "month", "year")
_MONTHS = {n.lower(): i for i, n in enumerate(calendar.month_name) if n}
_MONTHS.update({n.lower(): i for i, n in enumerate(calendar.month_abbr) if n})
_MONTHS["sept"] = 9


def _month(text: str) -> int | None:
    """3, 03, March or Mar: the month's number, or None."""
    t = text.strip().lower().rstrip(".")
    if t.isdigit():
        return int(t) if 1 <= int(t) <= 12 else None
    return _MONTHS.get(t)


class GGDSDateWidget(forms.MultiWidget):
    """Day, month and year as three text inputs. GGDSFormRenderer draws it as a GGDS date input."""

    def __init__(self, attrs=None, autocomplete: str = ""):
        boxes = []
        for part in PARTS:
            a = {"inputmode": "numeric", "spellcheck": "false"}
            if autocomplete:
                a["autocomplete"] = f"{autocomplete}-{part}"
            boxes.append(forms.TextInput(attrs=a))
        super().__init__(boxes, attrs)

    def decompress(self, value):
        if isinstance(value, date):
            return [value.day, value.month, value.year]
        return [None, None, None]


class GGDSDateField(forms.MultiValueField):
    """A date people know, such as a date of birth, as a GGDS date input (day, month and year boxes).

    It accepts 3, 03, March or Mar for the month, and gives the error messages GGDS recommends, naming the date
    with `name`: GGDSDateField(label="What is your date of birth?", name="date of birth", birthday=True).
    `past=True` rejects dates in the future.
    """

    def __init__(self, *, name: str = "the date", birthday: bool = False, past: bool = False, **kwargs):
        self.name = name
        self.past = past or birthday
        self.invalid_parts: tuple[str, ...] = ()
        kwargs.setdefault("widget", GGDSDateWidget(autocomplete="bday" if birthday else ""))
        fields = tuple(forms.CharField(required=False) for _ in PARTS)
        super().__init__(fields, require_all_fields=False, **kwargs)

    def _fail(self, message: str, parts=PARTS):
        self.invalid_parts = tuple(parts)
        raise ValidationError(message)

    def clean(self, value):
        self.invalid_parts = ()
        values = [str(v or "").strip() for v in (value or [None] * 3)]
        day, month, year = values
        cap = self.name[:1].upper() + self.name[1:]
        if not any(values):
            if self.required:
                self._fail(f"Enter {self.name}")
            return None
        missing = [p for p, v in zip(PARTS, values) if not v]
        if missing:
            self._fail(f"{cap} must include a {' and a '.join(missing)}", missing)
        if not (year.isdigit() and len(year) == 4):
            self._fail("Year must include 4 numbers", ["year"])
        m = _month(month)
        if not day.isdigit() or m is None:
            self._fail(f"{cap} must be a real date", [p for p, ok in (("day", day.isdigit()), ("month", m)) if not ok])
        try:
            result = date(int(year), m, int(day))
        except ValueError:
            self._fail(f"{cap} must be a real date")
        if self.past and result > date.today():
            self._fail(f"{cap} must be in the past")
        self.run_validators(result)
        return result

    def compress(self, data_list):  # clean() does the work; MultiValueField requires the method
        return data_list


# --- Code input, and inputs with a prefix or suffix -----------------------------------------------------------

class OneTimeCodeField(forms.CharField):
    """A code sent by SMS or email, in one box that phones can fill in (a GGDS code input).

    It accepts the code with spaces or dashes and removes them, keeps leading zeros (it is text, not a number) and
    gives the error messages GGDS recommends: OneTimeCodeField(label="Enter the code we sent you", digits=6).
    """

    def __init__(self, *, digits: int = 6, **kwargs):
        self.digits = digits
        kwargs.setdefault("widget", forms.TextInput(attrs={
            "class": "ggds-input--code", "inputmode": "numeric", "autocomplete": "one-time-code", "spellcheck": "false"}))
        kwargs.setdefault("error_messages", {"required": "Enter the code we sent you"})
        super().__init__(**kwargs)

    def to_python(self, value):
        value = super().to_python(value)
        if value in self.empty_values:
            return value
        return "".join(str(value).split()).replace("-", "")

    def validate(self, value):
        super().validate(value)
        # Only 0 to 9: other scripts' digits (and superscripts) are not codes anyone was sent.
        if value and not (value.isascii() and value.isdigit() and len(value) == self.digits):
            raise ValidationError(f"Enter the {self.digits}-digit code we sent you", code="invalid")


class AffixInput(forms.TextInput):
    """A text input with a unit before or after it, such as GH₵ or kg: AffixInput(prefix="GH₵").

    GGDSFormRenderer draws the unit beside the box and hides it from screen readers, so say the unit in the label
    too ("How much do you want to pay, in Ghana cedis?").
    """

    def __init__(self, attrs=None, *, prefix: str = "", suffix: str = ""):
        self.prefix = prefix
        self.suffix = suffix
        super().__init__({"inputmode": "decimal", "spellcheck": "false", **(attrs or {})})
