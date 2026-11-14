// ggds-check: each page rule finds what it should, the header rules read real headers, every rule names a real
// source, and GGDS's own starter passes every page check.
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { check, checkHeaders, checkPage, mailDomain, report } from '../../packages/check/check.mjs';
import { RULES, SOURCES } from '../../packages/check/rules.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));

const GOOD = `<!doctype html><html lang="en"><head><title>Apply for a licence - NCA</title>
<meta name="viewport" content="width=device-width, initial-scale=1"></head><body>
<a class="ggds-skip-link" href="#main">Skip to main content</a>
<div class="ggds-banner">Official website of the Government of Ghana</div>
<header class="ggds-header"><a href="/">Home</a></header>
<main id="main"><h1>Apply</h1><img src="a.png" alt="" width="10" height="10"></main>
<footer class="ggds-footer"><div><footer class="inner"></footer></div>
<a href="/accessibility">Accessibility statement</a> <a href="/privacy">Privacy</a> <a href="/disclaimer">Disclaimer</a></footer>
<nav class="ggds-tab-bar"></nav></body></html>`;

const status = (r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, v.status]));

test('a page with every part passes every page rule', () => {
  const r = status(checkPage(GOOD));
  for (const [id, s] of Object.entries(r)) assert.equal(s, 'pass', `${id}: ${checkPage(GOOD)[id].detail}`);
  assert.deepEqual(Object.keys(r).sort(), Object.keys(RULES).filter((id) => id.startsWith('page.')).sort());
});

test('each page rule fails on the problem it is for', () => {
  const cases = {
    'page.lang': GOOD.replace(' lang="en"', ''),
    'page.title': GOOD.replace('Apply for a licence - NCA', ' '),
    'page.zoom': GOOD.replace('initial-scale=1', 'initial-scale=1, maximum-scale=1'),
    'page.alt': GOOD.replace(' alt=""', ''),
    'page.skip-link': GOOD.replace('href="#main"', 'href="#content"'), // no such id
    'page.banner': GOOD.replace('ggds-banner', 'site-banner'),
    'page.header': GOOD.replace('class="ggds-header"', 'class="top"'),
    'page.main': GOOD.replace('<main id="main">', '<div id="main">').replace('</main>', '</div>'),
    'page.footer': GOOD.replace('class="ggds-footer"', 'class="bottom"'),
    'page.footer-links': GOOD.replace('<a href="/disclaimer">Disclaimer</a>', ''),
  };
  for (const [id, html] of Object.entries(cases)) assert.equal(checkPage(html)[id].status, 'fail', id);
  assert.equal(checkPage(GOOD.replace('class="ggds-tab-bar"', ''))['page.tab-bar'].status, 'warn');
  assert.equal(checkPage(GOOD.replace(' width="10" height="10"', ''))['page.image-size'].status, 'warn');
  // The footer's links are read from the whole footer, even with a <footer> inside it; links elsewhere do not count.
  const outside = GOOD.replace('<a href="/privacy">Privacy</a>', '').replace('<h1>Apply</h1>', '<h1>Apply</h1><a href="/privacy">Privacy</a>');
  assert.match(checkPage(outside)['page.footer-links'].detail, /privacy/);
  // A commented-out banner is not a banner.
  assert.equal(checkPage(GOOD.replace('<div class="ggds-banner">', '<!-- <div class="ggds-banner"> --><div>'))['page.banner'].status, 'fail');
});

test('the header rules read the response headers', () => {
  const none = status(checkHeaders(new Headers({ server: 'Apache/2.4.41 (Ubuntu)' })));
  assert.deepEqual(none, { 'web.hsts': 'fail', 'web.csp': 'fail', 'web.frames': 'fail', 'web.nosniff': 'fail', 'web.referrer': 'fail', 'web.permissions': 'warn', 'web.server-version': 'warn' });
  const good = status(checkHeaders(new Headers({
    'strict-transport-security': 'max-age=63072000; includeSubDomains', 'content-security-policy': "default-src 'self'; frame-ancestors 'self'",
    'x-content-type-options': 'nosniff', 'referrer-policy': 'strict-origin-when-cross-origin', 'permissions-policy': 'camera=()', server: 'nginx',
  })));
  for (const [id, s] of Object.entries(good)) assert.equal(s, 'pass', id);
  assert.equal(checkHeaders(new Headers({ 'strict-transport-security': 'max-age=300' }))['web.hsts'].status, 'warn');
  assert.equal(checkHeaders(new Headers({ 'content-security-policy': "script-src 'self' 'unsafe-inline'" }))['web.csp'].status, 'warn');
  assert.equal(checkHeaders(new Headers({ 'x-frame-options': 'DENY' }))['web.frames'].status, 'pass');
});

