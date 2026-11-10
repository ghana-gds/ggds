"""Key figures, progress, timeline, meter, steps and page heading: each tag renders the documentation's markup."""
from html.parser import HTMLParser
from pathlib import Path

from django.template import Context, Template
from django.test import SimpleTestCase

EXAMPLES = Path(__file__).resolve().parents[3] / "packages" / "html" / "components"


def shape(html):
    """Every element's tag and classes, in order, leaving out icon drawings: the shape the examples define."""
    out = []

    class P(HTMLParser):
        def handle_starttag(self, tag, attrs):
            if tag not in ("svg", "path", "circle", "rect", "line", "polyline", "polygon", "ellipse", "a"):
                out.append((tag, dict(attrs).get("class", "")))
    P().feed(html)
    return out


def example(slug, file):
    return (EXAMPLES / slug / "examples" / file).read_text().split("\n", 1)[1]


def render(src, **ctx):
    return Template("{% load ggds %}" + src).render(Context(ctx))


class KeyFiguresTests(SimpleTestCase):
    figures = [{"value": "755 mm", "label": "average rainfall", "change": "7% above normal"},
               {"value": "18", "label": "days of heavy rain", "change": "5 more than last year"},
               {"value": "3", "label": "regions with a flood warning", "change": "See the warnings", "danger": True}]

    def test_has_the_documentation_shape(self):
        html = render("{% ggds_key_figures figures %}", figures=self.figures)
        doc = example("key-figures", "1-default.html").split("</ul>")[0] + "</ul>"
        self.assertEqual(shape(html), shape(doc))

    def test_change_is_optional_and_inverse(self):
        html = render("{% ggds_key_figures figures inverse=True %}", figures=[{"value": "2", "label": "new messages"}])
        self.assertIn('<ul class="ggds-key-figures ggds-key-figures--inverse">', html)
        self.assertNotIn("ggds-key-figure__change", html)


class ProgressTests(SimpleTestCase):
    def test_has_the_documentation_shape_and_a_label_for_the_bar(self):
        html = render('{% ggds_progress 3 4 id="form-progress" %}')
        doc = example("progress", "1-default.html").split("<h1>")[0]
        self.assertEqual(shape(html), shape(doc))
        self.assertInHTML('<label class="ggds-progress__label" for="form-progress">Question 3 of 4</label>', html)
        self.assertIn('value="3" max="4"', html)

    def test_own_words(self):
        self.assertIn("Step 2 of 4: your canoe", render('{% ggds_progress 2 4 label="Step 2 of 4: your canoe" %}'))


class TimelineTests(SimpleTestCase):
    stages = [{"title": "Application and payment received", "when": "10 November 2026", "state": "done"},
              {"title": "A fisheries officer checks your answers", "when": "Within 5 working days", "state": "current"},
              {"title": "We check your canoe at the landing beach", "when": "We will text you a date"},
              {"title": "Your licence arrives by SMS", "when": "By 31 December 2026"}]

    def test_has_the_documentation_shape(self):
        html = render("{% ggds_timeline stages %}", stages=self.stages)
        doc = "<ol" + example("timeline", "1-what-happens-next.html").split("<ol", 1)[1]
        self.assertEqual(shape(html), shape(doc))

    def test_each_stage_says_its_state(self):
        html = render("{% ggds_timeline stages %}", stages=self.stages)
        for words in ("Done: ", "Now: ", "Next: "):
            self.assertIn(f'<span class="ggds-visually-hidden">{words}</span>', html)

    def test_rejects_an_unknown_state(self):
        with self.assertRaises(ValueError):
            render("{% ggds_timeline stages %}", stages=[{"title": "x", "state": "late"}])


class MeterTests(SimpleTestCase):
    def test_native_meter_hidden_from_screen_readers(self):
        html = render("{% ggds_meter 812 max=1100 %}")
        self.assertInHTML('<meter class="ggds-meter" min="0" max="1100" value="812" aria-hidden="true">812</meter>', html)


class StepsTests(SimpleTestCase):
    steps = [{"icon": "arrow-up", "title": "Move to higher ground", "text": "Take your family."},
             {"icon": "energy", "title": "Switch off the electricity", "text": "At the main switch."},
             {"icon": "blocked", "title": "Do not cross flood water", "text": "Not on foot and not by car."},
             {"icon": "mobile", "title": "Keep your phone charged", "text": "We will send updates."}]

    def test_has_the_documentation_shape_with_icons(self):
        html = render("{% ggds_steps steps urgent=True %}", steps=self.steps)
        doc = "<ol" + example("steps", "1-urgent.html").split("<ol", 1)[1]
        self.assertEqual(shape(html), shape(doc))
        self.assertEqual(html.count('<svg class="ggds-icon ggds-icon--lg"'), 4)

    def test_heading_level(self):
        self.assertIn('<h2 class="ggds-steps__title">', render("{% ggds_steps steps heading_level=2 %}", steps=self.steps))


class PageHeadingTests(SimpleTestCase):
    def test_title_is_the_h1_and_danger(self):
        html = render('{% ggds_page_heading "Flood warning" eyebrow="Warning in force" lede="Act now." danger=True %}')
        self.assertIn('<div class="ggds-page-heading ggds-page-heading--danger">', html)
        self.assertInHTML('<h1 class="ggds-page-heading__title">Flood warning</h1>', html)
        self.assertInHTML('<p class="ggds-page-heading__lede">Act now.</p>', html)

    def test_has_the_documentation_shape(self):
        html = render('{% ggds_page_heading "Flood warning" eyebrow="Warning in force" lede="Act now." danger=True %}')
        doc = example("page-heading", "2-warning.html")
        self.assertEqual(shape(html), [s for s in shape(doc)])
