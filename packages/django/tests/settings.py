SECRET_KEY = "tests-only"
# ggds_django.admin_theme above django.contrib.admin, so its admin templates win.
INSTALLED_APPS = ["django.contrib.staticfiles", "ggds_django", "ggds_django.admin_theme", "django.contrib.admin",
                  "django.contrib.auth", "django.contrib.contenttypes", "django.contrib.sessions",
                  "django.contrib.messages"]
MIDDLEWARE = ["django.contrib.sessions.middleware.SessionMiddleware",
              "django.contrib.auth.middleware.AuthenticationMiddleware",
              "django.contrib.messages.middleware.MessageMiddleware"]
TEMPLATES = [{"BACKEND": "django.template.backends.django.DjangoTemplates", "APP_DIRS": True,
              "OPTIONS": {"context_processors": ["django.template.context_processors.request",
                                                 "django.contrib.auth.context_processors.auth",
                                                 "django.contrib.messages.context_processors.messages"]}}]
DATABASES = {"default": {"ENGINE": "django.db.backends.sqlite3", "NAME": ":memory:"}}
ROOT_URLCONF = "tests.urls"
FORM_RENDERER = "ggds_django.forms.GGDSFormRenderer"
STATIC_URL = "/static/"
USE_TZ = True
GGDS_ADMIN = {"theme": "nca", "name": "National Communications Authority"}
