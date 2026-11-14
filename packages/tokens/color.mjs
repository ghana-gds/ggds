// WCAG 2.2 colour contrast. Pure functions with no imports, so the same code runs in Node, in build tools and in
// the browser (the theme builder on the documentation's Themes page loads this file as it is).

const HEX = /^#[0-9a-f]{6}$/i;

/** True for a #rrggbb colour. */
export const isHex = (hex) => typeof hex === 'string' && HEX.test(hex);

/** The red, green and blue channels of a #rrggbb colour, 0 to 255. */
export const channels = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

/** A #rrggbb colour from red, green and blue channels (rounded and clamped to 0 to 255). */
export const toHex = (rgb) => `#${rgb.map((c) => Math.min(255, Math.max(0, Math.round(c))).toString(16).padStart(2, '0')).join('')}`;

/**
 * A colour as #rrggbb, lower case, from "#rrggbb", "rrggbb", "#rgb" or "rgb" (any case, surrounding spaces
 * ignored). Null for anything else.
 */
export function normaliseHex(input) {
  const s = String(input ?? '').trim().replace(/^#/, '').toLowerCase();
  if (/^[0-9a-f]{3}$/.test(s)) return `#${[...s].map((c) => c + c).join('')}`;
  return /^[0-9a-f]{6}$/.test(s) ? `#${s}` : null;
}

/** The WCAG 2.2 relative luminance of a #rrggbb colour. */
export function luminance(hex) {
  if (!isHex(hex)) throw new Error(`expected #rrggbb, got "${hex}"`);
  const [r, g, b] = channels(hex).map((c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** The WCAG 2.2 contrast ratio between two #rrggbb colours. */
export function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
