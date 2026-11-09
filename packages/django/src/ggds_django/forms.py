"""Render Django forms with GGDS.

Set FORM_RENDERER = "ggds_django.forms.GGDSFormRenderer" in settings, or give one form the renderer with
GGDSFormMixin. Then {{ form }} renders an error summary and every field in GGDS markup, and
{{ form.my_field.as_field_group }} renders one field.
"""
from django.forms.renderers import DjangoTemplates


class GGDSFormRenderer(DjangoTemplates):
    form_template_name = "ggds/forms/form.html"
    field_template_name = "ggds/forms/field.html"


class GGDSFormMixin:
    """Use GGDS for this form only: class ComplaintForm(GGDSFormMixin, forms.Form)."""

    default_renderer = GGDSFormRenderer()
