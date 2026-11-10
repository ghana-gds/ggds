// Builds the GGDS documentation site into site/: component pages with live examples, every example as its own
// page (what the browser tests check), foundations, and the example sites. The site uses GGDS itself and
// runs under a strict CSP: no inline scripts, styles or style attributes. No dependencies.
import { copyFileSync, cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { loadAgencies, writeAgencyPages } from './agencies.mjs';
import { contrast, cssName, flatten, loadTokens, resolveAll } from '../packages/tokens/lib.mjs';
import { DEFAULT_THEME, themes } from '../packages/themes/index.mjs';
import { drift } from '../packages/themes/sync.mjs';
import { esc, footer, header, hero, icon } from './parts.mjs';
import { ICONS } from '../packages/icons/dist/all.js';
import { heroArt } from './hero-art.mjs';
import { SHOWCASES, showcaseCss, showcaseFiles, showcasePages, showcaseThemes } from './showcase.mjs';
import { STARTER, starterFiles } from './starter.mjs';
import { highlightCode } from './highlight.mjs';
import { STACKS, stackLogo, stacksSection } from './stacks.mjs';
import { STACK_LOGOS } from './stack-logos.mjs';
import { demoPlaceholders, demoThemes, setups, tutorialBody, tutorialFiles } from './tutorial.mjs';

// The documentation uses GGDS's own icons (@ggds/icons) wherever an icon helps people find their way.
/** A card's icon (ggds-card--icon): a GGDS icon in the institution-coloured circle. */
const cardIcon = (name) => {
  if (!ICONS[name]) throw new Error(`docs: there is no icon called "${name}" in @ggds/icons`);
  return `<span class="ggds-card__icon">${icon(name)}</span>`;
};
/** Words with an icon before (or, for arrows, after) them: <span class="ggds-with-icon">. */
const withIcon = (name, words, after = false) => `<span class="ggds-with-icon">${after ? '' : icon(name)}<span>${words}</span>${after ? icon(name) : ''}</span>`;

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const site = join(root, 'site');
const componentsDir = join(root, 'packages', 'html', 'components');
// Where people get GGDS: the version they download, and the repository with its releases page.
const { version } = JSON.parse(readFileSync(join(root, 'packages', 'css', 'package.json'), 'utf8'));
const repo = 'https://github.com/ghana-gds/ggds';

// Example sites are built from docs/example-sites.json, a cleaned copy of the MoCDTI platform's settings
// (pnpm run sync:examples): no logos, contact details, web addresses or identification banner, so they cannot pass
// for the real sites. They are built only with GGDS_AGENCY_SITES=1: until the real sites go live, "What you can
// build" is the showcase (docs/showcase.mjs), and MoCDTI and its agencies are themes. Otherwise they are left out,
// and so is every link to them.
const { agencies, dir } = await loadAgencies(root);
const EXAMPLES = process.env.GGDS_AGENCY_SITES === '1' && agencies.length > 0;
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
  // A page's heading and introduction come first, then "On this page", the same on every page.
  const intro = body.match(/^\s*<h1[\s\S]*?<\/h1>\s*(?:<p class="ggds-lead[^"]*">[\s\S]*?<\/p>\s*)?/)?.[0] ?? '';
  body = body.slice(intro.length);
  const used = new Set();
  const items = [];
  const html = body.replace(/<h2(\s[^>]*)?>([\s\S]*?)<\/h2>/g, (whole, attrs = '', inner) => {
    let id = attrs.match(/\sid="([^"]+)"/)?.[1];
    if (!id) { id = slugify(inner) || 'section'; while (used.has(id)) id += '-2'; attrs += ` id="${id}"`; }
    used.add(id);
    items.push([id, inner.replace(/<[^>]+>/g, '').trim()]);
    return `<h2${attrs}>${inner}</h2>`;
  });
  if (items.length < 3) return intro + html;
  // A disclosure, so on a phone it takes one line until opened; docs.js opens it on wide screens, where it sits
  // beside the content.
  return `${intro}<div class="docs-with-contents">
<nav class="docs-contents" aria-label="On this page">
<details class="docs-contents__details">
  <summary class="docs-contents__title">On this page</summary>
  <ul class="docs-contents__list">${items.map(([id, t]) => `<li><a href="#${id}">${esc(t)}</a></li>`).join('')}</ul>
</details>
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
/** Breadcrumbs (the GGDS component): Home, then crumbs [{ label, href }], then the page itself. */
function breadcrumbs(crumbs, title, base) {
  const items = [{ label: 'Home', href: `${base}index.html` }, ...crumbs];
  return `<nav class="ggds-breadcrumbs" aria-label="Breadcrumb">
  <ol class="ggds-breadcrumbs__list">
    ${items.map((c) => `<li class="ggds-breadcrumbs__item"><a class="ggds-breadcrumbs__link" href="${c.href}">${esc(c.label)}</a></li>`).join('\n    ')}
    <li class="ggds-breadcrumbs__item" aria-current="page">${esc(title)}</li>
  </ol>
</nav>
`;
}

/** A complete page. depth: how many folders below site/. bare: body is the whole page content. crumbs: the pages above this one. */
function shell({ title, depth, body, extraCss = [], bare = false, current = '', lead, noindex = false, toc = false, scripts = [], feedback = {}, crumbs = null }) {
  const base = '../'.repeat(depth);
  const css = [`${base}assets/ggds.css`, `${base}assets/docs.css`, ...extraCss].map((h) => `<link rel="stylesheet" href="${h}">`).join('\n  ');
  const docsNav = [
    { label: 'Get started', href: `${base}get-started.html` },
    { label: 'Foundations', href: `${base}foundations.html` },
    { label: 'Themes', href: `${base}themes.html` },
    { label: 'Components', href: `${base}components/index.html` },
    { label: 'Patterns', href: `${base}patterns/index.html` },
    { label: 'Showcase', href: `${base}showcase/index.html` },
    ...(EXAMPLES ? [{ label: 'Example sites', href: `${base}agencies/index.html` }] : []),
  ];
  const content = bare ? body : `<a class="ggds-skip-link" href="#main">Skip to main content</a>
<div class="docs-draft"><p class="ggds-container"><strong>This is a draft (version ${version}).</strong> <span class="docs-draft__more">The National Information Technology Agency (NITA) plans to make GGDS official guidance for government websites after independent accessibility testing.</span> <a href="${base}versions.html">What this means</a></p></div>
${header({ name: 'Ghana Government Design System', country: 'Design system for Government of Ghana websites', logo: '<span class="ggds-header__monogram" aria-hidden="true">GGDS</span>', nav: docsNav, current: docsNav.find((n) => n.label === current)?.href, navId: 'docs-nav', home: `${base}index.html`, search: `${base}search.html` })}
<main id="main" tabindex="-1">
${lead ?? ''}<div class="ggds-main ggds-container">
${crumbs ? breadcrumbs(crumbs, title, base) : ''}${toc ? withContents(body) : body}
</div>
<p class="ggds-container docs-top"><a href="#main">Back to top</a></p>
<div class="ggds-container docs-feedback">
<p>Something wrong, unclear or missing? <a href="${repo}/issues/new?title=${encodeURIComponent(feedback.title ?? `${title}: `)}">${withIcon('comment', 'Report a problem with this page')}</a>${feedback.source ? ` or <a href="${repo}/edit/main/${feedback.source}">suggest a change to it on GitHub</a>` : ''}. You need a GitHub account.</p>
</div>
</main>
${footer({
  name: 'Ghana Government Design System',
  logo: '<span class="ggds-header__monogram" aria-hidden="true">GGDS</span>',
  purpose: 'Ready-made styles and page parts for Government of Ghana websites, maintained by the National Information Technology Agency (NITA).',
  sections: [
    { label: 'Design system', href: `${base}index.html`, links: [{ label: 'Get started', href: `${base}get-started.html` }, { label: 'For developers', href: `${base}get-started/developers.html` }, { label: 'Tutorial', href: `${base}get-started/tutorial.html` }, { label: 'For designers', href: `${base}get-started/designers.html` }, { label: 'Foundations', href: `${base}foundations.html` }, { label: 'Icons', href: `${base}icons.html` }, { label: 'Themes', href: `${base}themes.html` }] },
    { label: 'Components', href: `${base}components/index.html`, links: [...GROUPS.map((g) => ({ label: g, href: `${base}components/index.html#${slugify(g)}` })), { label: 'Patterns', href: `${base}patterns/index.html` }] },
    EXAMPLES
      ? { label: 'Examples', href: `${base}agencies/index.html`, links: [{ label: 'Example sites', href: `${base}agencies/index.html` }, { label: 'Register of government websites', href: `${base}register.html` }] }
      : { label: 'Examples', href: `${base}showcase/index.html`, links: [{ label: 'Showcase: what you can build', href: `${base}showcase/index.html` }, { label: 'Register of government websites', href: `${base}register.html` }] },
    { label: 'About GGDS', href: `${base}changelog.html`, links: [{ label: 'What\u2019s new', href: `${base}changelog.html` }, { label: 'Contribute', href: `${base}contribute.html` }, { label: 'Versions and support', href: `${base}versions.html` }, { label: 'Accessibility statement', href: `${base}accessibility.html` }, { label: 'Search', href: `${base}search.html` }] },
  ],
  bar: [['Code licence: Apache-2.0', `${base}index.html#licence`]],
})}`;
  return highlightCode(`<!doctype html>
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
`);
}

// Example links: an example's markup uses real website addresses ("/services/"), which do not exist on this site.
// In the rendered example each one opens a small page that says where the link would go and links back, so no
// example link leads to "not found". The HTML shown for copying keeps the real addresses.
function exampleLinks(c, e) {
  const dir = join(site, 'examples', c.slug, 'links');
  // Links first, then forms, so a link inside a form (such as "I do not have a Ghana Card") is caught too.
  const rewrite = (body, tags) => body.replace(new RegExp(`<(${tags})\\b([^>]*?)\\s(href|action)="(\\/[^"]*)"([^>]*)>([\\s\\S]*?)<\\/\\1>`, 'g'), (whole, tag, before, attr, address, after, inside) => {
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
  return rewrite(rewrite(e.body, 'a'), 'form');
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
  if (!g.data.icon) throw new Error(`component ${d.name}: add "icon: <name>" (from @ggds/icons) to its guidance.html meta`);
  return { slug: d.name, name: g.data.name ?? d.name, icon: g.data.icon, status: g.data.status ?? 'beta', order: Number(g.data.order ?? 99), group, summary: g.data.summary ?? '',
    related: (g.data.related ?? '').split(',').map((r) => r.trim()).filter(Boolean), guidance: g.body, examples: loadParts(dir), ref: JSON.parse(readFileSync(refFile, 'utf8')) };
}).sort((a, b) => GROUPS.indexOf(a.group) - GROUPS.indexOf(b.group) || a.order - b.order);
for (const c of components) for (const r of c.related) if (!components.some((x) => x.slug === r)) throw new Error(`${c.slug}: related component "${r}" does not exist`);

