// Builds the GGDS documentation site into site/: component pages with live examples, every example as its own
// page (what the browser tests check), foundations, and the example sites. The site uses GGDS itself and
// runs under a strict CSP: no inline scripts, styles or style attributes. No dependencies.
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAgencies, platformDir, writeAgencyPages } from './agencies.mjs';
import { contrast, cssName, flatten, loadTokens, resolveAll } from '../packages/tokens/lib.mjs';
import { DEFAULT_THEME, themes } from '../packages/themes/index.mjs';
import { drift } from '../packages/themes/sync.mjs';
import { esc, footer, header, hero, icon } from './parts.mjs';
import { heroArt } from './hero-art.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const site = join(root, 'site');
const componentsDir = join(root, 'packages', 'html', 'components');
// Where people get GGDS: the version they download, and the repository with its releases page.
const { version } = JSON.parse(readFileSync(join(root, 'packages', 'css', 'package.json'), 'utf8'));
const repo = 'https://github.com/ghana-gds/ggds';

rmSync(site, { recursive: true, force: true });
mkdirSync(join(site, 'assets', 'js'), { recursive: true });
mkdirSync(join(site, 'assets', 'themes'), { recursive: true });

// Assets
copyFileSync(join(root, 'packages', 'css', 'dist', 'ggds.css'), join(site, 'assets', 'ggds.css'));
for (const f of readdirSync(join(root, 'packages', 'js', 'dist')).filter((f) => f.endsWith('.js'))) {
  copyFileSync(join(root, 'packages', 'js', 'dist', f), join(site, 'assets', 'js', f));
}
for (const f of readdirSync(join(root, 'packages', 'themes', 'dist')).filter((f) => f.endsWith('.css'))) {
  copyFileSync(join(root, 'packages', 'themes', 'dist', f), join(site, 'assets', 'themes', f));
}

// The themes must still match the platform's agency profiles (skipped when the platform is not available).
const themeDrift = drift();
if (themeDrift?.length) throw new Error(`packages/themes/themes.json is out of date with the platform (run pnpm run sync:themes):\n  ${themeDrift.join('\n  ')}`);
writeFileSync(join(site, 'assets', 'example-logo.svg'),
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><circle cx="24" cy="24" r="22" fill="#00496e"/><path d="M24 10l4 10h10l-8 6 3 11-9-7-9 7 3-11-8-6h10z" fill="#fcd116"/></svg>\n');

// Meta comments: <!-- key: value; key: value -->
function meta(text) {
  const m = text.match(/^<!--\s*([\s\S]*?)\s*-->\n?/);
  const data = {};
  if (m) for (const part of m[1].split(';')) { const i = part.indexOf(':'); if (i > 0) data[part.slice(0, i).trim()] = part.slice(i + 1).trim(); }
  return { data, body: m ? text.slice(m[0].length) : text };
}

export const slugify = (t) => t.toLowerCase().replace(/<[^>]+>/g, '').replace(/&[a-z]+;/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const GROUPS = ['Page structure', 'Navigation', 'Forms', 'Content'];

/** Gives every h2 an id and, when there are three or more, adds an "On this page" list beside the content. */
function withContents(body) {
  const used = new Set();
  const items = [];
  const html = body.replace(/<h2(\s[^>]*)?>([\s\S]*?)<\/h2>/g, (whole, attrs = '', inner) => {
    let id = attrs.match(/\sid="([^"]+)"/)?.[1];
    if (!id) { id = slugify(inner) || 'section'; while (used.has(id)) id += '-2'; attrs += ` id="${id}"`; }
    used.add(id);
    items.push([id, inner.replace(/<[^>]+>/g, '').trim()]);
    return `<h2${attrs}>${inner}</h2>`;
  });
  if (items.length < 3) return html;
  return `<div class="docs-with-contents">
<nav class="docs-contents" aria-labelledby="contents-h">
  <p class="docs-contents__title" id="contents-h">On this page</p>
  <ul class="docs-contents__list">${items.map(([id, t]) => `<li><a href="#${id}">${esc(t)}</a></li>`).join('')}</ul>
</nav>
<div class="docs-with-contents__body">
${html}
</div>
</div>`;
}

/** Previous and next links at the end of a page. */
const pager = (prev, next) => `<nav class="docs-pager" aria-label="Previous and next pages">
${prev ? `<a class="docs-pager__link docs-pager__link--prev" href="${prev.href}"><span class="docs-pager__dir">Previous</span> ${esc(prev.label)}</a>` : '<span></span>'}
${next ? `<a class="docs-pager__link docs-pager__link--next" href="${next.href}"><span class="docs-pager__dir">Next</span> ${esc(next.label)}</a>` : ''}
</nav>`;

/** A complete page. depth: how many folders below site/. bare: body is the whole page content. */
function shell({ title, depth, body, extraCss = [], bare = false, current = '', lead, noindex = false, toc = false, scripts = [] }) {
  const base = '../'.repeat(depth);
  const css = [`${base}assets/ggds.css`, `${base}assets/docs.css`, ...extraCss].map((h) => `<link rel="stylesheet" href="${h}">`).join('\n  ');
  const docsNav = [
    { label: 'Get started', href: `${base}get-started.html` },
    { label: 'Foundations', href: `${base}foundations.html` },
    { label: 'Themes', href: `${base}themes.html` },
    { label: 'Components', href: `${base}components/index.html` },
    { label: 'Example sites', href: `${base}agencies/index.html` },
  ];
  const content = bare ? body : `<a class="ggds-skip-link" href="#main">Skip to main content</a>
<div class="docs-draft"><p class="ggds-container"><strong>Draft, version 0.1.0.</strong> GGDS v1 will be NITA guidance, recommended for government websites. It has not had its accessibility audit yet.</p></div>
${header({ name: 'Ghana Government Design System', country: 'Design system for Government of Ghana websites', logo: '<span class="ggds-header__monogram" aria-hidden="true">GGDS</span>', nav: docsNav, current: docsNav.find((n) => n.label === current)?.href, navId: 'docs-nav', home: `${base}index.html`, search: `${base}search.html` })}
<main id="main" tabindex="-1">
${lead ?? ''}<div class="ggds-main ggds-container">
${toc ? withContents(body) : body}
</div>
</main>
${footer({
  name: 'Ghana Government Design System',
  logo: '<span class="ggds-header__monogram" aria-hidden="true">GGDS</span>',
  purpose: 'Ready-made styles and page parts for Government of Ghana websites, looked after by NITA.',
  sections: [
    { label: 'Design system', href: `${base}index.html`, links: [{ label: 'Get started', href: `${base}get-started.html` }, { label: 'Foundations', href: `${base}foundations.html` }, { label: 'Themes', href: `${base}themes.html` }] },
    { label: 'Components', href: `${base}components/index.html`, links: GROUPS.map((g) => ({ label: g, href: `${base}components/index.html#${slugify(g)}` })) },
    { label: 'Examples', href: `${base}agencies/index.html`, links: [{ label: 'Example sites', href: `${base}agencies/index.html` }, { label: 'Register of government websites', href: `${base}register.html` }] },
    { label: 'About GGDS', href: `${base}changelog.html`, links: [{ label: 'What\u2019s new', href: `${base}changelog.html` }, { label: 'Search', href: `${base}search.html` }] },
  ],
  bar: [['Code licence: Apache-2.0', `${base}index.html#licence`]],
})}`;
  return `<!doctype html>
