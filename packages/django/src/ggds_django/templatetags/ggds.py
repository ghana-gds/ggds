"""GGDS template tags: {% load ggds %}.

Page parts (they output the same markup as the GGDS documentation and @ggds/astro):
    {% ggds_assets theme="nca" %}     stylesheets and the optional script, in <head>
    {% ggds_skip_link %}
    {% ggds_banner short_name="NCA" host="nca.org.gh" official=True %}
    {% ggds_header name="National Communications Authority" nav=nav %}
    {% ggds_hero title="What do you need help with?" search_action="/search/" tasks=tasks %}
    {% ggds_breadcrumbs crumbs %}
    {% ggds_pagination page_obj %}
    {% ggds_footer name="..." sections=sections links=links %}
    {% ggds_tab_bar tabs %}
    {% ggds_summary_list rows %}      questions and answers, with Change links
    {% ggds_panel "Complaint sent" reference=ref %}
    {% ggds_page_heading "Welcome back, Ama" eyebrow="..." lede="..." %}
    {% ggds_key_figures figures %}    the numbers that matter most
    {% ggds_progress 3 4 %}           "Question 3 of 4"
    {% ggds_timeline stages %}        what has happened and what happens next
    {% ggds_meter value max=1100 %}   an amount as a bar, in a table
    {% ggds_steps steps urgent=True %} numbered things to do
    {% ggds_back_link "/apply/contact/" %}
    {% ggds_phase_banner "beta" feedback_href="/feedback/" %}
    {% ggds_side_nav items %}         the pages of one section
    {% ggds_contents items %}         "On this page"
    {% ggds_language_switcher %}      the same page in each language in settings.LANGUAGES
    {% ggds_cookie_banner "Example Agency" choice=choice %}   asks before analytics cookies
Forms (GGDSFormRenderer uses these; you rarely need them yourself):
    {% ggds_error_summary form %}, {{ field|ggds_widget }}, {{ field|ggds_choices }}

Links are given as dicts ({"label": ..., "href": ...}) or (label, href) pairs.
"""
from __future__ import annotations

from collections.abc import Iterable, Mapping
from datetime import date
from urllib.parse import urlencode

from django import forms, template
from django.forms.utils import flatatt
from django.templatetags.static import static
from django.utils.html import format_html
from django.utils.safestring import mark_safe
from django.utils.translation import get_language

from ..forms import PARTS, GGDSDateWidget
from ..icons import icon
from ..strings import html as _html
from ..strings import text as _text
from ..strings import LANGUAGES as _LANGUAGES

register = template.Library()


def _link(item) -> dict:
    """A link from a dict or a (label, href) pair; other keys (tag, icon, links) are kept."""
    if isinstance(item, Mapping):
        return dict(item)
    label, href, *rest = item
    return {"label": label, "href": href, **(rest[0] if rest else {})}


def _links(items: Iterable | None) -> list[dict]:
    return [_link(i) for i in (items or [])]


def _path(context) -> str:
    request = context.get("request")
    return getattr(request, "path", "") or ""


def _initials(name: str) -> str:
    return "".join(c for c in name if c.isalnum())[:4].upper()


@register.simple_tag
def ggds_text(key: str, **values):
    """GGDS's own text for key (packages/html/strings/en.json) in the active language: {% ggds_text "header.menu" %}."""
    return _html(key, **values)


@register.simple_tag
def ggds_icon(name: str, cls: str = "ggds-icon"):
    return icon(name, cls)


@register.simple_tag
def ggds_assets(theme: str = "", script: bool = True, minified: bool = True):
    """The GGDS stylesheet, the institution's theme (if not the default) and the optional script."""
    css = "ggds/ggds.min.css" if minified else "ggds/ggds.css"
    tags = [format_html('<link rel="stylesheet" href="{}">', static(css))]
    if theme:
        tags.append(format_html('<link rel="stylesheet" href="{}">', static(f"ggds/themes/{theme}.css")))
    if script:
        tags.append(format_html('<script type="module" src="{}"></script>', static("ggds/js/auto.js")))
    return mark_safe("\n".join(tags))


@register.inclusion_tag("ggds/components/skip_link.html")
def ggds_skip_link(href: str = "#main", label: str = ""):
    return {"href": href, "label": label or _text("skipLink.label")}


