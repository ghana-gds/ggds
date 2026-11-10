// The showcase (docs/showcase.mjs): each example is its own made-up organisation with its own colour; every link
// on its pages works and stays inside that example (or goes to the showcase index); every page has the same frame
// (example bar, header, one h1, footer); and every page can be reached by clicking from the example's first page.
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { SHOWCASES, showcaseFiles } from '../../docs/showcase.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const dir = join(root, 'site', 'showcase');
const built = { skip: !existsSync(join(dir, 'index.html')) && 'run pnpm run build' };

test('every example is its own organisation, with its own colour, title and icon', () => {
  for (const key of ['org', 'colour', 'slug', 'title']) {
    const values = SHOWCASES.map((sc) => sc[key]);
    assert.deepEqual(values.filter((v, i) => values.indexOf(v) !== i), [], `two examples share a ${key}`);
  }
  for (const sc of SHOWCASES) {
    assert.ok(sc.summary && sc.uses?.length && sc.behind?.length, `${sc.slug}: summary, uses and behind`);
    assert.equal(typeof sc.common, 'boolean', `${sc.slug}: common or not`);
  }
  assert.ok(SHOWCASES.filter((sc) => sc.common).length >= 8, 'the examples built most often');
});

test('every link on every example page works, and stays inside its example', built, () => {
  const files = new Set(Object.keys(showcaseFiles()));
  for (const sc of SHOWCASES) {
    const own = new Set(sc.pages.map((p) => p.file));
    for (const p of sc.pages) {
      const html = readFileSync(join(dir, p.file), 'utf8');
      const main = html.match(/<main[\s\S]*<\/main>/)[0];
      const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
      for (const [, attr, url] of main.matchAll(/\s(href|action)="([^"]*)"/g)) {
        if (/^(mailto:|tel:)/.test(url)) continue;
        const [file, hash] = url.split('#');
        const where = `${sc.slug}/${p.file} → ${url}`;
        if (!file) { assert.ok(ids.has(hash), `${where}: no #${hash} on the page`); continue; }
        assert.ok(own.has(file) || files.has(file), `${where}: leads outside "${sc.name}"`);
        assert.ok(existsSync(join(dir, file)), `${where}: missing`);
        if (hash && own.has(file)) assert.match(readFileSync(join(dir, file), 'utf8'), new RegExp(`\\sid="${hash}"`), `${where}: no #${hash} there`);
        if (attr === 'action') assert.ok(own.has(file), `${where}: a form must go to a page of its example`);
      }
      // The header, the tab bar and the footer link only to the example, the index or the documentation.
      for (const [, url] of html.replace(main, '').matchAll(/\shref="([^"#][^"]*)"/g)) {
        if (/^\.\.\/(assets|index\.html)/.test(url) || url === 'index.html' || /^https?:/.test(url)) continue;
        assert.ok(own.has(url.split('#')[0]), `${sc.slug}/${p.file} → ${url} (outside main) leads outside "${sc.name}"`);
      }
    }
  }
});

test('every page has the same frame: the example bar, the header, one h1, the footer', built, () => {
  for (const sc of SHOWCASES) {
    for (const p of sc.pages) {
      const html = readFileSync(join(dir, p.file), 'utf8');
      const where = `${sc.slug}/${p.file}`;
      assert.equal((html.match(/<h1\b/g) ?? []).length, 1, `${where}: one h1`);
      assert.match(html, /class="docs-exit docs-exit--top"/, `${where}: example bar`);
      assert.match(html, new RegExp(`class="ggds-header__name[^"]*">${sc.org}<`), `${where}: header with ${sc.org}`);
      assert.match(html, /<footer class="ggds-footer"/, `${where}: footer`);
      assert.match(html, new RegExp(`assets/showcase/${sc.slug}\\.css`), `${where}: its own colour`);
    }
  }
});

test('every page of an example can be reached by clicking from its first page', built, () => {
  for (const sc of SHOWCASES) {
    const own = new Set(sc.pages.map((p) => p.file));
    const seen = new Set([sc.pages[0].file]);
    const queue = [sc.pages[0].file];
    while (queue.length) {
      const html = readFileSync(join(dir, queue.shift()), 'utf8');
      for (const [, url] of html.matchAll(/\s(?:href|action)="([^"#]+)/g)) if (own.has(url) && !seen.has(url)) { seen.add(url); queue.push(url); }
    }
    assert.deepEqual([...own].filter((f) => !seen.has(f)), [], `${sc.slug}: pages no link reaches`);
  }
});