<html lang="en-GB">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)} | GGDS</title>${noindex ? '\n  <meta name="robots" content="noindex, nofollow">' : ''}
  ${css}
  <script type="module" src="${base}assets/js/auto.js"></script>${bare ? '' : `\n  <script type="module" src="${base}assets/docs.js"></script>`}${scripts.map((js) => `\n  <script type="module" src="${base}${js}"></script>`).join('')}
</head>
<body>
${content}
</body>
</html>
`;
}

// Example links: an example's markup uses real website addresses ("/services/"), which do not exist on this site.
// In the rendered example each one opens a small page that says where the link would go and links back, so no
// example link leads to "not found". The HTML shown for copying keeps the real addresses.
function exampleLinks(c, e) {
  const dir = join(site, 'examples', c.slug, 'links');
  return e.body.replace(/<(a|form)\b([^>]*?)\s(href|action)="(\/[^"]*)"([^>]*)>([\s\S]*?)<\/\1>/g, (whole, tag, before, attr, address, after, inside) => {
    const path = address.split('#')[0];
    const file = `${e.slug}-${path.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'home'}.html`;
    const text = inside.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const label = tag === 'form' ? 'Search results' : (text.replace(/ – home$/, '') || 'Home');
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, file), shell({ title: `${label} (example link)`, depth: 3, bare: true, body: `<main class="ggds-main ggds-container" id="main" tabindex="-1">
<h1>${esc(label)}</h1>
<div class="ggds-notice"><p class="ggds-notice__title"><span class="ggds-visually-hidden">Information:</span> You followed a link in an example</p>
<p>On a real website this opens <code>${esc(address)}</code>. In the documentation it comes here instead.</p></div>
<p><a href="../${e.file}">Back to the example</a></p>
</main>` }));
    return `<${tag}${before} ${attr}="links/${file}"${after}>${inside}</${tag}>`;
  });
}

// Components
const components = readdirSync(componentsDir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => {
  const dir = join(componentsDir, d.name);
  const g = meta(readFileSync(join(dir, 'guidance.html'), 'utf8'));
  const examples = readdirSync(join(dir, 'examples')).filter((f) => f.endsWith('.html')).sort().map((f) => {
    const e = meta(readFileSync(join(dir, 'examples', f), 'utf8'));
    return { file: f, slug: f.replace(/\.html$/, ''), title: e.data.title ?? f, layout: e.data.layout ?? 'main', height: Number(e.data.height ?? 300), themes: e.data.themes === 'true', body: e.body.trim() };
  });
  const group = g.data.group ?? 'Content';
  if (!GROUPS.includes(group)) throw new Error(`${d.name}: unknown group "${group}"`);
  return { slug: d.name, name: g.data.name ?? d.name, status: g.data.status ?? 'beta', order: Number(g.data.order ?? 99), group, summary: g.data.summary ?? '',
    related: (g.data.related ?? '').split(',').map((r) => r.trim()).filter(Boolean), guidance: g.body, examples };
}).sort((a, b) => GROUPS.indexOf(a.group) - GROUPS.indexOf(b.group) || a.order - b.order);
for (const c of components) for (const r of c.related) if (!components.some((x) => x.slug === r)) throw new Error(`${c.slug}: related component "${r}" does not exist`);

const heights = new Set();
const sidenav = (current) => `<nav class="docs-sidenav" aria-label="Components">
  <p class="docs-sidenav__all"><a href="index.html">All components</a></p>
  ${GROUPS.map((g) => `<p class="docs-sidenav__group">${g}</p>
  <ul class="docs-sidenav__list">
    ${components.filter((c) => c.group === g).map((c) => `<li><a class="docs-sidenav__link" href="${c.slug}.html"${c.slug === current ? ' aria-current="page"' : ''}>${esc(c.name)}</a></li>`).join('\n    ')}
  </ul>`).join('\n  ')}