@register.inclusion_tag("ggds/components/banner.html")
def ggds_banner(short_name: str = "", host: str = "", official: bool = False, address_note: str = "",
                register_href: str = "", register_label: str = ""):
    """The government website banner. official: this page is served from the official address. host: the
    official address to name ("" when there is none the banner may name)."""
    strong = format_html("<strong>{}</strong>", host)
    if not host:
        address = _html("banner.noAddress", shortName=short_name)
    elif official:
        address = _html("banner.officialAddress", host=strong)
    else:
        address = _html("banner.otherAddress", shortName=short_name, host=strong, note=address_note)
    register = format_html('<a href="{}">{}</a>', register_href, register_label or _text("banner.registerLabel"))
    return {"official": official, "label": _text("banner.label"),
            "summary": _text("banner.official") if official else _text("banner.unofficial", shortName=short_name),
            "how_to_tell": _text("banner.howToTell"), "check_address": _text("banner.checkAddress"),
            "address": address, "domain": _html("banner.domain", domain=mark_safe("<strong>.gov.gh</strong>")),
            "register": _html("banner.register", register=register) if register_href else "",
            "padlock_heading": _text("banner.padlockHeading"),
            "padlock": _html("banner.padlock", https=mark_safe("<strong>https://</strong>")),
            "pin_heading": _text("banner.pinHeading"), "pin": _text("banner.pin")}


@register.inclusion_tag("ggds/components/header.html", takes_context=True)
def ggds_header(context, name: str, nav=None, current: str | None = None, country: str | None = None,
                logo_url: str = "", logo_alt: str = "", initials: str = "", home: str = "/",
                search_url: str = "/search/", nav_id: str = "ggds-header-nav"):
    """The header. The current section is the nav link the page's address starts with (or current=)."""
    items = _links(nav)
    if current is None:
        path = _path(context)
        matches = [i["href"] for i in items if i["href"] != "/" and path.startswith(i["href"])]
        current = max(matches, key=len) if matches else None
    for i in items:
        i["current"] = i["href"] == current
    return {"name": name, "long": len(name) > 45, "country": _text("header.country") if country is None else country,
            "items": items, "logo_url": logo_url,
            "logo_alt": logo_alt, "initials": initials or (_initials(name) if not logo_url else ""), "home": home,
            "search_url": search_url, "nav_id": nav_id,
            "search_icon": icon("search", "ggds-header__icon"),
            "menu_icons": icon("menu", "ggds-header__icon ggds-header__icon--menu") + icon("close", "ggds-header__icon ggds-header__icon--close")}


@register.inclusion_tag("ggds/components/hero.html")
def ggds_hero(title: str, purpose: str = "", lede: str = "", search_action: str = "",
              search_label: str = "", search_placeholder: str = "", tasks=None,
              tasks_label: str = "", hub: bool = False, art: str = "", art_decorative: bool = True):
    """The top of a homepage. tasks: links, each with an optional "tag" (on a ministry hub, the agency's name).
    art: an SVG or image to show beside the text (marked safe by you)."""
    return {"title": title, "purpose": purpose, "lede": lede, "search_action": search_action,
            "search_label": search_label or _text("hero.searchLabel"), "search_placeholder": search_placeholder,
            "tasks": _links(tasks), "tasks_label": tasks_label or _text("hero.tasks"), "hub": hub, "art": art, "art_decorative": art_decorative,
            "search_icon": icon("search", "ggds-hero__button-icon")}


@register.inclusion_tag("ggds/components/breadcrumbs.html")
def ggds_breadcrumbs(crumbs):
    """crumbs: the trail, home first. The last one is the current page and is not a link."""
    items = _links(crumbs)
    return {"parents": items[:-1], "current": items[-1] if items else None}


