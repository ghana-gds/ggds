// @ggds/themes: named example institution themes. MoCDTI is the default (it is also what @ggds/tokens ships), and
// each agency of the Ministry has an example theme GGDS can switch to. A theme changes only the institution colour and its deep
// shade, so it reaches the identity surfaces (header rule and name, hero, footer, directory cards) and nothing
// else: links, buttons, form controls and status colours are the same on every government website.
//
// An institution without a theme here uses institutionCss('#rrggbb') from @ggds/tokens/institution.mjs.
// No dependencies beyond @ggds/tokens.
import { readFileSync } from 'node:fs';
import { institutionPalette } from '@ggds/tokens/institution.mjs';

const data = JSON.parse(readFileSync(new URL('./themes.json', import.meta.url), 'utf8'));

/** The default theme's slug ("mocdti"). */
export const DEFAULT_THEME = data.default;

/** Every theme, default first: { slug, name, shortName, color, accent, deep, status, source }. */
export const themes = Object.freeze(data.themes.map((t) => Object.freeze({ ...t, ...institutionPalette(t.color) })));

/** One theme by slug. Throws for an unknown slug, so a typo cannot silently fall back to the default. */
export function getTheme(slug) {
  const t = themes.find((x) => x.slug === slug);
  if (!t) throw new Error(`unknown GGDS theme "${slug}" (known: ${themes.map((x) => x.slug).join(', ')})`);
  return t;
}

const declarations = (t) => `  --ggds-color-institution: ${t.accent};\n  --ggds-color-institution-deep: ${t.deep};\n`;

/**
 * A theme as CSS. scope "root" (default) themes the whole page: link it after ggds.css. scope "attribute" themes
 * any element with data-ggds-theme="<slug>", e.g. one card in a directory, or <html> for the whole page.
 */
export function themeCss(slug, { scope = 'root' } = {}) {
  const t = getTheme(slug);
  const selector = scope === 'attribute' ? `:root[data-ggds-theme="${t.slug}"],\n[data-ggds-theme="${t.slug}"]` : ':root';
  return `/* ${t.name} (${t.shortName}) */\n${selector} {\n${declarations(t)}}\n`;
}

/** Every theme keyed by data-ggds-theme, for a page that switches themes or shows several institutions. */
export function allThemesCss() {
  return themes.map((t) => themeCss(t.slug, { scope: 'attribute' })).join('\n');
}