</nav>`;

for (const c of components) {
  mkdirSync(join(site, 'examples', c.slug), { recursive: true });
  for (const e of c.examples) {
    heights.add(e.height);
    const linked = exampleLinks(c, e);
    const body = e.layout === 'bare' ? linked : `<main class="ggds-main ggds-container" id="main" tabindex="-1">\n${linked}\n</main>`;
    writeFileSync(join(site, 'examples', c.slug, e.file), shell({ title: `${c.name}: ${e.title}`, depth: 2, body, bare: true, extraCss: e.themes ? ['../../assets/themes/themes.css'] : [] }));
  }
  const tag = { stable: 'ggds-tag--success', beta: 'ggds-tag--info' }[c.status] ?? '';
  const examples = c.examples.map((e) => `
<section class="docs-example" aria-labelledby="ex-${e.slug}">
  <h2 class="docs-example__title" id="ex-${e.slug}">Example: ${esc(e.title)}</h2>
  <iframe class="docs-frame docs-frame--h${e.height}" src="../examples/${c.slug}/${e.file}" title="Example: ${esc(e.title)}" loading="lazy"></iframe>
  <p><a href="../examples/${c.slug}/${e.file}">Open this example on its own page</a></p>
  <details class="ggds-disclosure">
    <summary class="ggds-disclosure__summary">HTML</summary>
    <div class="ggds-disclosure__content"><pre class="docs-code" tabindex="0" aria-label="HTML for ${esc(e.title)}"><code>${esc(e.body)}</code></pre></div>
  </details>
</section>`).join('');
  const i = components.indexOf(c);
  const near = (x) => x && { label: x.name, href: `${x.slug}.html` };
  const related = c.related.map((r) => components.find((x) => x.slug === r));
  const body = `<div class="docs-layout">
${sidenav(c.slug)}
<div class="docs-content">
  <p class="docs-kicker">${esc(c.group)}</p>
  <h1>${esc(c.name)}</h1>
  <p><strong class="ggds-tag ${tag}">${esc(c.status)}</strong></p>
  ${withContents(`<div class="docs-guidance">${c.guidance}</div>
  ${examples}
  ${related.length ? `<h2>Related components</h2>
  <ul class="ggds-card-grid">${related.map((r) => `
    <li class="ggds-card"><h3 class="ggds-card__title"><a class="ggds-card__link" href="${r.slug}.html">${esc(r.name)}</a></h3><p class="ggds-card__body">${esc(r.summary)}</p></li>`).join('')}
  </ul>` : ''}`)}
  ${pager(near(components[i - 1]), near(components[i + 1]))}
</div>
</div>`;
  mkdirSync(join(site, 'components'), { recursive: true });
  writeFileSync(join(site, 'components', `${c.slug}.html`), shell({ title: c.name, depth: 1, body, current: 'Components' }));
}

// Components overview, by group.
{
  const groups = GROUPS.map((g) => `<h2 id="${slugify(g)}">${g}</h2>
<ul class="ggds-card-grid">${components.filter((c) => c.group === g).map((c) => `
  <li class="ggds-card"><h3 class="ggds-card__title"><a class="ggds-card__link" href="${c.slug}.html">${esc(c.name)}</a></h3><p class="ggds-card__body">${esc(c.summary)}</p></li>`).join('')}
</ul>`).join('\n');
  writeFileSync(join(site, 'components', 'index.html'), shell({ title: 'Components', depth: 1, current: 'Components', body: `
