// Tokens: every reference resolves, every approved colour pair meets its contrast minimum, and the default
// identity is the MoCDTI theme.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { GOLD, institutionColourProblems, institutionCss, institutionPalette } from '../../packages/tokens/institution.mjs';
import { contrast, cssName, flatten, loadTokens, resolveAll } from '../../packages/tokens/lib.mjs';

const file = new URL('../../packages/tokens/tokens.json', import.meta.url).pathname;
const source = loadTokens(file);
const tokens = resolveAll(flatten(source));
const value = (path) => tokens.get(path).resolved;

test('every token has a type and every reference resolves', () => {
  for (const t of tokens.values()) {
    assert.ok(t.type, `${t.path.join('.')} has no $type`);
    assert.notEqual(t.resolved, undefined, `${t.path.join('.')} did not resolve`);
  }
});

test('every approved colour pair meets its minimum contrast', () => {
  const failures = source.$extensions.ggds.contrastPairs
    .map((p) => ({ ...p, ratio: contrast(value(p.fg), value(p.bg)) }))
    .filter((p) => p.ratio < p.min)
    .map((p) => `${p.fg} on ${p.bg}: ${p.ratio.toFixed(2)}:1 < ${p.min}:1`);
  assert.deepEqual(failures, []);
});

test('institution.mjs gold matches the flag gold token', () => {
  assert.equal(GOLD, value('color.flag.gold'));
});

test('the default institution colours are the MoCDTI theme', () => {
  const moc = institutionPalette(value('color.brand.700'));
  assert.equal(value('color.institution.default'), moc.accent);
  assert.equal(value('color.institution.deep'), moc.deep);
});

test('css names drop a trailing "default"', () => {
  assert.equal(cssName(['color', 'text', 'default']), '--ggds-color-text');
  assert.equal(cssName(['color', 'institution', 'deep']), '--ggds-color-institution-deep');
});

test('institution colour rule refuses colours too light for text on white', () => {
  assert.equal(institutionColourProblems('#0090d8').length, 1, 'the MoCDTI logo blue is 3.5:1');
  assert.equal(institutionColourProblems('red').length, 1);
  assert.deepEqual(institutionColourProblems('#005f8f'), []);
  assert.throws(() => institutionCss('#fcd116'));
});

test('the deep shade always carries white at 7:1 and gold at 4.5:1, and keeps the hue', () => {
  for (const hex of ['#ca0a15', '#006e35', '#005f8f', '#767676', '#0808af']) {
    const { deep } = institutionPalette(hex);
    assert.ok(contrast('#ffffff', deep) >= 7, `${hex} → ${deep}`);
    assert.ok(contrast(GOLD, deep) >= 4.5, `${hex} → ${deep}`);
  }
  assert.equal(institutionPalette('#061f45').deep, '#061f45', 'a colour that is already dark is used as it is');
});

test('built tokens.css zeroes durations under reduced motion', () => {
  const css = readFileSync(new URL('../../packages/tokens/dist/tokens.css', import.meta.url), 'utf8');
  assert.match(css, /prefers-reduced-motion: reduce[\s\S]*--ggds-motion-duration-base: 0ms/);
});

test('compat-site.css aliases point at existing GGDS properties', () => {
  const css = readFileSync(new URL('../../packages/tokens/dist/compat-site.css', import.meta.url), 'utf8');
  const names = new Set([...tokens.values()].map((t) => cssName(t.path)));
  for (const [, target] of css.matchAll(/var\((--ggds-[a-z0-9-]+)\)/g)) assert.ok(names.has(target), target);
});
