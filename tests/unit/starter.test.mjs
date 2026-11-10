// The agency website starter (docs/starter.mjs): a whole website people download. Every link works inside the
// download, every page has the GGDS frame, the zip holds everything it needs and nothing of the documentation,
// and the live preview always has a way back to the documentation.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const site = join(root, 'site');
const zip = existsSync(join(site, 'downloads')) ? readdirSync(join(site, 'downloads')).find((f) => /^ggds-agency-starter-.*\.zip$/.test(f)) : undefined;
const built = { skip: !zip && 'run pnpm run build' };

test('the download: one folder, every page and file, no documentation in it, and every link works inside it', built, () => {
  const dir = mkdtempSync(join(tmpdir(), 'ggds-starter-'));
  try {
    execFileSync('unzip', ['-q', join(site, 'downloads', zip), '-d', dir]);
    assert.deepEqual(readdirSync(dir), ['ggds-agency-starter']);
    const pack = join(dir, 'ggds-agency-starter');
    for (const f of ['index.html', 'README.md', 'LICENSE', 'LICENSE.md', 'search-index.json', 'ggds/ggds.min.css', 'ggds/auto.js', 'ggds/index.js', 'ggds/themes/mocdti.css', 'ggds/themes/nca.css', 'assets/site.css', 'assets/site.js', 'assets/search.js']) {
      assert.ok(existsSync(join(pack, f)), `missing ${f}`);
    }
    const pages = readdirSync(pack).filter((f) => f.endsWith('.html'));
    assert.ok(pages.length >= 20, `${pages.length} pages`);
    for (const p of pages) {
      const html = readFileSync(join(pack, p), 'utf8');
      assert.doesNotMatch(html, /docs-exit|\.\.\//, `${p}: nothing from the documentation, and no link outside the folder`);
      assert.doesNotMatch(html, /<script(?![^>]*\bsrc=)[^>]*>|<style\b|\sstyle=|\son[a-z]+=/i, `${p}: works under a strict Content Security Policy`);
      assert.match(html, /<html lang="en-GB">/, p);
      assert.equal((html.match(/<h1\b/g) ?? []).length, 1, `${p}: one h1`);
      for (const part of ['ggds-skip-link', 'ggds-banner', 'ggds-header', '<main id="main"', 'ggds-footer']) assert.ok(html.includes(part), `${p}: ${part}`);
      for (const [, url] of html.matchAll(/\s(?:href|src|action)="([^"]+)"/g)) {
        if (/^(https?:|mailto:|tel:|#)/.test(url)) continue;
        const target = join(pack, url.split(/[?#]/)[0]);
        assert.ok(existsSync(target), `${p} → ${url}`);
        const hash = url.split('#')[1];
        if (hash && target.endsWith('.html')) assert.match(readFileSync(target, 'utf8'), new RegExp(`\\sid="${hash}"`), `${p} → ${url}: no #${hash}`);
      }
    }
    // Search lists real pages.
    for (const { url } of JSON.parse(readFileSync(join(pack, 'search-index.json'), 'utf8'))) assert.ok(pages.includes(url), `search-index.json: ${url}`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('the live preview: the same pages, each with a way back to the documentation and the download', built, () => {
  const dir = join(site, 'starter');
  for (const p of readdirSync(dir).filter((f) => f.endsWith('.html'))) {
    const html = readFileSync(join(dir, p), 'utf8');
    assert.match(html, /<nav class="docs-exit docs-exit--top"[\s\S]*href="\.\.\/index\.html">Back to GGDS documentation<\/a>/, `${p}: top bar`);
    assert.match(html, /docs-exit--bottom/, `${p}: bottom bar`);
    assert.ok(html.includes(`../downloads/${zip}`), `${p}: download link`);
    assert.ok(existsSync(join(dirname(dir), 'assets', 'starter-preview.css')), 'preview styles');
  }
});
