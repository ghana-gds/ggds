// Component CSS rules: only tokens for colour, only the documented breakpoints, everything in layers.
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { test } from 'node:test';
import { COMPONENTS } from '../../packages/css/build.mjs';

const srcDir = new URL('../../packages/css/src/', import.meta.url);
const sources = [['base.css', readFileSync(new URL('base.css', srcDir), 'utf8')],
  ...readdirSync(new URL('components/', srcDir)).map((f) => [`components/${f}`, readFileSync(new URL(`components/${f}`, srcDir), 'utf8')])];
const strip = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');

test('every component source file is in the build', () => {
  const files = readdirSync(new URL('components/', srcDir)).map((f) => f.replace(/\.css$/, '')).sort();
  assert.deepEqual([...COMPONENTS].sort(), files);
});

test('no raw colours in component CSS: tokens only', () => {
  for (const [name, css] of sources) {
    const raw = strip(css).match(/#[0-9a-f]{3,8}\b|\brgba?\(|\bhsla?\(/gi);
    assert.equal(raw, null, `${name}: ${raw}`);
  }
});

test('media queries use only the breakpoint tokens (48rem, 64rem, 80rem) or user preferences', () => {
  const allowed = /^\((min-width: (48|64|80)rem|max-width: (47|63|79)\.99rem|prefers-reduced-motion: (reduce|no-preference)|forced-colors: active)\)$|^print$/;
  for (const [name, css] of sources) {
    for (const [, q] of strip(css).matchAll(/@media\s+([^{]+?)\s*\{/g)) assert.match(q, allowed, `${name}: @media ${q}`);
  }
});

test('!important only in utilities (visually hidden, print); no raw z-index', () => {
  for (const [name, css] of sources) {
    const rules = strip(css).replace(/\.ggds-visually-hidden\s*\{[^}]*\}/g, '').replace(/@media print\s*\{[\s\S]*?\n\}/g, '');
    assert.doesNotMatch(rules, /!important/, name);
    for (const [, v] of strip(css).matchAll(/z-index:\s*([^;]+);/g)) assert.match(v, /^var\(--ggds-layer-/, `${name}: z-index ${v}`);
  }
});

test('ggds.css puts base and components in cascade layers', () => {
  const css = readFileSync(new URL('../../packages/css/dist/ggds.css', import.meta.url), 'utf8');
  assert.match(css, /@layer ggds\.base, ggds\.components;/);
  assert.ok(css.length < 60_000, `ggds.css is ${css.length} bytes`);
});