test('every rule has a group, a title and sources that exist', () => {
  for (const [id, rule] of Object.entries(RULES)) {
    assert.ok(rule.group && rule.title, id);
    assert.ok(rule.sources.length, `${id} names no source`);
    for (const s of rule.sources) assert.ok(SOURCES[s], `${id}: unknown source ${s}`);
    assert.ok('nita' in rule, `${id} has no nita field (null until NITA's clause is mapped)`);
  }
  assert.equal(mailDomain('www.nca.gov.gh'), 'nca.gov.gh');
});

test('GGDS’s own agency starter passes every page check, and the report says it is not a NITA statement', { skip: !existsSync(join(root, 'site', 'starter', 'index.html')) && 'run pnpm run build' }, async () => {
  const res = await check(join(root, 'site', 'starter'), { a11y: false, pages: Infinity });
  const failed = Object.entries(res.results).filter(([, r]) => r.status === 'fail' || r.status === 'warn');
  assert.deepEqual(failed, []);
  assert.ok(res.pages.length >= 20);
  assert.equal(res.results['ggds.css'].status, 'pass');
  assert.match(report(res), /not a statement of NITA compliance/);
});

// The browser checks need @playwright/test, @axe-core/playwright and Chromium (GGDS's own tests have them).
const browserReady = async () => {
  try {
    const { chromium } = await import('@playwright/test');
    await (await chromium.launch()).close();
    return true;
  } catch { return false; }
};

test('GGDS’s own starter passes the browser checks: axe on a computer and a phone, 320px, the first Tab, no JavaScript', { skip: !existsSync(join(root, 'site', 'starter', 'index.html')) && 'run pnpm run build' }, async (t) => {
  if (!(await browserReady())) return t.skip('no browser');
  const res = await check(join(root, 'site', 'starter'), { pages: 4 });
  for (const id of ['a11y.axe', 'a11y.axe-phone', 'a11y.reflow', 'a11y.focus-start', 'a11y.no-javascript']) {
    assert.equal(res.results[id].status, 'pass', `${id}: ${res.results[id].detail}`);
  }
  assert.equal(res.results['privacy.cookies'], undefined, 'privacy is checked on a live site only');
  const failed = Object.entries(res.results).filter(([, r]) => r.status === 'fail' || r.status === 'warn');
  assert.deepEqual(failed, []);
});

test('the browser checks find a page that is too wide, has no skip link, needs JavaScript and loads from other websites', async (t) => {
  if (!(await browserReady())) return t.skip('no browser');
  const { createServer } = await import('node:http');
  const bad = (port) => `<!doctype html><html lang="en"><head><title>Bad</title><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body><button>First</button><main id="main"></main><div style="width:400px">wide</div>
<img src="http://localhost:${port}/pixel.png" alt="" width="1" height="1">
<script>document.querySelector('main').textContent = 'Only with JavaScript';</script></body></html>`;
  const server = createServer((req, res) => {
    // Another origin for the same server (localhost, not 127.0.0.1): a third party that answers at once, with no network.
    if (req.url === '/pixel.png') return res.writeHead(204).end();
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Set-Cookie': 'tracker=1; Path=/' });
    res.end(bad(server.address().port));
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  try {
    const res = await check(`http://127.0.0.1:${server.address().port}/`, { pages: 1, dns: false });
    const s = (id) => res.results[id].status;
    assert.equal(s('a11y.reflow'), 'fail');
    assert.equal(s('a11y.focus-start'), 'fail');
    assert.equal(s('a11y.no-javascript'), 'fail');
    assert.equal(s('privacy.third-parties'), 'warn', 'a warning: no published rule makes it a failure');
    assert.match(res.results['privacy.third-parties'].detail, /localhost/);
    assert.equal(s('privacy.cookies'), 'warn');
    assert.match(res.results['privacy.cookies'].detail, /tracker/);
    assert.equal(s('fast.weight'), 'info', 'no budget given: information only');
    const budget = await check(`http://127.0.0.1:${server.address().port}/`, { pages: 1, dns: false, a11y: false, budgetKb: 0.1 });
    assert.equal(budget.results['fast.weight'].status, 'fail');
  } finally {
    server.close();
  }
});

test('without the browser tools, the browser checks say they did not run, never that they passed', async () => {
  const res = await check(join(root, 'packages', 'html', 'components', 'back-link', 'examples'), { a11y: false });
  for (const id of ['a11y.axe', 'a11y.axe-phone', 'a11y.reflow', 'a11y.focus-start', 'a11y.no-javascript']) assert.equal(res.results[id].status, 'skip', id);
});