@register.inclusion_tag("ggds/components/pagination.html", takes_context=True)
def ggds_pagination(context, page_obj, label: str = "", param: str = "page"):
    """Pagination from Django's Paginator page. Other query parameters (filters, a search) are kept."""
    request = context.get("request")
    query = request.GET.copy() if request is not None else None

    def href(n: int) -> str:
        if query is None:
            return f"?{urlencode({param: n})}"
        q = query.copy()
        if n == 1:
            q.pop(param, None)
        else:
            q[param] = n
        return f"?{q.urlencode()}" if q else "?"

    number, count = page_obj.number, page_obj.paginator.num_pages
    shown = sorted({n for n in (1, number - 2, number - 1, number, number + 1, number + 2, count) if 1 <= n <= count})
    pages: list[dict] = []
    for i, n in enumerate(shown):
        if i and n - shown[i - 1] > 1:
            pages.append({"gap": True})
        pages.append({"number": n, "href": href(n), "current": n == number, "label": _text("pagination.page", number=n)})
    return {"show": count > 1, "label": label or _text("pagination.label"), "pages": pages,
            "previous": href(number - 1) if page_obj.has_previous() else "",
            "next": href(number + 1) if page_obj.has_next() else ""}


@register.inclusion_tag("ggds/components/footer.html")
def ggds_footer(name: str, purpose: str = "", address: str = "", email: str = "", phone: str = "",
                contact_url: str = "", sections=None, links=None, logo_url: str = "", logo_alt: str = "",
                initials: str = "", year: int | None = None):
    """The footer. sections: each {"label", "href", "links": [...]} (up to five links shown). links: the
    bottom bar after the copyright line; include at least Accessibility, Privacy and Disclaimer."""
    secs = []
    for s in _links(sections):
        s["links"] = _links(s.get("links"))[:5]
        secs.append(s)
    return {"name": name, "purpose": purpose, "address": address, "email": email, "phone": phone,
            "contact_url": contact_url, "has_contact": bool(address or email or phone), "sections": secs,
            "links": _links(links), "logo_url": logo_url, "logo_alt": logo_alt,
            "initials": initials or (_initials(name) if not logo_url else ""), "year": year or date.today().year}


@register.inclusion_tag("ggds/components/tab_bar.html", takes_context=True)
def ggds_tab_bar(context, tabs, current: str | None = None):
    """Phone-only quick links: Home first, Search last, three sections between. Each tab has an "icon". The
    current tab is the one whose address is current=, or else the one the page's address starts with."""
    path = _path(context)
    items = _links(tabs)
    for t in items:
        if current:
            t["current"] = t["href"] == current
        else:
            t["current"] = path == "/" if t["href"] == "/" else bool(path) and path.startswith(t["href"])
        t["icon_svg"] = icon(t.get("icon", "services"), "ggds-tab-bar__icon")
    return {"tabs": items}


@register.inclusion_tag("ggds/components/feedback.html", takes_context=True)
def ggds_feedback(context, action: str, report_url: str = "", page: str = "", answered: bool = False):
    """At the end of a page: "Did this page help you?" with Yes and No, sent (POST, with the CSRF token) to action
    with the page's address, and a link to report_url with ?page=. answered: say thank you instead of asking again."""
    page = page or _path(context)
    report = f"{report_url}{'&' if '?' in report_url else '?'}{urlencode({'page': page}, safe='/')}" if report_url else ""
    return {"action": action, "page": page, "answered": answered, "report_url": report,
            "csrf_token": context.get("csrf_token", ""),
            "question": _text("feedback.question"), "yes": _text("feedback.yes"), "no": _text("feedback.no"),
            "yes_hidden": _text("feedback.yesHidden"), "no_hidden": _text("feedback.noHidden"),
            "thanks": _text("feedback.thanks"), "report": _text("feedback.report")}

# --- Forms -------------------------------------------------------------------------------------------------

CHOICE_WIDGETS = (forms.RadioSelect, forms.CheckboxSelectMultiple)


def _first_id(field) -> str:
    """The id an error summary links to: the control itself, a group's first option, or a date's first box with
    the problem, each of which can take focus."""
    if isinstance(field.field.widget, GGDSDateWidget):
        bad = getattr(field.field, "invalid_parts", ()) or PARTS
        return f"{field.auto_id}_{PARTS.index(bad[0])}"
    if isinstance(field.field.widget, CHOICE_WIDGETS):
        return f"{field.auto_id}_0"
    return field.id_for_label


