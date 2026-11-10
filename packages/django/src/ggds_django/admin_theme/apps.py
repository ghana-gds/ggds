from django.apps import AppConfig
from django.conf import settings
from django.contrib.staticfiles import finders
from django.core import checks

KEYS = {"theme", "name", "initials", "logo_url", "logo_alt", "country"}


class GgdsAdminConfig(AppConfig):
    name = "ggds_django.admin_theme"
    label = "ggds_admin"
    verbose_name = "GGDS for Django admin"

    def ready(self):
        checks.register(check_settings)


def check_settings(app_configs=None, **kwargs):
    """Catch the mistakes that would otherwise fail silently: admin looking unchanged, or a theme that 404s."""
    errors = []
    apps = list(settings.INSTALLED_APPS)
    ours, admin = "ggds_django.admin_theme", "django.contrib.admin"
    position = lambda name: next((i for i, a in enumerate(apps) if a == name or a.startswith(f"{name}.apps.")), None)
    if position(admin) is not None and position(ours) > position(admin):
        errors.append(checks.Warning(
            f"{ours} is below {admin} in INSTALLED_APPS, so admin's own templates are used.",
            hint=f"Move {ours} above {admin}.", id="ggds_admin.W001"))
    config = getattr(settings, "GGDS_ADMIN", {})
    unknown = set(config) - KEYS
    if unknown:
        errors.append(checks.Warning(
            f"GGDS_ADMIN has unknown keys: {', '.join(sorted(unknown))}.",
            hint=f"The keys are: {', '.join(sorted(KEYS))}.", id="ggds_admin.W002"))
    theme = config.get("theme")
    if theme and not finders.find(f"ggds/themes/{theme}.css"):
        errors.append(checks.Warning(
            f'GGDS_ADMIN theme "{theme}" does not exist.',
            hint="Use the name of a file in ggds/themes/, without .css.", id="ggds_admin.W003"))
    return errors
