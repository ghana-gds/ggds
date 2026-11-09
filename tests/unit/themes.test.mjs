// Themes: MoCDTI is the default and agrees with the tokens; every theme is a valid institution colour; the built
// stylesheets set only the two institution tokens.
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { test } from 'node:test';
import { DEFAULT_THEME, allThemesCss, getTheme, themeCss, themes } from '../../packages/themes/index.mjs';
import { drift } from '../../packages/themes/sync.mjs';
import { institutionColourProblems } from '../../packages/tokens/institution.mjs';
import { flatten, loadTokens, resolveAll } from '../../packages/tokens/lib.mjs';

const tokens = resolveAll(flatten(loadTokens(new URL('../../packages/tokens/tokens.json', import.meta.url).pathname)));
const dist = new URL('../../packages/themes/dist/', import.meta.url);

test('MoCDTI is the default theme, listed first, and equals the token defaults', () => {
  assert.equal(DEFAULT_THEME, 'mocdti');
  assert.equal(themes[0].slug, 'mocdti');
  const moc = getTheme('mocdti');
  assert.equal(moc.accent, tokens.get('color.institution.default').resolved);
  assert.equal(moc.deep, tokens.get('color.institution.deep').resolved);
});

test('there is one theme per MoCDTI website, with unique slugs', () => {
  assert.equal(themes.length, 12);
  assert.equal(new Set(themes.map((t) => t.slug)).size, themes.length);
  for (const t of themes) assert.match(t.slug, /^[a-z0-9-]+$/);
});

test('every theme colour passes the institution colour rule', () => {
  for (const t of themes) assert.deepEqual(institutionColourProblems(t.color), [], t.slug);
});

test('an unknown theme is an error, not the default', () => {
  assert.throws(() => getTheme('nope'), /unknown GGDS theme "nope"/);
});

test('theme CSS sets only the institution tokens', () => {
  for (const css of [allThemesCss(), ...themes.map((t) => themeCss(t.slug))]) {
    const props = new Set([...css.matchAll(/(--[a-z0-9-]+)\s*:/g)].map((m) => m[1]));
    assert.deepEqual([...props].sort(), ['--ggds-color-institution', '--ggds-color-institution-deep']);
  }
});

test('attribute scope outranks the token defaults on <html>', () => {
  assert.match(themeCss('nca', { scope: 'attribute' }), /^:root\[data-ggds-theme="nca"\],\n\[data-ggds-theme="nca"\] \{/m);
});

test('the build wrote one stylesheet per theme and themes.css with every theme', () => {
  const files = readdirSync(dist).filter((f) => f.endsWith('.css'));
  for (const t of themes) assert.ok(files.includes(`${t.slug}.css`), t.slug);
  const all = readFileSync(new URL('themes.css', dist), 'utf8');
  for (const t of themes) assert.ok(all.includes(`[data-ggds-theme="${t.slug}"]`), t.slug);
});

test('themes.json matches the platform profiles (when the platform is available)', (t) => {
  const d = drift();
  if (d === null) return t.skip('platform not found');
  assert.deepEqual(d, []);
});
