// Builds the GGDS documentation site into site/: component pages with live examples, every example as its own
// page (what the browser tests check), foundations, and the example sites. The site uses GGDS itself and
// runs under a strict CSP: no inline scripts, styles or style attributes. No dependencies.
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { loadAgencies, platformDir, writeAgencyPages } from './agencies.mjs';
import { contrast, cssName, flatten, loadTokens, resolveAll } from '../packages/tokens/lib.mjs';
import { DEFAULT_THEME, themes } from '../packages/themes/index.mjs';
import { drift } from '../packages/themes/sync.mjs';
import { esc, footer, header, hero, icon } from './parts.mjs';
import { ICONS } from '../packages/astro/icons.mjs';
import { heroArt } from './hero-art.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const site = join(root, 'site');
const componentsDir = join(root, 'packages', 'html', 'components');
// Where people get GGDS: the version they download, and the repository with its releases page.
const { version } = JSON.parse(readFileSync(join(root, 'packages', 'css', 'package.json'), 'utf8'));
const repo = 'https://github.com/ghana-gds/ggds';

// Example sites are built from the MoCDTI platform's settings (GGDS_PLATFORM_DIR). Without the platform, as in CI
// and on the published documentation, they are left out, and so is every link to them: the published site never
// shows mock-ups of real institutions' websites while the wording that marks them as examples awaits approval (D-03).
const { agencies, dir } = await loadAgencies(root);
const EXAMPLES = agencies.length > 0;
/** html when the example sites are built, nothing otherwise. */
const ifExamples = (html) => (EXAMPLES ? html : '');
/** Guidance text: keeps or removes the parts marked <!-- examples -->…<!-- /examples -->. */
const forExamples = (html) => html.replace(/<!-- examples -->([\s\S]*?)<!-- \/examples -->/g, (_, inner) => ifExamples(inner));

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
function shell({ title, depth, body, extraCss = [], bare = false, current = '', lead, noindex = false, toc = false, scripts = [], feedback = {} }) {
  const base = '../'.repeat(depth);
  const css = [`${base}assets/ggds.css`, `${base}assets/docs.css`, ...extraCss].map((h) => `<link rel="stylesheet" href="${h}">`).join('\n  ');
  const docsNav = [
    { label: 'Get started', href: `${base}get-started.html` },
    { label: 'Foundations', href: `${base}foundations.html` },
    { label: 'Themes', href: `${base}themes.html` },
    { label: 'Components', href: `${base}components/index.html` },
    { label: 'Patterns', href: `${base}patterns/index.html` },
    ...(EXAMPLES ? [{ label: 'Example sites', href: `${base}agencies/index.html` }] : []),
  ];
  const content = bare ? body : `<a class="ggds-skip-link" href="#main">Skip to main content</a>
<div class="docs-draft"><p class="ggds-container"><strong>Draft, version 0.1.1.</strong> GGDS v1 will be NITA guidance, recommended for government websites. It has not had its accessibility audit yet.</p></div>
${header({ name: 'Ghana Government Design System', country: 'Design system for Government of Ghana websites', logo: '<span class="ggds-header__monogram" aria-hidden="true">GGDS</span>', nav: docsNav, current: docsNav.find((n) => n.label === current)?.href, navId: 'docs-nav', home: `${base}index.html`, search: `${base}search.html` })}
<main id="main" tabindex="-1">
${lead ?? ''}<div class="ggds-main ggds-container">
${toc ? withContents(body) : body}
</div>
<div class="ggds-container docs-feedback">
<p>Something wrong, unclear or missing? <a href="${repo}/issues/new?title=${encodeURIComponent(feedback.title ?? `${title}: `)}">Report a problem with this page</a>${feedback.source ? ` or <a href="${repo}/edit/main/${feedback.source}">suggest a change to it on GitHub</a>` : ''}. You need a GitHub account.</p>
</div>
</main>
${footer({
  name: 'Ghana Government Design System',
  logo: '<span class="ggds-header__monogram" aria-hidden="true">GGDS</span>',
  purpose: 'Ready-made styles and page parts for Government of Ghana websites, looked after by NITA.',
  sections: [
    { label: 'Design system', href: `${base}index.html`, links: [{ label: 'Get started', href: `${base}get-started.html` }, { label: 'For developers', href: `${base}get-started/developers.html` }, { label: 'For designers', href: `${base}get-started/designers.html` }, { label: 'Foundations', href: `${base}foundations.html` }, { label: 'Themes', href: `${base}themes.html` }] },
    { label: 'Components', href: `${base}components/index.html`, links: [...GROUPS.map((g) => ({ label: g, href: `${base}components/index.html#${slugify(g)}` })), { label: 'Patterns', href: `${base}patterns/index.html` }] },
    EXAMPLES
      ? { label: 'Examples', href: `${base}agencies/index.html`, links: [{ label: 'Example sites', href: `${base}agencies/index.html` }, { label: 'Register of government websites', href: `${base}register.html` }] }
      : { label: 'Government websites', href: `${base}register.html`, links: [{ label: 'Register of government websites', href: `${base}register.html` }] },
    { label: 'About GGDS', href: `${base}changelog.html`, links: [{ label: 'What\u2019s new', href: `${base}changelog.html` }, { label: 'Contribute', href: `${base}contribute.html` }, { label: 'Versions and support', href: `${base}versions.html` }, { label: 'Accessibility statement', href: `${base}accessibility.html` }, { label: 'Search', href: `${base}search.html` }] },
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
    const label = tag === 'form' ? (/role="search"/.test(before + after) ? 'Search results' : 'The next page of the form') : (text.replace(/ – home$/, '') || 'Home');
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, file), shell({ title: `${label} (example link)`, depth: c.slug.split('/').length + 2, bare: true, body: `<main class="ggds-main ggds-container" id="main" tabindex="-1">
<h1>${esc(label)}</h1>
<div class="ggds-notice"><p class="ggds-notice__title"><span class="ggds-visually-hidden">Information:</span> You followed a link in an example</p>
<p>On a real website this opens <code>${esc(address)}</code>. In the documentation it comes here instead.</p></div>
<p><a href="../${e.file}">Back to the example</a></p>
</main>` }));
    return `<${tag}${before} ${attr}="links/${file}"${after}>${inside}</${tag}>`;
  });
}

