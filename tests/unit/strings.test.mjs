// GGDS's own text (packages/html/strings): one English source, used by every package, ready to translate.
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { LANGUAGES, STRINGS, TRANSLATIONS } from '../../packages/html/strings/build.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const files = (dir, ext) => readdirSync(join(root, dir), { recursive: true }).filter((f) => f.endsWith(ext) && !f.includes('strings.')).map((f) => readFileSync(join(root, dir, f), 'utf8')).join('\n');
const react = files('packages/react/src', '.tsx') + files('packages/react/src', '.ts');
const astro = files('packages/astro/src', '.astro').replace(/\/\*[\s\S]*?\*\//g, '');
const django = files('packages/django/src/ggds_django/templatetags', '.py') + files('packages/django/src/ggds_django/templates', '.html');

test('every text is used: by the Django tags and templates and by @ggds/react', () => {
  // A key in a template literal (`phaseBanner.${phase}`, `notice.${type}`) counts by its prefix.
  const used = (src, key) => src.includes(`'${key}'`) || src.includes(`"${key}"`) || src.includes(`${key.split('.')[0]}.\${`) || src.includes(`f"${key.split('.')[0]}.{`);
  // Parts React or Django does not have (Django has no notice tag; React has no pagination, summary list or panel,
  // and its fields take "(optional)" in the label the site writes).
  const notInReact = /^(pagination|summaryList|panel)\.|^field\.optional$/;
  const notInDjango = /^notice\./;
  for (const key of Object.keys(STRINGS)) {
    if (!notInReact.test(key)) assert.ok(used(react, key), `@ggds/react does not use ${key}`);
    if (!notInDjango.test(key)) assert.ok(used(django, key), `ggds-django does not use ${key}`);
  }
});

test('the Astro page parts take their text from the strings, not from English in the markup', () => {
  for (const english of ['Skip to main content', 'How to tell', 'A padlock is not proof', 'Quick links', 'Common tasks:', 'All contact details and offices', 'Choose a language', 'On this page', 'Accept analytics cookies']) {
    assert.ok(!astro.includes(english), `Astro has "${english}" written in`);
  }
});

test('the languages have ISO codes, a name in their own language, and only English is marked checked', () => {
  assert.equal(LANGUAGES[0].code, 'en');
  for (const l of LANGUAGES) {
    assert.match(l.code, /^[a-z]{2,3}$/, l.code);
    assert.ok(l.own && l.name, l.code);
    if (l.code !== 'en') assert.equal(l.checked, false, `${l.code}: a speaker must check it before it is marked checked`);
  }
});

test('translations keep the English placeholders and only use real keys', () => {
  const ph = (s) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');
  for (const [code, t] of Object.entries(TRANSLATIONS)) {
    for (const [key, text] of Object.entries(t)) {
      assert.ok(key in STRINGS, `${code}: ${key}`);
      assert.equal(ph(text), ph(STRINGS[key]), `${code}: ${key}`);
    }
  }
});

test('the Django catalogues hold every text, with its key as context', () => {
  const dir = join(root, 'packages', 'django', 'src', 'ggds_django', 'locale');
  if (!existsSync(dir)) return; // built by pnpm run build
  for (const { code } of LANGUAGES.filter((l) => l.code !== 'en')) {
    const po = readFileSync(join(dir, code, 'LC_MESSAGES', 'django.po'), 'utf8');
    for (const key of Object.keys(STRINGS)) assert.ok(po.includes(`msgctxt "${key}"`), `${code}: ${key}`);
    assert.ok(existsSync(join(dir, code, 'LC_MESSAGES', 'django.mo')), `${code}: django.mo`);
  }
});
