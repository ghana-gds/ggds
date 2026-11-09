"""GGDS icons, shared with @ggds/astro and the documentation (packages/astro/icons.mjs, copied by build.mjs)."""
import json
from functools import cache
from pathlib import Path

from django.utils.html import format_html
from django.utils.safestring import SafeString, mark_safe


@cache
def _icons() -> dict[str, str]:
    return json.loads((Path(__file__).parent / "icons.json").read_text())


def icon(name: str, cls: str) -> SafeString:
    """An icon as SVG markup, hidden from screen readers: the text beside it names it."""
    paths = _icons().get(name) or _icons()["services"]
    return format_html(
        '<svg class="{}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" '
        'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">{}</svg>',
        cls,
        mark_safe(paths),
    )
