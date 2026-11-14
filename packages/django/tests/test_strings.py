"""GGDS's own text is translated through Django's gettext: a catalogue made by packages/html/strings/build.mjs is
used for the active language, each text by its key, and English shows wherever a language has no translation.
The "translations" here are test markers, not real Twi. Needs Node to write the catalogue; skipped without it."""
import json
import shutil
import subprocess
import tempfile
from pathlib import Path
from unittest import skipUnless

from django.core.paginator import Paginator
from django.template import Context, Template
from django.test import RequestFactory, SimpleTestCase, override_settings
from django.utils import translation
from django.utils.translation import trans_real

from ggds_django.strings import LANGUAGES, STRINGS, html, text

ROOT = Path(__file__).resolve().parents[3]
MARKERS = {
    "header.menu": "[tw] Menu",
    "pagination.next": "[tw] Next page",
    "timeline.next": "[tw] Next stage",
    "banner.officialAddress": "[tw] {host} address.",
}

WRITE_MO = """
import { mo, STRINGS } from './packages/html/strings/build.mjs';
import { writeFileSync } from 'node:fs';
const t = %s;
const meta = 'Language: tw\\nMIME-Version: 1.0\\nContent-Type: text/plain; charset=UTF-8\\n';
writeFileSync(process.argv[1], mo([['', meta], ...Object.entries(t).map(([k, v]) => [k + '\\x04' + STRINGS[k], v])]));
"""


def render(src, **ctx):
    return Template("{% load ggds %}" + src).render(Context({"request": RequestFactory().get("/"), **ctx}))


class EnglishTests(SimpleTestCase):
    def test_the_english_comes_from_the_shared_strings(self):
        self.assertEqual(text("skipLink.label"), "Skip to main content")
        self.assertIn('href="#main">Skip to main content<', render("{% ggds_skip_link %}"))
        self.assertEqual(text("progress.label", current=3, total=4), "Question 3 of 4")

    def test_placeholders_escape_text_and_keep_safe_html(self):
        self.assertEqual(html("banner.officialAddress", host="<b>x</b>"), "The official address of this website is &lt;b&gt;x&lt;/b&gt;.")
        self.assertIn("<strong>example.gov.gh</strong>", render('{% ggds_banner short_name="EA" host="example.gov.gh" official=True %}'))

    def test_a_site_can_still_reword_a_part(self):
        self.assertIn(">Skip to content<", render('{% ggds_skip_link label="Skip to content" %}'))
        self.assertIn('<span class="ggds-header__country">Accra</span>', render('{% ggds_header name="A" country="Accra" %}'))
        self.assertNotIn("ggds-header__country", render('{% ggds_header name="A" country="" %}'))

    def test_the_languages_are_listed_and_marked_unchecked_until_a_speaker_checks_them(self):
        codes = [lang["code"] for lang in LANGUAGES]
        self.assertEqual(codes, ["en", "tw", "ee", "gaa", "ha", "dag"])
        self.assertTrue(all(not lang["checked"] for lang in LANGUAGES if lang["code"] != "en"))
        self.assertTrue(all(isinstance(v, str) and v for v in STRINGS.values()))


@skipUnless(shutil.which("node"), "needs Node to write the test catalogue")
class TranslationTests(SimpleTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.dir = tempfile.TemporaryDirectory()
        mo = Path(cls.dir.name) / "tw" / "LC_MESSAGES" / "django.mo"
        mo.parent.mkdir(parents=True)
        subprocess.run(["node", "--input-type=module", "-e", WRITE_MO % json.dumps(MARKERS), str(mo)], cwd=ROOT, check=True)

    @classmethod
    def tearDownClass(cls):
        cls.dir.cleanup()
        super().tearDownClass()

    def setUp(self):
        trans_real._translations = {}
        trans_real._active = trans_real.Local()

    def tearDown(self):
        trans_real._translations = {}
        translation.deactivate()

    def test_the_active_language_is_used_and_english_fills_the_gaps(self):
        with override_settings(LOCALE_PATHS=[self.dir.name], LANGUAGES=[("en", "English"), ("tw", "Twi")]), translation.override("tw"):
            header = render('{% ggds_header name="Example Agency" %}')
            self.assertIn('<span class="ggds-visually-hidden">[tw] Menu</span>', header)
            self.assertIn(">Search<", header, "a text with no translation shows the English")

    def test_the_same_english_word_is_translated_by_its_place(self):
        page = Paginator(range(30), 10).page(1)
        with override_settings(LOCALE_PATHS=[self.dir.name]), translation.override("tw"):
            self.assertIn("[tw] Next page", render("{% ggds_pagination page_obj %}", page_obj=page))
            self.assertIn("[tw] Next stage", render("{% ggds_timeline stages %}", stages=[{"title": "Check", "state": ""}]))

    def test_a_translated_text_keeps_its_html(self):
        with override_settings(LOCALE_PATHS=[self.dir.name]), translation.override("tw"):
            banner = render('{% ggds_banner short_name="EA" host="example.gov.gh" official=True %}')
            self.assertIn("[tw] <strong>example.gov.gh</strong> address.", banner)