<h1>Components</h1>
<p class="ggds-lead ggds-measure">The parts you build pages from. Each page says when to use it, when not to, and how, with a live example and the HTML to copy.</p>
${groups}
${pager({ label: 'Themes', href: '../themes.html' }, { label: 'Example sites', href: '../agencies/index.html' })}` }));
}

// Foundations: colours with measured contrast, type scale, spacing.
const tokens = resolveAll(flatten(loadTokens(join(root, 'packages', 'tokens', 'tokens.json'))));
const tokenFile = loadTokens(join(root, 'packages', 'tokens', 'tokens.json'));
const colours = [...tokens.values()].filter((t) => t.type === 'color');
const swatchCss = colours.map((t) => `.docs-swatch--${t.path.slice(1).join('-')} { background: var(${cssName(t.path)}); }`);
const colourRows = colours.map((t) => `<tr><td><span class="docs-swatch docs-swatch--${t.path.slice(1).join('-')}"></span></td><th scope="row"><code>${cssName(t.path)}</code></th><td><code>${esc(t.resolved)}</code></td><td>${esc(t.description ?? '')}</td></tr>`).join('\n');
// Colour pairs, grouped by where they appear, each with a live sample. Borders and focus are drawn as lines, not text.
const pairs = tokenFile.$extensions.ggds.contrastPairs.map((p, i) => ({ ...p, i, ratio: contrast(tokens.get(p.fg).resolved, tokens.get(p.bg).resolved), line: /^color\.(border|focus)\./.test(p.fg) }));
const tok = (path) => cssName(path.split('.'));
const pairCss = pairs.map((p) => p.line
  ? `.docs-pair--${p.i} { background: var(${tok(p.bg)}); } .docs-pair--${p.i} .docs-pair__line { border-color: var(${tok(p.fg)}); }`
  : `.docs-pair--${p.i} { background: var(${tok(p.bg)}); color: var(${tok(p.fg)}); }`);
const need = (min) => (min >= 7 ? 'very easy to read' : min >= 4.5 ? 'easy to read' : 'easy to see');
const pairGroups = [...new Set(pairs.map((p) => p.group))].map((g) => `
<h3>${esc(g)}</h3>
<ul class="docs-pairs">${pairs.filter((p) => p.group === g).map((p) => `
  <li class="docs-pairs__item">
    <span class="docs-pair docs-pair--${p.i}" aria-hidden="true">${p.line ? '<span class="docs-pair__line"></span>' : 'Aa'}</span>
    <span class="docs-pairs__text">
      <span class="docs-pairs__label">${esc(p.label)}</span>
      <span class="docs-pairs__result ${p.ratio >= p.min ? 'docs-pass' : 'docs-fail'}">${p.ratio >= p.min ? `${need(p.min)[0].toUpperCase()}${need(p.min).slice(1)}` : 'Too faint'}: ${p.ratio.toFixed(1)} to 1 <span class="docs-pairs__min">(needs ${p.min} to 1)</span></span>
      <span class="docs-pairs__tokens"><code>${tok(p.fg)}</code> on <code>${tok(p.bg)}</code></span>
    </span>
  </li>`).join('')}
</ul>`).join('');
const typeRows = ['3xl', '2xl', 'xl', 'lg', 'base', 'sm', 'xs'].map((s) => `<p class="docs-type-sample docs-type--${s}">Font size ${s}: Apply for a licence</p>`).join('\n');
const typeCss = ['3xl', '2xl', 'xl', 'lg', 'base', 'sm', 'xs'].map((s) => `.docs-type--${s} { font-size: var(--ggds-font-size-${s}); }`);
writeFileSync(join(site, 'foundations.html'), shell({ title: 'Foundations', depth: 0, current: 'Foundations', toc: true, body: `
<h1>Foundations</h1>
<p class="ggds-lead ggds-measure">The colours, text sizes and spacing that every GGDS component uses. They are called design tokens: named values such as <code>--ggds-color-link</code>, so a website never has to repeat a colour code.</p>
<h2>Colour</h2>
<div class="ggds-prose">
<p>GGDS uses one government blue for links, buttons and focus on every website. Each institution adds its own colour only on its <a href="themes.html">theme</a> parts: the line under the header, its name, the homepage hero, the footer and its card in a list.</p>
<p>The red, gold and green are the flag colours. They appear only as thin lines and bands, and as gold text on dark backgrounds. Their exact values will be updated when an official specification is published.</p>
</div>
<h3 id="contrast">Can people read it?</h3>
<p class="ggds-measure"><strong>Contrast</strong> is how much a colour stands out from what is behind it, written as a ratio: 1 to 1 is invisible, 21 to 1 is black on white. People with low vision, old screens or bright sunlight need enough of it.</p>
<ul class="ggds-measure">
<li>Text needs at least <strong>4.5 to 1</strong> (WCAG 2.2 level AA).</li>
<li>Borders of form fields and the focus outline need at least <strong>3 to 1</strong>, so people can see where to type and where they are.</li>
<li>White text on the hero and footer needs <strong>7 to 1</strong>, because it carries your institution\u2019s colour on every page.</li>
</ul>
<p class="ggds-measure">These are all the colour combinations GGDS uses, measured when this page was built. If a change made any of them too faint, the build would stop.</p>
${pairGroups}
<h3>All colours</h3>
<div class="ggds-table-wrap" role="region" aria-labelledby="colours-caption" tabindex="0"><table class="ggds-table">
<caption class="ggds-table__caption" id="colours-caption">Colour tokens</caption>
<thead><tr><th scope="col">Swatch</th><th scope="col">Token</th><th scope="col">Value</th><th scope="col">Use</th></tr></thead>
<tbody>${colourRows}</tbody></table></div>
<h2>Text</h2>
<p class="ggds-measure">GGDS uses the fonts already on each phone and computer, so nothing extra downloads on slow or costly connections.</p>
${typeRows}
${pager({ label: 'Get started', href: 'get-started.html' }, { label: 'Themes', href: 'themes.html' })}` }));

writeFileSync(join(site, 'assets', 'docs.css'), `${readFileSync(join(root, 'docs', 'docs.css'), 'utf8')}\n/* Generated */\n${[...heights].sort((a, b) => a - b).map((h) => `.docs-frame--h${h} { height: ${h}px; }`).join('\n')}\n${swatchCss.join('\n')}\n${typeCss.join('\n')}\n${pairCss.join('\n')}\n`);

// Themes: one default, and a ready-made theme per institution. Each preview is real markup inside an element
// carrying data-ggds-theme, so the page itself demonstrates the attribute method.
const themeRow = (t) => `<tr><th scope="row">${esc(t.shortName)}${t.slug === DEFAULT_THEME ? ' <strong class="ggds-tag ggds-tag--info">default</strong>' : ''}</th><td><code>${t.slug}</code></td><td><span class="docs-swatch docs-theme-swatch" data-ggds-theme="${t.slug}"></span> <code>${t.accent}</code></td><td><span class="docs-swatch docs-theme-swatch docs-theme-swatch--deep" data-ggds-theme="${t.slug}"></span> <code>${t.deep}</code></td><td class="ggds-table__numeric">${contrast(t.accent, '#ffffff').toFixed(2)}:1</td><td class="ggds-table__numeric">${contrast('#ffffff', t.deep).toFixed(2)}:1</td></tr>`;
const themePreview = (t) => `
<li class="docs-theme" data-ggds-theme="${t.slug}">
  <div class="docs-theme__header"><span class="docs-theme__name">${esc(t.name)}</span></div>
  <div class="docs-theme__hero"><p class="docs-theme__purpose">${esc(t.shortName)}</p><p class="docs-theme__title">What do you need help with?</p></div>
  <div class="docs-theme__body"><a class="ggds-button" href="#theme-${t.slug}-use">Start now</a> <a href="#theme-${t.slug}-use">A link</a></div>
  <div class="docs-theme__footer" id="theme-${t.slug}-use"><code>themes/${t.slug}.css</code></div>
