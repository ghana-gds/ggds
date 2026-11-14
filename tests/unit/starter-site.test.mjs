// The agency website starter made from an institution's own settings (docs/starter-site.mjs), as the website builder
// and `npx @ggds/create` make it. Whatever someone types and whichever parts they choose, the website has nothing of
// the made-up example left in it, nothing they typed can break the HTML, every link works, it keeps the strict
// Content Security Policy, and ggds-site.json makes the same website again. No build needed.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { starterFiles } from '../../docs/starter.mjs';
import { DEFAULT_SITE, PARTS, SITE_SCHEMA, checkSite, normaliseSite, pagesFor } from '../../docs/starter-site.mjs';
import { SECURITY_HEADERS } from '../../docs/starter-hosting.mjs';
import { makeZip, readZip } from '../../docs/zip.mjs';

const version = '0.0.0-test';
const AGENCY = {
  name: 'Ghana Roads & Bridges Authority',
  short: 'grba',
  purpose: 'We build and look after the roads and bridges of Ghana.',
  host: 'www.grba.gov.gh',
  theme: 'nca',
  phone: '0302 123 456',
  hours: 'Monday to Thursday, 9am to 4pm',
  email: 'hello@grba.gov.gh',
  offices: [{ name: 'Tamale office', lines: ['5 Main Street', 'Tamale', 'NT-123-4567'] }],
};
// The GGDS files the build copies into ggds/: links to them count as working.
const GGDS = /^ggds\/(ggds\.min\.css|auto\.js|index\.js|themes\/[a-z0-9-]+\.css)$/;
const html = (files) => Object.entries(files).filter(([f]) => f.endsWith('.html'));

