// The built documentation site: works under a strict CSP (no inline script, style or event handler), every page
// has a language and title, and every local link and asset exists.
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const site = fileURLToPath(new URL('../../site/', import.meta.url));
const walk = (dir) => readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? walk(join(dir, f)) : [join(dir, f)]));
const pages = existsSync(site) ? walk(site).filter((f) => f.endsWith('.html')) : [];
// The example sites are built from the MoCDTI platform folder (GGDS_PLATFORM_DIR). Without it (in CI, for
// instance) the build skips them, and so do the tests that read them.
const exampleSites = existsSync(join(site, 'agencies'));
const needsExampleSites = { skip: !exampleSites && 'example sites not built: no MoCDTI platform folder' };

test('the site was built', () => {
  assert.ok(pages.length > 40, `${pages.length} pages; run pnpm run build`);
});

test('no inline scripts, styles, style attributes or event handlers', () => {
  for (const p of pages) {
    const html = readFileSync(p, 'utf8');
    const name = p.slice(site.length);
    assert.doesNotMatch(html, /<script(?![^>]*\bsrc=)[^>]*>/i, `${name}: inline <script>`);
    assert.doesNotMatch(html, /<style\b/i, `${name}: <style>`);
    assert.doesNotMatch(html, /\sstyle=/i, `${name}: style attribute`);
    assert.doesNotMatch(html, /\son[a-z]+=/i, `${name}: event handler attribute`);
  }
});

test('every page has a language, a title and one h1', () => {
  for (const p of pages) {
    const html = readFileSync(p, 'utf8');
    const name = p.slice(site.length);
    assert.match(html, /<html lang="en-GB">/, name);
    assert.match(html, /<title>[^<]+<\/title>/, name);
    // Example pages of a single component (a footer, a notice) have no h1 of their own.
    if (!name.startsWith('examples/')) assert.equal((html.match(/<h1\b/g) ?? []).length, 1, `${name}: h1 count`);
  }
});