// What the status tags mean (the components overview explains them; every component page links there).
const STATUS = {
  stable: ['ggds-tag--success', 'Used on live government websites and not expected to change. Any change is listed below and in What’s new.'],
  beta: ['ggds-tag--info', 'Works, is tested, and is ready to use on government websites. It may still change before version 1.0, after research or the accessibility audit.'],
  alpha: ['ggds-tag--warning', 'New: tested automatically, but not yet used on a live government website. It may change after research with the people who use it. Tell us how it works for you.'],
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
<h3>React and Next.js</h3>
${REACT[c.slug] ? `<p>With <code>@ggds/react</code>:</p>\n${code(`React for ${c.name}`, `import { ${REACT[c.slug][0]} } from '@ggds/react';\n\n${REACT[c.slug][1]}`)}` : '<p>No React component: switch the HTML under an example to <strong>JSX (React)</strong> and copy it.</p>'}
<h3>Django</h3>
${r.django ? `<p>With <code>ggds-django</code> (<code>{% load ggds %}</code>):</p>\n${code(`Django for ${c.name}`, r.django)}` : '<p>No template tag: copy the HTML into your template.</p>'}`;
}

/** @ggds/react: the components for each GGDS component, and a short example (tests/unit/react.test.mjs checks the HTML). */
const REACT = {
  'skip-link': ['SkipLink', '<SkipLink />'],
  banner: ['Banner', '<Banner shortName="Example Agency" host="www.example.gov.gh" official />'],
  header: ['Header', `<Header name="Example Agency" initials="EA" current="/services/"
  nav={[{ label: 'Services', href: '/services/' }, { label: 'About', href: '/about/' }]} />`],
  hero: ['Hero', `<Hero title="What do you need to do?" purpose="We license businesses and protect consumers."
  search={{ action: '/search/', label: 'Search Example Agency' }}
  tasks={[{ label: 'Apply for a licence', href: '/services/licence/' }]} />`],
  footer: ['Footer', `<Footer name="Example Agency" purpose="We license businesses and protect consumers."
  contact={{ email: 'info@example.gov.gh', moreHref: '/contact/' }}
  bar={[{ label: 'Accessibility', href: '/accessibility/' }, { label: 'Privacy', href: '/privacy/' }]} />`],
  'tab-bar': ['TabBar', `<TabBar tabs={[
  { label: 'Home', href: '/', icon: 'home', current: true },
  { label: 'Services', href: '/services/', icon: 'services' },
  { label: 'Search', href: '/search/', icon: 'search' },
]} />`],
  breadcrumbs: ['Breadcrumbs', `<Breadcrumbs current="Apply for a licence"
  items={[{ label: 'Home', href: '/' }, { label: 'Services', href: '/services/' }]} />`],
  field: ['TextInput, Textarea, Select', `<TextInput id="phone" name="phone" type="tel" label="Mobile phone number"
  hint="For example, 024 123 4567" width="medium" autoComplete="tel"
  error={errors.phone} />   {/* the error message, aria-invalid and aria-describedby follow */}`],
  choices: ['Radios, Checkboxes', `<Radios name="reply" legend="How should we reply?" error={errors.reply}
  items={[{ value: 'sms', label: 'SMS' }, { value: 'email', label: 'Email' }]} />`],
  'error-summary': ['ErrorSummary', `{/* First in <main>. It takes the focus when errors appear; nothing shows without errors. */}
<ErrorSummary errors={[{ href: '#phone', text: 'Enter your mobile phone number' }]} />`],
  button: ['Button, ButtonGroup', `<ButtonGroup>
  <Button type="submit">Continue</Button>
  <Button variant="secondary">Save as draft</Button>
</ButtonGroup>
<Button href="/services/licence/apply/">Start now</Button>`],
  notice: ['Notice', `<Notice type="warning" title="This fee has not been confirmed">
  <p>Contact us before you pay.</p>
</Notice>`],
  tag: ['Tag', '<Tag type="success">In force</Tag>'],
  card: ['Card, CardGrid', `<CardGrid>
  <Card icon="store" href="/services/permits/" title="Apply for a business permit">
    Who needs one, what it costs and how to apply online.
  </Card>
</CardGrid>`],
  icon: ['Icon', `<Icon name="download" />   {/* hidden from screen readers: put words beside it */}`],
  'page-heading': ['PageHeading, KeyFigures', `<PageHeading eyebrow="Owusu Trading Enterprise · EX-BN-2024-0081" title="Welcome back, Ama">
  <KeyFigures inverse figures={[{ value: '3', label: 'applications in progress' }, { value: 'GH₵ 1,250', label: 'paid this year' }]} />
</PageHeading>`],
  'key-figures': ['KeyFigures', `<KeyFigures figures={[
  { value: '755 mm', label: 'average rainfall', change: '7% above normal' },
  { value: '3', label: 'regions with a flood warning', danger: true },
]} />`],
  progress: ['Progress', '<Progress current={3} total={4} />   {/* "Question 3 of 4" */}'],
  timeline: ['Timeline', `<Timeline stages={[
  { title: 'Application and payment received', when: '10 November 2026', state: 'done' },
  { title: 'A fisheries officer checks your answers', when: 'Within 5 working days', state: 'current' },
  { title: 'Your licence arrives by SMS', when: 'By 31 December 2026' },
]} />`],
  meter: ['Meter', `<td className="ggds-table__numeric">812</td>
<td><Meter value={812} max={1100} /></td>`],
  steps: ['Steps', `<Steps urgent steps={[
  { icon: 'arrow-up', title: 'Move to higher ground', text: 'Take your family, your Ghana Card and your medicines.' },
  { icon: 'energy', title: 'Switch off the electricity', text: 'At the main switch, if it is safe to reach.' },
]} />`],
};

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
  <p class="docs-example__actions"><a href="${depthPrefix}examples/${dir}/${e.file}">${withIcon('external', 'Open this example on its own page')}</a></p>
  <details class="ggds-disclosure docs-example__code">
    <summary class="ggds-disclosure__summary">${withIcon('code', `HTML code for “${esc(e.title)}”`)}</summary>
    <div class="ggds-disclosure__content"><pre class="docs-code" tabindex="0" aria-label="HTML for ${esc(e.title)}"><code>${esc(shown)}</code></pre></div>
  </details>
</section>`;
  }).join('');
}