/** Every link, script, stylesheet and form in the website leads to a file in it (or to GGDS, or outside). */
function assertLinksWork(files, label) {
  for (const [page, text] of html(files)) {
    for (const [, url] of text.matchAll(/\s(?:href|src|action)="([^"]+)"/g)) {
      if (/^(https?:|mailto:|tel:|#)/.test(url)) continue;
      const [path, hash] = url.split('#');
      const file = path.split('?')[0];
      assert.ok(file in files || GGDS.test(file), `${label}: ${page} → ${url}`);
      if (hash && file.endsWith('.html')) assert.match(files[file], new RegExp(`\\sid="${hash}"`), `${label}: ${page} → ${url}`);
    }
  }
  for (const { url } of JSON.parse(files['search-index.json'])) assert.ok(url in files, `${label}: search-index.json → ${url}`);
}

test('with no settings, the made-up Example Agency, as the preview and the release download show it', () => {
  const files = starterFiles({ version, theme: 'mocdti' });
  assert.equal(html(files).length, 22);
  assert.match(files['index.html'], /<title>Example Agency<\/title>/);
  assert.match(files['index.html'], /href="ggds\/themes\/mocdti\.css"/);
  assert.match(files['index.html'], /noindex, nofollow/);
  assert.deepEqual(starterFiles({ version, site: DEFAULT_SITE }), files, 'the defaults, given or not, make the same website');
});

test("an institution's own settings: nothing of the example is left", () => {
  const files = starterFiles({ version, site: AGENCY });
  for (const [file, text] of Object.entries(files)) {
    if (file === 'README.md') continue; // names the builder's example address in its instructions
    for (const left of ['Example Agency', 'example.gov.gh', '030 000 0000', 'Example Road', 'Example Street', 'EA-LIC', 'EA-CMP', '>EA<', 'GA-000-0000', '8am to 5pm']) {
      assert.ok(!text.includes(left), `${file} still has "${left}"`);
    }
  }
  const home = files['index.html'];
  assert.match(home, /<title>Ghana Roads &amp; Bridges Authority<\/title>/);
  assert.match(home, /<span class="ggds-header__monogram" aria-hidden="true">GRBA<\/span>/);
  assert.match(home, /The official address of this website is <strong>www\.grba\.gov\.gh<\/strong>/);
  assert.match(home, /href="ggds\/themes\/nca\.css"/);
  assert.match(home, /5 Main Street, Tamale · NT-123-4567/);
  assert.match(files['contact.html'], /<h3>Tamale office<\/h3>\s*<address>5 Main Street<br>Tamale<br>NT-123-4567<\/address>/);
  assert.match(files['accessibility.html'], /mailto:accessibility@grba\.gov\.gh/);
  assert.match(files['apply-done.html'], /GRBA-LIC-2026-/);
  assert.match(files['README.md'], /# Ghana Roads & Bridges Authority: a GGDS website/);
});

test('whatever someone types cannot break the HTML', () => {
  const evil = '<script>alert(1)</script> & "quotes" \'single\'';
  const files = starterFiles({ version, site: { ...AGENCY, name: evil, purpose: evil, hours: evil, phone: '030 <b>1</b>', offices: [{ name: evil, lines: [evil] }] } });
  for (const [file, text] of html(files)) {
    assert.ok(!text.includes('<script>alert'), `${file}: typed HTML is escaped`);
    assert.ok(!text.includes('<b>1</b>'), `${file}: typed HTML is escaped`);
    assert.doesNotMatch(text, /<script(?![^>]*\bsrc=)[^>]*>|<style\b|\sstyle=|\son[a-z]+=/i, `${file}: still works under a strict Content Security Policy`);
  }
  const css = starterFiles({ version, site: { ...AGENCY, name: 'A */ body { display: none } /* B', theme: '#006e35' } });
  for (const f of ['assets/site.css', 'assets/theme.css']) assert.equal(css[f].split('*/').length, 2, `${f}: the name cannot end the CSS comment`);
});

test('every choice of parts: every link works, and the footer keeps the links every government website needs', () => {
  for (let mask = 0; mask < 2 ** PARTS.length; mask++) {
    const parts = Object.fromEntries(PARTS.map((p, i) => [p.id, Boolean(mask & (1 << i))]));
    const files = starterFiles({ version, site: { ...AGENCY, parts } });
    const label = Object.entries(parts).filter(([, on]) => on).map(([id]) => id).join('+') || 'no parts';
    assert.deepEqual(new Set(html(files).map(([f]) => f)), pagesFor({ parts }), `${label}: the pages`);
    assertLinksWork(files, label);
    for (const [page, text] of html(files)) {
      for (const need of ['accessibility.html', 'privacy.html', 'disclaimer.html']) assert.ok(text.includes(`href="${need}"`), `${label}: ${page} footer → ${need}`);
      assert.equal((text.match(/<h1\b/g) ?? []).length, 1, `${label}: ${page} has one h1`);
      assert.doesNotMatch(text, /<ul class="ggds-(card-grid|hero__tasks|footer__list)"[^>]*>\s*<\/ul>/, `${label}: ${page} has no empty list`);
    }
  }
});

test('forms can send to the institution’s server, and the security policy allows it', () => {
  const files = starterFiles({ version, site: { ...AGENCY, forms: 'https://forms.grba.gov.gh/submit' } });
  for (const [page, kind] of [['apply-check.html', 'application'], ['complaint.html', 'complaint'], ['contact.html', 'message']]) {
    assert.match(files[page], /<form action="https:\/\/forms\.grba\.gov\.gh\/submit" method="post" novalidate data-validate>/, page);
    assert.match(files[page], new RegExp(`<input type="hidden" name="form" value="${kind}">`), page);
  }
  for (const n of ['name', 'card', 'phone', 'licence']) assert.match(files['apply-check.html'], new RegExp(`<input type="hidden" name="${n}" value="" data-answer="${n}">`));
  assert.match(files['_headers'], /form-action 'self' https:\/\/forms\.grba\.gov\.gh;/);
  assert.match(files['.htaccess'], /form-action 'self' https:\/\/forms\.grba\.gov\.gh;/);
  assert.match(files['hosting/nginx.conf'], /form-action 'self' https:\/\/forms\.grba\.gov\.gh;/);
  // Without a server, the forms go to the example's next page, as before.
  assert.match(starterFiles({ version, site: AGENCY })['complaint.html'], /<form action="complaint-done\.html" method="get"/);
});

test("the institution's own colour: its theme file, with a darker shade when it is too light to read", () => {
  const ok = starterFiles({ version, site: { ...AGENCY, theme: '#006e35' } });
  assert.match(ok['index.html'], /href="assets\/theme\.css"/);
  assert.match(ok['assets/theme.css'], /--ggds-color-institution: #006e35;/);
  const light = starterFiles({ version, site: { ...AGENCY, theme: '#ffcc00' } });
  assert.match(light['assets/theme.css'], /too light to read on white/);
  assert.doesNotMatch(light['assets/theme.css'], /--ggds-color-institution: #ffcc00;/);
});

test('ready to go live: search engines may find it', () => {
  assert.match(starterFiles({ version, site: AGENCY })['index.html'], /noindex, nofollow/);
  for (const [page, text] of html(starterFiles({ version, site: { ...AGENCY, live: true } }))) assert.doesNotMatch(text, /noindex/, page);
});

test('the server settings: every security header ggds-check asks for, for each kind of hosting', () => {
  const files = starterFiles({ version, site: AGENCY });
  for (const [name, value] of SECURITY_HEADERS) {
    assert.ok(files['.htaccess'].includes(`Header always set ${name} "${value}"`), `.htaccess: ${name}`);
    assert.ok(files['_headers'].includes(`${name}: ${value}`), `_headers: ${name}`);
    assert.ok(files['hosting/nginx.conf'].includes(`add_header ${name} "${value}" always;`), `nginx.conf: ${name}`);
  }
  assert.match(files['.htaccess'], /ErrorDocument 404 \/404\.html/);
  assert.match(files['hosting/nginx.conf'], /server_name www\.grba\.gov\.gh;/);
  assert.match(files['hosting/dns-records.txt'], /_dmarc\.grba\.gov\.gh\s+v=DMARC1; p=quarantine/);
  assert.match(files['README.md'], /## Put it online/);
});

test('ggds-site.json makes the same website again', () => {
  const files = starterFiles({ version, site: { ...AGENCY, parts: { jobs: false }, forms: 'https://forms.grba.gov.gh/submit' } });
  const saved = JSON.parse(files['ggds-site.json']);
  assert.equal(saved.ggds, version);
  assert.deepEqual(starterFiles({ version, site: saved }), files);
  // The published schema describes every setting the file holds, and its patterns accept what is saved.
  assert.equal(saved.$schema, SITE_SCHEMA.$id);
  assert.deepEqual(Object.keys(saved).sort(), Object.keys(SITE_SCHEMA.properties).sort());
  assert.deepEqual(Object.keys(saved.parts).sort(), Object.keys(SITE_SCHEMA.properties.parts.properties).sort());
  for (const k of SITE_SCHEMA.required) assert.ok(saved[k], k);
  for (const [k, { pattern }] of Object.entries(SITE_SCHEMA.properties)) if (pattern) assert.match(saved[k], new RegExp(pattern), k);
});

test('the settings are checked, in plain words, before the website is made', () => {
  const themes = ['mocdti', 'nca'];
  assert.deepEqual(checkSite(AGENCY, { themes }), []);
  const fields = (s) => checkSite(s, { themes }).filter((p) => !p.warning).map((p) => p.field);
  assert.deepEqual(fields({}), ['name', 'short', 'host', 'email', 'phone']);
  assert.deepEqual(fields({ ...AGENCY, host: 'not an address', email: 'nope', short: 'TOO-LONG-INITIALS', theme: 'purple', forms: 'http://insecure.example' }), ['short', 'host', 'email', 'theme', 'forms']);
  assert.deepEqual(checkSite({ ...AGENCY, host: 'www.grba.com' }, { themes }).map((p) => [p.field, Boolean(p.warning)]), [['host', true]]);
  assert.deepEqual(fields({ ...AGENCY, theme: '#123abc' }), []);
  assert.equal(normaliseSite({ host: 'https://WWW.GRBA.GOV.GH/about' }).host, 'www.grba.gov.gh');
  assert.equal(normaliseSite({ logo: '../../etc/passwd' }).logo, '', 'a logo must be a file in assets/');
});

test('the zip the builder downloads: one folder, every file as it was made', () => {
  const files = starterFiles({ version, site: AGENCY });
  const out = readZip(makeZip(files, { folder: 'grba-website' }));
  const dec = new TextDecoder();
  assert.deepEqual(Object.keys(out), Object.keys(files).map((f) => `grba-website/${f}`));
  for (const [f, text] of Object.entries(files)) assert.equal(dec.decode(out[`grba-website/${f}`]), text, f);
  assert.deepEqual(makeZip(files), makeZip(files), 'the same files make the same zip');
  assert.throws(() => makeZip({ '../outside.txt': 'x' }), /unsafe path/);
});

// ---- Kinds of institution, and the words people write in the builder ----------------------------------------------
import { execFileSync } from 'node:child_process';
import { KINDS } from '../../docs/starter-kinds.mjs';
import { exampleWords, servicePages } from '../../docs/starter-site.mjs';
import { starterProject } from '../../docs/starter.mjs';

test('every kind of institution, with every choice of parts: its own services, every link works, one h1 a page', () => {
  for (const kind of KINDS) {
    for (let mask = 0; mask < 2 ** PARTS.length; mask += 7) {
      const parts = Object.fromEntries(PARTS.map((p, i) => [p.id, Boolean(mask & (1 << i))]));
      const files = starterFiles({ version, site: { ...AGENCY, kind: kind.id, parts } });
      const label = `${kind.id} ${mask}`;
      assert.deepEqual(new Set(html(files).map(([f]) => f)), pagesFor({ kind: kind.id, parts }), `${label}: the pages`);
      assertLinksWork(files, label);
      for (const [page, text] of html(files)) assert.equal((text.match(/<h1\b/g) ?? []).length, 1, `${label}: ${page} has one h1`);
      for (const s of kind.services) assert.match(files['services.html'], new RegExp(s.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/'/g, '&#39;')), `${label}: ${s.title} on Services`);
    }
    if (kind.id !== 'agency') {
      const files = starterFiles({ version, site: { ...AGENCY, kind: kind.id } });
      for (const [file, text] of html(files)) for (const left of ['Apply for a licence', 'Internet service provider', 'mobile money complaints', 'licence fees']) assert.ok(!text.includes(left), `${kind.id}: ${file} still has the agency's "${left}"`);
    }
  }
});

test('the institution\'s own services and words: their own pages, and nothing they typed can break the HTML', () => {
  const evil = '<script>alert(1)</script> & "q"';
  const site = { ...AGENCY, kind: 'assembly', question: `Q ${evil}`, lede: evil,
    services: [
      { title: 'Get a market stall', summary: evil, task: true, online: true, who: [evil, 'traders'], need: 'a Ghana Card\nyour trade', time: 'A week.\n\nOr two.', options: ['Lock-up shop', evil] },
      { title: 'Get a market stall', summary: 'The same title again' },
      { title: 'Services', summary: 'A title that is already a page' },
      { title: '   ' },
    ],
    fees: { columns: ['What', 'Fee'], rows: [['Stall', 'GH₵ 20'], [evil, evil]] },
    news: [{ title: evil, type: 'Notice', date: '1 December 2026', summary: evil, body: `${evil}\n\nSecond paragraph` }],
    about: { what: [evil], who: evil, funded: '' },
  };
  assert.deepEqual(servicePages(site), ['get-a-market-stall.html', 'get-a-market-stall-2.html', 'services-2.html'], 'each service has its own address, never another page\'s');
  const files = starterFiles({ version, site });
  for (const [file, text] of html(files)) {
    assert.ok(!text.includes('<script>alert'), `${file}: typed HTML is escaped`);
    assert.doesNotMatch(text, /<script(?![^>]*\bsrc=)[^>]*>|<style\b|\sstyle=|\son[a-z]+=/i, `${file}: strict policy`);
  }
  const stall = files['get-a-market-stall.html'];
  assert.match(stall, /<h1>Get a market stall<\/h1>/);
  assert.match(stall, /<li>a Ghana Card<\/li><li>your trade<\/li>/, 'one item a line');
  assert.match(stall, /<p>A week\.<\/p>\s*<p>Or two\.<\/p>/, 'paragraphs');
  assert.match(stall, /href="apply\.html"><span>Start now/, 'the online service starts the application');
  assert.match(files['apply.html'], /Which market stall do you need\?/);
  assert.match(files['apply.html'], /<label class="ggds-choice__label" for="market-stall-lock-up-shop">Lock-up shop<\/label>/);
  assert.match(files['index.html'], /Q &lt;script&gt;/);
  assert.match(files['index.html'], /href="get-a-market-stall\.html">Get a market stall<\/a>/, 'a common task on the homepage');
  assert.match(files['fees.html'], /<th scope="row">Stall<\/th><td class="ggds-table__numeric">GH₵ 20<\/td>/);
  assert.match(files['about.html'], /<h2>Who runs us<\/h2>/);
  assert.doesNotMatch(files['about.html'], /How we are funded/, 'an empty answer leaves its heading out');
  assert.match(files['news-article.html'], /<p>Second paragraph<\/p>/);
  const again = JSON.parse(files['ggds-site.json']);
  assert.deepEqual(starterFiles({ version, site: again }), files, 'ggds-site.json keeps the words, and makes the same website again');
});

test('the builder says which words are still the example\'s, and none once they are rewritten', () => {
  const left = exampleWords({ kind: 'health' }).map((x) => x.where);
  assert.ok(left.includes('Homepage') && left.includes('Book an appointment') && left.includes('About us'), left.join(', '));
  const own = { kind: 'health', question: 'How can we help?', lede: 'Our own words.', services: [{ title: 'See a doctor', summary: 'Ours.' }],
    about: { what: ['Ours.'] }, fees: { columns: ['A', 'B'], rows: [['x', 'y']] }, news: [{ title: 'Ours' }], publications: [{ title: 'Ours' }], jobs: [{ title: 'Ours' }] };
  assert.deepEqual(exampleWords(own), []);
});

test('WordPress: the pages, news and four menus as a WordPress import, for the GGDS theme', () => {
  for (const kind of KINDS) {
    const { files } = starterProject({ version, site: { ...AGENCY, kind: kind.id }, stack: 'wordpress' });
    const wxr = files['wordpress-import.xml'];
    try { execFileSync('xmllint', ['--noout', '-'], { input: wxr, stdio: ['pipe', 'ignore', 'pipe'] }); } catch (e) { if (e.code !== 'ENOENT') assert.fail(`${kind.id}: not well-formed XML: ${e.stderr}`); }
    for (const name of ['Main sections', 'Common tasks', 'Footer sections', 'Footer links']) assert.match(wxr, new RegExp(`<wp:term_name><!\\[CDATA\\[${name}\\]\\]></wp:term_name>`), `${kind.id}: the "${name}" menu, named as the theme looks for it`);
    for (const s of kind.services) assert.ok(wxr.includes(`<title>${s.title.replace(/&/g, '&amp;')}</title>`), `${kind.id}: ${s.title}`);
    assert.doesNotMatch(wxr, /<form\b|<script\b|\sstyle=/, `${kind.id}: no forms, scripts or styles`);
    assert.doesNotMatch(wxr, /href="[a-z0-9-]+\.html"/, `${kind.id}: links are WordPress addresses`);
    assert.match(files['README.md'], /Tools > Import > WordPress/);
    assert.ok(files['ggds-site.json']);
  }
});
