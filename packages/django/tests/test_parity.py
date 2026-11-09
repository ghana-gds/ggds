"""The Django page parts output the same elements and classes as the GGDS documentation's canonical markup
(docs/parts.mjs), so the two cannot drift. Needs Node; skipped without it."""
import json
import shutil
import subprocess
from html.parser import HTMLParser
from pathlib import Path

from django.template import Context, Template
from unittest import skipUnless

from django.test import RequestFactory, SimpleTestCase

ROOT = Path(__file__).resolve().parents[3]
NAV = [{"label": "Services", "href": "/services/"}, {"label": "About", "href": "/about/"}]
SECTIONS = [{"label": "Services", "href": "/services/", "links": [{"label": "Fees", "href": "/fees/"}]}]
TASKS = [{"label": "Apply", "href": "/apply/", "tag": "NCA"}]
TABS = [{"label": "Home", "href": "/", "icon": "home"}, {"label": "Search", "href": "/search/", "icon": "search"}]

NODE = """
import * as p from './docs/parts.mjs';
const NAV = %(nav)s, SECTIONS = %(sections)s, TASKS = %(tasks)s, TABS = %(tabs)s;
console.log(JSON.stringify({
  header: p.header({ name: 'Example Agency', logo: p.mark({ initials: 'EA' }), nav: NAV, current: '/services/', search: '/search/' }),
  banner: p.banner({ unofficial: true, shortName: 'EA', host: 'example.gov.gh', registerHref: '/register/' }),
  hero: p.hero({ purpose: 'We help.', title: 'What do you need?', lede: 'Find a service.', search: { action: '/search/', label: 'Search', placeholder: 'e.g. fees' }, tasks: TASKS }),
  footer: p.footer({ name: 'Example Agency', logo: p.mark({ initials: 'EA' }), purpose: 'We help.', contact: { address: 'Accra', email: 'a@b.c', phone: '0', moreHref: '/contact/' }, sections: SECTIONS, bar: [['Privacy', '/privacy/']] }),
  tabBar: p.tabBar(TABS.map((t, i) => ({ ...t, current: i === 0 }))),
}));
"""

DJANGO = {
    "header": '{% ggds_header name="Example Agency" initials="EA" nav=nav current="/services/" %}',
    "banner": '{% ggds_banner short_name="EA" host="example.gov.gh" register_href="/register/" %}',
    "hero": '{% ggds_hero title="What do you need?" purpose="We help." lede="Find a service." search_action="/search/" search_label="Search" search_placeholder="e.g. fees" tasks=tasks %}',
    "footer": '{% ggds_footer name="Example Agency" initials="EA" purpose="We help." address="Accra" email="a@b.c" phone="0" contact_url="/contact/" sections=sections links=bar %}',
    "tabBar": "{% ggds_tab_bar tabs %}",
}


class Shape(HTMLParser):
    """Every element in order, with its class and the attributes that carry meaning."""
    KEEP = ("class", "href", "id", "aria-label", "aria-current", "aria-hidden", "aria-controls", "aria-labelledby", "role", "type", "for", "name")

    def __init__(self):
        super().__init__()
        self.out = []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        self.out.append((tag, tuple((k, a[k] or "") for k in self.KEEP if k in a)))


def shape(html):
    s = Shape()
    s.feed(html)
    return s.out


@skipUnless(shutil.which("node"), "needs Node to render the documentation's markup")
class ParityTests(SimpleTestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        script = NODE % {"nav": json.dumps(NAV), "sections": json.dumps(SECTIONS), "tasks": json.dumps(TASKS), "tabs": json.dumps(TABS)}
        out = subprocess.run(["node", "--input-type=module", "-e", script], cwd=ROOT, capture_output=True, text=True, check=True)
        cls.reference = json.loads(out.stdout)

    def test_parts_match_the_documentation(self):
        ctx = {"request": RequestFactory().get("/"), "nav": NAV, "sections": SECTIONS, "tasks": TASKS, "tabs": TABS,
               "bar": [{"label": "Privacy", "href": "/privacy/"}]}
        for part, src in DJANGO.items():
            with self.subTest(part=part):
                django_html = Template("{% load ggds %}" + src).render(Context(ctx))
                self.assertEqual(shape(django_html), shape(self.reference[part]))