@register.filter
def ggds_kind(field) -> str:
    widget = field.field.widget
    if isinstance(widget, GGDSDateWidget):
        return "date"
    if isinstance(widget, CHOICE_WIDGETS):
        return "choices"
    if isinstance(widget, forms.CheckboxInput):
        return "checkbox"
    if isinstance(widget, forms.PasswordInput):
        return "password"
    if _counted(field):
        return "count"
    if getattr(widget, "prefix", "") or getattr(widget, "suffix", ""):
        return "affix"
    return "control"


def _counted(field) -> bool:
    """A textarea with a length limit gets a character count."""
    return isinstance(field.field.widget, forms.Textarea) and bool(getattr(field.field, "max_length", None))


@register.filter
def ggds_described_by(field) -> str:
    ids = []
    if field.help_text:
        ids.append(f"{field.auto_id}-hint")
    if field.errors:
        ids.append(f"{field.auto_id}-error")
    if _counted(field):
        ids.append(f"{field.auto_id}-info")
    return " ".join(ids)


@register.filter
def ggds_widget(field):
    """The field's control with its GGDS class, aria-describedby (hint, then error) and aria-invalid."""
    widget = field.field.widget
    if isinstance(widget, forms.Textarea):
        cls = "ggds-textarea"
    elif isinstance(widget, (forms.Select, forms.SelectMultiple)):
        cls = "ggds-select"
    elif isinstance(widget, (forms.FileInput, forms.ClearableFileInput)):
        cls = "ggds-file-upload"
    elif isinstance(widget, forms.CheckboxInput):
        cls = "ggds-choice__input"
    elif isinstance(widget, forms.PasswordInput):
        cls = "ggds-input ggds-password-input__input"
    else:
        cls = "ggds-input"
    if _counted(field):
        # No maxlength: it silently cuts off pasted text. The count shows the limit and the form checks it.
        widget.attrs.pop("maxlength", None)
    attrs = {"class": " ".join(filter(None, [cls, widget.attrs.get("class", "")]))}
    if isinstance(widget, forms.PasswordInput):
        # Password managers fill it in; phones neither correct nor capitalise it.
        attrs.update({"spellcheck": "false", "autocapitalize": "none"})
        attrs["autocomplete"] = widget.attrs.get("autocomplete", "current-password")
    described = ggds_described_by(field)
    if described:
        attrs["aria-describedby"] = described
    if field.errors:
        attrs["aria-invalid"] = "true"
    return field.as_widget(attrs=attrs)


@register.filter
def ggds_affix(field) -> dict:
    """An AffixInput's unit before (prefix) and after (suffix) the box."""
    widget = field.field.widget
    return {"prefix": getattr(widget, "prefix", ""), "suffix": getattr(widget, "suffix", "")}


@register.filter
def ggds_choices(field) -> list[dict]:
    """Each option of a radio or checkbox group, as a GGDS choice input and its label."""
    out = []
    for sub in field.subwidgets:
        data = sub.data
        kind = data["type"]  # CheckboxSelectMultiple subclasses RadioSelect, so ask each option
        attrs = {k: v for k, v in data["attrs"].items() if k not in ("class", "required") or kind == "radio"}
        attrs.update({"class": "ggds-choice__input", "type": kind, "name": data["name"], "value": data["value"]})
        if data.get("selected"):
            attrs["checked"] = True
        out.append({"id": data["attrs"].get("id", ""), "label": data["label"],
                    "input": format_html("<input{}>", flatatt(attrs))})
    return out


@register.filter
def ggds_date_parts(field) -> list[dict]:
    """The day, month and year boxes of a GGDSDateField, each with its label; only the parts with the problem
    are marked invalid."""
    widget = field.field.widget
    value = field.value()
    values = value if isinstance(value, (list, tuple)) else widget.decompress(value)
    invalid = (getattr(field.field, "invalid_parts", ()) or PARTS) if field.errors else ()
    out = []
    for i, (part, box) in enumerate(zip(PARTS, widget.widgets)):
        attrs = {"class": "ggds-input ggds-date-input__input" + (" ggds-date-input__input--year" if part == "year" else ""),
                 "id": f"{field.auto_id}_{i}", "name": f"{field.html_name}_{i}", "type": "text", **box.attrs}
        if values[i] not in (None, ""):
            attrs["value"] = str(values[i])
        if part in invalid:
            attrs["aria-invalid"] = "true"
        out.append({"id": attrs["id"], "label": part.capitalize(), "input": format_html("<input{}>", flatatt(attrs))})
    return out


