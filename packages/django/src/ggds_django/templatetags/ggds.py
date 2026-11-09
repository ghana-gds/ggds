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

from ..icons import icon

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
def ggds_skip_link(href: str = "#main", label: str = "Skip to main content"):
    return {"href": href, "label": label}


@register.inclusion_tag("ggds/components/banner.html")
def ggds_banner(short_name: str = "", host: str = "", official: bool = False, address_note: str = "",
                register_href: str = "", register_label: str = "register of official government websites"):
    """The government website banner. official: this page is served from the official address. host: the
    official address to name ("" when there is none the banner may name)."""
    return {"short_name": short_name, "host": host, "official": official, "address_note": address_note,
            "register_href": register_href, "register_label": register_label}


@register.inclusion_tag("ggds/components/header.html", takes_context=True)
def ggds_header(context, name: str, nav=None, current: str | None = None, country: str = "Republic of Ghana",
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
    return {"name": name, "long": len(name) > 45, "country": country, "items": items, "logo_url": logo_url,
            "logo_alt": logo_alt, "initials": initials or (_initials(name) if not logo_url else ""), "home": home,
            "search_url": search_url, "nav_id": nav_id,
            "search_icon": icon("search", "ggds-header__icon"),
            "menu_icons": icon("menu", "ggds-header__icon ggds-header__icon--menu") + icon("close", "ggds-header__icon ggds-header__icon--close")}


@register.inclusion_tag("ggds/components/hero.html")
def ggds_hero(title: str, purpose: str = "", lede: str = "", search_action: str = "",
              search_label: str = "Search this website", search_placeholder: str = "", tasks=None,
              tasks_label: str = "Common tasks:", hub: bool = False, art: str = "", art_decorative: bool = True):
    """The top of a homepage. tasks: links, each with an optional "tag" (on a ministry hub, the agency's name).
    art: an SVG or image to show beside the text (marked safe by you)."""
    return {"title": title, "purpose": purpose, "lede": lede, "search_action": search_action,
            "search_label": search_label, "search_placeholder": search_placeholder, "tasks": _links(tasks),
            "tasks_label": tasks_label, "hub": hub, "art": art, "art_decorative": art_decorative,
            "search_icon": icon("search", "ggds-hero__button-icon")}


@register.inclusion_tag("ggds/components/breadcrumbs.html")
def ggds_breadcrumbs(crumbs):
    """crumbs: the trail, home first. The last one is the current page and is not a link."""
    items = _links(crumbs)
    return {"parents": items[:-1], "current": items[-1] if items else None}


@register.inclusion_tag("ggds/components/pagination.html", takes_context=True)
def ggds_pagination(context, page_obj, label: str = "Pages", param: str = "page"):
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
        pages.append({"number": n, "href": href(n), "current": n == number})
    return {"show": count > 1, "label": label, "pages": pages,
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
def ggds_tab_bar(context, tabs):
    """Phone-only quick links: Home first, Search last, three sections between. Each tab has an "icon"."""
    path = _path(context)
    items = _links(tabs)
    for t in items:
        t["current"] = path == "/" if t["href"] == "/" else bool(path) and path.startswith(t["href"])
        t["icon_svg"] = icon(t.get("icon", "services"), "ggds-tab-bar__icon")
    return {"tabs": items}


# --- Forms -------------------------------------------------------------------------------------------------

CHOICE_WIDGETS = (forms.RadioSelect, forms.CheckboxSelectMultiple)


def _first_id(field) -> str:
    """The id an error summary links to: the control itself, or a group's first option, which can take focus."""
    if isinstance(field.field.widget, CHOICE_WIDGETS):
        return f"{field.auto_id}_0"
    return field.id_for_label


@register.filter
def ggds_kind(field) -> str:
    widget = field.field.widget
    if isinstance(widget, CHOICE_WIDGETS):
        return "choices"
    if isinstance(widget, forms.CheckboxInput):
        return "checkbox"
    return "control"


@register.filter
def ggds_described_by(field) -> str:
    ids = []
    if field.help_text:
        ids.append(f"{field.auto_id}-hint")
    if field.errors:
        ids.append(f"{field.auto_id}-error")
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
    else:
        cls = "ggds-input"
    attrs = {"class": " ".join(filter(None, [cls, widget.attrs.get("class", "")]))}
    described = ggds_described_by(field)
    if described:
        attrs["aria-describedby"] = described
    if field.errors:
        attrs["aria-invalid"] = "true"
    return field.as_widget(attrs=attrs)


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


@register.inclusion_tag("ggds/forms/error_summary.html")
def ggds_error_summary(form, title: str = "There is a problem"):
    """Every problem in the form, each linking to its field. data-ggds-module: @ggds/js focuses it on load."""
    items = [{"text": e, "href": ""} for e in form.non_field_errors()]
    for field in list(form.visible_fields()) + list(form.hidden_fields()):
        for e in field.errors:
            items.append({"text": e, "href": f"#{_first_id(field)}" if not field.is_hidden else ""})
    return {"items": items, "title": title}


@register.simple_tag
def ggds_error_title(form, title: str) -> str:
    """The page title, starting with "Error: " while the form has errors: {% ggds_error_title form "Apply" %}."""
    return f"Error: {title}" if form.errors else title


