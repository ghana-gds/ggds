"""Tags for the GGDS admin templates: {% load ggds_admin %}. Settings come from GGDS_ADMIN."""
from django import template
from django.conf import settings
from django.templatetags.static import static
from django.utils.html import format_html
from django.utils.safestring import mark_safe

from ...templatetags.ggds import _initials

register = template.Library()


def _config() -> dict:
    return getattr(settings, "GGDS_ADMIN", {})


@register.simple_tag
def ggds_admin_assets():
    """The GGDS tokens, the institution's theme, the header's identity styles and the admin mapping. No base
    styles: they would restyle admin's own elements."""
    files = ["ggds/tokens.css"]
    if theme := _config().get("theme"):
        files.append(f"ggds/themes/{theme}.css")
    files += ["ggds/components/header.min.css", "ggds_admin/admin.css"]
    return mark_safe("\n".join(format_html('<link rel="stylesheet" href="{}">', static(f)) for f in files))


@register.inclusion_tag("ggds_admin/branding.html", takes_context=True)
def ggds_admin_branding(context):
    """The institution's logo or initials, name and country, as in the GGDS header. The name defaults to the
    admin site's site_header."""
    config = _config()
    name = config.get("name") or context.get("site_header") or "Administration"
    logo_url = config.get("logo_url", "")
    return {"name": name, "long": len(name) > 45, "logo_url": logo_url, "logo_alt": config.get("logo_alt", ""),
            "initials": config.get("initials") or ("" if logo_url else _initials(name)),
            "country": config.get("country", "Republic of Ghana")}