@register.inclusion_tag("ggds/forms/error_summary.html")
def ggds_error_summary(form, title: str = ""):
    """Every problem in the form, each linking to its field. data-ggds-module: @ggds/js focuses it on load."""
    items = [{"text": e, "href": ""} for e in form.non_field_errors()]
    for field in list(form.visible_fields()) + list(form.hidden_fields()):
        for e in field.errors:
            items.append({"text": e, "href": f"#{_first_id(field)}" if not field.is_hidden else ""})
    return {"items": items, "title": title or _text("errorSummary.title")}


@register.simple_tag
def ggds_error_title(form, title: str) -> str:
    """The page title, starting with "Error: " while the form has errors: {% ggds_error_title form "Apply" %}."""
    return _text("page.errorTitle", title=title) if form.errors else title


# --- Summary list and confirmation panel -------------------------------------------------------------------

@register.inclusion_tag("ggds/components/summary_list.html")
def ggds_summary_list(rows, plain: bool = False):
    """Rows as dicts: key, value, and optionally href and label (what the Change link changes; default: the key
    in lower case). A missing or empty value shows "Not given"."""
    out = []
    for r in rows:
        r = dict(r)
        value = r.get("value")
        out.append({"key": r["key"], "value": value if value not in (None, "") else _text("summaryList.notGiven"),
                    "href": r.get("href", ""), "label": r.get("label") or str(r["key"]).lower(),
                    "action": r.get("action") or _text("summaryList.change")})
    return {"rows": out, "plain": plain}


@register.inclusion_tag("ggds/components/panel.html")
def ggds_panel(title: str, reference: str = "", reference_label: str = ""):
    """The confirmation panel: the page's <h1>, and the reference people need later."""
    return {"title": title, "reference": reference, "reference_label": reference_label or _text("panel.reference")}


# --- Key figures, progress, timeline, meter, steps and page heading ----------------------------------------------

@register.inclusion_tag("ggds/components/key_figures.html")
def ggds_key_figures(figures, inverse: bool = False):
    """Figures as dicts: value, label, and optionally change (in words) and danger (True for one that needs action)."""
    return {"figures": [dict(f) for f in figures], "inverse": inverse}


@register.inclusion_tag("ggds/components/progress.html")
def ggds_progress(current: int, total: int, label: str = "", id: str = "ggds-progress"):
    """How far through a task: "Question 3 of 4" in words, and the same as a native <progress>."""
    return {"current": current, "total": total, "label": label or _text("progress.label", current=current, total=total), "id": id}


_STATE_WORDS = {"done": "timeline.done", "current": "timeline.current", "": "timeline.next"}


@register.inclusion_tag("ggds/components/timeline.html")
def ggds_timeline(stages):
    """Stages as dicts: title, when, and state: "done", "current" or "" (to come). Each starts with hidden words that
    say its state, so it is said and not only drawn."""
    out = []
    for s in stages:
        s = dict(s)
        state = s.get("state") or ""
        if state not in _STATE_WORDS:
            raise ValueError(f'ggds_timeline: state must be "done", "current" or "", not {state!r}')
        out.append({**s, "state": state, "words": s.get("words") or _text(_STATE_WORDS[state])})
    return {"stages": out}


@register.inclusion_tag("ggds/components/meter.html")
def ggds_meter(value, max, min=0, text: str = ""):
    """An amount as a bar, for a table cell next to the number. Hidden from screen readers: the number says it."""
    return {"value": value, "max": max, "min": min, "text": text or str(value)}


@register.inclusion_tag("ggds/components/steps.html")
def ggds_steps(steps, urgent: bool = False, heading_level: int = 3):
    """Steps as dicts: icon (a GGDS icon name), title (starts with a verb) and text (one sentence)."""
    return {"steps": [dict(s) for s in steps], "urgent": urgent, "h": heading_level}