// Components
const loadParts = (dir) => readdirSync(join(dir, 'examples')).filter((f) => f.endsWith('.html')).sort().map((f) => {
  const e = meta(readFileSync(join(dir, 'examples', f), 'utf8'));
  return { file: f, slug: f.replace(/\.html$/, ''), title: e.data.title ?? f, layout: e.data.layout ?? 'main', height: Number(e.data.height ?? 300), themes: e.data.themes === 'true', states: e.data.states === 'true', body: e.body.trim() };
});
const components = readdirSync(componentsDir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => {
  const dir = join(componentsDir, d.name);
  const g = meta(readFileSync(join(dir, 'guidance.html'), 'utf8'));
  const refFile = join(dir, 'component.json');
  if (!existsSync(refFile)) throw new Error(`${d.name}: component.json is missing (its stylesheet, classes, frameworks and tests)`);
  const group = g.data.group ?? 'Content';
  if (!GROUPS.includes(group)) throw new Error(`${d.name}: unknown group "${group}"`);
  return { slug: d.name, name: g.data.name ?? d.name, status: g.data.status ?? 'beta', order: Number(g.data.order ?? 99), group, summary: g.data.summary ?? '',
    related: (g.data.related ?? '').split(',').map((r) => r.trim()).filter(Boolean), guidance: g.body, examples: loadParts(dir), ref: JSON.parse(readFileSync(refFile, 'utf8')) };
}).sort((a, b) => GROUPS.indexOf(a.group) - GROUPS.indexOf(b.group) || a.order - b.order);
for (const c of components) for (const r of c.related) if (!components.some((x) => x.slug === r)) throw new Error(`${c.slug}: related component "${r}" does not exist`);

// What the status tags mean (the components overview explains them; every component page links there).
const STATUS = {
  stable: ['ggds-tag--success', 'Used on live government websites and not expected to change. Any change is listed below and in What’s new.'],
  beta: ['ggds-tag--info', 'Works and is tested, and is used on the MoCDTI platform. It may still change before version 1.0, after research or the accessibility audit.'],
};

// The changelog, by version. A line ending in <!-- components: header, hero --> is listed on those components'
// pages too; GitHub and the What's new page do not show the marker.
const changelog = [];
{
  let v = '';
  for (const line of readFileSync(join(root, 'CHANGELOG.md'), 'utf8').split('\n')) {
    const h = line.match(/^## (?:Version (\S+)|(Unreleased))/);
    if (h) v = h[1] ?? h[2];
    else if (v && /^- /.test(line)) {
      const m = line.match(/\s*<!--\s*components:\s*([^>]*?)\s*-->\s*$/);
      changelog.push({ version: v, text: line.slice(2).replace(/\s*<!--[\s\S]*?-->\s*$/, ''), components: m ? m[1].split(',').map((x) => x.trim()) : [] });
    }
  }
}
const firstVersion = changelog.at(-1)?.version ?? version;
const mdInline = (t) => esc(t).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\[([^\]]+)\]\((https:\/\/[^)\s]+)\)/g, '<a href="$2">$1</a>');
const changesFor = (slug) => changelog.filter((c) => c.components.includes(slug));

// Accessibility tests. Automated: run on every change by CI (pnpm test); a failure stops the change. Manual: the
// checks the external audit (D-09) makes; a component.json "manual" entry records a result once it is done.
const behaviourSpec = readFileSync(join(root, 'tests', 'browser', 'behaviour.spec.ts'), 'utf8');
const AUTOMATED = [
  'WCAG 2.2 A and AA rules (axe), at desktop and phone widths, on every example',
  'No sideways scrolling on a 320px screen, also with a wide font, on every example',
  'Every approved colour pair meets its contrast minimum, for every institution theme',
  'No inline scripts or styles, so it runs under a strict Content Security Policy',
];
const MANUAL = [
  ['keyboard', 'Keyboard only'],
  ['nvda', 'NVDA screen reader with Firefox or Chrome (Windows)'],
  ['jaws', 'JAWS screen reader with Chrome (Windows)'],
  ['voiceover', 'VoiceOver screen reader with Safari (iPhone)'],
  ['talkback', 'TalkBack screen reader with Chrome (Android)'],
  ['zoom', 'Zoom to 400%, and increased text spacing'],
  ['forced-colours', 'Windows contrast themes (forced colours)'],
  ['voice', 'Voice control (Voice Access or Dragon)'],
];
const RESULTS = { pass: ['ggds-tag--success', 'Passed'], issues: ['ggds-tag--warning', 'Passed with issues'], fail: ['ggds-tag--danger', 'Failed'] };

function accessibilityTests(c) {
  for (const t of c.ref.tests) if (!behaviourSpec.includes(`test('${t}'`) && !behaviourSpec.includes(`test(\`${t}\``)) throw new Error(`${c.slug}: component.json names a test that does not exist: "${t}"`);
  const auto = [...AUTOMATED, ...c.ref.tests.map((t) => `Behaviour test: “${t}”`)];
  const manual = MANUAL.map(([key, label]) => {
    const r = c.ref.manual?.[key];
    const [cls, word] = r ? RESULTS[r.result] ?? ['', r.result] : ['', 'Not tested yet'];
    return `<tr><th scope="row">${esc(label)}</th><td><strong class="ggds-tag ${cls}">${word}</strong></td><td>${r ? esc([r.date, r.by, r.notes].filter(Boolean).join('. ')) : 'Waiting for the external audit with disabled people (decision D-09).'}</td></tr>`;
  }).join('\n');
  const done = MANUAL.filter(([key]) => c.ref.manual?.[key]).length;
  return { done, html: `<h2 id="accessibility-tests">Accessibility tests</h2>
<h3>Automated, on every change</h3>
<p>These run each time GGDS changes. A change that fails one is not accepted.</p>
<ul>${auto.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
<h3>By people, with assistive technology</h3>
<p>${done ? `${done} of ${MANUAL.length} checks done.` : 'Automated tests find only some of the barriers people meet. These checks are still to be done.'}</p>
<div class="ggds-table-wrap" role="region" tabindex="0" aria-labelledby="manual-caption-${c.slug}">
<table class="ggds-table">
<caption class="ggds-table__caption" id="manual-caption-${c.slug}">Manual accessibility checks for ${esc(c.name.toLowerCase())}</caption>
<thead><tr><th scope="col">Check</th><th scope="col">Result</th><th scope="col">Notes</th></tr></thead>
<tbody>
${manual}
</tbody>
</table>
</div>` };
}