</li>`;
writeFileSync(join(site, 'themes.html'), shell({ title: 'Themes', depth: 0, current: 'Themes', toc: true, extraCss: ['assets/themes/themes.css'], body: `
<h1>Themes</h1>
<p class="ggds-lead ggds-measure">A theme gives a website its institution's colour. Everything else stays the same on every government website.</p>
<div class="ggds-prose">
<h2>What a theme changes</h2>
<p>Only five places: the line under the header, the institution's name, the homepage <a href="components/hero.html">hero</a>, the footer, and the institution's card in a list.</p>
<p>Links, buttons, form fields and messages never change colour. Someone who has used one government website can then use any other. In the previews below, the button and the link look the same in every theme.</p>
<h2>Use a theme</h2>
<ol>
<li><strong>The default theme:</strong> add <code>ggds.css</code>. Nothing else is needed.</li>
<li><strong>Your institution's theme:</strong> add its theme file after the stylesheet, for example <code>&lt;link rel="stylesheet" href="themes/nca.css"&gt;</code>.</li>
<li><strong>Several institutions on one page,</strong> such as a list of a ministry's agencies: add <code>themes/themes.css</code> and put <code>data-ggds-theme="nca"</code> (with the institution's theme name) on each card.</li>
<li><strong>No theme for your institution yet:</strong> make one from your colour with <code>institutionCss('#rrggbb')</code> in <code>@ggds/tokens/institution.mjs</code>. It rejects colours that are too light to read on white, and works out the darker shade for the hero and footer.</li>
</ol>
<p>Themes are stylesheets, never inline styles, so they work on websites with a strict Content Security Policy.</p>
<h2>Ready-made themes</h2>
<p>These use each institution's current website colour. Each institution still has to confirm its colour, so treat them as provisional.</p>
</div>
<ul class="docs-themes">${themes.map(themePreview).join('')}
</ul>
<div class="ggds-table-wrap" role="region" aria-labelledby="themes-caption" tabindex="0"><table class="ggds-table">
<caption class="ggds-table__caption" id="themes-caption">Theme colours and contrast</caption>
<thead><tr><th scope="col">Institution</th><th scope="col">Theme name</th><th scope="col">Colour</th><th scope="col">Dark shade</th><th scope="col" class="ggds-table__numeric">Colour on white</th><th scope="col" class="ggds-table__numeric">White on dark shade</th></tr></thead>
<tbody>${themes.map(themeRow).join('\n')}</tbody></table></div>
<p>See whole homepages in each theme on the <a href="agencies/index.html">example sites</a>.</p>
${pager({ label: 'Foundations', href: 'foundations.html' }, { label: 'Components', href: 'components/index.html' })}` }));

writeFileSync(join(site, 'register.html'), shell({ title: 'Register of government websites', depth: 0, body: `
<h1>Register of official government websites</h1>
<div class="ggds-prose">
<p>The <a href="components/banner.html">government website banner</a> asks people to check a website's address against an official list of government websites.</p>
<p><strong>That list does not exist yet.</strong> Until it does, link the banner to the most official list your institution has, such as your ministry's list of its agencies.</p>
</div>` }));

// Example sites: real institutions' homepages built with GGDS (needs the MoCDTI platform's settings)
const { agencies, dir } = await loadAgencies(root);
if (agencies.length) {
  const index = writeAgencyPages({ siteDir: site, agencies, platformDirectory: dir, shell });
  writeFileSync(join(site, 'agencies', 'index.html'), shell({ title: index.title, depth: 1, body: `${index.body}\n${pager({ label: 'Components', href: '../components/index.html' }, null)}`, extraCss: index.extraCss, current: 'Example sites', noindex: true }));
  console.log(`docs: ${components.length} components, ${components.reduce((n, c) => n + c.examples.length, 0)} examples, ${themes.length} themes, ${agencies.length} example sites → ${site}`);
} else {
  console.warn(`docs: platform not found at ${platformDir(root)}; example sites skipped (set GGDS_PLATFORM_DIR)`);
}

// Get started: how to use GGDS on a website, from a local build.
{
  const page = components.find((c) => c.slug === 'page')?.examples[0]?.body ?? '';
  const starter = `<!doctype html>
