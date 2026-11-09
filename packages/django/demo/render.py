"""Renders a small example site with ggds-django into the documentation build (site/django/), where the
accessibility, Content Security Policy and layout tests check it like every other page.

    python demo/render.py <site directory>
"""
import shutil
import sys
from pathlib import Path

import django
from django.conf import settings

HERE = Path(__file__).parent
settings.configure(
    INSTALLED_APPS=["django.contrib.staticfiles", "ggds_django"],
    TEMPLATES=[{"BACKEND": "django.template.backends.django.DjangoTemplates", "DIRS": [HERE / "templates"], "APP_DIRS": True,
                "OPTIONS": {"context_processors": ["django.template.context_processors.request"]}}],
    FORM_RENDERER="ggds_django.forms.GGDSFormRenderer",
    STATIC_URL="/django/static/",  # the example site is served from site/django/
    ALLOWED_HOSTS=["*"],
)
django.setup()

from django import forms  # noqa: E402
from django.core.paginator import Paginator  # noqa: E402
from django.template.loader import render_to_string  # noqa: E402
from django.test import RequestFactory  # noqa: E402


class ComplaintForm(forms.Form):
    name = forms.CharField(label="Full name", help_text="As on your Ghana Card",
                           widget=forms.TextInput(attrs={"autocomplete": "name", "spellcheck": "false"}))
    phone = forms.CharField(label="Phone number", help_text="We call or text you about this only",
                            widget=forms.TextInput(attrs={"type": "tel", "autocomplete": "tel"}))
    email = forms.EmailField(label="Email address", required=False, widget=forms.EmailInput(attrs={"autocomplete": "email"}))
    provider = forms.ChoiceField(label="Which provider is it about?", choices=[("", "Choose a provider"), ("a", "Provider A"), ("b", "Provider B")])
    contact = forms.ChoiceField(label="How should we contact you?", widget=forms.RadioSelect,
                                choices=[("call", "Phone call"), ("sms", "SMS"), ("email", "Email")])
    topics = forms.MultipleChoiceField(label="What is it about?", required=False, widget=forms.CheckboxSelectMultiple,
                                       choices=[("net", "Internet"), ("calls", "Calls"), ("sms", "SMS")])
    details = forms.CharField(label="What happened?", help_text="Include dates. Do not include your PIN or passwords.", widget=forms.Textarea(attrs={"rows": 5}))
    agree = forms.BooleanField(label="I confirm the details are true")


NAV = [{"label": "Services", "href": "form.html"}, {"label": "Search", "href": "search.html"}, {"label": "About", "href": "index.html#main"}]
CONTEXT = {
    "nav": NAV,
    "tasks": [{"label": "Make a complaint", "href": "form.html"}, {"label": "See search results", "href": "search.html"}],
    "sections": [{"label": "Services", "href": "form.html", "links": [{"label": "Make a complaint", "href": "form.html"}]},
                 {"label": "Search", "href": "search.html", "links": [{"label": "Search results", "href": "search.html"}]}],
    "bar": [{"label": "Accessibility", "href": "index.html"}, {"label": "Privacy", "href": "index.html"}],
    "tabs": [{"label": "Home", "href": "index.html", "icon": "home"}, {"label": "Services", "href": "form.html", "icon": "services"},
             {"label": "Search", "href": "search.html", "icon": "search"}],
}


def render(out: Path, name: str, template: str, path: str, **extra):
    request = RequestFactory().get(path)
    html = render_to_string(template, {**CONTEXT, **extra}, request=request)
    (out / name).write_text(html)


def main(site: str):
    out = Path(site) / "django"
    shutil.rmtree(out, ignore_errors=True)
    out.mkdir(parents=True)
    shutil.copytree(HERE.parent / "src" / "ggds_django" / "static", out / "static")
    crumbs = lambda label: [("Home", "index.html"), (label, "")]  # noqa: E731
    render(out, "index.html", "demo/index.html", "/", title="Home")
    render(out, "form.html", "demo/form.html", "/services/", title="Make a complaint", form=ComplaintForm(), crumbs=crumbs("Make a complaint"))
    bad = ComplaintForm(data={"email": "not-an-email", "provider": ""})
    render(out, "form-errors.html", "demo/form.html", "/services/", title="Error: Make a complaint", form=bad, crumbs=crumbs("Make a complaint"))
    page = Paginator(list(range(1, 101)), 10).page(5)
    render(out, "search.html", "demo/list.html", "/search/?q=licence&page=5", title="Search results", page_obj=page, crumbs=crumbs("Search results"))
    print(f"django: example site → {out}")


if __name__ == "__main__":
    main(sys.argv[1])
