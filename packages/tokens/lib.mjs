// Reading the DTCG token file: flatten groups, resolve {references}, name CSS custom properties, check contrast.
// No dependencies, so the build, the tests and any consumer's tooling can use it.
import { readFileSync } from 'node:fs';

export const PREFIX = 'ggds';

export function loadTokens(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

/** Every token as { path, type, value, description }, with $type inherited from its groups. */
export function flatten(tree, path = [], inheritedType) {
  const out = [];
  const type = tree.$type ?? inheritedType;
  if ('$value' in tree) {
    out.push({ path, type, value: tree.$value, description: tree.$description });
    return out;
  }
  for (const [key, child] of Object.entries(tree)) {
    if (key.startsWith('$') || child === null || typeof child !== 'object') continue;
    out.push(...flatten(child, [...path, key], type));
  }
  return out;
}

const REF = /^\{([^}]+)\}$/;

/** A map from dotted path to resolved token, following {a.b.c} references (cycles are an error). */
export function resolveAll(tokens) {
  const byPath = new Map(tokens.map((t) => [t.path.join('.'), t]));
  const resolve = (t, seen = new Set()) => {
    const m = typeof t.value === 'string' && t.value.match(REF);
    if (!m) return t.value;
    const key = m[1];
    if (seen.has(key)) throw new Error(`Token reference cycle at ${key}`);
    const target = byPath.get(key);
    if (!target) throw new Error(`${t.path.join('.')} refers to unknown token {${key}}`);
    return resolve(target, new Set([...seen, key]));
  };
  return new Map(tokens.map((t) => [t.path.join('.'), { ...t, resolved: resolve(t), ref: t.value.match?.(REF)?.[1] }]));
}

/** CSS custom property name. A trailing "default" is dropped: color.text.default → --ggds-color-text. */
export function cssName(path) {
  const parts = path.at(-1) === 'default' ? path.slice(0, -1) : path;
  return `--${PREFIX}-${parts.join('-')}`;
}

/** A token value written as CSS. References become var() so overriding one token updates its dependants. */
export function cssValue(token, all) {
  if (token.ref) return `var(${cssName(all.get(token.ref).path)})`;
  const v = token.value;
  switch (token.type) {
    case 'fontFamily':
      return (Array.isArray(v) ? v : [v]).map((f) => (/[\s-]/.test(f) && !/^[a-z-]+$/.test(f) ? `"${f}"` : f)).join(', ');
    case 'cubicBezier':
      return `cubic-bezier(${v.join(', ')})`;
    default:
      return String(v);
  }
}

// Contrast: WCAG 2.2 relative luminance.
const HEX = /^#[0-9a-f]{6}$/i;
const channels = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

export function luminance(hex) {
  if (!HEX.test(hex)) throw new Error(`expected #rrggbb, got "${hex}"`);
  const [r, g, b] = channels(hex).map((c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2.2 contrast ratio between two #rrggbb colours. */
export function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