<html lang="en-GB">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Apply for a licence | Example Agency</title>
  <link rel="stylesheet" href="ggds/ggds.min.css">
  <script type="module" src="ggds/auto.js"></script>
</head>
<body>
${page}
</body>
</html>`;
  writeFileSync(join(site, 'get-started.html'), shell({ title: 'Get started', depth: 0, current: 'Get started', toc: true, body: `
<h1>Get started</h1>
<p class="ggds-lead ggds-measure">Add GGDS to a website in four steps, or use it as a package or with Astro. It is plain HTML and CSS, so it works with any website: plain HTML, WordPress, Django, React, or anything else that produces web pages.</p>
<div class="ggds-prose">
<h2>1. Download GGDS</h2>
<p>Download <code>ggds-${version}.zip</code> from the <a href="${repo}/releases">GGDS releases page</a>. You do not need Node, npm or any build tools.</p>
<h2>2. Copy the files into your website</h2>
<p>The zip holds one <code>ggds</code> folder. Copy it into your website as it is.</p>
<div class="ggds-table-wrap" role="region" aria-labelledby="files-caption" tabindex="0"><table class="ggds-table">
<caption class="ggds-table__caption" id="files-caption">The files in the ggds folder</caption>
<thead><tr><th scope="col">File</th><th scope="col">What it is</th><th scope="col">Needed?</th></tr></thead>
<tbody>
<tr><td><code>ggds.min.css</code></td><td>All the styles, with the default theme. <code>ggds.css</code> is the same, readable</td><td>Yes</td></tr>
<tr><td><code>themes/&lt;theme&gt;.css</code></td><td>Your institution's theme, such as <code>nca.css</code></td><td>Only for a theme other than the default</td></tr>
<tr><td><code>auto.js</code> and the other <code>.js</code> files</td><td>The small script: phone menu and error summary</td><td>No. Every part works without it. Keep the four files together</td></tr>
<tr><td><code>core.min.css</code> and <code>components/</code></td><td>The same styles in parts, to load only what you use</td><td>No</td></tr>
</tbody></table></div>
<p>The files come from your own website, so a strict Content Security Policy (<code>style-src 'self'; script-src 'self'</code>) works without changes. The zip's <code>SHA256SUMS</code> file lets you check the download.</p>
<h2>3. Start from this page</h2>
<p>A complete page with every required part: skip link, banner, header, content, footer and phone tab bar. Change the name, sections and content to your own.</p>
<pre class="docs-code" tabindex="0" aria-label="Starter page HTML"><code>${esc(starter)}</code></pre>
<h2>4. Add your theme</h2>
<p>Keep the default, or add your institution's theme after the stylesheet:</p>
<pre class="docs-code" tabindex="0" aria-label="Theme stylesheet"><code>&lt;link rel="stylesheet" href="ggds/ggds.min.css"&gt;
&lt;link rel="stylesheet" href="ggds/themes/nca.css"&gt;</code></pre>
<p>See <a href="themes.html">Themes</a> for every ready-made theme, and how to make one from your own colour.</p>
<h2>Use it as a package</h2>
<p>In a project that uses npm, pnpm or another package manager:</p>
<pre class="docs-code" tabindex="0" aria-label="Install command"><code>npm install @ggds/css @ggds/js
npm install @ggds/themes   # for an institution theme</code></pre>
<p>Load everything, or only the components you use, which keeps pages lighter:</p>
<pre class="docs-code" tabindex="0" aria-label="Stylesheet imports"><code>@import "@ggds/css/ggds.css";              /* everything */

/* or only what you use: */
@import "@ggds/css/core.css";              /* tokens and base styles */
@import "@ggds/css/components/header.css"; /* then one file per component */
@import "@ggds/css/components/footer.css";</code></pre>
<p>Start the optional script once: <code>import { initAll } from '@ggds/js'; initAll();</code></p>
<h2>Use it with Astro</h2>
<p>Install <code>@ggds/astro</code> as well. It has the page parts as Astro components, with the same HTML as these pages: <code>SkipLink</code>, <code>Banner</code>, <code>Header</code>, <code>Hero</code>, <code>Footer</code> and <code>TabBar</code>.</p>
<pre class="docs-code" tabindex="0" aria-label="Astro example"><code>---
import Header from '@ggds/astro/Header.astro';
---
&lt;Header name="Example Agency" initials="EA"
  nav={[{ label: 'Services', href: '/services/' }]} /&gt;</code></pre>
