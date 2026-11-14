"""GGDS's own text: the English in strings.json (built from packages/html/strings/en.json), translated through
Django's gettext from ggds_django/locale/<code>/LC_MESSAGES/django.mo, in the language Django has active for the
request (LocaleMiddleware, or translation.activate). Each text's key is its gettext context, so the same English
word in two places can be translated differently. A language with no translation for a text shows the English.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

from django.utils.html import conditional_escape, escape
from django.utils.safestring import SafeString, mark_safe
from django.utils.translation import pgettext

_DATA = json.loads(Path(__file__).with_name("strings.json").read_text("utf-8"))

#: GGDS's text in English, by key.
STRINGS: dict[str, str] = _DATA["strings"]
#: The languages GGDS's text is prepared for: code, name, own (its name in that language), checked.
LANGUAGES: list[dict] = _DATA["languages"]

_PLACEHOLDER = re.compile(r"\{(\w+)\}")


def text(key: str, **values) -> str:
    """The text for key in the active language, with each {name} filled in: for attributes and other plain text."""
    return _PLACEHOLDER.sub(lambda m: str(values[m[1]]) if m[1] in values else m[0], pgettext(key, STRINGS[key]))


def html(key: str, **values) -> SafeString:
    """The text for key in the active language as HTML: the text is escaped, and each {name} is replaced by its value,
    escaped unless it is already safe HTML (a link or <strong> made with format_html)."""
    template = escape(pgettext(key, STRINGS[key]))
    return mark_safe(_PLACEHOLDER.sub(lambda m: conditional_escape(values[m[1]]) if m[1] in values else m[0], template))
