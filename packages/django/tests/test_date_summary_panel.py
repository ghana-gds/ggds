"""The date input (GGDSDateField), the summary list and the confirmation panel."""
from datetime import date, timedelta
from html.parser import HTMLParser
from pathlib import Path

from django import forms
from django.template import Context, Template
from django.test import SimpleTestCase

from ggds_django.forms import GGDSDateField

EXAMPLES = Path(__file__).resolve().parents[3] / "packages" / "html" / "components"


class BirthForm(forms.Form):
    dob = GGDSDateField(label="What is your date of birth?", name="date of birth", birthday=True,
                        help_text="For example, 27 3 1990")
    issued = GGDSDateField(label="When was it issued?", name="the date it was issued", required=False)


def classes(html):
    """Every element's tag and classes, in order: the shape the documentation's examples define."""
    out = []

    class P(HTMLParser):
        def handle_starttag(self, tag, attrs):
            out.append((tag, dict(attrs).get("class", "")))
    P().feed(html)
    return out


def render(src, **ctx):
    return Template("{% load ggds %}" + src).render(Context(ctx))


class DateInputTests(SimpleTestCase):
    def test_renders_three_labelled_boxes_in_a_fieldset(self):
        html = str(BirthForm()["dob"].as_field_group())
        self.assertIn('<fieldset class="ggds-fieldset" role="group" aria-describedby="id_dob-hint">', html)
        self.assertInHTML('<legend class="ggds-fieldset__legend">What is your date of birth?</legend>', html)
        self.assertIn('<div class="ggds-date-input">', html)
        for i, part in enumerate(("Day", "Month", "Year")):
            self.assertInHTML(f'<label class="ggds-date-input__label" for="id_dob_{i}">{part}</label>', html)
        self.assertIn('name="dob_2"', html)
        self.assertIn('class="ggds-input ggds-date-input__input ggds-date-input__input--year"', html)
        self.assertIn('autocomplete="bday-month"', html)
        self.assertIn('inputmode="numeric"', html)

    def test_same_elements_and_classes_as_the_documentation(self):
        doc = (EXAMPLES / "date-input" / "examples" / "1-date-of-birth.html").read_text().split("\n", 1)[1]
        html = str(BirthForm()["dob"].as_field_group())
        self.assertEqual(classes(html), classes(doc))

    def test_accepts_numbers_and_month_names(self):
        for month in ("3", "03", "March", "mar", "MAR."):
            form = BirthForm(data={"dob_0": "27", "dob_1": month, "dob_2": "1990"})
            self.assertTrue(form.is_valid(), (month, form.errors))
            self.assertEqual(form.cleaned_data["dob"], date(1990, 3, 27))
        self.assertIsNone(BirthForm(data={"dob_0": "1", "dob_1": "1", "dob_2": "2000"}).is_valid() and None)

    def test_error_messages_name_the_date_and_mark_only_the_wrong_part(self):
        cases = {
            ("", "", ""): ("Enter date of birth", ("day", "month", "year")),
            ("27", "3", ""): ("Date of birth must include a year", ("year",)),
            ("", "3", ""): ("Date of birth must include a day and a year", ("day", "year")),
            ("27", "3", "90"): ("Year must include 4 numbers", ("year",)),
            ("27", "Smarch", "1990"): ("Date of birth must be a real date", ("month",)),
            ("31", "2", "1990"): ("Date of birth must be a real date", ("day", "month", "year")),
        }
        future = date.today() + timedelta(days=30)
        cases[(str(future.day), str(future.month), str(future.year))] = ("Date of birth must be in the past", ("day", "month", "year"))
        for (d, m, y), (message, parts) in cases.items():
            form = BirthForm(data={"dob_0": d, "dob_1": m, "dob_2": y})
            self.assertFalse(form.is_valid())
            self.assertEqual(form.errors["dob"], [message])
            html = str(form["dob"].as_field_group())
            for i, part in enumerate(("day", "month", "year")):
                box = next(t for t in html.split("<input")[1:] if f'id="id_dob_{i}"' in t.split(">")[0]).split(">")[0]
                self.assertEqual('aria-invalid="true"' in box, part in parts, (message, part))
            # The error summary links to the first box with the problem.
            summary = str(form)
            self.assertIn(f'href="#id_dob_{("day", "month", "year").index(parts[0])}"', summary)

    def test_keeps_what_people_typed_and_optional_dates_can_be_blank(self):
        form = BirthForm(data={"dob_0": "27", "dob_1": "March", "dob_2": "", "issued_0": "", "issued_1": "", "issued_2": ""})
        self.assertFalse(form.is_valid())
        self.assertNotIn("issued", form.errors)
        self.assertIn('value="March"', str(form["dob"].as_field_group()))
        self.assertIn("(optional)", str(form["issued"].as_field_group()))


class SummaryListAndPanelTests(SimpleTestCase):
    def test_summary_list_rows_with_hidden_change_text_and_not_given(self):
        rows = [{"key": "Full name", "value": "Ama Owusu", "href": "/name/"},
                {"key": "Email address", "value": "", "href": "/email/"},
                {"key": "Licence number", "value": "EX-LIC-1"}]
        html = render("{% ggds_summary_list rows %}", rows=rows)
        self.assertInHTML('<dd class="ggds-summary-list__actions"><a href="/name/">Change<span class="ggds-visually-hidden"> full name</span></a></dd>', html)
        self.assertInHTML('<dd class="ggds-summary-list__value">Not given</dd>', html)
        self.assertEqual(html.count("ggds-summary-list__actions"), 2)
        self.assertIn('<dl class="ggds-summary-list">', render("{% ggds_summary_list rows %}", rows=rows))
        self.assertIn("ggds-summary-list--plain", render("{% ggds_summary_list rows plain=True %}", rows=rows))

    def test_summary_list_has_the_documentation_shape(self):
        doc = (EXAMPLES / "summary-list" / "examples" / "1-check-answers.html").read_text().split("\n", 1)[1]
        doc = doc.split("<dl", 1)[1]
        rows = [{"key": k, "value": "x", "href": "/x/"} for k in range(5)]
        html = render("{% ggds_summary_list rows %}", rows=rows).split("<dl", 1)[1]
        self.assertEqual([c for c in classes("<dl" + html) if c[0] != "p"], [c for c in classes("<dl" + doc) if c[0] != "p"])

    def test_panel(self):
        html = render('{% ggds_panel "Complaint sent" reference="EX-2026-00123" %}')
        self.assertInHTML('<h1 class="ggds-panel__title">Complaint sent</h1>', html)
        self.assertInHTML('<p class="ggds-panel__body">Your reference number <strong class="ggds-panel__reference">EX-2026-00123</strong></p>', html)
        doc = (EXAMPLES / "panel" / "examples" / "1-confirmation.html").read_text().split("\n", 1)[1].split('<div class="ggds-measure">')[0]
        self.assertEqual(classes(html), classes(doc))
        self.assertNotIn("ggds-panel__body", render('{% ggds_panel "Payment received" %}'))
