"""GGDS_SITE from your settings, for ggds/page.html: every key a page part needs, with GGDS's defaults."""
from django.conf import settings

DEFAULTS = {
    "name": "", "short_name": "", "purpose": "", "host": "", "official": True, "address_note": "",
    "register_href": "", "noindex": False, "theme": "", "nav": [], "nav_id": "ggds-header-nav", "home": "/",
    "search_url": "/search/", "country": None, "logo_url": "", "logo_alt": "", "initials": "", "address": "",
    "email": "", "phone": "", "contact_url": "", "sections": [], "links": [], "tabs": [],
}


def site(request):
    """{"ggds_site": GGDS_SITE with every key filled in}. Add "ggds_django.context_processors.site" to TEMPLATES."""
    return {"ggds_site": {**DEFAULTS, **getattr(settings, "GGDS_SITE", {})}}