@register.inclusion_tag("ggds/components/page_heading.html")
def ggds_page_heading(title: str, eyebrow: str = "", lede: str = "", danger: bool = False):
    """The top of an inner page in the institution's colour; the title is the page's <h1>."""
    return {"title": title, "eyebrow": eyebrow, "lede": lede, "danger": danger}


# --- Back link, phase banner, side navigation, contents list, language switcher and cookie banner ---------------

@register.inclusion_tag("ggds/components/back_link.html")
def ggds_back_link(href: str, label: str = ""):
    """A link to the previous page of a task. label: only if "Back" would be unclear."""
    return {"href": href, "label": label or _text("backLink.label")}


@register.inclusion_tag("ggds/components/phase_banner.html")
def ggds_phase_banner(phase: str = "beta", feedback_href: str = ""):
    """Says the service is new: phase is "alpha" or "beta". feedback_href: where people tell you what went wrong."""
    if phase not in ("alpha", "beta"):
        raise ValueError(f'ggds_phase_banner: phase must be "alpha" or "beta", not {phase!r}')
    feedback = format_html('<a href="{}">{}</a>', feedback_href, _text("phaseBanner.feedback")) if feedback_href else _text("phaseBanner.feedback")
    return {"tag": _text(f"phaseBanner.{phase}"), "text": _html("phaseBanner.text", feedback=feedback)}


@register.inclusion_tag("ggds/components/side_nav.html", takes_context=True)
def ggds_side_nav(context, items, current: str | None = None, label: str = ""):
    """The pages of one section: links, each with optional "links" under it (shown under the current page or its
    parent). The current page is the one whose href is the request's path (or current=)."""
    path = current if current is not None else _path(context)
    out = []
    for item in _links(items):
        subs = _links(item.get("links"))
        for sub in subs:
            sub["current"] = sub["href"] == path
        item["links"] = subs
        item["current"] = item["href"] == path
        item["open"] = item["current"] or any(sub["current"] for sub in subs)
        out.append(item)
    return {"items": out, "label": label or _text("sideNav.label")}


@register.inclusion_tag("ggds/components/contents.html")
def ggds_contents(items, title: str = "", id: str = "contents-title"):
    """"On this page": links to the page's own headings (href "#heading-id"), in order."""
    return {"items": _links(items), "title": title or _text("contents.title"), "id": id}


@register.inclusion_tag("ggds/components/language_switcher.html", takes_context=True)
def ggds_language_switcher(context, links=None, current: str = "", label: str = ""):
    """The same page in each language. links: {"code", "href"} for each; by default every language in
    settings.LANGUAGES, linked with django.urls.translate_url (for sites that use i18n_patterns). Each is named in its
    own language from GGDS's list, or by Django's name for a language GGDS does not list."""
    from django.conf import settings
    from django.urls import translate_url

    own = {lang["code"]: lang["own"] for lang in _LANGUAGES}
    active = current or get_language() or settings.LANGUAGE_CODE
    request = context.get("request")
    if links is None:
        path = request.get_full_path() if request is not None else "/"
        links = [{"code": code, "href": translate_url(path, code), "name": name} for code, name in settings.LANGUAGES]
    languages = []
    for link in links:
        code = link["code"]
        languages.append({"code": code, "href": link["href"], "own": link.get("own") or own.get(code) or str(link.get("name", code)),
                          "current": code == active or code == active.split("-")[0]})
    return {"languages": languages, "label": label or _text("languageSwitcher.label")}


@register.inclusion_tag("ggds/components/cookie_banner.html", takes_context=True)
def ggds_cookie_banner(context, service: str, choice: str = "", action: str = "/cookies/", view_href: str = "/cookies/"):
    """Asks before setting analytics cookies. choice: "" (not chosen yet: ask), "accept" or "reject" (just chosen:
    confirm), or "hidden" (chosen and the message hidden: nothing). Your view handles the form's POST (name "cookies":
    accept, reject or hide), remembers the choice in an essential cookie, and redirects back."""
    if choice not in ("", "accept", "reject", "hidden"):
        raise ValueError(f'ggds_cookie_banner: choice must be "", "accept", "reject" or "hidden", not {choice!r}')
    change = format_html('<a href="{}">{}</a>', view_href, _text("cookieBanner.changeLink"))
    return {"choice": choice, "action": action, "view_href": view_href, "csrf_token": context.get("csrf_token", ""),
            "label": _text("cookieBanner.label", service=service), "title": _text("cookieBanner.title", service=service),
            "essential": _text("cookieBanner.essential"), "analytics": _text("cookieBanner.analytics"),
            "accept": _text("cookieBanner.accept"), "reject": _text("cookieBanner.reject"), "view": _text("cookieBanner.view"),
            "confirmation": _text("cookieBanner.accepted" if choice == "accept" else "cookieBanner.rejected"),
            "change": _html("cookieBanner.change", change=change), "hide": _text("cookieBanner.hide")}