test('every relative link and asset exists', () => {
  const missing = [];
  for (const p of pages) {
    const html = readFileSync(p, 'utf8').replace(/<code>[\s\S]*?<\/code>/g, ''); // markup shown as text
    for (const [, url] of html.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
      if (/^([a-z]+:|\/|#)/i.test(url)) continue; // external, site-absolute example paths, fragments
      const target = join(dirname(p), url.split(/[?#]/)[0]);
      if (!exampleSites && target.startsWith(join(site, 'agencies'))) continue;
      if (!existsSync(target)) missing.push(`${p.slice(site.length)} → ${url}`);
    }
  }
  assert.deepEqual(missing, []);
});

test('every theme page variant loads its theme stylesheet', needsExampleSites, () => {
  const agencies = pages.filter((p) => /agencies\/(?!index)[a-z0-9-]+\.html$/.test(p));
  assert.ok(agencies.length >= 12);
  for (const p of agencies) {
    const slug = p.match(/([a-z0-9-]+)\.html$/)[1];
    assert.match(readFileSync(p, 'utf8'), new RegExp(`href="\\.\\./assets/themes/${slug}\\.css"`), slug);
  }
});

test('example sites publish no unconfirmed agency data and are not indexed', { skip: needsExampleSites.skip || process.env.GGDS_EXAMPLE_UNVERIFIED === '1' }, () => {
  const dir = fileURLToPath(new URL('../../site/agencies/', import.meta.url));
  const files = readdirSync(dir, { recursive: true });
  assert.deepEqual(files.filter((f) => /\.(png|jpe?g|svg|webp)$/i.test(f)), [], 'no agency logos copied');
  for (const f of files.filter((f) => f.endsWith('.html'))) {
    const html = readFileSync(join(dir, f), 'utf8');
    assert.match(html, /<meta name="robots" content="noindex, nofollow">/, `${f}: noindex`);
    assert.doesNotMatch(html, /mailto:|tel:|sms:|wa\.me|General enquiries/, `${f}: no contact links`);
    const text = html.replace(/<[^>]+>/g, ' ');
    assert.doesNotMatch(text, /[\w.+-]+@[\w-]+\.[\w.]+/, `${f}: no email addresses`);
    assert.doesNotMatch(text.replace(/\b\d{1,2}(?:\.\d+)?:1\b/g, ''), /\+?\d[\d ()-]{6,}\d/, `${f}: no phone numbers`);
  }
});

test('every link on the example sites opens an example page: none points at the real sites\' addresses', needsExampleSites, () => {
  const dir = fileURLToPath(new URL('../../site/agencies/', import.meta.url));
  const absolute = [];
  for (const f of readdirSync(dir, { recursive: true }).filter((f) => f.endsWith('.html'))) {
    for (const [, url] of readFileSync(join(dir, f), 'utf8').matchAll(/\s(?:href|action)="(\/[^"]*)"/g)) absolute.push(`${f} → ${url}`);
  }
  assert.deepEqual(absolute, []);
});

test('every link in a component example opens a page on this site, never "not found"', () => {
  const dir = fileURLToPath(new URL('../../site/examples/', import.meta.url));
  const absolute = [];
  for (const f of readdirSync(dir, { recursive: true }).filter((f) => f.endsWith('.html'))) {
    for (const [, url] of readFileSync(join(dir, f), 'utf8').matchAll(/\s(?:href|action)="(\/[^"]*)"/g)) absolute.push(`${f} → ${url}`);
  }
  assert.deepEqual(absolute, []);
});

test('every example site page has a way back to the documentation', needsExampleSites, () => {
  const dir = fileURLToPath(new URL('../../site/agencies/', import.meta.url));
  for (const f of readdirSync(dir, { recursive: true }).filter((f) => f.endsWith('.html') && f !== 'index.html')) {
    const html = readFileSync(join(dir, f), 'utf8');
    assert.equal((html.match(/class="docs-exit /g) ?? []).length, 2, `${f}: top and bottom bars`);
    assert.match(html, />Back to GGDS documentation</, f);
  }
});

test('each example site shows the drawing its live site shows, with its stylesheet', { skip: needsExampleSites.skip || !existsSync(new URL('../../docs/scenes/scenes.json', import.meta.url)) }, () => {
  const scenes = JSON.parse(readFileSync(new URL('../../docs/scenes/scenes.json', import.meta.url), 'utf8'));
  const dir = fileURLToPath(new URL('../../site/agencies/', import.meta.url));
  for (const slug of Object.keys(scenes)) {
    const html = readFileSync(join(dir, `${slug}.html`), 'utf8');
    assert.match(html, /class="ggds-hero__art"/, slug);
    assert.match(html, new RegExp(`assets/scenes/${slug}\\.css`), slug);
    assert.doesNotMatch(readFileSync(new URL(`../../site/assets/scenes/${slug}.css`, import.meta.url), 'utf8'), /--site-/, `${slug}: platform colours swapped for GGDS tokens`);
  }
});

test('no example site names a compromised website', needsExampleSites, () => {
  const html = readFileSync(new URL('../../site/agencies/gifec.html', import.meta.url), 'utf8');
  assert.doesNotMatch(html, /gifec\.gov\.gh/);
  assert.match(html, /has not confirmed its official address yet/);
});

test('every component page has its reference sections and a way to report a problem', () => {
  const dir = join(site, 'components');
  for (const f of readdirSync(dir).filter((f) => f.endsWith('.html') && f !== 'index.html')) {
    const html = readFileSync(join(dir, f), 'utf8');
    for (const id of ['use-it', 'classes', 'accessibility-tests', 'changes']) assert.match(html, new RegExp(`id="${id}"`), `${f}: no #${id}`);
    assert.match(html, /Report a problem with this page/, `${f}: no feedback link`);
    assert.match(html, /suggest a change to it on GitHub/, `${f}: no edit link`);
  }
});

test('there are pattern pages, each with a live example', () => {
  const dir = join(site, 'patterns');
  const files = readdirSync(dir).filter((f) => f.endsWith('.html') && f !== 'index.html');
  assert.ok(files.length >= 3, `${files.length} patterns`);
  for (const f of files) assert.match(readFileSync(join(dir, f), 'utf8'), /<iframe class="docs-frame/, `${f}: no example`);
});
