// Fast pages: the CSS and icon subset tools give exactly what a site uses, the build runs every step, and every
// documentation screenshot has its smaller AVIF and WebP copies.
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const cssDist = join(root, 'packages', 'css', 'dist');
const built = { skip: !existsSync(join(cssDist, 'components.json')) && 'run pnpm run build' };
const css = await import('../../packages/css/subset.mjs');
const icons = await import('../../packages/icons/subset.mjs');

test('ggds-css-subset: classes find the component named after them, and only that one', built, () => {
  const map = JSON.parse(readFileSync(join(cssDist, 'components.json'), 'utf8'));
  const of = (html) => css.componentsFor(css.classesIn(html), map);
  assert.deepEqual(of('<div class="ggds-field ggds-field--error"><span class="ggds-hint">'), ['field']);
  assert.deepEqual(of('<fieldset class="ggds-fieldset">'), ['field']); // not date-input, which styles it too
  assert.deepEqual(of('<div class="ggds-date-input"><div class="ggds-field">'), ['field', 'date-input']);
  assert.deepEqual(of('<nav class="ggds-tab-bar">'), ['tab-bar']); // not footer
  assert.deepEqual(of('<div class="ggds-table-wrap">'), ['table']); // not prose
  assert.deepEqual(of('<button class="ggds-button ggds-button--secondary"><span class="ggds-stack">'), ['button', 'layout']);
  assert.deepEqual(of('<p class="not-ggds ggds-js-enabled">'), []); // unknown classes are ignored
  // Every component's own block class finds it.
  for (const c of map.components.filter((c) => map.classes[`ggds-${c}`])) assert.ok(of(`class="ggds-${c}"`).includes(c), c);
});

test('ggds-css-subset: every component together is ggds.min.css, rule for rule and in the same layers', built, () => {
  const all = css.subset(JSON.parse(readFileSync(join(cssDist, 'components.json'), 'utf8')).components);
  // Drop comments, the @layer wrappers (one per file in the subset, one per layer in ggds.min.css) and the layer-order
  // statements (the minifier moves them; the order is the same); what is left must be the same rules in the same order.
  const rules = (text) => text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/@layer ggds\.(base|components|utilities)\{/g, '').replace(/@layer[^{;]*;/g, '').replace(/\s+/g, '');
  const full = readFileSync(join(cssDist, 'ggds.min.css'), 'utf8');
  assert.equal(rules(all).replace(/\}+/g, '}'), rules(full).replace(/\}+/g, '}'));
  assert.match(all, /^\/\*! GGDS /, 'keeps the licence banner');
  assert.equal(all.match(/\/\*! GGDS /g).length, 1, 'one banner, not one per file');
});

test('ggds-css-subset: --no-tokens leaves the tokens out; an unknown component is an error', built, () => {
  assert.match(css.subset(['button']), /--ggds-color-brand-500:/);
  assert.doesNotMatch(css.subset(['button'], { tokens: false }), /--ggds-color-brand-500:/);
  assert.match(css.subset(['button'], { tokens: false }), /\.ggds-button\{/);
  assert.throws(() => css.subset(['buton']), /no component called buton/);
});

test('ggds-icons-subset: finds icons however a site names them, and makes a sprite of only those', { skip: !existsSync(join(root, 'packages', 'icons', 'dist', 'sprite.svg')) && 'run pnpm run build' }, () => {
  const all = icons.symbols();
  const names = new Set(all.keys());
  const found = (text) => [...icons.iconsIn(text, names)].sort();
  assert.deepEqual(found('<use href="/ggds/icons/sprite.svg#search"/>'), ['search']);
  assert.deepEqual(found(`icon('id-card') {% ggds_icon "download" %} ggds_icon( 'home', 'x' ) <Icon name="menu" />`), ['download', 'home', 'id-card', 'menu']);
  assert.deepEqual(found('searching for "searches" or #searchbox'), []); // whole names only
  const sprite = icons.subset(['search', 'close', 'search']);
  assert.equal(sprite.match(/<symbol /g).length, 2);
  assert.ok(sprite.includes(all.get('search')), 'the same symbol as in the full sprite');
  assert.throws(() => icons.subset(['serch']), /no icon called serch/);
});

test('ggds-icons-subset: a copy of the whole icon set is skipped, not counted as using every icon', { skip: !existsSync(join(root, 'packages', 'django', 'src', 'ggds_django', 'icons.json')) && 'run pnpm run build' }, () => {
  const skipped = [];
  const used = icons.scan([join(root, 'packages', 'django', 'src')], icons.symbols(), skipped);
  assert.ok(skipped.some((f) => f.endsWith('icons.json')));
  assert.ok(used.length > 0 && used.length < 20, `${used.length} icons`);
});

test('the build runs every build:<step> script, each after the steps whose output it reads', async () => {
  const { scripts } = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  assert.equal(scripts.build, 'node scripts/build.mjs');
  const src = readFileSync(join(root, 'scripts', 'build.mjs'), 'utf8');
  const needs = Function(`return ${src.slice(src.indexOf('{', src.indexOf('export const NEEDS')), src.indexOf('};', src.indexOf('export const NEEDS')) + 1)}`)();
  const steps = Object.keys(scripts).filter((s) => s.startsWith('build:')).map((s) => s.slice(6)).sort();
  assert.deepEqual(Object.keys(needs).sort(), steps, 'every build:<step> script has its inputs listed in scripts/build.mjs');
  for (const [step, list] of Object.entries(needs)) for (const n of list) assert.ok(needs[n], `${step} needs unknown step ${n}`);
  // Each step that reads another package's dist lists that package.
  const reads = {
    css: join(root, 'packages', 'css', 'build.mjs'), django: join(root, 'packages', 'django', 'build.mjs'),
    wordpress: join(root, 'packages', 'wordpress', 'build.mjs'), docs: join(root, 'docs', 'build.mjs'),
  };
  for (const [step, file] of Object.entries(reads)) {
    const text = readFileSync(file, 'utf8');
    for (const pkg of ['tokens', 'icons', 'themes', 'js', 'css', 'react']) {
      const usesDist = new RegExp(`(['"/]${pkg}['"]?, 'dist'|\\.\\./${pkg}/dist|packages/${pkg}/dist|'${pkg}', 'demo-dist')`).test(text);
      if (usesDist && pkg !== step) assert.ok(needs[step].includes(pkg), `${step} reads ${pkg}'s output: add it to NEEDS.${step}`);
    }
  }
});

test('every documentation screenshot has AVIF and WebP copies, made after it and smaller', () => {
  const dir = join(root, 'docs', 'screenshots');
  for (const jpg of readdirSync(dir).filter((f) => f.endsWith('.jpg'))) {
    for (const ext of ['avif', 'webp']) {
      const copy = join(dir, jpg.replace(/\.jpg$/, `.${ext}`));
      assert.ok(existsSync(copy), `${copy} is missing: run pnpm run images`);
      assert.ok(statSync(copy).size < statSync(join(dir, jpg)).size, `${copy} is bigger than the JPEG`);
    }
  }
});
