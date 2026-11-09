from django.core.paginator import Paginator
from django.template import Context, Template
from django.test import RequestFactory, SimpleTestCase

NAV = [{"label": "Services", "href": "/services/"}, ("Laws & regulations", "/regulation/")]


def render(src, path="/", **ctx):
    request = RequestFactory().get(path)
    return Template("{% load ggds %}" + src).render(Context({"request": request, **ctx}))


class ComponentTests(SimpleTestCase):
    def test_header_marks_the_section_the_page_is_in(self):
        html = render('{% ggds_header name="National Communications Authority" nav=nav %}', "/services/fees/", nav=NAV)
        self.assertIn('href="/services/" aria-current="page"', html)
        self.assertNotIn('href="/regulation/" aria-current', html)
        self.assertIn('<span class="ggds-header__monogram" aria-hidden="true">NATI</span>', html)
        self.assertIn('class="ggds-header__menu-button"', html)
        self.assertIn('<span class="ggds-header__search-label">Search</span>', html)

    def test_long_names_get_the_long_modifier(self):
        html = render('{% ggds_header name=n nav=nav %}', n="Ministry of Communications, Digital Technology and Innovations", nav=NAV)
        self.assertIn("ggds-header__name--long", html)

    def test_pagination_keeps_other_query_parameters(self):
        page = Paginator(list(range(100)), 10).page(5)
        html = render("{% ggds_pagination page %}", "/news/?kind=notice&page=5", page=page)
        self.assertIn('href="?kind=notice&amp;page=4" rel="prev"', html)
        self.assertIn('href="?kind=notice" aria-label="Page 1"', html)
        self.assertIn('aria-label="Page 5" aria-current="page"', html)
        self.assertIn("ggds-pagination__ellipsis", html)

    def test_one_page_has_no_pagination(self):
        self.assertEqual(render("{% ggds_pagination page %}", page=Paginator([1], 10).page(1)).strip(), "")

    def test_tab_bar_lights_the_current_section(self):
        tabs = [{"label": "Home", "href": "/", "icon": "home"}, {"label": "Services", "href": "/services/", "icon": "services"}]
        html = render("{% ggds_tab_bar tabs %}", "/services/x/", tabs=tabs)
        self.assertIn('href="/services/" aria-current="page"', html)
        self.assertNotIn('href="/" aria-current', html)

    def test_banner_without_an_address_never_names_one(self):
        html = render('{% ggds_banner short_name="GIFEC" host="" %}')
        self.assertIn("This copy is not the official GIFEC website", html)
        self.assertIn("The GIFEC has not confirmed its official address yet.", html)

    def test_breadcrumbs_end_with_the_current_page(self):
        html = render("{% ggds_breadcrumbs crumbs %}", crumbs=[("Home", "/"), ("Services", "/services/"), ("Fees", "")])
        self.assertIn('<li class="ggds-breadcrumbs__item" aria-current="page">Fees</li>', html)

    def test_assets(self):
        html = render('{% ggds_assets theme="nca" %}')
        self.assertIn('href="/static/ggds/ggds.min.css"', html)
        self.assertIn('href="/static/ggds/themes/nca.css"', html)
        self.assertIn('<script type="module" src="/static/ggds/js/auto.js"></script>', html)
