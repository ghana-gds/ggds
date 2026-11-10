// The component reference (packages/html/components/*/component.json) matches the CSS: every class it documents
// exists, and every class in the CSS is documented. Also: the documentation's drawn focus matches the real one.
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const componentsDir = join(root, 'packages', 'html', 'components');
const cssDir = join(root, 'packages', 'css', 'src');
const slugs = readdirSync(componentsDir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
const refs = Object.fromEntries(slugs.map((s) => [s, JSON.parse(readFileSync(join(componentsDir, s, 'component.json'), 'utf8'))]));
const classesIn = (css) => new Set(css.replace(/\/\*[\s\S]*?\*\//g, '').match(/\.ggds-[a-z0-9_-]+/g) ?? []);
const cssFile = (name) => readFileSync(name ? join(cssDir, 'components', `${name}.css`) : join(cssDir, 'base.css'), 'utf8');
const covers = (documented, cls) => documented.some((d) => (d.endsWith('*') ? cls.startsWith(d.slice(0, -1)) : d === cls));

test('every component has a reference with a stylesheet, classes and the fields the docs need', () => {
  for (const [slug, r] of Object.entries(refs)) {
    assert.ok(r.css === null || existsSync(join(cssDir, 'components', `${r.css}.css`)), `${slug}: stylesheet ${r.css}`);
    assert.ok(r.classes.length > 0, `${slug}: no classes`);
    for (const key of ['javascript', 'states', 'astro', 'django', 'tests']) assert.ok(key in r, `${slug}: ${key} missing`);
  }
});

test('every documented class exists in the component\'s stylesheet', () => {
  for (const [slug, r] of Object.entries(refs)) {
    const real = [...classesIn(cssFile(r.css))];
    for (const [cls] of r.classes) {
      assert.ok(cls.endsWith('*') ? real.some((x) => x.startsWith(cls.slice(0, -1))) : real.includes(cls), `${slug}: ${cls} is not in ${r.css ?? 'base'}.css`);
    }
  }
});

test('every class in the CSS is documented on a component page', () => {
  const documented = Object.values(refs).flatMap((r) => r.classes.map(([c]) => c));
  const files = [null, ...readdirSync(join(cssDir, 'components')).map((f) => f.replace(/\.css$/, ''))];
  const missing = files.flatMap((f) => [...classesIn(cssFile(f))].filter((c) => !covers(documented, c)).map((c) => `${c} (${f ?? 'base'}.css)`));
  assert.deepEqual(missing, []);
});

test('the documentation draws focus exactly as GGDS does', () => {
  const decl = (css, selector) => css.match(new RegExp(`(?:^|\\n)${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} \\{([^}]*)\\}`))?.[1].split(';').map((d) => d.trim()).filter(Boolean).sort();
  const docs = readFileSync(join(root, 'docs', 'docs.css'), 'utf8');
  assert.deepEqual(decl(docs, '.docs-state-focus'), decl(cssFile(null), ':focus-visible'));
  assert.ok(/\.ggds-select:focus-visible \{\s*border-color: var\(--ggds-color-focus-halo\);/.test(cssFile('field')));
  assert.match(docs, /\.ggds-input\.docs-state-focus \{\s*border-color: var\(--ggds-color-focus-halo\);/);
});

test('changelog component tags name real components', () => {
  const tags = [...readFileSync(join(root, 'CHANGELOG.md'), 'utf8').matchAll(/<!--\s*components:\s*([^>]*?)\s*-->/g)].flatMap((m) => m[1].split(',').map((s) => s.trim()));
  assert.ok(tags.length > 0);
  assert.deepEqual(tags.filter((t) => !slugs.includes(t)), []);
});
