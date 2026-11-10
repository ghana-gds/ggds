// @ggds/icons: every drawing keeps the icon rules, every built format holds the same icons, and the icons that
// GGDS's own components and earlier releases use are still there.
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { compile, SVG_OPEN } from '../../packages/icons/build.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const pkg = join(root, 'packages', 'icons');
const dist = join(pkg, 'dist');
const names = readdirSync(join(pkg, 'src')).filter((f) => f.endsWith('.svg')).map((f) => f.slice(0, -4)).sort();
const json = (p) => JSON.parse(readFileSync(p, 'utf8'));
const built = { skip: !existsSync(join(dist, 'icons.json')) && 'run pnpm run build' };

test('every drawing keeps the icon rules', () => {
  assert.ok(names.length >= 140, `${names.length} icons`);
  for (const n of names) compile(n, readFileSync(join(pkg, 'src', `${n}.svg`), 'utf8'));
});

test('the rules catch drawings that break them', () => {
  const bad = {
    'off-grid': '<path d="M0 12h24"/>',
    'arc-out': '<path d="M3 12a10 10 0 1 1 18 0"/>',
    coloured: '<path d="M4 4h4" stroke="red"/>',
    filled: '<circle cx="12" cy="12" r="4" fill="#000"/>',
    transformed: '<path d="M4 4h4" transform="rotate(45)"/>',
    precise: '<path d="M4.125 4h4"/>',
    styled: '<g><path d="M4 4h4"/></g>',
    Wrong_Name: '<path d="M4 4h4"/>',
  };
  for (const [name, body] of Object.entries(bad)) assert.throws(() => compile(name, `${SVG_OPEN}${body}</svg>`), name);
  assert.throws(() => compile('no-frame', '<svg viewBox="0 0 24 24"><path d="M4 4h4"/></svg>'));
});

test('every icon is in exactly one category, with search keywords', () => {
  const { categories } = json(join(pkg, 'catalogue.json'));
  const listed = categories.flatMap((c) => Object.keys(c.icons));
  assert.deepEqual([...listed].sort(), names);
  for (const c of categories) for (const [n, tags] of Object.entries(c.icons)) assert.ok(tags.length >= 2, `${n}: add search keywords`);
});

test('the icons GGDS components and earlier releases use are still there', () => {
  // 0.2.0 and the components: renaming or removing one of these breaks websites.
  const kept = ['search', 'menu', 'close', 'home', 'building', 'services', 'help', 'comment', 'scale', 'chart', 'megaphone', 'book'];
  for (const n of kept) assert.ok(names.includes(n), n);
});

test('every built format holds every icon', built, () => {
  const icons = json(join(dist, 'icons.json'));
  assert.deepEqual(Object.keys(icons).sort(), names);
  for (const n of names) {
    assert.equal(icons[n], compile(n, readFileSync(join(pkg, 'src', `${n}.svg`), 'utf8')), `${n}: dist is out of date`);
    assert.equal(readFileSync(join(dist, 'svg', `${n}.svg`), 'utf8'), `${SVG_OPEN}${icons[n]}</svg>\n`, n);
  }
  const sprite = readFileSync(join(dist, 'sprite.svg'), 'utf8');
  assert.equal((sprite.match(/<symbol /g) ?? []).length, names.length);
  const sheet = readFileSync(join(dist, 'ggds-icons.svg'), 'utf8');
  for (const n of names) {
    assert.ok(sprite.includes(`<symbol id="${n}" `), `sprite: ${n}`);
    assert.ok(sheet.includes(`<g id="${n}" `), `design sheet: ${n}`);
  }
  // Django and WordPress draw the same icons.
  for (const copy of ['packages/django/src/ggds_django/icons.json', 'packages/wordpress/ggds/assets/icons.json']) {
    if (existsSync(join(root, copy))) assert.deepEqual(json(join(root, copy)), icons, copy);
  }
});

test('the JavaScript: one export per icon, svg() hides icons from screen readers unless labelled', built, async () => {
  const mod = await import('../../packages/icons/dist/index.js');
  const { ICONS, icon } = await import('../../packages/icons/dist/all.js');
  assert.equal(Object.keys(mod).length, names.length + 1);
  assert.deepEqual(Object.keys(ICONS).sort(), names);
  assert.equal(ICONS['arrow-right'], mod.arrowRight);
  const hidden = mod.svg(mod.download);
  assert.match(hidden, /^<svg class="ggds-icon" viewBox="0 0 24 24" [^>]*aria-hidden="true" focusable="false">/);
  const labelled = mod.svg(mod.download, { label: 'Download "form"', class: 'x' });
  assert.match(labelled, /role="img" aria-label="Download &quot;form&quot;"/);
  assert.doesNotMatch(labelled, /aria-hidden/);
  assert.match(icon('home', 'a'), /^<svg class="a" /);
  assert.throws(() => icon('no-such-icon'));
});

test('every icon on GGDS\'s own website is from @ggds/icons, drawn exactly as the pack draws it', built, () => {
  const site = join(root, 'site');
  if (!existsSync(site)) return;
  const icons = new Set(Object.values(json(join(dist, 'icons.json'))));
  const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((f) => (f.isDirectory() ? walk(join(d, f.name)) : [join(d, f.name)]));
  const strays = [];
  let used = 0;
  for (const file of walk(site).filter((f) => f.endsWith('.html'))) {
    // The example sites' hero drawings are the MoCDTI platform's own artwork (docs/scenes/), copied as the live
    // sites show it: small screens and envelopes there are part of a picture, not icons.
    const html = readFileSync(file, 'utf8').replace(/<figure\b[^>]*>[\s\S]*?<\/figure>/g, '')
      // Framework logos in the developers' guide (docs/stack-logos.mjs) are their owners' marks, not icons.
      .replace(/<span class="ggds-card__icon docs-stack-logo[^"]*">[\s\S]*?<\/span>/g, '').replace(/<code>[\s\S]*?<\/code>/g, (c) => c.replace(/<\/?span[^>]*>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&'));
    for (const [, body] of html.matchAll(/<svg\b[^>]*viewBox="0 0 24 24"[^>]*>([\s\S]*?)<\/svg>/g)) {
      const inner = body.replace(/>\s+</g, '><').replace(/\s+\/>/g, '/>').trim().replace(/(^|[\s,a-zA-Z"-])0\.(\d)/g, '$1.$2');
      if (inner.startsWith('<use ')) continue; // a sprite reference: the sprite is the pack
      used++;
      if (!icons.has(inner)) strays.push(`${file.slice(site.length + 1)}: ${inner.slice(0, 80)}`);
    }
  }
  // The agency example sites add hundreds of icons; they are built only with GGDS_AGENCY_SITES=1.
  const least = existsSync(join(site, 'agencies')) ? 1000 : 500;
  assert.ok(used > least, `${used} icons found; is the site built?`);
  assert.deepEqual([...new Set(strays)], []);
});
