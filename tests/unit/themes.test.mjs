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

// Making a theme: the suggestion, the full check, scoped CSS, design tokens and the command line.
import { execFileSync, spawnSync } from 'node:child_process';
import { contrast, normaliseHex } from '../../packages/tokens/color.mjs';
import { checkInstitutionColour, institutionCss, institutionPalette, institutionTokens, suggestInstitutionColour } from '../../packages/tokens/institution.mjs';
import { themeTokens } from '../../packages/themes/index.mjs';

const cli = new URL('../../packages/themes/cli.mjs', import.meta.url).pathname;
const run = (...args) => spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8' });

test('normaliseHex accepts the ways people write colours, and nothing else', () => {
  assert.equal(normaliseHex(' #006E35 '), '#006e35');
  assert.equal(normaliseHex('006e35'), '#006e35');
  assert.equal(normaliseHex('#0f0'), '#00ff00');
  for (const bad of ['', 'green', '#12345', '#gggggg', null]) assert.equal(normaliseHex(bad), null, String(bad));
});

test('a too-light colour gets the lightest passing shade with the same hue', () => {
  for (const hex of ['#7fb3d5', '#00ff00', '#fcd116', '#ffffff', '#ff8800']) {
    const s = suggestInstitutionColour(hex);
    assert.ok(contrast(s, '#ffffff') >= 4.5, `${hex} → ${s}`);
    assert.ok(contrast(s, '#ffffff') < 4.7, `${hex} → ${s} is darker than it needs to be`);
  }
  assert.equal(suggestInstitutionColour('#006e35'), '#006e35');
});

test('checkInstitutionColour reports without throwing, and agrees with institutionPalette', () => {
  const good = checkInstitutionColour('#006e35');
  assert.equal(good.ok, true);
  assert.equal(good.suggestion, null);
  assert.deepEqual({ accent: good.accent, deep: good.deep }, institutionPalette('#006e35'));
  assert.ok(good.checks.every((k) => k.pass));
  const bad = checkInstitutionColour('#7fb3d5');
  assert.equal(bad.ok, false);
  assert.equal(bad.accent, bad.suggestion);
  assert.deepEqual(bad.checks.filter((k) => !k.pass).map((k) => k.id), ['name-on-white']);
  assert.equal(checkInstitutionColour('nope').ok, false);
});

test('every ready-made theme has the same deep shade as before (the 2% step is kept)', () => {
  assert.equal(getTheme('mocdti').deep, '#005d8c');
  assert.equal(getTheme('gdcl').deep, '#006732');
});

test('institutionCss scopes to data-ggds-theme with a slug, and rejects bad slugs', () => {
  assert.equal(institutionCss(getTheme('pcsrc').color, { slug: 'pcsrc' }).replace(/^\/\*.*\*\/\n/, ''), themeCss('pcsrc', { scope: 'attribute' }).replace(/^\/\*.*\*\/\n/, ''));
  assert.throws(() => institutionCss('#b20912', { slug: 'Not OK' }), /lower-case letters/);
  assert.match(institutionCss('#b20912', { name: 'A */ B' }), /^\/\* A \* \/ B \*\//);
});

test('design tokens use the tokens.json names, and the build wrote one file per theme', () => {
  const t = institutionTokens('#006e35');
  assert.equal(t.color.$type, 'color');
  assert.equal(t.color.institution.default.$value, '#006e35');
  assert.equal(t.color.institution.deep.$value, '#006732');
  for (const th of themes) {
    const file = JSON.parse(readFileSync(new URL(`tokens/${th.slug}.tokens.json`, dist), 'utf8'));
    assert.deepEqual(file, themeTokens(th.slug), th.slug);
  }
});

test('the command line makes, checks and lists themes', () => {
  assert.match(execFileSync(process.execPath, [cli, '#006e35'], { encoding: 'utf8' }), /--ggds-color-institution-deep: #006732;/);
  assert.match(run('#006e35', '--slug', 'gdcl').stdout, /\[data-ggds-theme="gdcl"\]/);
  assert.equal(JSON.parse(run('nca', '--format', 'tokens').stdout).color.institution.default.$value, getTheme('nca').accent);
  const check = run('check', '#7fb3d5');
  assert.equal(check.status, 1);
  assert.match(check.stdout, /#577b92/);
  assert.equal(run('check', '006e35').status, 0);
  assert.equal(run('#7fb3d5').status, 1);
  assert.equal(run('nope').status, 2);
  assert.equal(run('#006e35', '--slug', 'Bad Slug').status, 2);
  assert.equal(run('list').stdout.trim().split('\n').length, themes.length);
});