const cards = (list, href) => `<ul class="ggds-card-grid">${list.map((r) => `
    <li class="ggds-card ggds-card--icon">${cardIcon(r.icon)}<h3 class="ggds-card__title"><a class="ggds-card__link" href="${href(r)}">${esc(r.name)}</a></h3><p class="ggds-card__body">${esc(r.summary)}</p></li>`).join('')}
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
  writeFileSync(join(site, 'components', `${c.slug}.html`), shell({ title: c.name, depth: 1, body, current: 'Components', crumbs: [{ label: 'Components', href: 'index.html' }],
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
  if (!g.data.icon) throw new Error(`pattern ${d.name}: add "icon: <name>" (from @ggds/icons) to its guidance.html meta`);
  return { slug: d.name, name: g.data.name ?? d.name, icon: g.data.icon, order: Number(g.data.order ?? 99), summary: g.data.summary ?? '', uses, guidance: g.body, examples: loadParts(dir) };
}).sort((a, b) => a.order - b.order);
mkdirSync(join(site, 'patterns'), { recursive: true });
for (const p of patterns) {
  const i = patterns.indexOf(p);
  const near = (x) => x && { label: x.name, href: `${x.slug}.html` };
  const examples = examplePages(p, `patterns/${p.slug}`, '../');
  const nav = `<nav class="docs-sidenav" aria-label="Patterns">
  <p class="docs-sidenav__all"><a href="index.html">All patterns</a></p>
  <ul class="docs-sidenav__list">
    ${patterns.map((x) => `<li><a class="docs-sidenav__link" href="${x.slug}.html"${x.slug === p.slug ? ' aria-current="page"' : ''}>${esc(x.name)}</a></li>`).join('\n    ')}
  </ul>
</nav>`;
  const body = `<div class="docs-layout">
${nav}
<div class="docs-content">
<p class="docs-kicker">Pattern</p>
<h1>${esc(p.name)}</h1>
${withContents(`<div class="docs-guidance">${p.guidance}</div>
${examples}
<h2>Components used</h2>
${cards(p.uses.map((u) => components.find((x) => x.slug === u)), (r) => `../components/${r.slug}.html`)}`)}
${pager(near(patterns[i - 1]) ?? { label: 'All patterns', href: 'index.html' }, near(patterns[i + 1]) ?? (EXAMPLES ? { label: 'Example sites', href: '../agencies/index.html' } : { label: 'Showcase', href: '../showcase/index.html' }))}
</div>
</div>`;
  writeFileSync(join(site, 'patterns', `${p.slug}.html`), shell({ title: p.name, depth: 1, body, current: 'Patterns', crumbs: [{ label: 'Patterns', href: 'index.html' }],
    feedback: { title: `Pattern, ${p.name}: `, source: `packages/html/patterns/${p.slug}/guidance.html` } }));
}
writeFileSync(join(site, 'patterns', 'index.html'), shell({ title: 'Patterns', depth: 1, current: 'Patterns', body: `
<h1>Patterns</h1>
<p class="ggds-lead ggds-measure">Whole tasks people do on government websites, put together from GGDS components: what to do on each page, and why.</p>
${cards(patterns, (p) => `${p.slug}.html`)}
${ifExamples('<p class="ggds-measure">The <a href="../agencies/index.html">example sites</a> show these patterns in complete websites.</p>')}
${pager({ label: 'Components', href: '../components/index.html' }, EXAMPLES ? { label: 'Example sites', href: '../agencies/index.html' } : { label: 'Showcase', href: '../showcase/index.html' })}` }));

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
const iconCount = Object.keys(ICONS).length;
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
<p class="ggds-measure">Movement is short and explains a change, such as a menu opening. Nothing flashes. The only thing that moves on its own is the optional hero drawing, only for people who have not asked for less motion, and it stops within 5 seconds.</p>
<ul class="ggds-measure">
<li>Animate only inside <code>@media (prefers-reduced-motion: no-preference)</code>, so people who ask their device for less motion get none.</li>
<li>Use the duration and easing tokens, so movement feels the same everywhere.</li>
<li>Never make people wait for an animation before they can act.</li>
<li>Anything that moves on its own must stop within 5 seconds, or have a pause button (WCAG 2.2.2). A finite <code>animation-iteration-count</code> does it without JavaScript; never use <code>infinite</code>.</li>
</ul>
${tokenTable('motion-caption', 'Motion tokens', ['motion'])}
<h2>Layers</h2>
<p class="ggds-measure">Named layers for things that sit above the page, so a menu never ends up behind a sticky header. GGDS's CSS uses these names only, never raw numbers.</p>
${tokenTable('layer-caption', 'Layer tokens', ['layer'])}
<h2>Icons</h2>
<p class="ggds-measure">GGDS has its own set of ${iconCount} line icons for government services, <code>@ggds/icons</code>, drawn on a 24px grid in the colour of the text around them. <a href="icons.html">See all the icons</a>, and how to use them with the <a href="components/icon.html">icon component</a>.</p>
<ul class="ggds-measure">
<li>Always put words next to an icon. An icon on its own is guessed differently by different people.</li>
<li>Hide icons from screen readers (<code>aria-hidden="true"</code> and <code>focusable="false"</code>), because the words already say it.</li>
<li>Use the icon size tokens, and the text colour (<code>currentColor</code>), so icons keep their contrast in every theme.</li>
</ul>
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
// Icons: every icon in @ggds/icons by category, with a filter (icons.js), and the files to download.
{
  const iconsDist = join(root, 'packages', 'icons', 'dist');
  const { categories } = JSON.parse(readFileSync(join(iconsDist, 'catalogue.json'), 'utf8'));
  mkdirSync(join(site, 'assets', 'icons', 'svg'), { recursive: true });
  for (const f of ['sprite.svg', 'ggds-icons.svg']) copyFileSync(join(iconsDist, f), join(site, 'assets', 'icons', f));
  for (const f of readdirSync(join(iconsDist, 'svg'))) copyFileSync(join(iconsDist, 'svg', f), join(site, 'assets', 'icons', 'svg', f));
  const item = (name, tags) => `<li class="docs-icons__item" data-keywords="${esc([name.replaceAll('-', ' '), ...tags].join(', '))}">${icon(name, 'docs-icons__svg')}<code class="docs-icons__name">${name}</code><a class="docs-icons__file" href="assets/icons/svg/${name}.svg" download>SVG<span class="ggds-visually-hidden"> file of the ${name} icon</span></a></li>`;
  const sections = categories.map((c) => `<section class="docs-icons__group" aria-labelledby="icons-${slugify(c.name)}">
<h2 id="icons-${slugify(c.name)}">${esc(c.name)}</h2>
<ul class="docs-icons">${Object.entries(c.icons).map(([n, tags]) => item(n, tags)).join('')}</ul>
</section>`).join('\n');
  writeFileSync(join(site, 'icons.html'), shell({ title: 'Icons', depth: 0, current: 'Foundations', crumbs: [{ label: 'Foundations', href: 'foundations.html' }], scripts: ['assets/icons.js'], feedback: { title: 'Icons: ' }, body: `
