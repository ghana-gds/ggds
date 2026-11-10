// The institution colour rule. Each institution keeps its own colour on identity surfaces only: the header rule,
// its name and the footer. Links, buttons, form controls and status colours stay shared, so every government
// website works the same way.
//
// Use: write institutionCss('#006e35') into a stylesheet loaded after ggds.css (never an inline style: GGDS
// pages run under a CSP without 'unsafe-inline').
import { contrast } from './lib.mjs';

const HEX = /^#[0-9a-f]{6}$/i;
const WHITE = '#ffffff';
// Kept equal to color.flag.gold in tokens.json (a unit test checks it).
export const GOLD = '#fcd116';
/** The institution colour is used as text on white (its name in the header). */
export const MIN_ON_WHITE = 4.5;
/** The deep shade carries white body text in the footer and gold accents. */
export const MIN_WHITE_ON_DEEP = 7;
export const MIN_GOLD_ON_DEEP = 4.5;

const channels = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const toHex = (rgb) => `#${rgb.map((c) => Math.round(c).toString(16).padStart(2, '0')).join('')}`;

/** Why a colour cannot be an institution colour, or [] when it can. */
export function institutionColourProblems(hex) {
  if (!HEX.test(hex ?? '')) return ['institution colour must be #rrggbb'];
  const ratio = contrast(hex, WHITE);
  return ratio < MIN_ON_WHITE
    ? [`${hex} has ${ratio.toFixed(2)}:1 contrast on white; the header sets the institution name in it, which needs ${MIN_ON_WHITE}:1 (use a darker shade)`]
    : [];
}

/**
 * The institution colour and a deep shade of it for the footer. The shade darkens the colour only as far as
 * contrast needs (scaling the channels keeps its hue).
 */
export function institutionPalette(hex) {
  const problems = institutionColourProblems(hex);
  if (problems.length) throw new Error(problems.join('; '));
  const accent = hex.toLowerCase();
  const base = channels(accent);
  let deep = accent;
  for (let k = 1; contrast(deep, WHITE) < MIN_WHITE_ON_DEEP || contrast(deep, GOLD) < MIN_GOLD_ON_DEEP; k -= 0.02) {
    deep = toHex(base.map((c) => c * Math.max(k, 0)));
  }
  return { accent, deep };
}

/** A stylesheet that sets the institution colour for a site. */
export function institutionCss(hex) {
  const { accent, deep } = institutionPalette(hex);
  return `:root {\n  --ggds-color-institution: ${accent};\n  --ggds-color-institution-deep: ${deep};\n}\n`;
}