# --- Task list, dialog and timeout warning ----------------------------------------------------------------------

_TASK_STATUS = {"completed": "ggds-tag ggds-tag--success", "inProgress": "ggds-tag ggds-tag--info", "notStarted": "ggds-tag", "cannotStart": ""}


@register.inclusion_tag("ggds/components/task_list.html")
def ggds_task_list(tasks, summary: bool = True, id_prefix: str = "task"):
    """Sections as dicts: label, href (left out when people cannot open it yet), status ("completed", "inProgress",
    "notStarted" or "cannotStart"), and optionally hint and id (for its ids: <id_prefix>-<id>-status; default:
    position). Give each task list on a page its own id_prefix."""
    out = []
    for i, t in enumerate(tasks, 1):
        t = dict(t)
        status = t.get("status", "notStarted")
        if status not in _TASK_STATUS:
            raise ValueError(f"ggds_task_list: status must be one of {', '.join(_TASK_STATUS)}, not {status!r}")
        key = f"{id_prefix}-{t.get('id') or i}"
        hint = t.get("hint", "")
        out.append({**t, "key": key, "status": status, "tag": _TASK_STATUS[status], "words": _text(f"taskList.{status}"),
                    "open": bool(t.get("href")) and status != "cannotStart",
                    "described_by": " ".join(filter(None, [f"{key}-hint" if hint else "", f"{key}-status"]))})
    done = sum(1 for t in out if t["status"] == "completed")
    return {"tasks": out, "summary": _text("taskList.summary", done=done, total=len(out)) if summary else ""}


@register.inclusion_tag("ggds/components/dialog.html", takes_context=True)
def ggds_dialog(context, id: str, title: str, body: str, action: str, confirm: str, cancel: str = "", warning: bool = False):
    """A dialog that confirms an action: its form posts to action, which is also where the opener links without
    JavaScript. Open it with a link that has data-ggds-dialog="<id>"."""
    return {"id": id, "title": title, "body": body, "action": action, "confirm": confirm,
            "cancel": cancel or _text("dialog.cancel"), "warning": warning, "csrf_token": context.get("csrf_token")}


@register.inclusion_tag("ggds/components/timeout_warning.html")
def ggds_timeout_warning(timeout: int, keep_alive: str, sign_out: str, warn: int = 120, sign_out_href: str = "",
                         id: str = "timeout-warning"):
    """The timeout warning, on every signed-in page. timeout: seconds of inactivity before the session ends (the
    same as SESSION_COOKIE_AGE, with SESSION_SAVE_EVERY_REQUEST = True so every page extends it, as the warning
    assumes); warn: seconds before that to warn; keep_alive: a view that touches the session and fails or redirects
    when it has ended; sign_out: where to go when time runs out."""
    first = min(int(warn) if int(warn) > 0 else 120, int(timeout))
    minutes = int(first / 60 + 0.5)
    if first >= 60:
        time = _text("timeoutWarning.minutesOne") if minutes == 1 else _text("timeoutWarning.minutesOther", count=minutes)
    else:
        time = _text("timeoutWarning.secondsOne") if first == 1 else _text("timeoutWarning.secondsOther", count=first)
    before, _, after = _text("timeoutWarning.message", time="\0").partition("\0")
    return {"id": id, "timeout": timeout, "warn": warn, "keep_alive": keep_alive, "sign_out": sign_out,
            "sign_out_href": sign_out_href or sign_out, "time": time, "before": before, "after": after,
            "words": {k: _text(f"timeoutWarning.{k}") for k in ("minutesOne", "minutesOther", "secondsOne", "secondsOther")}}
