"""The Django starter (npx @ggds/create --stack django) is the same website as the plain HTML starter: every page,
rendered by Django with ggds/page.html and ggds-django's tags, matches the HTML starter's page element by element,
with the classes and the attributes that carry meaning, at Django's addresses. And the project it makes passes
Django's own checks. Needs Node; skipped without it."""
import json
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path
from unittest import skipUnless

from django.test import SimpleTestCase, override_settings

ROOT = Path(__file__).resolve().parents[3]
SRC = ROOT / "packages" / "django" / "src"

SITES = {
    "example": {"version": "0.5.0", "theme": "mocdti"},
    "own": {"version": "0.5.0", "site": {"name": "Fisheries Commission of the Republic of Ghana", "short": "FC",
                                         "theme": "#7fd1ae", "logo": "assets/logo.svg",
                                         "forms": "https://forms.fc.gov.gh/submit", "live": True,
                                         "parts": {"news": False, "jobs": False}}},
}

NODE = """
import { starterFiles, starterProject } from './docs/starter.mjs';
import { relinkPages, route } from './docs/starter-stacks.mjs';
const site = JSON.parse(process.argv[1]);
const { files } = starterProject({ ...site, stack: 'django' });
const expected = relinkPages(starterFiles(site), '/static/website/');
console.log(JSON.stringify({ files, expected, routes: Object.fromEntries(Object.keys(expected).map((f) => [f, route(f)])) }));
"""

KEEP = ["class", "href", "id", "src", "action", "method", "aria-label", "aria-current", "aria-hidden", "aria-controls",
        "aria-labelledby", "aria-describedby", "role", "type", "for", "name", "value", "hidden", "autocomplete",
        "tabindex", "data-validate", "data-required", "data-pattern"]


def shape(html: str) -> list[str]:
    """Every start tag in order, with the attributes that carry meaning (as tests/unit/starter-stacks.test.mjs)."""
    if "<body" in html:
        html = html[html.index(">", html.index("<body")) + 1:html.rindex("</body>")]
    html = re.sub(r"<!--[\s\S]*?-->", "", html)
    html = re.sub(r"<script\b[\s\S]*?</script>", "", html, flags=re.I)
    html = re.sub(r"<link\b[^>]*>", "", html, flags=re.I)
    out = []
    for tag, attrs in re.findall(r"<([a-z][a-z0-9]*)\b([^>]*)>", html, flags=re.I):
        a = {k.lower(): (v or "").replace("&amp;", "&") for k, v in re.findall(r'([a-z-:]+)(?:="([^"]*)")?', attrs, flags=re.I)}
        kept = " ".join(f'{k}="{a[k]}"' for k in KEEP if k in a)
        out.append(f"{tag.lower()} {kept}".strip())
    return out


def make(site: dict) -> dict:
    out = subprocess.run(["node", "--input-type=module", "-e", NODE, json.dumps(site)], cwd=ROOT, capture_output=True,
                         text=True, check=True)
    return json.loads(out.stdout)


@skipUnless(shutil.which("node"), "needs Node to make the starter")
class StarterTests(SimpleTestCase):
    def render_all(self, name: str):
        made = make(SITES[name])
        tmp = Path(tempfile.mkdtemp(prefix="ggds-django-starter-"))
        self.addCleanup(shutil.rmtree, tmp, True)
        for path, text in made["files"].items():
            (tmp / path).parent.mkdir(parents=True, exist_ok=True)
            (tmp / path).write_text(text)
        return made, tmp

    def test_every_page_matches_the_html_starter(self):
        for name in SITES:
            made, tmp = self.render_all(name)
            sys.path.insert(0, str(tmp))
            self.addCleanup(sys.path.remove, str(tmp))
            for mod in [m for m in sys.modules if m == "config" or m.startswith("config.")]:
                del sys.modules[mod]
            namespace: dict = {"__file__": str(tmp / "config" / "settings.py")}
            exec(compile((tmp / "config" / "settings.py").read_text(), "settings.py", "exec"), namespace)
            templates = [{"BACKEND": "django.template.backends.django.DjangoTemplates", "DIRS": [tmp / "website" / "templates"],
                          "APP_DIRS": True, "OPTIONS": {"context_processors": [
                              "django.template.context_processors.request", "ggds_django.context_processors.site"]}}]
            with override_settings(ROOT_URLCONF="config.urls", TEMPLATES=templates, GGDS_SITE=namespace["GGDS_SITE"],
                                   MIDDLEWARE=[], DEBUG=False):
                for file, html in made["expected"].items():
                    url = "/this-page-does-not-exist/" if file == "404.html" else made["routes"][file]
                    response = self.client.get(url)
                    self.assertEqual(response.status_code, 404 if file == "404.html" else 200, f"{name}: {url}")
                    self.assertEqual(shape(response.content.decode()), shape(html), f"{name}: {file}")

    def test_the_project_passes_djangos_checks(self):
        for name in SITES:
            _, tmp = self.render_all(name)
            env = {"PYTHONPATH": str(SRC), "DJANGO_DEBUG": "0", "DJANGO_SECRET_KEY": "tests-only-9f2Kq7Lm3Xv8Rt1Wb6Yc4Hn0Pd5Jz-Ga2Se8Uo-Ti4Fr7Ey1Wq3", "PATH": "/usr/bin:/bin"}
            result = subprocess.run([sys.executable, "manage.py", "check", "--deploy", "--fail-level", "WARNING"],
                                    cwd=tmp, env=env, capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, f"{name}: {result.stdout}{result.stderr}")
