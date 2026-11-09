# ggds-django

The [Ghana Government Design System](https://github.com/ghana-gds/ggds) (GGDS) for Django: the page parts as
template tags, a form renderer that turns any Django form into GGDS markup with correct error handling, and the GGDS
styles, themes and script as static files. Django 5.0 or later. Works with Wagtail and other Django-based CMSs.

## Set up

```python
INSTALLED_APPS = [..., "django.contrib.staticfiles", "ggds_django"]
FORM_RENDERER = "ggds_django.forms.GGDSFormRenderer"   # every form in GGDS markup
TEMPLATES = [{..., "OPTIONS": {"context_processors": [..., "django.template.context_processors.request"]}}]
```

To use GGDS for some forms only, leave `FORM_RENDERER` out and add `GGDSFormMixin` to those forms.

## A page

```django
{% load ggds %}<!doctype html>
<html lang="en-GB">
<head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{% ggds_error_title form "Make a complaint" %} | Example Agency</title>
  {% ggds_assets theme="nca" %}
</head>
<body>
{% ggds_skip_link %}
{% ggds_banner short_name="NCA" host="nca.org.gh" official=is_official %}
{% ggds_header name="National Communications Authority" nav=nav %}
<main id="main" tabindex="-1" class="ggds-container ggds-main">
  {% ggds_breadcrumbs crumbs %}
  <h1>Make a complaint</h1>
  <form method="post">{% csrf_token %}
    {{ form }}
    <button class="ggds-button">Send complaint</button>
  </form>
</main>
{% ggds_footer name="National Communications Authority" sections=sections links=footer_links %}
{% ggds_tab_bar tabs %}
</body>
</html>
```

Links are dicts (`{"label": "Services", "href": "/services/"}`) or `("Services", "/services/")` pairs. The header
marks the section the page's address is in; the tab bar marks the current tab.

## Forms

With the renderer, `{{ form }}` shows an error summary after a failed submit (focused on load by the GGDS
script, each item linking to its field, a radio group's to its first option), then every field:

| Django widget | GGDS markup |
|---|---|
| Text, email, number, date… | `ggds-field` with label, hint (`help_text`), error and `ggds-input` |
| `Textarea`, `Select`, `FileInput` | the same with `ggds-textarea`, `ggds-select`, `ggds-file-upload` |
| `RadioSelect`, `CheckboxSelectMultiple` | a `ggds-fieldset` with a legend and `ggds-choices` |
| `CheckboxInput` | a single `ggds-choice` |

Each control gets `aria-describedby` (hint, then error) and, with an error, `aria-invalid="true"`. Errors start
with a hidden "Error:". Fields that are not required say "(optional)". Set `autocomplete` on personal details with
the widget's `attrs`. One field: `{{ form.phone.as_field_group }}`.

## Page parts

| Tag | |
|---|---|
| `{% ggds_assets theme="nca" %}` | Stylesheet, theme and optional script, in `<head>` |
| `{% ggds_skip_link %}` | First thing in `<body>` |
| `{% ggds_banner short_name host official %}` | Government website banner |
| `{% ggds_header name nav %}` | Logo or initials, name, sections, Search |
| `{% ggds_hero title purpose lede search_action tasks %}` | Homepage hero |
| `{% ggds_breadcrumbs crumbs %}` | Trail ending with the current page |
| `{% ggds_pagination page_obj %}` | From Django's `Paginator`; keeps other query parameters |
| `{% ggds_footer name purpose address email phone sections links %}` | Footer |
| `{% ggds_tab_bar tabs %}` | Phone quick links: each tab has an `icon` |
| `{% ggds_error_summary form %}` | On its own, for forms you lay out yourself |

Everything else (buttons, notices, tags, cards, tables) is plain GGDS HTML: copy it from the documentation.

## Content added after load

HTMX, fetch or a script that adds a GGDS menu or error summary should call `initAll(element)` from the GGDS script
(`ggds/js/index.js`) on the new content.

## Develop

From the GGDS repository: `pnpm run build` copies the styles, themes, script and icons into the app;
`pnpm run test:django` runs the tests (including a check that the markup matches the GGDS documentation) and renders
an example site into the documentation build, where the accessibility tests check it.