<p>The shared MoCDTI agency platform uses GGDS this way.</p>
<h2 id="django">Use it with Django</h2>
<p>Install <code>ggds-django</code> (from <code>packages/django</code> in your local copy: <code>pip install -e ggds/packages/django</code>). It works with Wagtail and other Django-based content management systems.</p>
<pre class="docs-code" tabindex="0" aria-label="Django settings"><code>INSTALLED_APPS = [..., "django.contrib.staticfiles", "ggds_django"]
FORM_RENDERER = "ggds_django.forms.GGDSFormRenderer"</code></pre>
<p>Then <code>{{ form }}</code> renders every form in GGDS markup, with an error summary and each field's error wired up for screen readers. The page parts are template tags:</p>
<pre class="docs-code" tabindex="0" aria-label="Django template"><code>{% load ggds %}
{% ggds_assets theme="nca" %}
{% ggds_banner short_name="NCA" host="nca.org.gh" official=True %}
{% ggds_header name="National Communications Authority" nav=nav %}
{% ggds_pagination page_obj %}
{% ggds_footer name="National Communications Authority" sections=sections links=links %}</code></pre>
<p>For Django admin in GGDS colours with your institution's header, add <code>"ggds_django.admin_theme"</code> above <code>"django.contrib.admin"</code> and set <code>GGDS_ADMIN = {"theme": "nca", "name": "National Communications Authority"}</code>. See every tag in <code>packages/django/README.md</code>. <code>pnpm run test:django</code> renders an example site with it at <code>/django/index.html</code>.</p>
<h2>Next steps</h2>
<ul>
<li>Pick the parts you need from <a href="components/index.html">Components</a>. Each page says when to use it and has the HTML to copy.</li>
<li>See whole websites built with GGDS on the <a href="agencies/index.html">example sites</a>.</li>
<li>Check what changed in <a href="changelog.html">What\u2019s new</a>.</li>
</ul>
</div>
${pager(null, { label: 'Foundations', href: 'foundations.html' })}` }));
}

// What's new: CHANGELOG.md, as a page.
{
  const md = readFileSync(join(root, 'CHANGELOG.md'), 'utf8');
  const inline = (t) => esc(t).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  const html = [];
  let list = false;
  for (const line of md.split('\n').slice(1)) {
    if (/^- /.test(line)) { if (!list) { html.push('<ul>'); list = true; } html.push(`<li>${inline(line.slice(2))}</li>`); continue; }
    if (list) { html.push('</ul>'); list = false; }
    if (/^## /.test(line)) html.push(`<h2>${inline(line.slice(3))}</h2>`);
    else if (/^### /.test(line)) html.push(`<h3>${inline(line.slice(4))}</h3>`);
    else if (line.trim()) html.push(`<p>${inline(line)}</p>`);
  }
  if (list) html.push('</ul>');
  writeFileSync(join(site, 'changelog.html'), shell({ title: 'What\u2019s new', depth: 0, body: `<h1>What\u2019s new</h1>\n<div class="ggds-prose">\n${html.join('\n')}\n</div>` }));
}

// Homepage, written last so it can report what the build produced.
{
  const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((f) => (f.isDirectory() ? walk(join(d, f.name)) : [join(d, f.name)]));
  const all = walk(site).filter((f) => f.endsWith('.html'));
  const exampleCount = components.reduce((n, c) => n + c.examples.length, 0);
  const sitePages = all.filter((f) => /[\\/]agencies[\\/]/.test(f)).length;
  const kb = (f) => Math.round(readFileSync(f).length / 1024);
  const jsKb = Math.round(readdirSync(join(site, 'assets', 'js')).filter((f) => f.endsWith('.js')).reduce((n, f) => n + readFileSync(join(site, 'assets', 'js', f)).length, 0) / 1024 * 10) / 10;
  const art = heroArt(themes);
  writeFileSync(join(site, 'assets', 'hero-art.css'), art.css);
  const homeHero = hero({
    art: art.svg,
    purpose: 'The design system for Government of Ghana websites',
    title: 'Build government websites people can trust',
    lede: 'Ready-made styles and page parts, so every government website looks familiar, works on low-cost phones and slow networks, and can be used by everyone.',
    search: { action: 'search.html', label: 'Search the GGDS documentation', placeholder: 'Search, for example: header, form errors, theme' },
    tasksLabel: 'Start here:',
    tasks: [
      { label: 'Get started', href: 'get-started.html' },
      { label: 'Browse components', href: 'components/index.html' },
      { label: 'Choose your theme', href: 'themes.html' },
      { label: 'See example sites', href: 'agencies/index.html' },
    ],
  });
  const cards = [
    ['Get started', 'get-started.html', 'Add GGDS to a website in four steps, with a starter page to copy.'],
    ['Components', 'components/index.html', `${components.length} page parts, each with when to use it, a live example and the HTML.`],
    ['Themes', 'themes.html', 'Give your website your institution\u2019s colour, in the same places on every site.'],
    ['Example sites', 'agencies/index.html', `Twelve government websites built with GGDS: ${sitePages} pages.`],
  ].map(([t, h, b]) => `
  <li class="ggds-card"><h3 class="ggds-card__title"><a class="ggds-card__link" href="${h}">${t}</a></h3><p class="ggds-card__body">${b}</p></li>`).join('');
  writeFileSync(join(site, 'index.html'), shell({ title: 'Home', depth: 0, lead: homeHero, extraCss: ['assets/hero-art.css'], body: `