<h1>Icons</h1>
<p class="ggds-lead ggds-measure">${iconCount} icons for Government of Ghana websites, drawn for GGDS so they look like one set: the same grid, the same line, the same corners. Free to use under the Apache-2.0 licence.</p>
<ul class="ggds-measure">
<li><a href="assets/icons/ggds-icons.svg" download>${icon('download')} Every icon on one sheet (SVG, ${Math.round(readFileSync(join(iconsDist, 'ggds-icons.svg')).length / 1024)} KB)</a>, with each icon named, to import into Figma or another design tool.</li>
<li><a href="assets/icons/sprite.svg" download>${icon('download')} Every icon in a sprite (SVG, ${Math.round(readFileSync(join(iconsDist, 'sprite.svg')).length / 1024)} KB)</a>, for websites: see the <a href="components/icon.html">icon component</a>.</li>
<li>Single icons: the SVG link under each one below. With npm: <code>npm install @ggds/icons</code>.</li>
</ul>
<form class="docs-icons__filter" role="search" action="#" hidden>
<div class="ggds-field">
<label class="ggds-label" for="icons-q">Find an icon</label>
<div class="ggds-hint" id="icons-q-hint">Search by name or meaning, for example: payment, Ghana Card, election</div>
<input class="ggds-input ggds-input--width-medium" id="icons-q" type="search" autocomplete="off" aria-describedby="icons-q-hint">
</div>
<p class="docs-icons__count" role="status"></p>
</form>
${sections}
<h2 id="drawing">Drawing a new icon</h2>
<p class="ggds-measure">Ask for an icon GGDS does not have by <a href="${repo}/issues/new?title=${encodeURIComponent('New icon: ')}">opening an issue</a>: say what it is for and where it will be used. To draw one, follow these rules, which every GGDS icon keeps. The build checks the ones a computer can check, and stops with the reason if an icon breaks them.</p>
<ul class="ggds-measure">
<li>A 24 by 24 frame. Keep the drawing between 2 and 22, leaving 2px clear on every side.</li>
<li>Lines only, 2px wide, with round ends and round corners. No fills, no colours, no shadows: the icon takes the colour of the text around it.</li>
<li>Put straight lines on whole pixels (4, not 4.3), so they stay sharp on screens. Use at most 2 decimal places anywhere.</li>
<li>Match the size of the icons around it: a circle is about 17px across, a square about 16px.</li>
<li>Draw what people already know: a phone for calling, a pin for a place. Leave out detail that disappears at 16px.</li>
<li>No logos, flags, coats of arms or people's faces.</li>
<li>Name it after what it shows, in lower case with hyphens (<code>id-card</code>), and add it to <code>packages/icons/catalogue.json</code> with words people might search for.</li>
</ul>
<p class="ggds-measure">Save the drawing as <code>packages/icons/src/&lt;name&gt;.svg</code>, starting with the same <code>&lt;svg&gt;</code> element as the other files there, and run <code>pnpm run build</code>. Then it is in every format: npm, the sprite, the design sheet, Django, WordPress and Astro.</p>
${pager({ label: 'Foundations', href: 'foundations.html' }, { label: 'Themes', href: 'themes.html' })}` }));
}

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
<li><strong>Your institution's theme:</strong> add its theme file after the stylesheet, for example <code>&lt;link rel="stylesheet" href="themes/&lt;theme&gt;.css"&gt;</code>, with its name from the list below.</li>
<li><strong>Several institutions on one page,</strong> such as a list of a ministry's agencies: add <code>themes/themes.css</code> and put <code>data-ggds-theme="&lt;theme&gt;"</code> (with the institution's theme name) on each card.</li>
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
<p>See any theme on a whole page: open a template in the <a href="showcase/index.html">showcase</a> and choose the theme at the top.</p>
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

// Example sites: example homepages in each institution's theme, built with GGDS, from docs/example-sites.json
if (EXAMPLES) {
  const index = writeAgencyPages({ siteDir: site, agencies, platformDirectory: dir, shell });
  writeFileSync(join(site, 'agencies', 'index.html'), shell({ title: index.title, depth: 1, body: `${index.body}\n${pager({ label: 'Patterns', href: '../patterns/index.html' }, null)}`, extraCss: index.extraCss, current: 'Example sites', noindex: true }));
  console.log(`docs: ${components.length} components, ${components.reduce((n, c) => n + c.examples.length, 0)} examples, ${themes.length} themes, ${agencies.length} example sites → ${site}`);
} else {
  console.log(agencies.length
    ? 'docs: agency example sites not built: the showcase is "What you can build" (GGDS_AGENCY_SITES=1 builds them)'
    : 'docs: no docs/example-sites.json; example sites skipped (pnpm run sync:examples)');
}

// Get started: an overview by role, and a guide for each role. Developers' guide is above; the others are
// docs/guides/*.html (a meta comment, then the body; links are relative to get-started/).
const ROLE_ICONS = { developers: 'code', designers: 'edit', content: 'document', 'service-owners': 'briefcase' };
const ROLES = [
  ['developers', 'Developers', 'Add GGDS to any website: plain HTML, React, Next.js, Vue, Svelte, Angular, Astro, Django, WordPress or Laravel.'],
  ['designers', 'Designers', 'Design from GGDS foundations, components and patterns, and test with the people who will use it.'],
  ['content', 'Content designers', 'Write pages people understand the first time, in the style every GGDS website shares.'],
  ['service-owners', 'Service owners', 'What adopting GGDS involves: what every website needs, what to ask suppliers for, and checks before launch.'],
];
/** Where GGDS is published: npm, PyPI and GitHub. */
function whereToGetIt(level = 2) {
  const links = [
    ['npm', 'https://www.npmjs.com/org/ggds', 'download', '<code>@ggds/css</code>, <code>js</code>, <code>themes</code>, <code>icons</code>, <code>react</code>, <code>astro</code> and <code>tokens</code>, for projects with a build step.'],
    ['PyPI', 'https://pypi.org/project/ggds-django/', 'download', '<code>ggds-django</code>: template tags, forms and Django admin, for Django and Wagtail.'],
    ['GitHub releases', `${repo}/releases/latest`, 'archive', `The <code>ggds</code> folder as a zip, for any website, and the WordPress theme. Version ${version}.`],
    ['GitHub repository', repo, 'code', 'The source code, problems people have reported, and how to contribute.'],
  ];
  return `<section aria-labelledby="get-it-h">
<h${level} id="get-it-h">Where to get GGDS</h${level}>
<ul class="ggds-card-grid ggds-card-grid--4 docs-roles-grid">${links.map(([t, h, ic, b]) => `
  <li class="ggds-card ggds-card--icon">${cardIcon(ic)}<h${level + 1} class="ggds-card__title"><a class="ggds-card__link" href="${h}">${t}</a></h${level + 1}><p class="ggds-card__body">${b}</p></li>`).join('')}
</ul>
</section>`;
}
function roles(current, base = '') {
  return `<nav class="docs-roles" aria-label="Get started by role">
  <ul class="docs-roles__list">${ROLES.map(([slug, label]) => `<li><a class="docs-roles__link" href="${base}${slug}.html"${slug === current ? ' aria-current="page"' : ''}>${label}</a></li>`).join('')}</ul>
</nav>`;
}
// Get started: how to use GGDS on a website, from a local build.
{
  // People save this page on its own, so the banner's link to the register goes to the published documentation.
  const page = (components.find((c) => c.slug === 'page')?.examples[0]?.body ?? '')
    .replaceAll('href="../../register.html"', 'href="https://ghana-gds.github.io/ggds/register.html"');
  // The same starter page for each way of adding GGDS: only the two lines that load it differ.
  const ways = setups(version);
  const starter = (head) => `<!doctype html>
<html lang="en-GB">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Apply for a licence | Example Agency</title>
${head}
</head>
<body>
${page}
</body>
</html>`;
  const cdnBase = 'https://cdn.jsdelivr.net/npm';
  mkdirSync(join(site, 'get-started'), { recursive: true });
  writeFileSync(join(site, 'get-started', 'developers.html'), shell({ title: 'Get started as a developer', depth: 1, current: 'Get started', crumbs: [{ label: 'Get started', href: '../get-started.html' }], body: `
