SECRET_KEY = "tests-only"
INSTALLED_APPS = ["django.contrib.staticfiles", "ggds_django"]
TEMPLATES = [{"BACKEND": "django.template.backends.django.DjangoTemplates", "APP_DIRS": True,
              "OPTIONS": {"context_processors": ["django.template.context_processors.request"]}}]
FORM_RENDERER = "ggds_django.forms.GGDSFormRenderer"
STATIC_URL = "/static/"
USE_TZ = True