// Sizes of the stylesheets a site can load one by one.
const gz = (file) => `${(gzipSync(readFileSync(file)).length / 1024).toFixed(1)} KB`;
const cssDist = join(root, 'packages', 'css', 'dist');
const djangoTags = readFileSync(join(root, 'packages', 'django', 'src', 'ggds_django', 'templatetags', 'ggds.py'), 'utf8');
const astroDir = join(root, 'packages', 'astro', 'src');

function useIt(c) {
  const r = c.ref;
  const css = r.css
    ? `<code>ggds.css</code> includes it. To load only the parts you use: <code>core.css</code>, then <code>components/${r.css}.css</code> (${gz(join(cssDist, 'components', `${r.css}.min.css`))} with gzip, minified)${['navigation', 'field'].includes(r.css) ? `, which also holds ${r.css === 'navigation' ? 'breadcrumbs, pagination and tab links' : 'text inputs, radios and checkboxes'}` : ''}.`
    : `<code>core.css</code> (${gz(join(cssDist, 'core.min.css'))} with gzip, minified): the tokens and the layout helpers below.`;
  const astroNames = [...new Set((r.astro ?? '').match(/<([A-Z][A-Za-z]+)/g)?.map((m) => m.slice(1)) ?? [])];
  for (const n of astroNames) if (!existsSync(join(astroDir, `${n}.astro`))) throw new Error(`${c.slug}: Astro component ${n} does not exist`);
  for (const t of (r.django ?? '').match(/{%\s*(ggds_[a-z_]+)/g) ?? []) {
    const tag = t.replace(/{%\s*/, '');
    if (!new RegExp(`def ${tag}\\(`).test(djangoTags)) throw new Error(`${c.slug}: Django tag ${tag} does not exist`);
  }
  const code = (label, text) => `<pre class="docs-code" tabindex="0" aria-label="${esc(label)}"><code>${esc(text)}</code></pre>`;
  return `<h2 id="use-it">Use it</h2>
<dl class="docs-facts">
  <dt>Stylesheet</dt><dd>${css}</dd>
  <dt>JavaScript</dt><dd>${r.javascript ? esc(r.javascript) : 'None needed.'}</dd>
</dl>
<h3>HTML</h3>
<p>Copy the HTML under each example above. It works in any website.</p>
<h3>Astro</h3>
${r.astro ? `<p>With <code>@ggds/astro</code>:</p>\n${code(`Astro for ${c.name}`, `${astroNames.map((n) => `import ${n} from '@ggds/astro/${n}.astro';`).join('\n')}\n\n${r.astro}`)}` : '<p>No Astro component: copy the HTML.</p>'}
<h3>Django</h3>
${r.django ? `<p>With <code>ggds-django</code> (<code>{% load ggds %}</code>):</p>\n${code(`Django for ${c.name}`, r.django)}` : '<p>No template tag: copy the HTML into your template.</p>'}`;
}

function reference(c) {
  const rows = (list) => list.map(([k, v]) => `<tr><th scope="row"><code>${esc(k)}</code></th><td>${esc(v)}</td></tr>`).join('\n');
  const table = (id, caption, head, list) => `<div class="ggds-table-wrap" role="region" tabindex="0" aria-labelledby="${id}">
<table class="ggds-table">
<caption class="ggds-table__caption" id="${id}">${caption}</caption>
<thead><tr><th scope="col">${head}</th><th scope="col">What it does</th></tr></thead>
<tbody>
${rows(list)}
</tbody>
</table>
</div>`;
  return `<h2 id="classes">Classes and states</h2>
${table(`classes-${c.slug}`, `Classes for ${esc(c.name.toLowerCase())}`, 'Class', c.ref.classes)}
${c.ref.states.length ? table(`states-${c.slug}`, `States of ${esc(c.name.toLowerCase())}`, 'State', c.ref.states) : ''}`;
}

const heights = new Set();
const sidenav = (current) => `<nav class="docs-sidenav" aria-label="Components">
  <p class="docs-sidenav__all"><a href="index.html">All components</a></p>
  ${GROUPS.map((g) => `<p class="docs-sidenav__group">${g}</p>
  <ul class="docs-sidenav__list">
    ${components.filter((c) => c.group === g).map((c) => `<li><a class="docs-sidenav__link" href="${c.slug}.html"${c.slug === current ? ' aria-current="page"' : ''}>${esc(c.name)}</a></li>`).join('\n    ')}
  </ul>`).join('\n  ')}
</nav>`;

/** Writes each example as its own page under site/examples/<dir>/ and returns the example sections. */
function examplePages(owner, dir, depthPrefix) {
  mkdirSync(join(site, 'examples', dir), { recursive: true });
  return owner.examples.map((e) => {
    heights.add(e.height);
    const linked = exampleLinks({ slug: dir }, e);
    const body = e.layout === 'bare' ? linked : `<main class="ggds-main ggds-container" id="main" tabindex="-1">\n${linked}\n</main>`;
    const depth = dir.split('/').length + 1;
    writeFileSync(join(site, 'examples', dir, e.file), shell({ title: `${owner.name}: ${e.title}`, depth, body, bare: true, extraCss: e.themes ? [`${'../'.repeat(depth)}assets/themes/themes.css`] : [] }));
    // A states example draws focus without a keyboard (docs-state-focus); the HTML to copy leaves that class out.
    const shown = e.states ? e.body.replace(/ docs-state-focus/g, '').replace(/<p class="docs-state-label">[^<]*<\/p>\n/g, '') : e.body;
    return `
<section class="docs-example" aria-labelledby="ex-${e.slug}">
  <h2 class="docs-example__title" id="ex-${e.slug}">Example: ${esc(e.title)}</h2>
  <iframe class="docs-frame docs-frame--h${e.height}" src="${depthPrefix}examples/${dir}/${e.file}" title="Example: ${esc(e.title)}" loading="lazy"></iframe>
  <p><a href="${depthPrefix}examples/${dir}/${e.file}">Open this example on its own page</a></p>
  <details class="ggds-disclosure">
    <summary class="ggds-disclosure__summary">HTML</summary>
    <div class="ggds-disclosure__content"><pre class="docs-code" tabindex="0" aria-label="HTML for ${esc(e.title)}"><code>${esc(shown)}</code></pre></div>
  </details>
</section>`;
  }).join('');
}

const cards = (list, href) => `<ul class="ggds-card-grid">${list.map((r) => `
    <li class="ggds-card"><h3 class="ggds-card__title"><a class="ggds-card__link" href="${href(r)}">${esc(r.name)}</a></h3><p class="ggds-card__body">${esc(r.summary)}</p></li>`).join('')}
  </ul>`;

for (const x of changelog) for (const slug of x.components) if (!components.some((c) => c.slug === slug)) throw new Error(`CHANGELOG.md tags an unknown component: "${slug}"`);
for (const c of components) {
  const [tag] = STATUS[c.status] ?? [''];
  const examples = examplePages(c, c.slug, '../');
  const tests = accessibilityTests(c);
  const changes = changesFor(c.slug);
  const i = components.indexOf(c);
  const near = (x) => x && { label: x.name, href: `${x.slug}.html` };
  const related = c.related.map((r) => components.find((x) => x.slug === r));
  const body = `<div class="docs-layout">
${sidenav(c.slug)}
<div class="docs-content">
  <p class="docs-kicker">${esc(c.group)}</p>
  <h1>${esc(c.name)}</h1>
  <ul class="docs-badges">
    <li><a href="index.html#status"><strong class="ggds-tag ${tag}">${esc(c.status)}</strong></a></li>
    <li><a href="#accessibility-tests"><strong class="ggds-tag ggds-tag--success">Automated accessibility tests: on every change</strong></a></li>
    <li><a href="#accessibility-tests"><strong class="ggds-tag ${tests.done === MANUAL.length ? 'ggds-tag--success' : 'ggds-tag--warning'}">Checks by people: ${tests.done} of ${MANUAL.length} done</strong></a></li>
  </ul>
  ${withContents(`<div class="docs-guidance">${c.guidance}</div>
  ${examples}
  ${useIt(c)}
  ${reference(c)}
  ${tests.html}
  <h2 id="changes">Changes</h2>
  ${changes.length ? `<div class="ggds-table-wrap" role="region" tabindex="0" aria-labelledby="changes-caption">
<table class="ggds-table">
<caption class="ggds-table__caption" id="changes-caption">Changes to ${esc(c.name.toLowerCase())}, newest first</caption>
<thead><tr><th scope="col">Version</th><th scope="col">Change</th></tr></thead>
<tbody>
${changes.map((x) => `<tr><td>${esc(x.version)}</td><td>${mdInline(x.text)}</td></tr>`).join('\n')}
<tr><td>${esc(firstVersion)}</td><td>Added.</td></tr>
</tbody>
</table>
</div>` : `<p>Added in version ${esc(firstVersion)}. No changes since.</p>`}
  <p><a href="../changelog.html">Every change, in What’s new</a></p>
  ${related.length ? `<h2>Related components</h2>\n  ${cards(related, (r) => `${r.slug}.html`)}` : ''}`)}
  ${pager(near(components[i - 1]), near(components[i + 1]))}
</div>
</div>`;
  mkdirSync(join(site, 'components'), { recursive: true });
  writeFileSync(join(site, 'components', `${c.slug}.html`), shell({ title: c.name, depth: 1, body, current: 'Components',
    feedback: { title: `${c.name}: `, source: `packages/html/components/${c.slug}/guidance.html` } }));
}

// Components overview, by group, and what each status means.
{
  const groups = GROUPS.map((g) => `<h2 id="${slugify(g)}">${g}</h2>
${cards(components.filter((c) => c.group === g), (c) => `${c.slug}.html`)}`).join('\n');
  writeFileSync(join(site, 'components', 'index.html'), shell({ title: 'Components', depth: 1, current: 'Components', body: `
<h1>Components</h1>
<p class="ggds-lead ggds-measure">The parts you build pages from. Each page says when to use it, when not to, and how, with live examples, the HTML to copy, the Astro and Django versions, its classes, its accessibility tests and its changes.</p>
${groups}
<h2 id="status">What the status means</h2>
<dl class="docs-facts">
${Object.entries(STATUS).map(([s, [cls, text]]) => `  <dt><strong class="ggds-tag ${cls}">${s}</strong></dt><dd>${esc(text)}</dd>`).join('\n')}
</dl>
<p>Every component is tested automatically on every change. None has had its checks by people yet: they come with the external accessibility audit before version 1.0.</p>
${pager({ label: 'Themes', href: '../themes.html' }, { label: 'Patterns', href: '../patterns/index.html' })}` }));
}

// Patterns: whole tasks, put together from components, with live examples.
const patternsDir = join(root, 'packages', 'html', 'patterns');
const patterns = readdirSync(patternsDir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => {
  const dir = join(patternsDir, d.name);
  const g = meta(readFileSync(join(dir, 'guidance.html'), 'utf8'));
  const uses = (g.data.components ?? '').split(',').map((r) => r.trim()).filter(Boolean);
  for (const u of uses) if (!components.some((x) => x.slug === u)) throw new Error(`pattern ${d.name}: component "${u}" does not exist`);
  return { slug: d.name, name: g.data.name ?? d.name, order: Number(g.data.order ?? 99), summary: g.data.summary ?? '', uses, guidance: g.body, examples: loadParts(dir) };
}).sort((a, b) => a.order - b.order);
mkdirSync(join(site, 'patterns'), { recursive: true });
for (const p of patterns) {
  const i = patterns.indexOf(p);
  const near = (x) => x && { label: x.name, href: `${x.slug}.html` };
  const examples = examplePages(p, `patterns/${p.slug}`, '../');
  const body = `<p class="docs-kicker">Pattern</p>
<h1>${esc(p.name)}</h1>
${withContents(`<div class="docs-guidance">${p.guidance}</div>
${examples}
<h2>Components used</h2>
${cards(p.uses.map((u) => components.find((x) => x.slug === u)), (r) => `../components/${r.slug}.html`)}`)}
${pager(near(patterns[i - 1]) ?? { label: 'All patterns', href: 'index.html' }, near(patterns[i + 1]) ?? (EXAMPLES ? { label: 'Example sites', href: '../agencies/index.html' } : null))}`;
  writeFileSync(join(site, 'patterns', `${p.slug}.html`), shell({ title: p.name, depth: 1, body, current: 'Patterns',
    feedback: { title: `Pattern, ${p.name}: `, source: `packages/html/patterns/${p.slug}/guidance.html` } }));
}
writeFileSync(join(site, 'patterns', 'index.html'), shell({ title: 'Patterns', depth: 1, current: 'Patterns', body: `
<h1>Patterns</h1>
<p class="ggds-lead ggds-measure">Whole tasks people do on government websites, put together from GGDS components: what to do on each page, and why.</p>
${cards(patterns, (p) => `${p.slug}.html`)}
${ifExamples('<p class="ggds-measure">The <a href="../agencies/index.html">example sites</a> show these patterns in complete websites.</p>')}
${pager({ label: 'Components', href: '../components/index.html' }, EXAMPLES ? { label: 'Example sites', href: '../agencies/index.html' } : null)}` }));

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
// Token tables for the other foundations, straight from tokens.json, with a visual sample where one helps.
const byPrefix = (prefix) => [...tokens.values()].filter((t) => `${t.path.join('.')}.`.startsWith(`${prefix}.`));
const tokClass = (t) => `docs-tok--${t.path.join('-')}`;
const SAMPLE_CSS = { space: 'inline-size', radius: 'border-radius', shadow: 'box-shadow' };
const tokenCss = Object.entries(SAMPLE_CSS).flatMap(([prefix, prop]) => byPrefix(prefix).map((t) => `.${tokClass(t)} { ${prop}: var(${cssName(t.path)}); }`));
const tokenTable = (id, caption, prefixes, sample) => `<div class="ggds-table-wrap" role="region" aria-labelledby="${id}" tabindex="0"><table class="ggds-table">
<caption class="ggds-table__caption" id="${id}">${caption}</caption>
<thead><tr>${sample ? '<th scope="col">Sample</th>' : ''}<th scope="col">Token</th><th scope="col">Value</th><th scope="col">Use</th></tr></thead>
<tbody>${prefixes.flatMap(byPrefix).map((t) => `<tr>${sample ? `<td><span class="docs-sample docs-sample--${sample} ${tokClass(t)}" aria-hidden="true"></span></td>` : ''}<th scope="row"><code>${cssName(t.path)}</code></th><td><code>${esc(String(t.resolved))}</code></td><td>${esc(t.description ?? '')}</td></tr>`).join('\n')}</tbody></table></div>`;
const iconList = `<ul class="docs-icons">${Object.keys(ICONS).map((n) => `<li class="docs-icons__item">${icon(n, 'docs-icons__svg')}<code>${n}</code></li>`).join('')}</ul>`;
const typeRows = ['3xl', '2xl', 'xl', 'lg', 'base', 'sm', 'xs'].map((s) => `<p class="docs-type-sample docs-type--${s}">Font size ${s}: Apply for a licence</p>`).join('\n');
const typeCss = ['3xl', '2xl', 'xl', 'lg', 'base', 'sm', 'xs'].map((s) => `.docs-type--${s} { font-size: var(--ggds-font-size-${s}); }`);
writeFileSync(join(site, 'foundations.html'), shell({ title: 'Foundations', depth: 0, current: 'Foundations', toc: true, body: `
<h1>Foundations</h1>
<p class="ggds-lead ggds-measure">The colours, text, spacing, layout, sizes, motion and icons that every GGDS component uses. They are called design tokens: named values such as <code>--ggds-color-link</code>, so a website never has to repeat a colour code.</p>
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
<ul class="ggds-measure">
<li>Body text is 17px (<code>--ggds-font-size-base</code>), larger than most websites, because many people read on small phones in bright light. Do not set body text smaller.</li>
<li>The two largest sizes grow with the screen, so headings fit a 320px phone without breaking words.</li>
<li>Use two weights only: regular for text, bold for headings and emphasis. Lines of text are at most 68 characters wide (<code>--ggds-measure</code>, the class <code>ggds-measure</code>).</li>
<li>Sizes are in <code>rem</code>, so they follow the text size people choose on their device.</li>
</ul>
${tokenTable('type-caption', 'Text tokens', ['font', 'line-height', 'measure'])}
<h2>Spacing</h2>
<p class="ggds-measure">One spacing scale for padding, margins and gaps, in steps of 4px. Use the scale, not values in between, so pages line up and keep the same rhythm on every government website.</p>
<ul class="ggds-measure">
<li>Use small steps (1 to 3) inside a component, 4 and 6 between related things, and 8 and above between sections.</li>
<li>Leave more space above a heading than below it, so it belongs to what follows.</li>
</ul>
${tokenTable('space-caption', 'Spacing tokens', ['space'], 'space')}
<h2>Layout</h2>
<p class="ggds-measure">Pages are one column on phones, and gain columns only as the screen allows. Design for a 320px phone first.</p>
<ul class="ggds-measure">
<li><code>ggds-container</code> centres the page, up to 76rem wide, with a side margin (the gutter) that grows from 16px on phones to 32px on large screens, and keeps clear of a phone's notch.</li>
<li><code>ggds-main</code> gives the main content its space above and below. Put it on <code>&lt;main id="main" tabindex="-1"&gt;</code>, the skip link's target.</li>
<li>Use the three breakpoints only. Components change layout at them, and the tests reject any other width in GGDS's CSS.</li>
</ul>
${tokenTable('layout-caption', 'Layout tokens', ['size.gutter', 'size.content-max', 'breakpoint'])}
<h2>Sizes and touch targets</h2>
<p class="ggds-measure">Everything people tap is at least 44px tall: buttons, links in menus, form fields, radios and checkboxes with their labels. That is more than WCAG 2.2 asks (24px), because many people use phones with one hand, on the move.</p>
${tokenTable('size-caption', 'Size tokens', ['size.target', 'size.icon'])}
<h2>Focus</h2>
<p class="ggds-measure">When people use a keyboard, the element they are on has a 3px gold ring with a dark band around it, so it shows on light and dark backgrounds alike. Never remove it. In Windows contrast themes it uses the system's highlight colour.</p>
<h2>Corners and shadows</h2>
<p class="ggds-measure">Small rounded corners, and light shadows only where something sits above the page. Shadows never carry meaning: anything that must be seen also has a border.</p>
${tokenTable('radius-caption', 'Corner tokens', ['radius'], 'radius')}
${tokenTable('shadow-caption', 'Shadow tokens', ['shadow'], 'shadow')}
<h2>Motion</h2>
<p class="ggds-measure">Movement is short and explains a change, such as a menu opening. Nothing flashes. The only thing that moves on its own is the optional hero drawing, and only for people who have not asked for less motion (see the <a href="accessibility.html">accessibility statement</a>).</p>
<ul class="ggds-measure">
<li>Animate only inside <code>@media (prefers-reduced-motion: no-preference)</code>, so people who ask their device for less motion get none.</li>
<li>Use the duration and easing tokens, so movement feels the same everywhere.</li>
<li>Never make people wait for an animation before they can act.</li>
</ul>
${tokenTable('motion-caption', 'Motion tokens', ['motion'])}
<h2>Layers</h2>
<p class="ggds-measure">Named layers for things that sit above the page, so a menu never ends up behind a sticky header. GGDS's CSS uses these names only, never raw numbers.</p>
${tokenTable('layer-caption', 'Layer tokens', ['layer'])}
<h2>Icons</h2>
<p class="ggds-measure">A small set of line icons, drawn on a 24px grid in the colour of the text around them. They are in <code>@ggds/astro/icons.mjs</code> and copied into the HTML of each component that uses them.</p>
<ul class="ggds-measure">
<li>Always put words next to an icon. An icon on its own is guessed differently by different people.</li>
<li>Hide icons from screen readers (<code>aria-hidden="true"</code> and <code>focusable="false"</code>), because the words already say it.</li>
<li>Use the icon size tokens, and the text colour (<code>currentColor</code>), so icons keep their contrast in every theme.</li>
</ul>
${iconList}
${pager({ label: 'Get started as a service owner', href: 'get-started/service-owners.html' }, { label: 'Themes', href: 'themes.html' })}` }));

writeFileSync(join(site, 'assets', 'docs.css'), `${readFileSync(join(root, 'docs', 'docs.css'), 'utf8')}\n/* Generated */\n${[...heights].sort((a, b) => a - b).map((h) => `.docs-frame--h${h} { height: ${h}px; }`).join('\n')}\n${swatchCss.join('\n')}\n${typeCss.join('\n')}\n${pairCss.join('\n')}\n${tokenCss.join('\n')}\n`);

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
${ifExamples('<p>See whole homepages in each theme on the <a href="agencies/index.html">example sites</a>.</p>')}
${pager({ label: 'Foundations', href: 'foundations.html' }, { label: 'Components', href: 'components/index.html' })}` }));

writeFileSync(join(site, 'register.html'), shell({ title: 'Register of government websites', depth: 0, body: `
<h1>Register of official government websites</h1>
<div class="ggds-prose">
<p>The <a href="components/banner.html">government website banner</a> asks people to check a website's address against an official list of government websites.</p>
<p><strong>That list does not exist yet.</strong> Until it does, link the banner to the most official list your institution has, such as your ministry's list of its agencies.</p>
</div>` }));

// About pages: docs/pages/<slug>.html (a meta comment with title and lead, then the body) → site/<slug>.html.
// ${version} and ${repo} in the body are replaced.
for (const f of readdirSync(join(root, 'docs', 'pages')).filter((f) => f.endsWith('.html'))) {
  const slug = f.slice(0, -5);
  const g = meta(readFileSync(join(root, 'docs', 'pages', f), 'utf8'));
  const body = forExamples(g.body).replaceAll('${version}', version).replaceAll('${repo}', repo);
  writeFileSync(join(site, f), shell({ title: g.data.title, depth: 0, feedback: { source: `docs/pages/${f}` }, body: `
<h1>${esc(g.data.title)}</h1>
${g.data.lead ? `<p class="ggds-lead ggds-measure">${esc(g.data.lead)}</p>\n` : ''}${withContents(`<div class="ggds-prose">\n${body}\n</div>`)}` }));
}

// Example sites: real institutions' homepages built with GGDS (needs the MoCDTI platform's settings)
if (EXAMPLES) {
  const index = writeAgencyPages({ siteDir: site, agencies, platformDirectory: dir, shell });
  writeFileSync(join(site, 'agencies', 'index.html'), shell({ title: index.title, depth: 1, body: `${index.body}\n${pager({ label: 'Patterns', href: '../patterns/index.html' }, null)}`, extraCss: index.extraCss, current: 'Example sites', noindex: true }));
  console.log(`docs: ${components.length} components, ${components.reduce((n, c) => n + c.examples.length, 0)} examples, ${themes.length} themes, ${agencies.length} example sites → ${site}`);
} else {
  console.warn(`docs: platform not found at ${platformDir(root)}; example sites skipped (set GGDS_PLATFORM_DIR)`);
}

// Get started: an overview by role, and a guide for each role. Developers' guide is above; the others are
// docs/guides/*.html (a meta comment, then the body; links are relative to get-started/).
const ROLES = [
  ['developers', 'Developers', 'Add GGDS to a website: download or install it, a starter page, Astro and Django.'],
  ['designers', 'Designers', 'Design from GGDS foundations, components and patterns, and test with the people who will use it.'],
  ['content', 'Content designers', 'Write pages people understand the first time, in the style every GGDS website shares.'],
  ['service-owners', 'Service owners', 'What adopting GGDS involves: what every website needs, what to ask suppliers for, and checks before launch.'],
];
function roles(current, base = '') {
  return `<nav class="docs-roles" aria-label="Get started by role">
  <ul class="docs-roles__list">${ROLES.map(([slug, label]) => `<li><a class="docs-roles__link" href="${base}${slug}.html"${slug === current ? ' aria-current="page"' : ''}>${label}</a></li>`).join('')}</ul>
</nav>`;
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
  mkdirSync(join(site, 'get-started'), { recursive: true });
  writeFileSync(join(site, 'get-started', 'developers.html'), shell({ title: 'Get started as a developer', depth: 1, current: 'Get started', body: `
${roles('developers')}
<h1>Get started as a developer</h1>
<p class="ggds-lead ggds-measure">GGDS is plain HTML and CSS, so it works with any website: plain HTML, WordPress, Django, React, or anything else that produces web pages. Install it from npm, download the files, or try it from a CDN.</p>
${withContents(`<div class="ggds-prose">
<h2>Choose how to add it</h2>
<div class="ggds-table-wrap" role="region" aria-labelledby="ways-caption" tabindex="0"><table class="ggds-table">
<caption class="ggds-table__caption" id="ways-caption">Three ways to add GGDS</caption>
<thead><tr><th scope="col">Way</th><th scope="col">Best for</th></tr></thead>
<tbody>
<tr><th scope="row" class="docs-nowrap"><a href="#install-from-npm">npm</a></th><td>Projects with a package manager or build step: Astro, Vite, Next.js, a Django project that bundles its assets</td></tr>
<tr><th scope="row" class="docs-nowrap"><a href="#download-the-files">Download</a></th><td>Websites without build tools: copy one folder in</td></tr>
<tr><th scope="row" class="docs-nowrap"><a href="#try-it-from-a-cdn">CDN</a></th><td>Trying GGDS out and prototypes, not live websites</td></tr>
</tbody></table></div>
<h2 id="install-from-npm">Install from npm</h2>
<p>GGDS is published under the <a href="https://www.npmjs.com/org/ggds"><code>@ggds</code> organisation on npm</a>, with provenance, at version <code>${version}</code>.</p>
<pre class="docs-code" tabindex="0" aria-label="Install command"><code>npm install @ggds/css @ggds/js
npm install @ggds/themes   # for an institution theme</code></pre>
<div class="ggds-table-wrap" role="region" aria-labelledby="packages-caption" tabindex="0"><table class="ggds-table">
<caption class="ggds-table__caption" id="packages-caption">The GGDS packages</caption>
<thead><tr><th scope="col">Package</th><th scope="col">What it is</th></tr></thead>
<tbody>
<tr><th scope="row"><a href="https://www.npmjs.com/package/@ggds/css"><code>@ggds/css</code></a></th><td>All the styles: <code>ggds.css</code>, or <code>core.css</code> and one file per component</td></tr>
<tr><th scope="row"><a href="https://www.npmjs.com/package/@ggds/themes"><code>@ggds/themes</code></a></th><td>The institution themes, one small file each</td></tr>
<tr><th scope="row"><a href="https://www.npmjs.com/package/@ggds/js"><code>@ggds/js</code></a></th><td>The optional script: phone menu and error summary</td></tr>
<tr><th scope="row"><a href="https://www.npmjs.com/package/@ggds/tokens"><code>@ggds/tokens</code></a></th><td>The design tokens as CSS custom properties and JSON, and the theme colour checker</td></tr>
<tr><th scope="row"><a href="https://www.npmjs.com/package/@ggds/astro"><code>@ggds/astro</code></a></th><td>The page parts as Astro components</td></tr>
</tbody></table></div>
<p>Load everything, or only the components you use, which keeps pages lighter. Then add your theme:</p>
<pre class="docs-code" tabindex="0" aria-label="Stylesheet imports"><code>@import "@ggds/css/ggds.css";              /* everything */

/* or only what you use: */
@import "@ggds/css/core.css";              /* tokens and base styles */
@import "@ggds/css/components/header.css"; /* then one file per component */
@import "@ggds/css/components/footer.css";

@import "@ggds/themes/nca.css";            /* your institution's theme, last */</code></pre>
<p>Start the optional script once, in your own script file:</p>
<pre class="docs-code" tabindex="0" aria-label="Script import"><code>import { initAll } from '@ggds/js';
initAll();

// or, to start it on every page without writing code:
import '@ggds/js/auto';</code></pre>
<p>Without a bundler, copy the files you need from <code>node_modules/@ggds/css/dist/</code>, <code>node_modules/@ggds/themes/dist/</code> and <code>node_modules/@ggds/js/dist/</code> into your website\u2019s static files.</p>
<p>Until version 1.0, a new minor version can change components. Keep to one minor version (<code>"@ggds/css": "~${version}"</code>), and read <a href="../changelog.html">What\u2019s new</a> before you update.</p>
<h2 id="download-the-files">Download the files</h2>
<p>Download <code>ggds-${version}.zip</code> from the <a href="${repo}/releases">GGDS releases page</a>. You do not need Node, npm or any build tools. The zip holds one <code>ggds</code> folder: copy it into your website as it is.</p>
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
<h2 id="try-it-from-a-cdn">Try it from a CDN</h2>
<p>The npm packages are also on the jsDelivr CDN, which is quick for trying GGDS out:</p>
<pre class="docs-code" tabindex="0" aria-label="CDN links"><code>&lt;link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@ggds/css@${version}/dist/ggds.min.css"&gt;
&lt;link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@ggds/themes@${version}/dist/nca.css"&gt;
&lt;script type="module" src="https://cdn.jsdelivr.net/npm/@ggds/js@${version}/dist/auto.js"&gt;&lt;/script&gt;</code></pre>
<p>For a live government website, serve the files yourself instead (npm or the download). Then the website does not depend on another company\u2019s service, and a strict Content Security Policy works without allowing another address. If you do use a CDN, always name the exact version, as above, and add an <code>integrity</code> attribute.</p>
<h2>Start from this page</h2>
<p>A complete page with every required part: skip link, banner, header, content, footer and phone tab bar. Change the name, sections and content to your own, and the <code>ggds/</code> paths to where your files are.</p>
<pre class="docs-code" tabindex="0" aria-label="Starter page HTML"><code>${esc(starter)}</code></pre>
<h2>Add your theme</h2>
<p>Keep the default, or add your institution's theme after the stylesheet:</p>
<pre class="docs-code" tabindex="0" aria-label="Theme stylesheet"><code>&lt;link rel="stylesheet" href="ggds/ggds.min.css"&gt;
&lt;link rel="stylesheet" href="ggds/themes/nca.css"&gt;</code></pre>
<p>See <a href="../themes.html">Themes</a> for every ready-made theme, and how to make one from your own colour.</p>
<h2>Use it with Astro</h2>
<p><code>npm install @ggds/astro @ggds/css</code>. It has the page parts as Astro components, with the same HTML as these pages: <code>SkipLink</code>, <code>Banner</code>, <code>Header</code>, <code>Hero</code>, <code>Footer</code> and <code>TabBar</code>.</p>
<pre class="docs-code" tabindex="0" aria-label="Astro example"><code>---
import Header from '@ggds/astro/Header.astro';
---
&lt;Header name="Example Agency" initials="EA"
  nav={[{ label: 'Services', href: '/services/' }]} /&gt;</code></pre>
<p>The shared MoCDTI agency platform uses GGDS this way.</p>
<h2 id="django">Use it with Django</h2>
<p><code>ggds-django</code> is not on PyPI yet. Install it from a copy of the GGDS repository: <code>pip install -e ggds/packages/django</code>. It works with Wagtail and other Django-based content management systems.</p>
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
<li>Pick the parts you need from <a href="../components/index.html">Components</a>. Each page says when to use it and has the HTML to copy.</li>
${ifExamples('<li>See whole websites built with GGDS on the <a href="../agencies/index.html">example sites</a>.</li>')}
<li>Check what changed in <a href="../changelog.html">What\u2019s new</a>.</li>
</ul>
</div>`)}
${pager({ label: 'Get started', href: '../get-started.html' }, { label: 'Get started as a designer', href: 'designers.html' })}` }));
}

{
  const guideDir = join(root, 'docs', 'guides');
  const order = ROLES.map(([slug]) => slug);
  for (const [slug] of ROLES.slice(1)) {
    const g = meta(readFileSync(join(guideDir, `${slug}.html`), 'utf8'));
    const i = order.indexOf(slug);
    const [prevSlug, nextSlug] = [order[i - 1], order[i + 1]];
    const label = (x) => ({ label: `Get started as ${x === 'service-owners' ? 'a service owner' : x === 'content' ? 'a content designer' : `a ${x.slice(0, -1)}`}`, href: `${x}.html` });
    writeFileSync(join(site, 'get-started', `${slug}.html`), shell({ title: g.data.title, depth: 1, current: 'Get started',
      feedback: { source: `docs/guides/${slug}.html` },
      body: `${roles(slug)}\n<h1>${esc(g.data.title)}</h1>\n${withContents(`<div class="ggds-prose">\n${forExamples(g.body).replaceAll('${version}', version)}\n</div>`)}\n${pager(prevSlug ? label(prevSlug) : null, nextSlug ? label(nextSlug) : { label: 'Foundations', href: '../foundations.html' })}` }));
  }
  writeFileSync(join(site, 'get-started.html'), shell({ title: 'Get started', depth: 0, current: 'Get started', body: `
<h1>Get started</h1>
<p class="ggds-lead ggds-measure">GGDS is the shared way to build Government of Ghana websites: the styles, page parts and guidance that make every one look familiar, work on low-cost phones and slow networks, and be usable by everyone. Start with the guide for your role.</p>
<ul class="ggds-card-grid ggds-card-grid--4 docs-roles-grid">${ROLES.map(([slug, label, text]) => `
  <li class="ggds-card"><h2 class="ggds-card__title"><a class="ggds-card__link" href="get-started/${slug}.html">${label}</a></h2><p class="ggds-card__body">${text}</p></li>`).join('')}
</ul>
<h2>What GGDS gives you</h2>
<ul class="ggds-measure">
<li><a href="foundations.html">Foundations</a>: colours with measured contrast, type and spacing, as tokens.</li>
<li><a href="themes.html">Themes</a>: your institution's colour, in the same places on every website.</li>
<li><a href="components/index.html">Components</a>: ${components.length} page parts, each with guidance, live examples, code and accessibility tests.</li>
<li><a href="patterns/index.html">Patterns</a>: whole tasks, such as asking for information or showing search results.</li>
${ifExamples('<li><a href="agencies/index.html">Example sites</a>: complete government websites built with GGDS.</li>')}
</ul>
<h2>Principles</h2>
<ol class="ggds-measure">
<li><strong>Start with what people need to do.</strong> Most visitors come to do one task. Make it easy to find and finish.</li>
<li><strong>Design for the phone in people’s hands.</strong> Low-cost Android phones, slow and costly data, bright sun.</li>
<li><strong>Everyone can use it.</strong> WCAG 2.2 AA is the minimum, and testing with disabled people is part of the work.</li>
<li><strong>Plain words.</strong> Write so people understand the first time, in English or their own language.</li>
<li><strong>Familiar and trustworthy.</strong> Every government website works the same way, so people know it is official.</li>
<li><strong>Works without extras.</strong> Every part works without JavaScript, on any website technology, under strict security settings.</li>
</ol>
${pager(null, { label: 'Get started as a developer', href: 'get-started/developers.html' })}` }));
}

// What's new: CHANGELOG.md, as a page.
{
  const md = readFileSync(join(root, 'CHANGELOG.md'), 'utf8');
  const inline = mdInline;
  const html = [];
  let list = false;
  for (const line of md.split('\n').slice(1)) {
    if (/^- /.test(line)) { if (!list) { html.push('<ul>'); list = true; } html.push(`<li>${inline(line.slice(2).replace(/\s*<!--[\s\S]*?-->\s*$/, ''))}</li>`); continue; }
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
      ...(EXAMPLES ? [{ label: 'See example sites', href: 'agencies/index.html' }] : [{ label: 'See the patterns', href: 'patterns/index.html' }]),
    ],
  });
  const cards = [
    ['Get started', 'get-started.html', 'Guides for developers, designers, content designers and service owners.'],
    ['Components', 'components/index.html', `${components.length} page parts, each with when to use it, a live example and the HTML.`],
    ['Themes', 'themes.html', 'Give your website your institution\u2019s colour, in the same places on every site.'],
    EXAMPLES
      ? ['Example sites', 'agencies/index.html', `Twelve government websites built with GGDS: ${sitePages} pages.`]
      : ['Patterns', 'patterns/index.html', `${patterns.length} whole tasks, such as asking for information or helping people contact you.`],
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
  <li><strong>${all.length + 1}</strong> pages built${EXAMPLES ? `, including <strong>${sitePages}</strong> on the example sites` : ''}</li>
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
      const section = url.startsWith('components/') ? 'Components' : url.startsWith('patterns/') ? 'Patterns' : url.startsWith('agencies/') ? 'Example sites' : 'Guidance';
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