<section class="docs-home-section" aria-labelledby="sections-h">
<h2 id="sections-h">What is in GGDS</h2>
<ul class="ggds-card-grid ggds-card-grid--4">${cards}
</ul>
</section>
<section class="docs-home-section docs-proof" aria-labelledby="proof-h">
<h2 id="proof-h">This website is the proof</h2>
<p class="ggds-measure">Everything you see here is built only with GGDS, under the same rules every government website using it gets.</p>
<ul class="docs-proof__list">
  <li><strong>${components.length}</strong> components and <strong>${exampleCount}</strong> live examples</li>
  <li><strong>${all.length + 1}</strong> pages built, including <strong>${sitePages}</strong> on the example sites</li>
  <li><strong>${kb(join(site, 'assets', 'ggds.css'))} KB</strong> of CSS and <strong>${jsKb} KB</strong> of JavaScript for all of it</li>
  <li><strong>0</strong> inline scripts or styles: it runs under a strict Content Security Policy</li>
</ul>
<ul class="ggds-measure">
<li>Every page works without JavaScript.</li>
<li>Every kind of page is checked for accessibility (WCAG 2.2 AA rules) at phone and desktop widths, each time the tests run.</li>
<li>No page scrolls sideways on a 320px screen.</li>
<li>Every colour pair is measured. The build stops if one is too faint to read.</li>
</ul>
</section>
<section class="docs-home-section" aria-labelledby="licence">
<h2 id="licence">Licence</h2>
<p class="ggds-measure">You may use, change and share GGDS code under the Apache-2.0 licence. The national flag, the coat of arms and institutions\u2019 logos are not part of the licence.</p>
</section>` }));
}

// Search: an index of the documentation, a page that searches it with a small script, and an A to Z of every
// page for browsers without JavaScript. The example sites' own pages are left out: they are placeholders.
{
  const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((f) => (f.isDirectory() ? walk(join(d, f.name)) : [join(d, f.name)]));
  const text = (h) => h.replace(/<(script|style|nav|header|footer)[\s\S]*?<\/\1>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&rsquo;/g, '\u2019').replace(/\s+/g, ' ').trim();
  const docs = walk(site).filter((f) => f.endsWith('.html') && !/[\\/](examples|agencies[\\/][a-z0-9-]+[\\/])/.test(f) && !/[\\/]agencies[\\/](?!index)[a-z0-9-]+\.html$/.test(f))
    .map((f) => {
      const html = readFileSync(f, 'utf8');
      const url = f.slice(site.length + 1).split('\\').join('/');
      const main = html.match(/<main[^>]*>([\s\S]*)<\/main>/)?.[1] ?? '';
      const title = (html.match(/<title>([^<]*)<\/title>/)?.[1] ?? url).replace(/ \| GGDS$/, '').replace(/&amp;/g, '&');
      const section = url.startsWith('components/') ? 'Components' : url.startsWith('agencies/') ? 'Example sites' : 'Guidance';
      return { url, title: title === 'Home' ? 'Home' : title, section, headings: [...main.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)].map((m) => text(m[1])), text: text(main).slice(0, 4000) };
    })
    .sort((a, b) => a.title.localeCompare(b.title));
  docs.push({ url: 'search.html', title: 'Search', section: 'Guidance', headings: [], text: 'Search the GGDS documentation.' });
  writeFileSync(join(site, 'assets', 'search-index.json'), JSON.stringify(docs));
  const az = docs.filter((d) => d.url !== 'search.html').map((d) => `<li><a href="${d.url}">${esc(d.title)}</a> <span class="docs-search__section">${d.section}</span></li>`).join('\n');
  writeFileSync(join(site, 'search.html'), shell({ title: 'Search', depth: 0, scripts: ['assets/search.js'], body: `
<h1>Search</h1>
<form class="docs-search" action="search.html" method="get" role="search">
  <label class="ggds-label" for="search-q">Search the GGDS documentation</label>
  <div class="docs-example-search__row">
    <input class="ggds-input" id="search-q" name="q" type="search" enterkeyhint="search" autocomplete="off">
    <button class="ggds-button" type="submit">Search</button>
  </div>
</form>
<p class="docs-search__status" id="search-status" role="status"></p>
<ol class="docs-search__results" id="search-results" hidden></ol>
<div id="search-all">
<h2>Every page, A to Z</h2>
<ul class="docs-search__az">
${az}
</ul>
</div>` }));
}

for (const f of ['docs.js', 'search.js']) copyFileSync(join(root, 'docs', f), join(site, 'assets', f));
