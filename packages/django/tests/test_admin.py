"""ggds_django.admin_theme: Django admin in GGDS colours, type and header, from GGDS tokens only."""
import json
import re
from pathlib import Path

from django.contrib.auth.models import User
from django.contrib.staticfiles import finders
from django.core import checks
from django.test import TestCase, override_settings

ROOT = Path(__file__).resolve().parents[3]
ADMIN_CSS = Path(__file__).resolve().parents[1] / "src" / "ggds_django" / "admin_theme" / "static" / "ggds_admin" / "admin.css"


class AdminCssTests(TestCase):
    def test_uses_only_tokens_that_exist(self):
        tokens = set(json.loads((ROOT / "packages" / "tokens" / "dist" / "tokens.json").read_text()))
        used = set(re.findall(r"--ggds-[a-z0-9-]+", ADMIN_CSS.read_text()))
        self.assertTrue(used)
        self.assertEqual(used - tokens, set())

    def test_static_files_are_found(self):
        for f in ("ggds/tokens.css", "ggds/themes/nca.css", "ggds/components/header.min.css", "ggds_admin/admin.css"):
            self.assertTrue(finders.find(f), f)

    def test_tokens_css_has_no_element_styles(self):
        css = Path(finders.find("ggds/tokens.css")).read_text()
        selectors = {s.strip() for s in re.findall(r"([^{}]+)\{", re.sub(r"/\*.*?\*/", "", css, flags=re.S))}
        self.assertTrue(selectors <= {":root"} | {s for s in selectors if s.startswith("@media")}, selectors)


class AdminPageTests(TestCase):
    def test_login_page(self):
        html = self.client.get("/admin/login/").content.decode()
        for f in ("ggds/tokens.css", "ggds/themes/nca.css", "ggds_admin/admin.css"):
            self.assertIn(f"/static/{f}", html)
        self.assertNotIn("ggds/ggds", html)  # no base styles in admin
        self.assertIn('<span class="ggds-header__name">National Communications Authority</span>', html)
        self.assertIn('<span class="ggds-header__monogram" aria-hidden="true">NATI</span>', html)
        self.assertNotIn("dark_mode.css", html)
        self.assertNotIn("theme-toggle", html)

    def test_change_form(self):
        User.objects.create_superuser("admin", "a@b.c", "pw")
        self.client.login(username="admin", password="pw")
        user = User.objects.get()
        response = self.client.get(f"/admin/auth/user/{user.pk}/change/")
        self.assertEqual(response.status_code, 200)
        html = response.content.decode()
        self.assertIn("ggds_admin/admin.css", html)
        self.assertNotIn("theme-toggle", html)

    @override_settings(GGDS_ADMIN={"name": "National Communications Authority", "initials": "NCA",
                                   "logo_url": "", "country": ""})
    def test_initials_and_no_country(self):
        html = self.client.get("/admin/login/").content.decode()
        self.assertIn(">NCA</span>", html)
        self.assertNotIn("ggds-header__country", html)

    @override_settings(GGDS_ADMIN={"logo_url": "/static/logo.png", "logo_alt": "NCA logo"})
    def test_logo_and_site_header_default(self):
        html = self.client.get("/admin/login/").content.decode()
        self.assertIn('src="/static/logo.png" alt="NCA logo"', html)
        self.assertNotIn("ggds-header__monogram", html)
        self.assertIn(">Django administration</span>", html)  # admin.site.site_header


class CheckTests(TestCase):
    def ids(self):
        from ggds_django.admin_theme.apps import check_settings
        return [e.id for e in check_settings()]

    def test_good_settings(self):
        self.assertEqual(self.ids(), [])

    @override_settings(INSTALLED_APPS=["django.contrib.admin", "ggds_django.admin_theme"])
    def test_order(self):
        self.assertIn("ggds_admin.W001", self.ids())

    @override_settings(GGDS_ADMIN={"them": "nca"})
    def test_unknown_key(self):
        self.assertIn("ggds_admin.W002", self.ids())

    @override_settings(GGDS_ADMIN={"theme": "nope"})
    def test_unknown_theme(self):
        self.assertIn("ggds_admin.W003", self.ids())

    def test_registered(self):
        self.assertEqual([e for e in checks.run_checks() if e.id.startswith("ggds_admin")], [])
