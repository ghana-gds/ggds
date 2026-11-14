#!/usr/bin/env node
// ggds-check: is a government website ready? Checks a live website, or a folder of its built pages, against the
// rules in rules.mjs, and names each rule's published source. It is a readiness check, not a statement of NITA
// compliance: NITA's clauses are not mapped yet (see rules.mjs).
//
//   npx @ggds/check https://www.example.gov.gh        the live site: pages, server, email domain and speed
//   npx @ggds/check ./dist                            built pages in a folder (page checks only), e.g. in CI
//
//   --pages <n>     how many pages to check, following links from the homepage (default 10; a folder: all)
//   --json          the results as JSON, for other tools
//   --no-dns        skip the email domain checks
//   --strict        warnings fail too
//   --budget-kb <n> fail when the homepage downloads more than this many KB (otherwise its weight is information)
//
// It exits with 1 when a check fails, so a build or CI job can stop on it. The browser checks (axe-core on a computer
// and a phone, 320px, the first Tab, JavaScript off, and on a live site what the first visit loads) run when the site has @playwright/test (or playwright) and @axe-core/playwright installed; without them it
// says it did not run. Automated testing finds only some accessibility problems: test with people too.
// No dependencies (Node.js 20 or later).
import { existsSync, readFileSync, readdirSync, realpathSync, statSync } from 'node:fs';
import { resolveCaa, resolveTxt } from 'node:dns/promises';
import { createRequire } from 'node:module';
import { extname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { GROUPS, RULES, SOURCES } from './rules.mjs';

const here = fileURLToPath(new URL('./', import.meta.url));
const { version: CHECKER_VERSION } = JSON.parse(readFileSync(join(here, 'package.json'), 'utf8'));
const TIMEOUT = 20000;
const UA = `ggds-check/${CHECKER_VERSION} (+https://github.com/ghana-gds/ggds)`;

// ---------------------------------------------------------------------------------------------------------------
// Reading HTML without a parser: enough for these checks. Comments, scripts and styles are removed first.

const clean = (html) => html.replace(/<!--[\s\S]*?-->/g, '').replace(/<(script|style|template)\b[\s\S]*?<\/\1\s*>/gi, (m, t) => `<${t}></${t}>`);
const attr = (tag, name) => tag.match(new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'))?.slice(1).find((v) => v !== undefined);
const hasAttr = (tag, name) => new RegExp(`\\s${name}(\\s*=|[\\s/>])`, 'i').test(tag);
const tags = (html, name) => [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'gi'))].map((m) => m[0]);
const text = (s) => s.replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const hasClass = (html, cls) => new RegExp(`class\\s*=\\s*["'][^"']*(?<![\\w-])${cls}(?![\\w-])`, 'i').test(html);
const links = (html) => [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)].map((m) => ({ tag: m[0], href: attr(`<a ${m[1]}>`, 'href'), text: text(m[2]) }));
/** The element with this class, from its opening tag to its matching closing tag. */
function element(html, cls, name) {
  const open = html.search(new RegExp(`<${name}\\b[^>]*class\\s*=\\s*["'][^"']*(?<![\\w-])${cls}(?![\\w-])`, 'i'));
  const start = open >= 0 ? open : html.search(new RegExp(`<${name}\\b`, 'i'));
  if (start < 0) return '';
  let depth = 0;
  for (const m of html.slice(start).matchAll(new RegExp(`<(/?)${name}\\b[^>]*>`, 'gi'))) {
    depth += m[1] ? -1 : 1;
    if (depth === 0) return html.slice(start, start + m.index + m[0].length);
  }
  return html.slice(start);
}

