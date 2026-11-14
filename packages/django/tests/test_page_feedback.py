"""ggds/page.html puts the page parts around <main> in GGDS's order from GGDS_SITE, and {% ggds_feedback %} matches
its component examples. (test_starter.py renders whole websites with ggds/page.html.)"""
from pathlib import Path

from django.template import Context, Template
from django.test import RequestFactory, SimpleTestCase, override_settings

from ggds_django.context_processors import site

from .test_parity import shape

ROOT = Path(__file__).resolve().parents[3]
EXAMPLES = ROOT / "packages" / "html" / "components" / "feedback" / "examples"
TEMPLATES = [{"BACKEND": "django.template.backends.django.DjangoTemplates", "APP_DIRS": True,
              "OPTIONS": {"context_processors": ["django.template.context_processors.request",
                                                 "ggds_django.context_processors.site"]}}]
SITE = {
    "name": "Example Agency", "short_name": "EA", "purpose": "We help.", "host": "example.gov.gh",
    "register_href": "/register/", "theme": "nca",
    "nav": [{"label": "Services", "href": "/services/"}, {"label": "About", "href": "/about/"}],
    "address": "Accra", "email": "a@b.c", "phone": "0", "contact_url": "/contact/",
    "sections": [{"label": "Services", "href": "/services/", "links": [{"label": "Fees", "href": "/fees/"}]}],
    "links": [{"label": "Privacy", "href": "/privacy/"}],
    "tabs": [{"label": "Home", "href": "/", "icon": "home"}, {"label": "Services", "href": "/services/", "icon": "services"}],
}
PAGE = '{% extends "ggds/page.html" %}{% block title %}Fees | Example Agency{% endblock %}{% block content %}<h1>Fees</h1>{% endblock %}'


def example(name: str) -> str:
    return (EXAMPLES / name).read_text().split("-->", 1)[1]


def body(html: str) -> str:
    return html[html.index("<body>") + 6:html.index("</body>")]


@override_settings(TEMPLATES=TEMPLATES, GGDS_SITE=SITE)
class PageTests(SimpleTestCase):
    def render(self, path: str, **context) -> str:
        request = RequestFactory().get(path)
        from django.template import engines
        return engines["django"].from_string(PAGE).render({**context}, request)

    def test_the_parts_come_in_ggds_order_around_main(self):
        html = self.render("/fees/")
        tags = [t for t, a in shape(body(html)) if dict(a).get("class", "").split(" ")[0] in (
            "ggds-skip-link", "ggds-banner", "ggds-header", "ggds-footer", "ggds-tab-bar")] + ["main"]
        self.assertEqual(tags[:5], ["a", "section", "header", "footer", "nav"])
        self.assertIn('<main id="main" tabindex="-1" class="ggds-container ggds-main">\n<h1>Fees</h1>\n</main>', html)
        self.assertIn("<title>Fees | Example Agency</title>", html)
        self.assertIn('<meta name="description" content="We help.">', html)
        self.assertIn("/static/ggds/themes/nca.css", html)
        self.assertNotIn('name="robots"', html)
        self.assertIn("An official website of the Government of Ghana", html, "official by default")

    def test_the_page_address_marks_the_header_and_tab_unless_the_view_says(self):
        html = self.render("/services/licences/")
        self.assertRegex(html, r'<a class="ggds-header__link" href="/services/" aria-current="page">')
        self.assertRegex(html, r'href="/services/" aria-current="page"><svg class="ggds-tab-bar__icon"')
        html = self.render("/apply/", ggds_current="/about/", ggds_tab="/")
        self.assertRegex(html, r'<a class="ggds-header__link" href="/about/" aria-current="page">')
        self.assertRegex(html, r'<a class="ggds-tab-bar__link" href="/" aria-current="page">')
        self.assertNotRegex(html, r'href="/services/" aria-current="page"')

    def test_a_missing_setting_takes_ggds_default(self):
        with override_settings(GGDS_SITE={"name": "Example Agency", "short_name": "EA", "host": "example.gov.gh"}):
            html = self.render("/")
        self.assertIn('<span class="ggds-header__country">Republic of Ghana</span>', html, "country: GGDS's words, not empty")
        self.assertIn('href="/search/"', html)
        self.assertNotIn("ggds-tab-bar", html, "no tabs, no tab bar")
        self.assertEqual(site(None)["ggds_site"]["nav_id"], "ggds-header-nav")


class FeedbackTests(SimpleTestCase):
    def render(self, src: str, path: str = "/services/apply-for-a-licence/", **context) -> str:
        return Template("{% load ggds %}" + src).render(Context({"request": RequestFactory().get(path), **context}))

    def test_feedback_matches_its_examples(self):
        tag = '{% ggds_feedback action="/feedback/" report_url="/report-a-problem/" %}'
        self.assertEqual(shape(self.render(tag)), shape(example("1-default.html")))
        answered = '{% ggds_feedback action="/feedback/" report_url="/report-a-problem/" answered=True %}'
        self.assertEqual(shape(self.render(answered)), shape(example("2-thanks.html")))
        self.assertIn('href="/report-a-problem/?page=/services/apply-for-a-licence/"', self.render(tag))

    def test_feedback_sends_the_csrf_token_and_a_given_page(self):
        html = self.render('{% ggds_feedback action="/feedback/" page="/fees/" %}', csrf_token="t0k3n")
        self.assertIn('name="csrfmiddlewaretoken" value="t0k3n"', html)
        self.assertIn('name="page" value="/fees/"', html)
        self.assertNotIn("ggds-feedback__report", html, "no report link without report_url")