${roles('developers')}
<h1>Get started as a developer</h1>
<p class="ggds-lead ggds-measure">GGDS is plain HTML and CSS, so it works with whatever you build with: plain HTML, React and Next.js, Vue, Svelte, Angular, Astro, Django, WordPress, Laravel, or anything else that makes web pages. Try it in one minute below, then find your setup. New to GGDS? <a href=\"tutorial.html\">Start with the tutorial</a>.</p>
${withContents(`<div class="ggds-prose">
<h2 id="quick-start">Try it in one minute</h2>
<p>Copy this page, save it as <code>index.html</code> and open it in your browser. It loads GGDS from the jsDelivr CDN, so there is nothing to download or install, and it has every part a GGDS page needs: skip link, banner, header, content, footer and phone tab bar.</p>
<div class="ggds-button-group"><a class="ggds-button ggds-button--secondary" href="../examples/page/1-default.html">${withIcon('external', 'See what this page looks like')}</a></div>
<pre class="docs-code" tabindex="0" aria-label="Quick start page HTML"><code>${esc(starter(ways.cdn.head))}</code></pre>
<p>Change the name, sections and content to your own, then add more parts from <a href="../components/index.html">Components</a>: each one has the HTML to copy. Before the website goes live, <a href="#download-the-files">serve the files yourself</a>.</p>
</div>
${whereToGetIt()}
<div class="ggds-prose">
<h2 id="choose">Step 1: Find your setup</h2>
<p>Choose what your website is built with. Plain HTML websites follow steps 2 to 4 below; every framework has its own short section, with the same steps in its own words.</p>
</div>
<ul class="ggds-card-grid docs-stack-grid">${STACKS.map(([id, name, logo, text]) => `
  <li class="ggds-card ggds-card--icon">${stackLogo(logo, STACK_LOGOS)}<h3 class="ggds-card__title"><a class="ggds-card__link" href="#${id}">${name}</a></h3><p class="ggds-card__body">${text}</p></li>`).join('')}
</ul>
<p class="docs-logo-credit">Framework logos are trademarks of their owners, shown to say GGDS works with them; they are not part of GGDS. Shapes from <a href="https://simpleicons.org/">Simple Icons</a>. Angular logo: <a href="https://angular.dev/press-kit">Google</a>, CC BY 4.0. Vue logo: <a href="https://github.com/vuejs/art">Evan You</a>, CC BY-NC-SA 4.0.</p>
<div class="ggds-prose">
<p>Just trying GGDS out? Use the <a href="#try-it-from-a-cdn">CDN</a>, or the <a href="#quick-start">one-minute page</a> above.</p>

<h2 id="add-the-files">Step 2: Add the files</h2>
<h3 id="try-it-from-a-cdn">From a CDN (quickest)</h3>
<p>Put these two lines in the <code>&lt;head&gt;</code> of each page. Nothing else is needed.</p>
<pre class="docs-code" tabindex="0" aria-label="CDN links"><code>${esc(ways.cdn.head.replace(/^ {2}/gm, ''))}</code></pre>
<p>Keep the exact version (<code>@${version}</code>) so your pages do not change when GGDS does. The CDN is for trying GGDS out and for prototypes. For a live government website, use the download or npm: then the website does not depend on another company’s service, and a strict Content Security Policy works without allowing another address.</p>
<p>If you do keep the CDN on a live website, add <code>integrity</code> and <code>crossorigin="anonymous"</code> to both lines, so the browser refuses a file that has been changed. The values for version ${version} are in <a href="${repo}/releases/download/v${version}/integrity.json"><code>integrity.json</code></a>, in the same release as the download: use the entries for <code>ggds.min.css</code> and <code>auto.js</code>.</p>

<h3 id="download-the-files">From the download (recommended for live websites)</h3>
<p>Download <code>ggds-${version}.zip</code> from the <a href="${repo}/releases/latest">latest GitHub release</a>. You do not need Node, npm or any build tools. The zip holds one <code>ggds</code> folder: copy it into your website as it is, then put these two lines in the <code>&lt;head&gt;</code> of each page:</p>
<pre class="docs-code" tabindex="0" aria-label="Download links"><code>${esc(ways.download.head.replace(/^ {2}/gm, ''))}</code></pre>
<div class="ggds-table-wrap" role="region" aria-labelledby="files-caption" tabindex="0"><table class="ggds-table">
<caption class="ggds-table__caption" id="files-caption">The files in the ggds folder</caption>
<thead><tr><th scope="col">File</th><th scope="col">What it is</th><th scope="col">Needed?</th></tr></thead>
<tbody>
<tr><td><code>ggds.min.css</code></td><td>All the styles, with the default theme. <code>ggds.css</code> is the same, readable</td><td>Yes</td></tr>
<tr><td><code>themes/&lt;theme&gt;.css</code></td><td>Your institution's theme</td><td>Only for a theme other than the default</td></tr>
<tr><td><code>auto.js</code> and the other <code>.js</code> files</td><td>The small script: phone menu and error summary</td><td>No. Every part works without it. Keep the four files together</td></tr>
<tr><td><code>core.min.css</code> and <code>components/</code></td><td>The same styles in parts, to load only what you use</td><td>No</td></tr>
</tbody></table></div>
<p>The files come from your own website, so a strict Content Security Policy (<code>style-src 'self'; script-src 'self'</code>) works without changes. The zip's <code>SHA256SUMS</code> file lets you check the download.</p>
<h3 id="install-from-npm">From npm</h3>
<p>The packages are in the <a href="https://www.npmjs.com/org/ggds"><code>@ggds</code> organisation on npm</a>, at version <code>${version}</code>, with provenance.</p>
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
<tr><th scope="row"><a href="https://www.npmjs.com/package/@ggds/react"><code>@ggds/react</code></a></th><td>Page parts and form fields as React components, for React and Next.js</td></tr>
<tr><th scope="row"><a href="https://www.npmjs.com/package/@ggds/astro"><code>@ggds/astro</code></a></th><td>The page parts as Astro components</td></tr>
<tr><th scope="row"><a href="https://www.npmjs.com/package/@ggds/icons"><code>@ggds/icons</code></a></th><td>${iconCount} icons as SVG files, a sprite, JavaScript and JSON</td></tr>
</tbody></table></div>
<p>Load everything, or only the components you use, which keeps pages lighter:</p>
<pre class="docs-code" tabindex="0" aria-label="Stylesheet imports"><code>@import "@ggds/css/ggds.css";              /* everything */

/* or only what you use: */
@import "@ggds/css/core.css";              /* tokens and base styles */
@import "@ggds/css/components/header.css"; /* then one file per component */
@import "@ggds/css/components/footer.css";</code></pre>
<p>Start the optional script once, in your own script file:</p>
<pre class="docs-code" tabindex="0" aria-label="Script import"><code>import { initAll } from '@ggds/js';
initAll();

// or, to start it on every page without writing code:
import '@ggds/js/auto';</code></pre>
<p>Without a bundler, copy the files you need from <code>node_modules/@ggds/css/dist/</code>, <code>node_modules/@ggds/themes/dist/</code> and <code>node_modules/@ggds/js/dist/</code> into your website\u2019s static files.</p>
<p>Until version 1.0, a new minor version can change components. Keep to one minor version (<code>"@ggds/css": "~${version}"</code>), and read <a href="../changelog.html">What\u2019s new</a> before you update.</p>
<h2 id="start-from-a-page">Step 3: Start from a complete page</h2>
<p>A page with every required part: skip link, banner, header, content, footer and phone tab bar. It is the page from <a href="#quick-start">Try it in one minute</a>, loading the files from the download’s <code>ggds</code> folder. Change the name, sections and content to your own.</p>
<pre class="docs-code" tabindex="0" aria-label="Starter page HTML"><code>${esc(starter(ways.download.head))}</code></pre>
<p>Using the CDN? Keep the two CDN lines in place of the two <code>ggds/</code> lines. Using npm? Load the files the way your build tool does, as in <a href="#install-from-npm">From npm</a>.</p>

<h2 id="add-your-theme">Step 4: Add your theme</h2>
<p>Keep the default, or add your institution’s theme straight after the GGDS stylesheet. Find its name on <a href="../themes.html">Themes</a>, or make one from your own colour. Use the line for the way you added GGDS:</p>
<pre class="docs-code" tabindex="0" aria-label="Theme stylesheet"><code>&lt;!-- CDN --&gt;
&lt;link rel="stylesheet" href="${cdnBase}/@ggds/themes@${version}/dist/&lt;theme&gt;.css"&gt;

&lt;!-- Download --&gt;
&lt;link rel="stylesheet" href="ggds/themes/&lt;theme&gt;.css"&gt;

/* npm: last in your stylesheet */
@import "@ggds/themes/&lt;theme&gt;.css";</code></pre>
<p>Replace <code>&lt;theme&gt;</code> with your theme’s name, for example <code>csa</code>.</p>

${stacksSection({ code: (label, text) => `<pre class="docs-code" tabindex="0" aria-label="${esc(label)}"><code>${esc(text)}</code></pre>`, version, repo })}
<h2>Next steps</h2>
<ul>
<li>Pick the parts you need from <a href="../components/index.html">Components</a>. Each page says when to use it and has the HTML to copy.</li>
<li>See what you can build in the <a href="../showcase/index.html">showcase</a>: services, accounts, open data, warnings, staff tools and phone-first pages, in any theme.</li>
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
    writeFileSync(join(site, 'get-started', `${slug}.html`), shell({ title: g.data.title, depth: 1, current: 'Get started', crumbs: [{ label: 'Get started', href: '../get-started.html' }],
      feedback: { source: `docs/guides/${slug}.html` },
      body: `${roles(slug)}\n<h1>${esc(g.data.title)}</h1>\n${withContents(`<div class="ggds-prose">\n${forExamples(g.body).replaceAll('${version}', version)}\n</div>`)}\n${pager(prevSlug ? label(prevSlug) : null, nextSlug ? label(nextSlug) : { label: 'Foundations', href: '../foundations.html' })}` }));
  }
  writeFileSync(join(site, 'get-started.html'), shell({ title: 'Get started', depth: 0, current: 'Get started', body: `
<h1>Get started</h1>
<p class="ggds-lead ggds-measure">GGDS is the shared way to build Government of Ghana websites: the styles, page parts and guidance that make every one look familiar, work on low-cost phones and slow networks, and be usable by everyone. Start with the guide for your role.</p>
<ul class="ggds-card-grid ggds-card-grid--4 docs-roles-grid">${ROLES.map(([slug, label, text]) => `
  <li class="ggds-card ggds-card--icon">${cardIcon(ROLE_ICONS[slug])}<h2 class="ggds-card__title"><a class="ggds-card__link" href="get-started/${slug}.html">${label}</a></h2><p class="ggds-card__body">${text}</p></li>`).join('')}
</ul>
<p class="ggds-measure">${withIcon('lightbulb', '<strong>New to GGDS?</strong>')} <a href="get-started/tutorial.html">Follow the tutorial</a>: set GGDS up from a CDN, the download or npm, then build a page and a sign-in form, in about 20 minutes.</p>
${whereToGetIt()}
<h2>What GGDS gives you</h2>
<ul class="ggds-measure">
<li><a href="foundations.html">Foundations</a>: colours with measured contrast, type and spacing, as tokens.</li>
<li><a href="themes.html">Themes</a>: your institution's colour, in the same places on every website.</li>
<li><a href="components/index.html">Components</a>: ${components.length} page parts, each with guidance, live examples, code and accessibility tests.</li>
<li><a href="patterns/index.html">Patterns</a>: whole tasks, such as asking for information or showing search results.</li>
<li><a href="showcase/index.html">Showcase</a>: different things you can build with GGDS, in any institution\u2019s theme.</li>
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

  // The tutorial, and its pages as live demos (examples/tutorial/), from the same templates (docs/tutorial.mjs).
  writeFileSync(join(site, 'get-started', 'tutorial.html'), shell({ title: 'Tutorial: build a page and a sign-in form', depth: 1, current: 'Get started', toc: true, extraCss: ['../assets/themes/themes.css'], crumbs: [{ label: 'Get started', href: '../get-started.html' }],
    feedback: { source: 'docs/tutorial.mjs' },
    body: `${tutorialBody({ esc, version, repo, themes, defaultName: themes.find((t) => t.slug === DEFAULT_THEME).name })}\n${pager({ label: 'Get started as a developer', href: 'developers.html' }, { label: 'Foundations', href: '../foundations.html' })}` }));
  const demoDir = join(site, 'examples', 'tutorial');
  mkdirSync(demoDir, { recursive: true });
  const demo = setups(version).demo;
  for (const [file, text] of Object.entries({ ...tutorialFiles(demo), ...demoPlaceholders(demo) })) writeFileSync(join(demoDir, file), text);
  // The first page again in a few ready-made themes, for step 6.
  // The live React example (packages/react/demo, built by pnpm run build:react).
  const reactDemo = join(root, 'packages', 'react', 'demo-dist');
  if (existsSync(reactDemo)) cpSync(reactDemo, join(site, 'examples', 'react'), { recursive: true });
  for (const slug of demoThemes) {
    const themed = { ...demo, head: `${demo.head}\n  <link rel="stylesheet" href="../../assets/themes/${slug}.css">` };
    writeFileSync(join(demoDir, `index-${slug}.html`), tutorialFiles(themed)['index.html']);
  }
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
  const art = heroArt(themes, { iconCount });
  writeFileSync(join(site, 'assets', 'hero-art.css'), art.css);
  // What GGDS has built: the ministry's website and its agencies' (the example sites show each one).
  const hubSite = agencies.find((a) => a.profile.modules.hub);
  const hubName = hubSite ? `${hubSite.profile.identity.legalName} (${hubSite.profile.identity.shortName})` : '';
  // Screenshots of a few example sites (docs/screenshots/, made by pnpm run screenshots), each linked to its site.
  const shotDir = join(root, 'docs', 'screenshots');
  const shots = EXAMPLES && existsSync(shotDir)
    ? readdirSync(shotDir).filter((f) => f.endsWith('.jpg')).sort()
      .map((f) => ({ file: f, a: agencies.find((x) => x.slug === f.replace(/^\d+-/, '').replace(/\.jpg$/, '')) })).filter((s) => s.a)
    : [];
  if (shots.length) {
    mkdirSync(join(site, 'assets', 'screenshots'), { recursive: true });
    for (const s of shots) copyFileSync(join(shotDir, s.file), join(site, 'assets', 'screenshots', s.file));
  }
  const homeHero = hero({
    art: art.svg,
    artDecorative: false,
    purpose: 'The design system for Government of Ghana websites',
    title: 'Build government websites people can trust',
    lede: 'Tested components, patterns and guidance for Government of Ghana websites. Build services people recognise and everyone can use, on any phone and any connection.',
    search: { action: 'search.html', label: 'Search the GGDS documentation', placeholder: 'Search, for example: header, form errors, theme' },
    tasksLabel: 'Start here:',
    tasks: [
      { label: 'Get started', href: 'get-started.html' },
      { label: 'Browse components', href: 'components/index.html' },
      { label: 'Choose your theme', href: 'themes.html' },
      { label: 'See what you can build', href: 'showcase/index.html' },
    ],
  });
  const cards = [
    ['Get started', 'get-started.html', 'book', 'Guides for developers, designers, content designers and service owners.'],
    ['Components', 'components/index.html', 'grid', `${components.length} page parts, such as headers, forms and menus, each with guidance, a live example and the code.`],
    ['Patterns', 'patterns/index.html', 'clipboard', `${patterns.length} whole tasks, such as asking for information or helping people contact you.`],
    ['Themes', 'themes.html', 'building', 'Give your website your institution’s colour, in the same places on every website.'],
  ].map(([t, h, ic, b]) => `
  <li class="ggds-card ggds-card--icon">${cardIcon(ic)}<h3 class="ggds-card__title"><a class="ggds-card__link" href="${h}">${t}</a></h3><p class="ggds-card__body">${b}</p></li>`).join('');
  // The agency website starter (docs/starter.mjs): a whole website to download. Written to site/starter/ as the
  // live preview, with the GGDS files in ggds/, then zipped as one folder for the download.
  const starterZip = `ggds-agency-starter-${version}.zip`;
  {
    const write = (dir) => {
      for (const [path, text] of Object.entries(starterFiles({ version, theme: DEFAULT_THEME }))) {
        mkdirSync(dirname(join(dir, path)), { recursive: true });
        writeFileSync(join(dir, path), text);
      }
      mkdirSync(join(dir, 'ggds', 'themes'), { recursive: true });
      copyFileSync(join(root, 'packages', 'css', 'dist', 'ggds.min.css'), join(dir, 'ggds', 'ggds.min.css'));
      for (const f of readdirSync(join(root, 'packages', 'js', 'dist')).filter((f) => f.endsWith('.js'))) copyFileSync(join(root, 'packages', 'js', 'dist', f), join(dir, 'ggds', f));
      for (const f of readdirSync(join(root, 'packages', 'themes', 'dist')).filter((f) => f.endsWith('.css'))) copyFileSync(join(root, 'packages', 'themes', 'dist', f), join(dir, 'ggds', 'themes', f));
      for (const f of ['LICENSE', 'LICENSE.md']) copyFileSync(join(root, f), join(dir, f));
    };
    write(join(site, 'starter'));
    // The live preview only (not the download): a bar at the top and bottom of every page, the way back to the
    // documentation, as on the showcase. Its styles are the documentation's (starter-preview.css), so the starter
    // itself looks exactly as it does when downloaded.
    const docsCss = readFileSync(join(root, 'docs', 'docs.css'), 'utf8');
    const exitStart = docsCss.indexOf('/* Example sites: a way back to the documentation');
    const exitEnd = docsCss.indexOf('/* ', docsCss.indexOf('.ggds-footer:has(~ .docs-exit--bottom)'));
    writeFileSync(join(site, 'assets', 'starter-preview.css'), docsCss.slice(exitStart, exitEnd));
    const bar = (where) => `<nav class="docs-exit docs-exit--${where}" aria-label="${where === 'top' ? 'Preview of the agency website starter' : 'Leave the preview'}">
  <div class="ggds-container docs-exit__inner">
    <p class="docs-exit__text"><strong>Preview</strong> of the agency website starter, built with GGDS. ${esc(STARTER.name)} is made up.</p>
    <ul class="docs-exit__links">
      <li><a href="../index.html">Back to GGDS documentation</a></li>
      <li><a href="../showcase/index.html">Showcase</a></li>
      <li><a href="../downloads/${starterZip}" download>Download this website</a></li>
    </ul>
  </div>
</nav>`;
    for (const f of readdirSync(join(site, 'starter')).filter((f) => f.endsWith('.html'))) {
      const file = join(site, 'starter', f);
      writeFileSync(file, readFileSync(file, 'utf8')
        .replace('<link rel="stylesheet" href="assets/site.css">', '<link rel="stylesheet" href="assets/site.css">\n  <link rel="stylesheet" href="../assets/starter-preview.css">')
        .replace('<a class="ggds-skip-link" href="#main">Skip to main content</a>\n', `<a class="ggds-skip-link" href="#main">Skip to main content</a>\n${bar('top')}\n`)
        .replace('</footer>\n', `</footer>\n${bar('bottom')}\n`));
    }
    // The download: the same files in one folder, "ggds-agency-starter", zipped with no machine-specific details.
    const stage = join(root, '.starter-build');
    rmSync(stage, { recursive: true, force: true });
    write(join(stage, 'ggds-agency-starter'));
    mkdirSync(join(site, 'downloads'), { recursive: true });
    const walkFiles = (d) => readdirSync(d, { withFileTypes: true }).flatMap((f) => (f.isDirectory() ? walkFiles(join(d, f.name)) : [join(d, f.name)])).sort();
    execFileSync('zip', ['-X', '-q', join(site, 'downloads', starterZip), ...walkFiles(join(stage, 'ggds-agency-starter')).map((f) => relative(stage, f))], { cwd: stage });
    rmSync(stage, { recursive: true, force: true });
  }
  const starterKb = Math.round(readFileSync(join(site, 'downloads', starterZip)).length / 1024);
  const starterSection = (base) => `<section class="docs-starter" aria-labelledby="starter-h">
<div class="docs-starter__text">
<p class="docs-starter__kicker">${icon('download', 'ggds-icon ggds-icon--sm')} Download a whole website</p>
<h2 id="starter-h">An agency website, ready to make your own</h2>
<p class="ggds-measure">A complete website for a made-up institution, ${esc(STARTER.name)}: a homepage, services, a licence application from start to confirmation, a complaint form, news, publications, jobs, about and contact pages, search, and an accessibility statement. Forms check their answers and search works, with no server. Change the name, the theme and the words, and put it online.</p>
<div class="ggds-button-group">
<a class="ggds-button ggds-with-icon" href="${base}downloads/${starterZip}" download>${icon('download')}<span>Download the website (ZIP, ${starterKb} KB)</span></a>
<a class="ggds-button ggds-button--secondary ggds-with-icon" href="${base}starter/index.html"><span>See it working</span>${icon('arrow-right')}</a>
</div>
<p class="docs-starter__small">Plain HTML, GGDS ${version} and every institution theme, with a README on how to make it yours. It works under a strict Content Security Policy.</p>
</div>
</section>`;

  // What you can build: the showcase first (six kinds of government product, docs/showcase.mjs), then the example
  // websites. A showcase's screenshot is docs/screenshots/showcase-<slug>.jpg (pnpm run screenshots).
  const scShot = (slug) => existsSync(join(shotDir, `showcase-${slug}.jpg`)) ? `showcase-${slug}.jpg` : '';
  // A showcase as a tile: its first page in a browser window (or a phone), which scrolls through the whole page when
  // pointed at or focused, with what it is built from sliding up. base: the path to the site's root.
  const compName = Object.fromEntries(components.map((c) => [c.slug, c.name]));
  const showcaseTile = (sc, base, href) => `
  <li class="docs-showcase__item">
    <a class="docs-showcase__link" href="${href}">
      <span class="docs-showcase__frame docs-showcase__frame--${sc.slug}${sc.phone ? ' docs-showcase__frame--phone' : ''}">
        <span class="docs-showcase__bar" aria-hidden="true"><span class="docs-showcase__dots"></span><span class="docs-showcase__address">${esc(sc.org)}</span></span>
        <span class="docs-showcase__screen">${scShot(sc.slug) ? `<img class="docs-showcase__img" src="${base}assets/screenshots/${scShot(sc.slug)}" alt="" loading="lazy">` : `<span class="docs-showcase__placeholder">${icon(sc.icon, 'ggds-icon ggds-icon--xl')}</span>`}</span>
        <span class="docs-showcase__peek" aria-hidden="true"><span class="docs-showcase__peek-pages">${sc.pages.length} ${sc.pages.length === 1 ? 'page' : 'pages'}</span> ${sc.uses.slice(0, 4).map(([, label]) => `<span class="docs-showcase__chip">${esc(label)}</span>`).join('')}</span>
      </span>
      <span class="docs-showcase__kind">${icon(sc.icon, 'ggds-icon ggds-icon--sm')} ${esc(sc.name)}</span>
      <span class="docs-showcase__name">${esc(sc.title)}</span>
    </a>
    <p class="docs-showcase__summary">${esc(sc.summary)}</p>
  </li>`;
  const common = SHOWCASES.filter((sc) => sc.common);
  const more = SHOWCASES.filter((sc) => !sc.common);
  // Each showcase's colour, for its tile (the site allows no style attributes).
  writeFileSync(join(site, 'assets', 'showcase-tiles.css'), `${SHOWCASES.map((sc) => `.docs-showcase__frame--${sc.slug} { --docs-sc: ${sc.colour}; }`).join('\n')}\n`);
  const inUse = `
<section class="docs-home-section" aria-labelledby="built-h">
<div class="docs-section-head"><h2 id="built-h">What you can build</h2><a href="showcase/index.html">${withIcon('arrow-right', 'See the showcase', true)}</a></div>
<p class="ggds-lead ggds-measure">The things government institutions build again and again, made with GGDS: online services, payments, tracking, bookings, registers, accounts, staff tools, and jobs and tenders. Point at one to see the whole page.</p>
<p class="ggds-measure">Each template works in any institution’s theme, including MoCDTI’s and each of its agencies’: open one and choose the theme at the top.</p>
${starterSection('')}
<h3 class="docs-showcase__group">Built most often</h3>
<ul class="docs-showcase">${common.map((sc) => showcaseTile(sc, '', `showcase/${sc.pages[0].file}`)).join('')}
</ul>
<h3 class="docs-showcase__group">More examples</h3>
<ul class="docs-showcase docs-showcase--more">${more.map((sc) => showcaseTile(sc, '', `showcase/${sc.pages[0].file}`)).join('')}
</ul>
<p class="docs-shots__note">Every organisation, person and figure in the showcase is made up.</p>
${EXAMPLES && hubSite ? `<div class="docs-section-head docs-section-head--sub"><h3>And websites for real institutions</h3><a href="agencies/index.html">${withIcon('arrow-right', `See all ${agencies.length} example sites`, true)}</a></div>
<p class="ggds-measure">${agencies.length} example sites: a website for the ${esc(hubName)} and for ${agencies.length - 1} of its agencies. Each has its own colour, sections and common tasks, and shares everything else. They are examples, not the institutions’ live websites.</p>
${shots.length ? `<ul class="docs-shots docs-shots--small">${shots.map(({ file, a }) => `
  <li class="docs-shots__item"><a class="docs-shots__link" href="agencies/${a.slug}.html">
    <img class="docs-shots__img" src="assets/screenshots/${file}" alt="" width="640" height="400" loading="lazy">
    <span class="docs-shots__name">${esc(a.profile.identity.legalName)}</span>
  </a></li>`).join('')}
</ul>` : ''}` : ''}
</section>`;
  mkdirSync(join(site, 'assets', 'screenshots'), { recursive: true });
  for (const sc of SHOWCASES) if (scShot(sc.slug)) copyFileSync(join(shotDir, scShot(sc.slug)), join(site, 'assets', 'screenshots', scShot(sc.slug)));
  // The showcase pages, each in its own colour, and the showcase's own page in the documentation.
  {
    const dir = join(site, 'showcase');
    mkdirSync(join(site, 'assets', 'showcase'), { recursive: true });
    for (const [slug, css] of Object.entries(showcaseThemes())) writeFileSync(join(site, 'assets', 'showcase', `${slug}.css`), css);
    for (const p of showcasePages(themes)) {
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, p.file), shell({ title: p.title, depth: 1, body: p.body, bare: true, noindex: true, extraCss: ['../assets/showcase/showcase.css', `../assets/showcase/${p.sc.slug}.css`], scripts: ['assets/showcase/showcase.js'] }));
    }
    writeFileSync(join(site, 'assets', 'showcase', 'showcase.css'), showcaseCss());
    copyFileSync(join(root, 'docs', 'showcase.js'), join(site, 'assets', 'showcase', 'showcase.js'));
    for (const [file, text] of Object.entries(showcaseFiles())) writeFileSync(join(dir, file), text);
    const byName = Object.fromEntries(components.map((c) => [c.slug, c]));
    // Each example's code on its own page, so the showcase page stays light.
    for (const sc of SHOWCASES) {
      writeFileSync(join(dir, `code-${sc.slug}.html`), shell({ title: `The HTML of ${sc.name.toLowerCase()}`, depth: 1, current: '', noindex: false,
        crumbs: [{ label: 'Showcase', href: 'index.html' }], body: `
<h1>The HTML of “${esc(sc.title)}”</h1>
<p class="ggds-lead ggds-measure">What goes inside <code>&lt;main&gt;</code> on each page of ${esc(sc.name.toLowerCase())}. The skip link, banner, header and footer around it are on the <a href="../components/page.html">page template</a>. Switch any block to JSX for React.</p>
<p><a class="ggds-with-icon" href="${sc.pages[0].file}"><span>Open the example</span>${icon('arrow-right')}</a></p>
${sc.pages.map((pg) => `<h2 id="${pg.file.replace('.html', '')}">${esc(pg.title)} <span class="sc-muted">(${pg.file})</span></h2>
<pre class="docs-code" tabindex="0" aria-label="HTML of ${esc(pg.title)}"><code>${esc(`${pg.band ?? ''}${pg.body}`.trim())}</code></pre>`).join('\n')}
${pager({ label: 'All showcases', href: 'index.html' }, null)}` }));
    }
    writeFileSync(join(dir, 'index.html'), shell({ title: 'Showcase: what you can build', depth: 1, current: '', crumbs: [], extraCss: ['../assets/showcase-tiles.css'], body: `
<h1>What you can build with GGDS</h1>
<p class="ggds-lead ggds-measure">${SHOWCASES.length} kinds of government product, starting with the ${common.length} that institutions build most often, each made from GGDS components and tokens. Open one, resize the window, use it with a keyboard or a screen reader: it is a real page.</p>
<p class="ggds-measure">Each has its own colour, and works in every institution’s theme: choose MoCDTI or any of its agencies at the top of the page. The same template, in the same place, in your institution’s colour. See all the colours on <a href="../themes.html">Themes</a>.</p>
<p class="ggds-measure">Every organisation, person, number and figure here is made up. The pages add only a little layout of their own, written with GGDS tokens: you can read it in <a href="../assets/showcase/showcase.css">showcase.css</a>.</p>
${starterSection('../')}
${[['Built most often', common], ['More examples', more]].map(([group, list]) => `
<h2 id="${slugify(group)}">${group}</h2>
${list.map((sc) => `<section class="docs-scx" aria-labelledby="sc-${sc.slug}">
<h3 class="docs-scx__title" id="sc-${sc.slug}">${esc(sc.name)}: ${esc(sc.title)}</h3>
<div class="docs-scx__grid">
<ul class="docs-showcase docs-showcase--single">${showcaseTile(sc, '../', sc.pages[0].file)}</ul>
<div class="docs-scx__info">
<h4>Built from</h4>
<p>${sc.uses.filter(([slug]) => byName[slug]).map(([slug, label]) => `<a href="../components/${slug}.html">${esc(label)}</a>`).join(', ')}${sc.patterns?.length ? `; patterns: ${sc.patterns.map(([slug, label]) => `<a href="../patterns/${slug}.html">${esc(label)}</a>`).join(', ')}` : ''}.</p>
<h4>Behind it, your team still builds</h4>
<ul>${sc.behind.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>
<h4>Pages</h4>
<ol>${sc.pages.map((pg) => `<li><a href="${pg.file}">${esc(pg.title)}</a></li>`).join('')}</ol>
<p><a class="ggds-with-icon" href="code-${sc.slug}.html">${icon('code')}<span>The HTML of ${sc.pages.length === 1 ? 'its page' : `its ${sc.pages.length} pages`}, to copy</span></a></p>
</div>
</div>
</section>`).join('\n')}`).join('\n')}
</ul>` }));
  }
  writeFileSync(join(site, 'index.html'), shell({ title: 'Home', depth: 0, lead: homeHero, extraCss: ['assets/hero-art.css', 'assets/showcase-tiles.css'], body: `
<section class="docs-home-section" aria-labelledby="what-h">
<h2 id="what-h">What is GGDS?</h2>
<p class="ggds-lead ggds-measure">The Ghana Government Design System (GGDS) is a free, shared set of building blocks for government websites: page parts such as headers, forms and menus, the code for each, and guidance on using them. Websites built with it look and work the same way, so someone who has used one government website can use them all.</p>
<dl class="docs-facts">
  <dt>Who is it for?</dt><dd>Ministries, departments and agencies, and the suppliers who build and run their websites. There is a <a href="get-started.html">guide for each role</a>: developers, designers, content designers and service owners.</dd>
  <dt>Do I have to use it?</dt><dd>Not yet. GGDS is a draft. NITA plans to make it official guidance for government websites at version 1.0, after independent accessibility testing with disabled people.</dd>
  <dt>What does it cost?</dt><dd>Nothing. Any institution or supplier can use it, change it and share it, free of charge.</dd>
  <dt>Who maintains it?</dt><dd>The National Information Technology Agency (NITA). Anyone can <a href="contribute.html">report a problem or suggest a change</a>.</dd>
</dl>
</section>
<section class="docs-home-section" aria-labelledby="sections-h">
<h2 id="sections-h">What is in GGDS</h2>
<ul class="ggds-card-grid ggds-card-grid--4">${cards}
</ul>
</section>${inUse}
<section class="docs-home-section docs-proof" aria-labelledby="proof-h">
<h2 id="proof-h">Built for the people who use government websites</h2>
<p class="ggds-measure">This documentation is built only with GGDS, so every page here is a test of what it promises. Each check below runs every time GGDS changes.</p>
<ul class="docs-proof__list">
  <li><strong>Any phone</strong> No page scrolls sideways, even on a small 320px screen.</li>
  <li><strong>Slow networks</strong> ${kb(join(site, 'assets', 'ggds.css'))} KB of styles and ${jsKb} KB of script for the whole system, and every page works without the script.</li>
  <li><strong>Everyone</strong> Every kind of page is checked against the WCAG 2.2 AA accessibility standard, on phones and computers.</li>
  <li><strong>Easy to read</strong> Every colour pair is measured. A colour too faint to read cannot be published.</li>
</ul>
<details class="ggds-disclosure">
<summary class="ggds-disclosure__summary">Technical details for developers</summary>
<div class="ggds-disclosure__content">
<ul>
<li>${components.length} components with ${exampleCount} live examples, and ${all.length + 1} pages built${EXAMPLES ? `, ${sitePages} of them on the example sites` : ''}.</li>
<li>No inline scripts or styles: everything runs under a strict Content Security Policy.</li>
<li>Plain HTML and CSS, with packages for npm, Django, Astro and WordPress.</li>
</ul>
</div>
</details>
</section>
<section class="docs-home-section" aria-labelledby="licence">
<h2 id="licence">Free to use</h2>
<p class="ggds-measure">GGDS code is free to use, change and share under the Apache-2.0 licence. The national flag, the coat of arms and institutions’ logos are not part of the licence: use them only as their owners allow.</p>
</section>` }));
}

// Search: an index of the documentation, a page that searches it with a small script, and an A to Z of every
// page for browsers without JavaScript. The example sites' own pages are left out: they are placeholders.
{
  const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((f) => (f.isDirectory() ? walk(join(d, f.name)) : [join(d, f.name)]));
  const text = (h) => h.replace(/<(script|style|nav|header|footer)[\s\S]*?<\/\1>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&rsquo;/g, '\u2019').replace(/\s+/g, ' ').trim();
  const docs = walk(site).filter((f) => f.endsWith('.html') && !/[\\/](examples|starter|agencies[\\/][a-z0-9-]+[\\/])[\\/]?/.test(f) && !/[\\/]agencies[\\/](?!index)[a-z0-9-]+\.html$/.test(f))
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

for (const f of ['docs.js', 'search.js', 'icons.js']) copyFileSync(join(root, 'docs', f), join(site, 'assets', f));
