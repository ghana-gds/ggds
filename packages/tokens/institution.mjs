// The institution colour rule. Each institution keeps its own colour on identity surfaces only: the header rule,
// its name and the footer. Links, buttons, form controls and status colours stay shared, so every government
// website works the same way.
//
// Use: write institutionCss('#006e35') into a stylesheet loaded after ggds.css (never an inline style: GGDS
// pages run under a CSP without 'unsafe-inline'). Or run `npx @ggds/themes '#006e35'`, or use the theme builder
// on the documentation's Themes page: all three use this file.
//
// No Node imports, so the documentation's theme builder runs this same file in the browser.
import { channels, contrast, isHex, toHex } from './color.mjs';

const WHITE = '#ffffff';
// Kept equal to color.flag.gold in tokens.json (a unit test checks it).
export const GOLD = '#fcd116';
/** The institution colour is used as text on white (its name in the header). */
export const MIN_ON_WHITE = 4.5;
/** The deep shade carries white body text in the footer and gold accents. */
export const MIN_WHITE_ON_DEEP = 7;
export const MIN_GOLD_ON_DEEP = 4.5;

/** A theme name: lower-case letters, digits and hyphens, as used in data-ggds-theme="<slug>" and <slug>.css. */
export const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Darkens a colour, keeping its hue (scaling the channels), until it passes `ok`. The deep shade uses steps of 2%
 * (changing that would change every published theme); suggestions use finer steps, to stay close to the colour.
 */
function darkenUntil(hex, ok, step) {
  const base = channels(hex);
  let out = hex;
  for (let k = 1; !ok(out); k -= step) out = toHex(base.map((c) => c * Math.max(k, 0)));
  return out;
}

/** Why a colour cannot be an institution colour, or [] when it can. */
export function institutionColourProblems(hex) {
  if (!isHex(hex)) return ['institution colour must be #rrggbb'];
  const ratio = contrast(hex, WHITE);
  return ratio < MIN_ON_WHITE
    ? [`${hex} has ${ratio.toFixed(2)}:1 contrast on white; the header sets the institution name in it, which needs ${MIN_ON_WHITE}:1 (use a darker shade)`]
    : [];
}

/**
 * The lightest shade of a colour, with the same hue, that passes the institution colour rule: the colour itself
 * when it already passes. For a brand colour that is too light to read on white.
 */
export function suggestInstitutionColour(hex) {
  if (!isHex(hex)) throw new Error(`expected #rrggbb, got "${hex}"`);
  return darkenUntil(hex.toLowerCase(), (c) => contrast(c, WHITE) >= MIN_ON_WHITE, 0.005);
}

/**
 * The institution colour and a deep shade of it for the hero and footer. The shade darkens the colour only as far
 * as contrast needs (scaling the channels keeps its hue).
 */
export function institutionPalette(hex) {
  const problems = institutionColourProblems(hex);
  if (problems.length) throw new Error(problems.join('; '));
  const accent = hex.toLowerCase();
  const deep = darkenUntil(accent, (c) => contrast(c, WHITE) >= MIN_WHITE_ON_DEEP && contrast(c, GOLD) >= MIN_GOLD_ON_DEEP, 0.02);
  return { accent, deep };
}

/**
 * Everything a person or a tool needs to know about a candidate colour, without throwing:
 *   { ok, colour, problems, suggestion, accent, deep, checks: [{ id, label, fg, bg, ratio, min, pass }] }
 * `suggestion` is the nearest passing shade when the colour fails, else null. `accent`, `deep` and `checks` describe
 * the colour when it passes, or the suggestion when it does not, so a preview always has something valid to show.
 */
export function checkInstitutionColour(hex) {
  if (!isHex(hex)) return { ok: false, colour: hex, problems: institutionColourProblems(hex), suggestion: null, accent: null, deep: null, checks: [] };
  const colour = hex.toLowerCase();
  const problems = institutionColourProblems(colour);
  const ok = problems.length === 0;
  const suggestion = ok ? null : suggestInstitutionColour(colour);
  const { accent, deep } = institutionPalette(ok ? colour : suggestion);
  const check = (id, label, fg, bg, min) => {
    const ratio = contrast(fg, bg);
    return { id, label, fg, bg, ratio: Math.round(ratio * 100) / 100, min, pass: ratio >= min };
  };
  const checks = [
    check('name-on-white', 'Your colour on white: the institution name in the header', colour, WHITE, MIN_ON_WHITE),
    check('white-on-deep', 'White text on the deep shade: the hero and footer', WHITE, deep, MIN_WHITE_ON_DEEP),
    check('gold-on-deep', 'Gold on the deep shade: the purpose line on the hero', GOLD, deep, MIN_GOLD_ON_DEEP),
  ];
  return { ok, colour, problems, suggestion, accent, deep, checks };
}

function selectorFor(slug) {
  if (slug === undefined) return ':root';
  if (!SLUG.test(slug)) throw new Error(`theme name "${slug}" must be lower-case letters, digits and hyphens, such as "my-agency"`);
  return `:root[data-ggds-theme="${slug}"],\n[data-ggds-theme="${slug}"]`;
}

/** The two custom property declarations of a palette, as CSS lines. */
export const institutionDeclarations = ({ accent, deep }) => `  --ggds-color-institution: ${accent};\n  --ggds-color-institution-deep: ${deep};\n`;

/**
 * A stylesheet that sets the institution colour. Load it after ggds.css.
 *   institutionCss('#006e35')                          the whole page (:root)
 *   institutionCss('#006e35', { slug: 'my-agency' })   only elements marked data-ggds-theme="my-agency"
 * `name` adds a comment naming the institution.
 */
export function institutionCss(hex, { slug, name } = {}) {
  const selector = selectorFor(slug);
  const comment = name ? `/* ${String(name).replaceAll('*/', '* /')} */\n` : '';
  return `${comment}${selector} {\n${institutionDeclarations(institutionPalette(hex))}}\n`;
}

/**
 * The institution colours as W3C design tokens (DTCG format), with the same names as in @ggds/tokens tokens.json
 * (color.institution.default and color.institution.deep). Import the file into Figma (local variables, Import), or
 * into Tokens Studio or Style Dictionary.
 */
export function institutionTokens(hex, { name } = {}) {
  const { accent, deep } = institutionPalette(hex);
  return {
    $description: `GGDS institution theme${name ? `: ${name}` : ''}. Use these colours only on the header line, the institution name, the homepage hero, the footer and the institution's card in a list.`,
    color: {
      $type: 'color',
      institution: {
        default: { $value: accent, $description: `The institution colour (${contrast(accent, WHITE).toFixed(1)}:1 on white). Header line, institution name, cards.` },
        deep: { $value: deep, $description: `The deep shade for the hero and footer (${contrast(WHITE, deep).toFixed(1)}:1 under white text).` },
      },
    },
  };
}