/** The checks on one page's HTML. Returns { id: { status, detail } }. */
export function checkPage(raw) {
  const html = clean(raw);
  const r = {};
  const set = (id, status, detail = '') => { r[id] = { status, detail }; };

  const lang = attr(tags(html, 'html')[0] ?? '', 'lang');
  set('page.lang', lang ? 'pass' : 'fail', lang ? `lang="${lang}"` : 'no lang on <html>');
  const title = text(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '');
  set('page.title', title ? 'pass' : 'fail', title ? `"${title.slice(0, 70)}"` : 'no <title>, or it is empty');

  const vp = tags(html, 'meta').find((t) => (attr(t, 'name') ?? '').toLowerCase() === 'viewport');
  const vpc = (vp && attr(vp, 'content') || '').toLowerCase().replace(/\s/g, '');
  const maxScale = Number(vpc.match(/maximum-scale=([\d.]+)/)?.[1] ?? Infinity);
  if (!vp) set('page.zoom', 'warn', 'no viewport meta: phones show the desktop layout, shrunk');
  else if (/user-scalable=(no|0)/.test(vpc) || maxScale < 2) set('page.zoom', 'fail', `the viewport stops zooming: "${attr(vp, 'content')}"`);
  else if (!vpc.includes('width=device-width')) set('page.zoom', 'warn', 'the viewport has no width=device-width');
  else set('page.zoom', 'pass');

  const imgs = tags(html, 'img');
  const noAlt = imgs.filter((t) => !hasAttr(t, 'alt'));
  set('page.alt', noAlt.length ? 'fail' : 'pass', noAlt.length ? `${noAlt.length} of ${imgs.length} images have no alt: ${noAlt.slice(0, 2).map((t) => attr(t, 'src')).join(', ')}` : `${imgs.length} images`);
  const noSize = imgs.filter((t) => !(hasAttr(t, 'width') && hasAttr(t, 'height')));
  set('page.image-size', noSize.length ? 'warn' : 'pass', noSize.length ? `${noSize.length} of ${imgs.length} images have no width and height` : `${imgs.length} images`);

  // The skip link: the first link in the body, to an element on the page.
  const body = html.slice(Math.max(0, html.search(/<body\b/i)));
  const first = links(body)[0];
  const target = first?.href?.startsWith('#') ? first.href.slice(1) : '';
  const targetExists = target && new RegExp(`\\sid\\s*=\\s*["']?${target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'\\s>]`).test(html);
  if (!first || !target) set('page.skip-link', 'fail', first ? `the first link goes to ${first.href}, not to the main content` : 'no links');
  else if (!targetExists) set('page.skip-link', 'fail', `the skip link goes to #${target}, which is not on the page`);
  else set('page.skip-link', 'pass', `"${first.text}" → #${target}`);

  set('page.banner', hasClass(html, 'ggds-banner') ? 'pass' : 'fail', hasClass(html, 'ggds-banner') ? '' : 'no ggds-banner');
  set('page.header', hasClass(html, 'ggds-header') ? 'pass' : 'fail', hasClass(html, 'ggds-header') ? '' : 'no ggds-header');
  const mains = tags(html, 'main').length + tags(html, '[a-z]+').filter((t) => /\srole\s*=\s*["']?main/i.test(t) && !/^<main/i.test(t)).length;
  set('page.main', mains === 1 ? 'pass' : 'fail', mains === 1 ? '' : mains ? `${mains} main landmarks` : 'no <main>');
  set('page.footer', hasClass(html, 'ggds-footer') ? 'pass' : 'fail', hasClass(html, 'ggds-footer') ? '' : 'no ggds-footer');
  set('page.tab-bar', hasClass(html, 'ggds-tab-bar') ? 'pass' : 'warn', hasClass(html, 'ggds-tab-bar') ? '' : 'no ggds-tab-bar for phones');

  const footer = element(html, 'ggds-footer', 'footer') || element(html, 'ggds-footer', 'div');
  const footerLinks = links(footer).map((l) => l.text.toLowerCase());
  const missing = ['accessibility', 'privacy', 'disclaimer'].filter((w) => !footerLinks.some((t) => t.includes(w)));
  set('page.footer-links', !footer ? 'fail' : missing.length ? 'fail' : 'pass', !footer ? 'no footer' : missing.length ? `missing: ${missing.join(', ')}` : '');
  return r;
}

/** The GGDS stylesheets a page links, as absolute addresses. */
const stylesheets = (raw, base) => tags(clean(raw), 'link').filter((t) => /stylesheet/i.test(attr(t, 'rel') ?? '')).map((t) => attr(t, 'href')).filter(Boolean).map((h) => new URL(h, base).href);
const scripts = (raw, base) => tags(clean(raw).replace(/<script\b([^>]*)><\/script>/gi, '<script$1>'), 'script').map((t) => attr(t, 'src')).filter(Boolean).map((h) => new URL(h, base).href);
const images = (raw, base) => tags(clean(raw), 'img').map((t) => attr(t, 'src')).filter((s) => s && !s.startsWith('data:')).map((h) => new URL(h, base).href);

// ---------------------------------------------------------------------------------------------------------------
// The server

async function get(url, init = {}) {
  return fetch(url, { redirect: 'follow', ...init, headers: { 'user-agent': UA, 'accept-encoding': 'br, gzip', ...init.headers }, signal: AbortSignal.timeout(TIMEOUT) });
}

/** The checks on the homepage's response headers. */
export function checkHeaders(h) {
  const r = {};
  const set = (id, status, detail = '') => { r[id] = { status, detail }; };
  const hsts = h.get('strict-transport-security');
  const age = Number(hsts?.match(/max-age=(\d+)/i)?.[1] ?? 0);
  set('web.hsts', !hsts ? 'fail' : age < 31536000 ? 'warn' : 'pass', !hsts ? 'missing' : age < 31536000 ? `max-age=${age}: less than a year` : hsts);
  const csp = h.get('content-security-policy');
  const scriptSrc = csp?.match(/(?:^|;)\s*script-src\s+([^;]*)/i)?.[1] ?? csp?.match(/(?:^|;)\s*default-src\s+([^;]*)/i)?.[1] ?? '';
  set('web.csp', !csp ? 'fail' : /'unsafe-inline'/.test(scriptSrc) && !/'nonce-|'sha(256|384|512)-|'strict-dynamic'/.test(scriptSrc) ? 'warn' : 'pass', !csp ? 'missing' : /'unsafe-inline'/.test(scriptSrc) ? 'scripts allow \'unsafe-inline\'' : '');
  const frames = /frame-ancestors/i.test(csp ?? '') || /^(deny|sameorigin)$/i.test(h.get('x-frame-options') ?? '');
  set('web.frames', frames ? 'pass' : 'fail', frames ? '' : 'neither CSP frame-ancestors nor X-Frame-Options');
  set('web.nosniff', /^nosniff$/i.test(h.get('x-content-type-options') ?? '') ? 'pass' : 'fail', h.get('x-content-type-options') ?? 'missing');
  set('web.referrer', h.get('referrer-policy') ? 'pass' : 'fail', h.get('referrer-policy') ?? 'missing');
  set('web.permissions', h.get('permissions-policy') ? 'pass' : 'warn', h.get('permissions-policy') ? '' : 'missing');
  const announced = [h.get('server'), h.get('x-powered-by'), h.get('x-aspnet-version'), h.get('x-generator')].filter((v) => v && /\d/.test(v));
  set('web.server-version', announced.length ? 'warn' : 'pass', announced.join('; '));
  return r;
}

async function checkHttps(url) {
  const u = new URL(url);
  if (u.protocol !== 'https:') return { status: 'fail', detail: `${url} is not https` };
  try {
    const res = await fetch(`http://${u.host}/`, { redirect: 'manual', headers: { 'user-agent': UA }, signal: AbortSignal.timeout(TIMEOUT) });
    const to = res.headers.get('location') ?? '';
    if ([301, 302, 307, 308].includes(res.status) && to.startsWith('https://')) return { status: res.status === 301 || res.status === 308 ? 'pass' : 'warn', detail: `http:// → ${res.status} ${to}${res.status === 301 || res.status === 308 ? '' : ' (use a permanent 301 or 308)'}` };
    return { status: 'fail', detail: `http://${u.host}/ answers ${res.status}${to ? ` → ${to}` : ''}, without moving to https` };
  } catch {
    return { status: 'pass', detail: 'http:// does not answer: only https' };
  }
}

async function checkWpUsers(origin) {
  try {
    const res = await get(new URL('/wp-json/wp/v2/users', origin));
    const body = res.ok ? await res.text() : '';
    const users = (() => { try { return JSON.parse(body); } catch { return null; } })();
    if (Array.isArray(users) && users.length) return { status: 'fail', detail: `/wp-json/wp/v2/users lists ${users.length} user accounts` };
    return { status: 'pass', detail: res.status === 404 ? 'not WordPress, or the list is off' : `answers ${res.status}` };
  } catch {
    return { status: 'pass', detail: 'no answer' };
  }
}

// ---------------------------------------------------------------------------------------------------------------
// The email domain

/** The registered domain to check: www.nca.gov.gh → nca.gov.gh. */
export const mailDomain = (host) => host.replace(/^www\./, '');

async function checkDns(domain) {
  const r = {};
  const txt = async (name) => { try { return (await resolveTxt(name)).map((parts) => parts.join('')); } catch { return []; } };
  const spf = (await txt(domain)).filter((t) => /^v=spf1\b/i.test(t));
  r['dns.spf'] = spf.length === 1
    ? { status: /[-~]all\b/.test(spf[0]) ? 'pass' : 'warn', detail: /[-~]all\b/.test(spf[0]) ? spf[0] : `${spf[0]} (end with -all or ~all)` }
    : { status: 'fail', detail: spf.length ? `${spf.length} SPF records: there must be one` : `no SPF record on ${domain}` };
  const dmarc = (await txt(`_dmarc.${domain}`)).find((t) => /^v=DMARC1\b/i.test(t));
  const policy = dmarc?.match(/;\s*p=(\w+)/i)?.[1]?.toLowerCase();
  r['dns.dmarc'] = !dmarc ? { status: 'fail', detail: `no DMARC record at _dmarc.${domain}` }
    : policy === 'none' ? { status: 'warn', detail: `p=none only reports forged email; move to quarantine or reject (${dmarc})` }
      : { status: 'pass', detail: dmarc };
  let caa = [];
  try { caa = await resolveCaa(domain); } catch { /* none */ }
  r['dns.caa'] = caa.length ? { status: 'pass', detail: caa.map((c) => `${Object.keys(c).find((k) => k !== 'critical')} ${Object.values(c).filter((v) => typeof v === 'string').join('')}`).join('; ') } : { status: 'fail', detail: `no CAA record on ${domain}` };
  return r;
}

// ---------------------------------------------------------------------------------------------------------------
// Accessibility, in a real browser, when the site has the tools

async function loadAxe() {
  const from = [join(process.cwd(), 'noop.js'), join(here, 'noop.js')];
  const load = async (names) => {
    for (const base of from) for (const n of names) {
      try { return await import(pathToFileURL(createRequire(base).resolve(n)).href); } catch { /* next */ }
    }
    return null;
  };
  const pw = await load(['@playwright/test', 'playwright']);
  const axe = await load(['@axe-core/playwright']);
  return pw && axe ? { chromium: pw.chromium ?? pw.default?.chromium, AxeBuilder: axe.default ?? axe.AxeBuilder } : null;
}

/** The rules that need a real browser: what each reports when the tools are missing. */
const BROWSER_RULES = ['a11y.axe', 'a11y.axe-phone', 'a11y.reflow', 'a11y.focus-start', 'a11y.no-javascript'];
const PRIVACY_RULES = ['privacy.third-parties', 'privacy.cookies'];
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const PHONE = { viewport: { width: 375, height: 800 }, isMobile: true, hasTouch: true };

const skipAll = (ids, detail) => Object.fromEntries(ids.map((id) => [id, { status: 'skip', detail }]));

/** Every axe failure across pages, in one result. */
function axeResult(found, n, short) {
  if (!found.size) return { status: 'pass', detail: `${n} pages: no automated failures (test with people too)` };
  const where = (pages) => { const p = [...pages].map(short); return `${p.slice(0, 3).join(', ')}${p.length > 3 ? ` and ${p.length - 3} more` : ''}`; };
  return {
    status: 'fail',
    detail: [...found].map(([id, f]) => `${id} (${f.impact}): ${f.help}, ${f.nodes} times on ${where(f.pages)}`).join('\n'),
    pages: [...new Set([...found.values()].flatMap((f) => [...f.pages].map(short)))],
  };
}

async function axeInto(found, tools, page, url) {
  const res = await new tools.AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  for (const v of res.violations) {
    const f = found.get(v.id) ?? { help: v.help, impact: v.impact, pages: new Set(), nodes: 0 };
    f.pages.add(url);
    f.nodes += v.nodes.length;
    found.set(v.id, f);
  }
}

/**
 * The checks in a real browser, for each page: axe on a computer and on a phone, sideways scrolling at 320px, where
 * the first Tab goes, the content with JavaScript off, and (live: a live site) what the first visit loads from other
 * websites and the cookies it sets. Each reports 'skip' when the browser tools are missing, never 'pass'.
 */
async function checkBrowser(urls, { live = false } = {}) {
  const tools = await loadAxe();
  const missing = 'not run: install @playwright/test and @axe-core/playwright (then npx playwright install chromium)';
  if (!tools) return { ...skipAll(BROWSER_RULES, missing), ...(live ? skipAll(PRIVACY_RULES, missing) : {}) };
  const short = (u) => (u.startsWith('file:') ? u.split('/').slice(-2).join('/') : new URL(u).pathname);
  let browser;
  try {
    browser = await tools.chromium.launch();
    const desktop = new Map();
    const phone = new Map();
    const wide = [];
    const badStart = [];
    const empty = [];
    const others = new Map(); // origin → pages
    const cookies = new Map(); // name → pages
    const unreachable = [];
    for (const url of urls) {
     try {
      // A computer: axe, the first Tab, and (live) what the first visit loads and sets.
      const context = await browser.newContext();
      const page = await context.newPage();
      const origin = /^https?:/.test(url) ? new URL(url).origin : null;
      page.on('request', (req) => {
        const o = /^https?:/.test(req.url()) ? new URL(req.url()).origin : null;
        if (origin && o && o !== origin) others.set(o, [...(others.get(o) ?? []), short(url)]);
      });
      await page.goto(url, { waitUntil: 'load', timeout: TIMEOUT });
      await axeInto(desktop, tools, page, url);
      await page.keyboard.press('Tab');
      const start = await page.evaluate(() => {
        const el = document.activeElement;
        const href = el?.getAttribute?.('href') ?? '';
        return el?.tagName === 'A' && href.startsWith('#') && !!document.getElementById(decodeURIComponent(href.slice(1)));
      });
      if (!start) badStart.push(short(url));
      if (live) for (const c of await context.cookies()) cookies.set(c.name, [...(cookies.get(c.name) ?? []), short(url)]);
      await context.close();

      // A phone: axe, then the narrowest screen GGDS supports.
      const small = await browser.newContext(PHONE);
      const p = await small.newPage();
      await p.goto(url, { waitUntil: 'load', timeout: TIMEOUT });
      await axeInto(phone, tools, p, url);
      await p.setViewportSize({ width: 320, height: 800 });
      const over = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      if (over > 0) wide.push(`${short(url)} (${over}px too wide)`);
      await small.close();

      // JavaScript off.
      const plain = await browser.newContext({ javaScriptEnabled: false });
      const q = await plain.newPage();
      await q.goto(url, { waitUntil: 'load', timeout: TIMEOUT });
      const chars = await q.evaluate(() => (document.querySelector('main')?.innerText ?? '').trim().length);
      if (!chars) empty.push(short(url));
      await plain.close();
     } catch (e) {
      // One page that does not load (moved, or being rebuilt) is reported; the other pages are still checked.
      unreachable.push(`${short(url)} (${e.message.split('\n')[0]})`);
     }
    }
    const reached = urls.length - unreachable.length;
    if (!reached) throw new Error(`no page could be loaded: ${unreachable.join('; ')}`);
    const n = reached;
    const note = unreachable.length ? `\nnot loaded, so not checked: ${unreachable.join('; ')}` : '';
    const list = (xs) => `${xs.slice(0, 4).join(', ')}${xs.length > 4 ? ` and ${xs.length - 4} more` : ''}`;
    const out = {
      'a11y.axe': axeResult(desktop, n, short),
      'a11y.axe-phone': axeResult(phone, n, short),
      'a11y.reflow': wide.length ? { status: 'fail', detail: `scrolls sideways at 320px: ${list(wide)}` } : { status: 'pass', detail: `${n} pages fit 320px` },
      'a11y.focus-start': badStart.length ? { status: 'fail', detail: `the first Tab does not go to a working skip link: ${list(badStart)}` } : { status: 'pass', detail: `${n} pages: the first Tab goes to the skip link` },
      'a11y.no-javascript': empty.length ? { status: 'fail', detail: `<main> is empty, or missing, without JavaScript: ${list(empty)}` } : { status: 'pass', detail: `${n} pages show their content without JavaScript` },
    };
    if (note) for (const r of Object.values(out)) r.detail = `${r.detail ?? ''}${note}`.trim();
    if (live) {
      out['privacy.third-parties'] = others.size
        ? { status: 'warn', detail: `the first visit loads from ${list([...others.keys()].sort())}: check each is needed, and waits for people to agree if it is not` }
        : { status: 'pass', detail: 'everything came from the website itself' };
      out['privacy.cookies'] = cookies.size
        ? { status: 'warn', detail: `set on the first visit: ${list([...cookies.keys()].sort())}: only cookies the website needs to work may be set before people agree` }
        : { status: 'pass', detail: 'none set on the first visit' };
    }
    return out;
  } catch (e) {
    const detail = `not run: ${e.message.split('\n')[0]}`;
    return { ...skipAll(BROWSER_RULES, detail), ...(live ? skipAll(PRIVACY_RULES, detail) : {}) };
  } finally {
    await browser?.close();
  }
}

// ---------------------------------------------------------------------------------------------------------------
// GGDS and speed

async function checkGgds(sheets, readSheet) {
  const r = {};
  let version = null;
  for (const href of sheets) {
    const css = await readSheet(href).catch(() => '');
    const m = css.match(/\/\*!\s*GGDS\s+(\d+\.\d+\.\d+)/);
    if (m) { version = m[1]; break; }
    if (/\.ggds-banner\b/.test(css)) version ??= 'unknown';
  }
  r['ggds.css'] = version ? { status: 'pass', detail: version === 'unknown' ? 'GGDS styles found, version not stated' : `GGDS ${version}` } : { status: 'fail', detail: 'no GGDS stylesheet found' };
  if (version && version !== 'unknown') {
    const [a, b] = version.split('.').map(Number);
    const [x, y] = CHECKER_VERSION.split('.').map(Number);
    r['ggds.version'] = a < x || (a === x && b < y) ? { status: 'warn', detail: `GGDS ${version}; ${CHECKER_VERSION} is out (read What's new before you update)` } : { status: 'pass', detail: `GGDS ${version}` };
  } else r['ggds.version'] = { status: 'skip', detail: 'version not known' };
  return r;
}

async function checkSpeed(homeUrl, homeRes, homeHtml, budgetKb) {
  const resources = [...new Set([...stylesheets(homeHtml, homeUrl), ...scripts(homeHtml, homeUrl), ...images(homeHtml, homeUrl)])];
  const host = new URL(homeUrl).host;
  let total = Buffer.byteLength(homeHtml);
  const uncompressed = [];
  const uncached = [];
  const isText = (type) => /text\/|javascript|json|svg|xml/.test(type ?? '');
  if (isText(homeRes.headers.get('content-type')) && !homeRes.headers.get('content-encoding')) uncompressed.push('the page itself');
  await Promise.all(resources.map(async (url) => {
    try {
      const res = await get(url);
      const body = Buffer.from(await res.arrayBuffer());
      const sent = Number(res.headers.get('content-length')) || body.length;
      total += sent;
      if (isText(res.headers.get('content-type')) && !res.headers.get('content-encoding') && body.length > 1024) uncompressed.push(url);
      const cc = res.headers.get('cache-control') ?? '';
      const age = Number(cc.match(/max-age=(\d+)/)?.[1] ?? 0);
      if (new URL(url).host === host && (/no-store|no-cache/.test(cc) || age < 86400) && !res.headers.get('expires')) uncached.push(url);
    } catch { /* unreachable files are not this check's business */ }
  }));
  const short = (u) => (u.startsWith('the ') ? u : new URL(u).pathname);
  return {
    'fast.compression': uncompressed.length ? { status: 'warn', detail: `sent uncompressed: ${uncompressed.slice(0, 4).map(short).join(', ')}${uncompressed.length > 4 ? ` and ${uncompressed.length - 4} more` : ''}` } : { status: 'pass' },
    'fast.cache': uncached.length ? { status: 'warn', detail: `kept for less than a day: ${uncached.slice(0, 4).map(short).join(', ')}${uncached.length > 4 ? ` and ${uncached.length - 4} more` : ''}` } : { status: 'pass' },
    // No published budget exists, so the weight is information unless the site sets its own (--budget-kb).
    'fast.weight': !budgetKb ? { status: 'info', detail: `${Math.round(total / 1024)} KB in ${resources.length + 1} files` }
      : total / 1024 > budgetKb ? { status: 'fail', detail: `${Math.round(total / 1024)} KB in ${resources.length + 1} files, over the ${budgetKb} KB budget` }
        : { status: 'pass', detail: `${Math.round(total / 1024)} KB in ${resources.length + 1} files, within the ${budgetKb} KB budget` },
  };
}

// ---------------------------------------------------------------------------------------------------------------
// Pages

const SKIP_EXT = /\.(pdf|docx?|xlsx?|pptx?|zip|jpe?g|png|gif|webp|avif|svg|mp[34]|csv|json|xml|txt)$/i;

/** Same-site pages linked from a page, under scope (the folder the check started in). */
function pageLinks(html, base, scope) {
  const origin = new URL(base).origin;
  return links(clean(html)).map((l) => l.href).filter((h) => h && !/^(#|mailto:|tel:|javascript:)/i.test(h))
    .map((h) => { try { const u = new URL(h, base); u.hash = ''; return u; } catch { return null; } })
    .filter((u) => u && u.origin === origin && u.pathname.startsWith(scope) && !SKIP_EXT.test(u.pathname)).map((u) => u.href);
}

async function crawl(start, max) {
  const scope = new URL(start).pathname.replace(/[^/]*$/, ''); // https://x.gov.gh/en/index.html → /en/
  const pages = [];
  const seen = new Set([start]);
  const queue = [start];
  while (queue.length && pages.length < max) {
    const batch = queue.splice(0, Math.min(4, max - pages.length));
    const got = await Promise.all(batch.map(async (url) => {
      try {
        const res = await get(url);
        if (!res.ok || !/html/.test(res.headers.get('content-type') ?? '')) return null;
        return { url: res.url, res, html: await res.text() };
      } catch { return null; }
    }));
    for (const p of got.filter(Boolean)) {
      pages.push(p);
      for (const l of pageLinks(p.html, p.url, scope)) if (!seen.has(l)) { seen.add(l); queue.push(l); }
    }
  }
  return pages;
}

function htmlFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    if (e.name.startsWith('.') || e.name === 'node_modules') return [];
    const p = join(dir, e.name);
    return e.isDirectory() ? htmlFiles(p) : ['.html', '.htm'].includes(extname(e.name).toLowerCase()) ? [p] : [];
  }).sort();
}

/** Combines each page's result for a rule: the worst status, with the pages that had it. */
function combine(perPage) {
  const order = ['fail', 'warn', 'pass', 'info', 'skip'];
  const out = {};
  for (const [page, results] of perPage) {
    for (const [id, res] of Object.entries(results)) {
      const cur = out[id];
      if (!cur || order.indexOf(res.status) < order.indexOf(cur.status)) out[id] = { ...res, pages: [] };
      if (out[id].status === res.status && res.status !== 'pass') out[id].pages.push(page);
    }
  }
  for (const r of Object.values(out)) if (r.status === 'pass' && perPage.length > 1) r.detail = '';
  return out;
}

/**
 * Checks a site: a URL (live) or a folder of built pages. Returns { target, kind, pages, results, summary }, where
 * results maps each rule id to { status: pass|fail|warn|info|skip, detail, pages }.
 */
export async function check(target, { pages: maxPages = 10, dns = true, a11y = true, budgetKb } = {}) {
  const isUrl = /^https?:\/\//i.test(target);
  let results = {};
  let pageList = [];
  if (isUrl) {
    const pages = await crawl(target, maxPages);
    if (!pages.length) throw new Error(`${target} did not answer with a web page`);
    const home = pages[0];
    pageList = pages.map((p) => p.url);
    results = combine(pages.map((p) => [p.url, checkPage(p.html)]));
    const host = new URL(home.url).hostname;
    results['web.domain'] = host.endsWith('.gov.gh') ? { status: 'pass', detail: host } : { status: 'warn', detail: `${host}: government websites use .gov.gh` };
    results['web.https'] = await checkHttps(home.url);
    Object.assign(results, checkHeaders(home.res.headers));
    results['web.wp-users'] = await checkWpUsers(new URL(home.url).origin);
    const local = host === 'localhost' || /^[\d.]+$|^\[|\.(local|localhost|test|internal)$/.test(host);
    if (dns && !local) Object.assign(results, await checkDns(mailDomain(host)));
    else for (const id of ['dns.spf', 'dns.dmarc', 'dns.caa']) results[id] = { status: 'skip', detail: dns ? `${host} is not a public domain` : 'skipped (--no-dns)' };
    Object.assign(results, await checkGgds(stylesheets(home.html, home.url), async (u) => (await get(u)).text()));
    Object.assign(results, await checkSpeed(home.url, home.res, home.html, budgetKb));
    Object.assign(results, a11y ? await checkBrowser(pageList, { live: true }) : skipAll([...BROWSER_RULES, ...PRIVACY_RULES], 'skipped'));
  } else {
    const dir = resolve(target);
    if (!existsSync(dir)) throw new Error(`${target}: no such folder or address`);
    const files = (statSync(dir).isFile() ? [dir] : htmlFiles(dir)).slice(0, maxPages);
    if (!files.length) throw new Error(`${target} has no .html files`);
    const root = statSync(dir).isFile() ? resolve(dir, '..') : dir;
    pageList = files.map((f) => relative(root, f));
    results = combine(files.map((f) => [relative(root, f), checkPage(readFileSync(f, 'utf8'))]));
    const index = files.find((f) => /(^|[/\\])index\.html?$/i.test(f)) ?? files[0];
    const html = readFileSync(index, 'utf8');
    Object.assign(results, await checkGgds(stylesheets(html, pathToFileURL(index).href).filter((u) => u.startsWith('file:')), async (u) => readFileSync(fileURLToPath(u.split(/[?#]/)[0]), 'utf8')));
    Object.assign(results, a11y ? await checkBrowser(files.map((f) => pathToFileURL(f).href)) : skipAll(BROWSER_RULES, 'skipped'));
  }
  const summary = { pass: 0, fail: 0, warn: 0, info: 0, skip: 0 };
  for (const r of Object.values(results)) summary[r.status]++;
  return { target, kind: isUrl ? 'site' : 'folder', checked: new Date().toISOString(), checker: CHECKER_VERSION, pages: pageList, results, summary };
}

// ---------------------------------------------------------------------------------------------------------------
// The report

const MARK = { pass: '✓ pass', fail: '✗ FAIL', warn: '! warn', info: '· info', skip: '- not run' };

export function report(res) {
  const lines = [];
  lines.push(`GGDS readiness check ${res.checker}: ${res.target}`);
  lines.push(`${res.pages.length} ${res.pages.length === 1 ? 'page' : 'pages'} checked on ${res.checked.slice(0, 10)}.`);
  lines.push('A readiness check against the published sources named on each line. It is not a statement of NITA compliance:');
  lines.push('NITA\u2019s clauses are not mapped yet. Automated checks find only some problems: test with people too.');
  for (const group of GROUPS) {
    const ids = Object.keys(RULES).filter((id) => RULES[id].group === group && res.results[id]);
    if (!ids.length) continue;
    lines.push('', group);
    for (const id of ids) {
      const rule = RULES[id];
      const r = res.results[id];
      lines.push(`  ${MARK[r.status].padEnd(10)} ${rule.title}`);
      for (const d of (r.detail ?? '').split('\n').filter(Boolean)) lines.push(`             ${d}`);
      if (r.pages?.length && res.pages.length > 1) lines.push(`             on ${r.pages.length === res.pages.length ? 'every page' : r.pages.slice(0, 3).join(', ') + (r.pages.length > 3 ? ` and ${r.pages.length - 3} more` : '')}`);
      if (r.status === 'fail' || r.status === 'warn') lines.push(`             ${id} · ${rule.sources.map((s) => SOURCES[s].name + (s === 'wcag' && rule.ref ? ` ${rule.ref}` : '')).join('; ')}`);
    }
  }
  const s = res.summary;
  lines.push('', `${s.fail} failed, ${s.warn} warnings, ${s.pass} passed${s.skip ? `, ${s.skip} not run` : ''}.`);
  return `${lines.join('\n')}\n`;
}

async function cli(argv) {
  const opts = { pages: undefined, dns: true, json: false, strict: false, budgetKb: undefined };
  let target = null;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--pages') opts.pages = Number(argv[++i]);
    else if (a === '--json') opts.json = true;
    else if (a === '--no-dns') opts.dns = false;
    else if (a === '--budget-kb') {
      opts.budgetKb = Number(argv[++i]);
      if (!(opts.budgetKb > 0)) throw new Error('--budget-kb needs a number of kilobytes');
    }
    else if (a === '--strict') opts.strict = true;
    else if (a === '--help' || a === '-h') {
      process.stdout.write(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1).filter((l) => l.startsWith('//')).map((l) => l.slice(3)).join('\n') + '\n');
      return 0;
    } else if (a.startsWith('-')) throw new Error(`unknown option ${a} (see --help)`);
    else target = a;
  }
  if (!target) throw new Error('give the website\u2019s address, or the folder of its built pages (see --help)');
  if (opts.pages !== undefined && !(opts.pages >= 1)) throw new Error('--pages needs a number, 1 or more');
  const res = await check(target, { pages: opts.pages ?? (/^https?:/i.test(target) ? 10 : Infinity), dns: opts.dns, budgetKb: opts.budgetKb });
  process.stdout.write(opts.json ? `${JSON.stringify(res, null, 2)}\n` : report(res));
  return res.summary.fail || (opts.strict && res.summary.warn) ? 1 : 0;
}

// Run as a command (npx links bin files, so compare real paths).
if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  cli(process.argv.slice(2)).then((code) => { process.exitCode = code; }, (e) => { process.stderr.write(`ggds-check: ${e.message}\n`); process.exitCode = 2; });
}
