"""The back link, phase banner, side navigation, contents list, language switcher, cookie banner and character count
output the same elements, classes and meaningful attributes as their GGDS documentation examples."""
from html.parser import HTMLParser
from pathlib import Path

from django import forms
from django.template import Context, Template
from django.test import RequestFactory, SimpleTestCase, override_settings

EXAMPLES = Path(__file__).resolve().parents[2] / "html" / "components"
KEEP = ("class", "href", "id", "aria-label", "aria-current", "aria-labelledby", "aria-describedby", "aria-invalid", "role",
        "type", "for", "name", "value", "method", "action", "lang", "hreflang", "data-ggds-module", "data-ggds-max")


class Shape(HTMLParser):
    def __init__(self):
        super().__init__()
        self.out = []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        self.out.append((tag, tuple((k, a[k] or "") for k in KEEP if k in a)))


def shape(html):
    s = Shape()
    s.feed(html)
    return s.out


def example(path):
    return (EXAMPLES / path).read_text("utf-8").split("-->", 1)[1]


def render(src, path="/", **ctx):
    return Template("{% load ggds %}" + src).render(Context({"request": RequestFactory().get(path), **ctx}))


SIDE = [{"label": "Licences", "href": "/services/licences/"},
        {"label": "Fees and charges", "href": "/services/fees/", "links": [
            {"label": "Broadcasting fees", "href": "/services/fees/broadcasting/"},
            {"label": "Telecoms fees", "href": "/services/fees/telecoms/"}]},
        {"label": "Equipment approval", "href": "/services/type-approval/"}]


class NewComponentTests(SimpleTestCase):
    def test_back_link(self):
        html = render('{% ggds_back_link "/services/licence/apply/contact/" %}')
        self.assertEqual(shape(html), shape(example("back-link/examples/1-default.html")))
        self.assertIn(">Back<", html)

    def test_phase_banner(self):
        html = render('{% ggds_phase_banner "beta" feedback_href="/feedback/" %}')
        self.assertEqual(shape(html), shape(example("phase-banner/examples/1-beta.html")))
        self.assertIn('Your <a href="/feedback/">feedback</a> will help', html)
        with self.assertRaises(ValueError):
            render('{% ggds_phase_banner "gamma" %}')

    def test_side_navigation_marks_the_current_page_and_opens_its_pages(self):
        html = render("{% ggds_side_nav items %}", path="/services/fees/", items=SIDE)
        self.assertEqual(shape(html), shape(example("side-navigation/examples/1-default.html")))
        closed = render("{% ggds_side_nav items %}", path="/services/licences/", items=SIDE)
        self.assertNotIn("ggds-side-nav__list--sub", closed, "only the current page's pages are shown")

    def test_contents_list(self):
        items = [("Who needs a licence", "#who-needs-a-licence"), ("What it costs", "#what-it-costs"), ("How to apply", "#how-to-apply")]
        html = render("{% ggds_contents items %}", items=items)
        self.assertEqual(shape(html), shape(example("contents-list/examples/1-default.html")))
        self.assertIn(">On this page<", html)

    @override_settings(LANGUAGES=[("en", "English"), ("tw", "Twi"), ("ee", "Ewe"), ("gaa", "Ga"), ("ha", "Hausa"), ("dag", "Dagbani")], LANGUAGE_CODE="en")
    def test_language_switcher_names_each_language_in_its_own_language(self):
        links = [{"code": c, "href": h} for c, h in [("en", "/"), ("tw", "/tw/"), ("ee", "/ee/"), ("gaa", "/gaa/"), ("ha", "/ha/"), ("dag", "/dag/")]]
        html = render("{% ggds_language_switcher links current='en' %}", links=links)
        self.assertEqual(shape(html), shape(example("language-switcher/examples/1-default.html")))
        self.assertIn('lang="ee" hreflang="ee">Eʋegbe<', html)
        auto = render("{% ggds_language_switcher %}")
        self.assertEqual(auto.count("ggds-language-switcher__link"), 6, "every language in settings.LANGUAGES")

    def test_language_switcher_is_left_out_with_one_language(self):
        self.assertEqual(render("{% ggds_language_switcher links %}", links=[{"code": "en", "href": "/"}]).strip(), "")

    def test_cookie_banner_asks_confirms_and_then_goes(self):
        ask = render('{% ggds_cookie_banner "Example Agency" %}')
        self.assertEqual(shape(ask), shape(example("cookie-banner/examples/1-question.html")))
        accepted = render('{% ggds_cookie_banner "Example Agency" choice="accept" %}')
        self.assertEqual(shape(accepted), shape(example("cookie-banner/examples/2-accepted.html")))
        self.assertIn("You have accepted analytics cookies.", accepted)
        self.assertIn("You have rejected analytics cookies.", render('{% ggds_cookie_banner "A" choice="reject" %}'))
        self.assertEqual(render('{% ggds_cookie_banner "A" choice="hidden" %}').strip(), "")
        with_token = render('{% ggds_cookie_banner "A" %}', csrf_token="abc")
        self.assertIn('name="csrfmiddlewaretoken" value="abc"', with_token)


class CountedForm(forms.Form):
    details = forms.CharField(label="Describe the problem", help_text="Include dates, amounts and any reference numbers",
                              max_length=500, widget=forms.Textarea(attrs={"rows": 5}))


class SummaryForm(forms.Form):
    summary = forms.CharField(label="Summarise the problem", max_length=100, widget=forms.Textarea(attrs={"rows": 3}))


@override_settings(FORM_RENDERER="ggds_django.forms.GGDSFormRenderer")
class CharacterCountTests(SimpleTestCase):
    def test_a_textarea_with_a_limit_gets_a_count_and_no_maxlength(self):
        html = str(CountedForm(auto_id="%s")["details"].as_field_group())
        self.assertEqual(shape(html), shape(example("character-count/examples/1-default.html")))
        self.assertNotIn("maxlength", html)
        self.assertIn("You can enter up to 500 characters", html)
        self.assertIn('data-ggds-remaining-other="You have {count} characters remaining"', html)

    def test_too_many_characters_is_an_error(self):
        form = SummaryForm({"summary": "x" * 112}, auto_id="%s")
        self.assertFalse(form.is_valid())
        html = str(form["summary"].as_field_group())
        self.assertEqual(shape(html), shape(example("character-count/examples/2-error.html")))
