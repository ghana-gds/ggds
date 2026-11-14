// The agency website starter in a framework: the same pages as the plain HTML starter (docs/starter.mjs), made as a
// Next.js, Astro or Django project. The parts around every page (skip link, banner, header, footer, tab bar) come
// from that framework's GGDS Page component, so they follow GGDS upgrades; the words of each page are the same GGDS
// markup as the HTML starter, ready to edit. tests/unit/starter-stacks.test.mjs and ggds-django's test_starter.py
// render every page of every framework and check it against the HTML starter, element by element.
//
// Runs in the browser (the website builder) and in Node (@ggds/create), so no Node imports.
import { esc } from './parts.mjs';
import { toJsx } from './jsx.mjs';

/** The kinds of website the starter makes: [id, name, what it is]. html first: it is the default. */
export const STACKS = [
  { id: 'html', label: 'Plain HTML', hint: 'Pages to copy onto any web server. No tools needed.' },
  { id: 'next', label: 'Next.js (React)', hint: 'A Next.js project with @ggds/react, exported as a static website.' },
  { id: 'astro', label: 'Astro', hint: 'An Astro project with @ggds/astro, built as a static website.' },
  { id: 'django', label: 'Django', hint: 'A Django project with ggds-django: template tags and every form.' },
];
export const STACK_IDS = STACKS.map((s) => s.id);

// ---- Addresses ------------------------------------------------------------------------------------------------
// The HTML starter links page to page as files (services.html) so it works from the disk. A framework serves clean
// addresses: /services/. Its files (assets/...) are served from assetBase.

/** The address of a page: index.html → /, services.html → /services/. */
export const route = (file) => (file === 'index.html' ? '/' : `/${file.replace(/\.html$/, '')}/`);
const slugOf = (file) => (file === 'index.html' ? 'index' : file.replace(/\.html$/, ''));

function mapUrl(url, assetBase) {
  const page = url.match(/^([a-z0-9-]+\.html)([?#].*)?$/);
  if (page) return `${route(page[1])}${page[2] ?? ''}`;
  if (url.startsWith('assets/')) return `${assetBase}${url.slice('assets/'.length)}`;
  return url;
}
/** Every href, action and src in some HTML, moved to the framework's addresses. */
const relink = (html, assetBase) => html.replace(/\b(href|action|src)="([^"]*)"/g, (_, a, u) => `${a}="${mapUrl(u, assetBase)}"`);

/** The plain HTML starter's pages ({ file: html }) at a framework's addresses: what each framework page must match. */
export const relinkPages = (files, assetBase) => Object.fromEntries(Object.entries(files).filter(([f]) => f.endsWith('.html')).map(([f, html]) => [f, relink(html, assetBase)]));

/** The parts around a page, with the framework's addresses. */
/** The site's details as the React and Astro components take them. */
const componentSite = (site) => ({
  name: site.name, purpose: site.purpose, live: site.live, logo: site.logo,
  banner: { shortName: site.banner.shortName, host: site.banner.host, official: site.banner.official, register: { href: site.banner.registerHref } },
  header: { name: site.header.name, initials: site.header.initials, nav: site.header.nav, navId: site.header.navId, home: site.header.home, search: { href: site.header.search } },
  footer: site.footer,
  tabs: site.tabs,
});

function frameFor(model, assetBase) {
  const { frame, raw } = model;
  const u = (x) => mapUrl(x, assetBase);
  const link = (l) => ({ label: l.label, href: u(l.href) });
  return {
    name: raw.name,
    short: raw.short,
    purpose: raw.purpose,
    live: raw.live,
    logo: raw.logo ? u(raw.logo) : '',
    banner: { shortName: frame.banner.shortName, host: frame.banner.host, official: !frame.banner.unofficial, registerHref: frame.banner.registerHref },
    header: { name: frame.header.name, initials: raw.short, nav: frame.header.nav.map(link), navId: frame.header.navId, home: u(frame.header.home), search: u(frame.header.search) },
    footer: {
      name: frame.footer.name,
      purpose: frame.footer.purpose,
      contact: { ...frame.footer.contact, moreHref: u(frame.footer.contact.moreHref) },
      sections: frame.footer.sections.map((s) => ({ label: s.label, href: u(s.href), links: s.links.map(link) })),
      bar: frame.footer.bar.map(([label, href]) => ({ label, href: u(href) })),
    },
    tabs: frame.tabs({}).map((t) => ({ label: t.label, href: u(t.href), icon: t.icon })),
  };
}

/** Each page with what a framework needs: its address, its section and tab, and its words at the new addresses. */
function pagesFor(model, assetBase) {
  return model.pages.map((p) => {
    const current = model.frame.current(p);
    const tab = model.frame.tabs(p).find((t) => t.current);
    return {
      ...p,
      slug: slugOf(p.file),
      route: route(p.file),
      section: current ? route(current) : null,
      tab: tab ? route(tab.href) : null,
      main: relink(p.main, assetBase),
      search: p.scripts.includes('assets/search.js'),
    };
  });
}

/** The search index, at the new addresses. */
const searchIndex = (model) => `${JSON.stringify(JSON.parse(model.assets.searchIndex).map((e) => ({ ...e, url: route(e.url) })))}\n`;

/** The form checks, importing GGDS from the package (or, for Django, from ggds-django's static files). */
const formsJs = (model, from) => model.assets.siteJs.replace("from '../ggds/index.js'", `from '${from}'`);
/** The search script, as a function (no top-level await, which some bundlers refuse), reading the index from url. */
const searchJs = (model, url) => {
  const body = model.assets.searchJs.replace("fetch('search-index.json')", `fetch('${url}')`);
  return `// Search as you type, from ${url}.\n(async () => {\n${body.replace(/^(?=.)/gm, '  ')}})();\n`;
};

/** Import lines for a file the starter writes (built here, so the bundler's import check does not read them as this module's). */
const imports = (...lines) => lines.join('\n');
const pkgName = (raw) => `${raw.short.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-website`;
const js = (v) => JSON.stringify(v, null, 2);
const pascal = (slug) => slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('');
const indent = (text, by) => text.replace(/^(?=.)/gm, by);
const isTheme = (theme) => !/^#[0-9a-f]{6}$/i.test(theme);

/** The documents and logo every framework serves as they are, under dir. */
function staticFiles(model, dir) {
  const files = {};
  for (const [path, text] of Object.entries(model.assets.documents)) files[`${dir}${path.slice('assets/'.length)}`] = text;
  return files;
}

/** JSX for a page's words. A bare data- attribute gets an empty value, as in the HTML: React would write "true". */
const pageJsx = (html) => toJsx(html).replace(/(<[a-zA-Z][^<>]*?\s)(data-[a-z-]+)(?=[\s/>])(?!=)/g, '$1$2=""');

// ---- Next.js ----------------------------------------------------------------------------------------------------

function nextFiles(model, { version }) {
  const assetBase = '/assets/';
  const site = frameFor(model, assetBase);
  const pages = pagesFor(model, assetBase);
  const { raw } = model;
  const files = {};
  const theme = isTheme(raw.theme) ? `import '@ggds/themes/${raw.theme}.css';` : "import './theme.css';";

  files['package.json'] = `${js({
    name: pkgName(raw),
    private: true,
    scripts: { dev: 'next dev', build: 'next build && node scripts/csp.mjs', start: 'npx serve@14 out' },
    dependencies: {
      '@ggds/css': `^${version}`, '@ggds/js': `^${version}`, '@ggds/react': `^${version}`, ...(isTheme(raw.theme) ? { '@ggds/themes': `^${version}` } : {}),
      next: '^16.4.6', react: '^19.3.1', 'react-dom': '^19.3.1',
    },
  })}\n`;
  files['next.config.mjs'] = `// A static website: \`npm run build\` writes every page to out/, to copy onto any web server.
// trailingSlash: each page is a folder (out/services/index.html), so its address works on every host.
export default {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  poweredByHeader: false,
};
`;
  files['jsconfig.json'] = `${js({ compilerOptions: { jsx: 'preserve' } })}\n`;
  const { logo, live, ...props } = componentSite(site);
  files['lib/site.jsx'] = `// ${raw.name.replace(/\n/g, ' ')}: the parts around every page. Change your details here, once.
export const SITE = ${js(props)};
${logo ? `
// Your logo, in the header and the footer.
SITE.header.logo = <img className="ggds-header__logo" src="${logo}" alt="" width={44} height={44} />;
SITE.footer.logo = <img className="ggds-footer__logo" src="${logo}" alt="" width={48} height={48} />;
` : `
// Until your logo is approved, your initials are shown in a round badge. Then add, with the file in public/assets/:
// SITE.header.logo = <img className="ggds-header__logo" src="/assets/logo.svg" alt="" width={44} height={44} />;
// SITE.footer.logo = <img className="ggds-footer__logo" src="/assets/logo.svg" alt="" width={48} height={48} />;
`}`;
  files['components/SitePage.jsx'] = `import { Page } from '@ggds/react';
${imports('import { SITE } from \'../lib/site.jsx\';', 'import Scripts from \'./Scripts.jsx\';')}

/** Every page: GGDS's page parts around its words. section: the header link to mark; tab: the tab bar's. */
export default function SitePage({ section, tab, search = false, children }) {
  return (
    <>
      <Page banner={SITE.banner} header={{ ...SITE.header, current: section }} footer={SITE.footer}
        tabs={SITE.tabs.map((t) => ({ ...t, current: t.href === tab }))} mainClassName="">
        {children}
      </Page>
      <Scripts search={search} />
    </>
  );
}
`;
  files['components/Scripts.jsx'] = `'use client';
// The form checks on every page, and search on the search page. Pages link with <a>, so each page loads afresh
// and these run once for it. Without JavaScript the forms still send, and the server checks them.
${imports('import { useEffect } from \'react\';')}

export default function Scripts({ search }) {
  useEffect(() => {
    import('../lib/forms.js');
    if (search) import('../lib/search.js');
  }, [search]);
  return null;
}
`;
  files['lib/forms.js'] = formsJs(model, '@ggds/js');
  if (pages.some((p) => p.search)) files['lib/search.js'] = searchJs(model, '/search-index.json');
  files['app/layout.jsx'] = `import '@ggds/css/ggds.min.css';
${theme}
import './site.css';

export const metadata = {
  title: { default: ${JSON.stringify(raw.name)}, template: ${JSON.stringify(`%s | ${raw.name}`)} },
  description: ${JSON.stringify(raw.purpose)},${raw.live ? '' : `
  // Remove this line when your website goes live, so search engines can find it.
  robots: { index: false, follow: false },`}
};

export default function RootLayout({ children }) {
  return (
    <html lang="en-GB">
      <body>{children}</body>
    </html>
  );
}
`;
  files['app/site.css'] = model.assets.siteCss;
  if (!isTheme(raw.theme)) files['app/theme.css'] = model.assets.themeCss;
  for (const p of pages) {
    const name = p.file === '404.html' ? 'NotFound' : `${pascal(p.slug)}Page`;
    const path = p.file === 'index.html' ? 'app/page.jsx' : p.file === '404.html' ? 'app/not-found.jsx' : `app/${p.slug}/page.jsx`;
    const up = '../'.repeat(path.split('/').length - 1);
    const title = p.file === 'index.html' ? `{ absolute: ${JSON.stringify(raw.name)} }` : JSON.stringify(p.title);
    const props = [p.section && `section="${p.section}"`, p.tab && `tab="${p.tab}"`, p.search && 'search'].filter(Boolean).join(' ');
    files[path] = `import SitePage from '${up}components/SitePage.jsx';
${p.file === '404.html' ? '' : `\nexport const metadata = { title: ${title} };\n`}
export default function ${name}() {
  return (
    <SitePage${props ? ` ${props}` : ''}>
${indent(pageJsx(p.main), '      ')}
    </SitePage>
  );
}
`;
  }
  Object.assign(files, staticFiles(model, 'public/assets/'));
  files['public/search-index.json'] = searchIndex(model);
  for (const [path, text] of Object.entries(model.assets.hosting)) files[path.startsWith('hosting/') ? path : `public/${path}`] = text;
  files['scripts/csp.mjs'] = CSP_JS;
  files['.gitignore'] = 'node_modules/\n.next/\nout/\n';
  files['README.md'] = frameworkReadme(model, {
    name: 'Next.js', version, run: 'npm install\nnpm run dev', build: 'npm run build', out: '`out/`',
    layout: '- `app/`: one folder per page, each with `page.jsx` holding its words. `app/layout.jsx` loads GGDS and your theme.\n- `components/SitePage.jsx`: GGDS\'s `Page` from `@ggds/react` (skip link, banner, header, footer, tab bar) around every page.\n- `lib/site.jsx`: your name, contact details, navigation and footer links, in one place.\n- `lib/forms.js`: checks forms before they are sent and shows errors the GGDS way. `lib/search.js`: search, as you type.\n- `public/`: your documents (`public/assets/files/`), `search-index.json`, and the server settings (`.htaccess`, `_headers`).',
    extra: `- **Security policy.** Next.js puts small scripts in every page. \`npm run build\` runs \`scripts/csp.mjs\`, which gives
  each page its own Content Security Policy in \`out/_headers\` and \`out/.htaccess\`, allowing that page's scripts by
  their hash. The policy stays strict (no \`'unsafe-inline'\`) and \`@ggds/check\` passes. For nginx, give each page's
  \`location\` the policy listed for it in \`out/_headers\`. Run the build again after changing a page.`,
  });
  return { files, assetDir: 'public/assets/' };
}

// After `next build`: each page's own security policy, allowing by hash the scripts Next.js writes into it, so the
// policy can stay strict without 'unsafe-inline'. Plain Node, no packages.
const CSP_JS = `// After next build (npm run build): gives each page of out/ its own Content Security Policy, allowing by hash the
// scripts Next.js wrote into that page, so the policy stays strict: script-src 'self' and those hashes, never
// 'unsafe-inline'. One policy per page keeps each header short (a policy for the whole site would list every hash).
// Writes them into out/_headers (Netlify, Cloudflare Pages) and out/.htaccess (Apache). Plain Node, no packages.
${imports('import { createHash } from \'node:crypto\';', 'import { existsSync, readFileSync, readdirSync, writeFileSync } from \'node:fs\';', 'import { join, relative, sep } from \'node:path\';', 'import { fileURLToPath } from \'node:url\';')}

const out = fileURLToPath(new URL('../out/', import.meta.url));
const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((f) => (f.isDirectory() ? walk(join(d, f.name)) : [join(d, f.name)]));

// Each page: the addresses it is served at, and its script-src.
const pages = walk(out).filter((f) => f.endsWith('.html')).sort().map((file) => {
  const rel = relative(out, file).split(sep).join('/');
  const hashes = new Set();
  for (const [, attrs, body] of readFileSync(file, 'utf8').matchAll(/<script\\b([^>]*)>([\\s\\S]*?)<\\/script>/g)) {
    if (!/\\bsrc=/.test(attrs) && body) hashes.add(\`'sha256-\${createHash('sha256').update(body).digest('base64')}'\`);
  }
  const folder = rel === 'index.html' ? '/' : rel.endsWith('/index.html') ? \`/\${rel.slice(0, -'index.html'.length)}\` : null;
  return { paths: folder ? [folder, \`/\${rel}\`] : [\`/\${rel}\`], scriptSrc: ["script-src 'self'", ...[...hashes].sort()].join(' ') };
});
const withScripts = (policy, page) => policy.replace(/script-src 'self'[^;]*/, page.scriptSrc);

// _headers: two values of one header are joined with a comma, which browsers read as two policies that must both
// allow a script. So the policy moves from /* to each page.
const headersFile = join(out, '_headers');
if (existsSync(headersFile)) {
  const text = readFileSync(headersFile, 'utf8');
  const policy = text.match(/^ +Content-Security-Policy: (.*)$/m)?.[1];
  if (policy) {
    const rules = pages.flatMap((p) => p.paths.map((path) => \`\${path}\\n  Content-Security-Policy: \${withScripts(policy, p)}\\n\`));
    writeFileSync(headersFile, \`\${text.replace(/^ +Content-Security-Policy: .*\\n/m, '').trimEnd()}\\n\\n# Each page's security policy, with the hashes of the scripts Next.js wrote into it (scripts/csp.mjs).\\n\${rules.join('\\n')}\`);
  }
}

// .htaccess: the policy for the whole site stays, and each page replaces it with its own.
const htaccessFile = join(out, '.htaccess');
if (existsSync(htaccessFile)) {
  const text = readFileSync(htaccessFile, 'utf8');
  const line = text.match(/^( *)Header always set Content-Security-Policy "([^"]*)"$/m);
  if (line) {
    const [whole, pad, policy] = line;
    const rules = pages.map((p) => \`\${pad}<If "%{REQUEST_URI} in { \${p.paths.map((x) => \`'\${x}'\`).join(', ')} }">\\n\${pad}  Header always set Content-Security-Policy "\${withScripts(policy, p)}"\\n\${pad}</If>\`);
    writeFileSync(htaccessFile, text.replace(whole, \`\${whole}\\n\${pad}# Each page's own policy, with the hashes of the scripts Next.js wrote into it (scripts/csp.mjs).\\n\${rules.join('\\n')}\`));
  }
}

const longest = Math.max(...pages.map((p) => p.scriptSrc.length));
console.log(\`csp: a security policy for each of \${pages.length} pages in out/_headers and out/.htaccess (the longest script-src is \${longest} characters).
For nginx, give each page's location the script-src listed for it in out/_headers.\`);
`;

// ---- Astro ------------------------------------------------------------------------------------------------------

/** Braces in an Astro page's text are expressions: write them as text. Attributes in quotes are left as they are. */
const astroText = (html) => html.replace(/>([^<]*)</g, (_, text) => `>${text.replace(/[{}]/g, (c) => `{'${c}'}`)}<`);

function astroFiles(model, { version }) {
  const assetBase = '/assets/';
  const site = frameFor(model, assetBase);
  const pages = pagesFor(model, assetBase);
  const { raw } = model;
  const files = {};
  files['package.json'] = `${js({
    name: pkgName(raw),
    private: true,
    type: 'module',
    scripts: { dev: 'astro dev', build: 'astro build', preview: 'astro preview' },
    dependencies: {
      '@ggds/astro': `^${version}`, '@ggds/css': `^${version}`, '@ggds/js': `^${version}`, ...(isTheme(raw.theme) ? { '@ggds/themes': `^${version}` } : {}),
      astro: '^7.4.7',
    },
  })}\n`;
  files['astro.config.mjs'] = `import { defineConfig } from 'astro/config';

// A static website: \`npm run build\` writes every page to dist/ (dist/services/index.html), to copy onto any web
// server. Styles and scripts stay in their own files, so the strict security policy in public/_headers works.
export default defineConfig({
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'never' },
  vite: { build: { assetsInlineLimit: 0 } },
});
`;
  files['src/data/site.js'] = `// ${raw.name.replace(/\n/g, ' ')}: the parts around every page. Change your details here, once.
// logo: your logo's address (put the file in public/assets/); until it is approved, your initials are shown.
export const SITE = ${js(componentSite(site))};
`;
  files['src/layouts/Site.astro'] = `---
// Every page: GGDS's Page from @ggds/astro (skip link, banner, header, footer, tab bar) around its words.
// section: the header link to mark; tab: the tab bar's.
import '@ggds/css/ggds.min.css';
import '${isTheme(raw.theme) ? `@ggds/themes/${raw.theme}.css` : '../styles/theme.css'}';
import '../styles/site.css';
${imports('import Page from \'@ggds/astro/Page.astro\';', 'import { SITE } from \'../data/site.js\';')}

const { title, section, tab } = Astro.props;
---
<!doctype html>
<html lang="en-GB">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{title ? \`\${title} | \${SITE.name}\` : SITE.name}</title>
  <meta name="description" content={SITE.purpose}>
  {!SITE.live && <meta name="robots" content="noindex, nofollow">}
</head>
<body>
  <Page banner={SITE.banner} header={{ ...SITE.header, current: section }} footer={SITE.footer}
    tabs={SITE.tabs.map((t) => ({ ...t, current: t.href === tab }))} mainClass="">
    {SITE.logo && <img slot="logo" class="ggds-header__logo" src={SITE.logo} alt="" width="44" height="44">}
    {SITE.logo && <img slot="footer-logo" class="ggds-footer__logo" src={SITE.logo} alt="" width="48" height="48">}
    <slot />
  </Page>
  <script>
    import '@ggds/js/auto';
    import '../scripts/forms.js';
  </script>
</body>
</html>
`;
  files['src/styles/site.css'] = model.assets.siteCss;
  if (!isTheme(raw.theme)) files['src/styles/theme.css'] = model.assets.themeCss;
  files['src/scripts/forms.js'] = formsJs(model, '@ggds/js');
  if (pages.some((p) => p.search)) files['src/scripts/search.js'] = searchJs(model, '/search-index.json');
  for (const p of pages) {
    const path = `src/pages/${p.file === '404.html' ? '404' : p.slug}.astro`;
    const attrs = [p.file !== 'index.html' && `title=${JSON.stringify(p.title)}`, p.section && `section="${p.section}"`, p.tab && `tab="${p.tab}"`].filter(Boolean).join(' ');
    files[path] = `---
${imports('import Site from \'../layouts/Site.astro\';')}
---
<Site${attrs ? ` ${attrs}` : ''}>
${astroText(p.main).trim()}
</Site>${p.search ? `
<script>
  import '../scripts/search.js';
</script>` : ''}
`;
  }
  Object.assign(files, staticFiles(model, 'public/assets/'));
  files['public/search-index.json'] = searchIndex(model);
  for (const [path, text] of Object.entries(model.assets.hosting)) files[path.startsWith('hosting/') ? path : `public/${path}`] = text;
  files['.gitignore'] = 'node_modules/\n.astro/\ndist/\n';
  files['README.md'] = frameworkReadme(model, {
    name: 'Astro', version, run: 'npm install\nnpm run dev', build: 'npm run build', out: '`dist/`',
    layout: '- `src/pages/`: one file per page, holding its words.\n- `src/layouts/Site.astro`: GGDS\'s `Page` from `@ggds/astro` (skip link, banner, header, footer, tab bar) around every page, with GGDS and your theme.\n- `src/data/site.js`: your name, contact details, navigation and footer links, in one place.\n- `src/scripts/forms.js`: checks forms before they are sent and shows errors the GGDS way. `src/scripts/search.js`: search, as you type.\n- `public/`: your documents (`public/assets/files/`), `search-index.json`, and the server settings (`.htaccess`, `_headers`).',
    extra: '',
  });
  return { files, assetDir: 'public/assets/' };
}

// ---- Django -----------------------------------------------------------------------------------------------------

/** A page's words as Django template text: {{, {%, {# and their ends would be read as template code, so write them as text. */
const TEMPLATE_TAGS = { '{{': 'openvariable', '}}': 'closevariable', '{%': 'openblock', '%}': 'closeblock', '{#': 'opencomment', '#}': 'closecomment' };
const djangoText = (html) => html.replace(/\{\{|\}\}|\{%|%\}|\{#|#\}/g, (m) => `{% templatetag ${TEMPLATE_TAGS[m]} %}`);
/** Python literal for a JSON-like value. */
const py = (v, pad = '') => {
  if (v === null || v === undefined) return 'None';
  if (v === true) return 'True';
  if (v === false) return 'False';
  if (typeof v === 'number') return String(v);
  if (typeof v === 'string') return JSON.stringify(v);
  const inner = `${pad}    `;
  if (Array.isArray(v)) return v.length ? `[\n${v.map((x) => `${inner}${py(x, inner)},`).join('\n')}\n${pad}]` : '[]';
  const entries = Object.entries(v);
  return entries.length ? `{\n${entries.map(([k, x]) => `${inner}${JSON.stringify(k)}: ${py(x, inner)},`).join('\n')}\n${pad}}` : '{}';
};

function djangoFiles(model, { version }) {
  const assetBase = '__STATIC__';
  const site = frameFor(model, assetBase);
  const pages = pagesFor(model, assetBase);
  const { raw } = model;
  const files = {};
  // In templates, the site's own files come from {% static %}; in settings, from STATIC_URL.
  const statics = (html) => html.replace(/"__STATIC__([^"]*)"/g, (_, path) => `"{% static 'website/${path}' %}"`);
  const staticUrl = (u) => u.replace('__STATIC__', '/static/website/');
  const ggdsSite = {
    name: site.name,
    short_name: site.short,
    purpose: site.purpose,
    host: site.banner.host,
    official: site.banner.official,
    register_href: site.banner.registerHref,
    noindex: !site.live,
    theme: isTheme(raw.theme) ? raw.theme : '',
    nav: site.header.nav,
    nav_id: site.header.navId,
    home: site.header.home,
    search_url: site.header.search,
    logo_url: site.logo ? staticUrl(site.logo) : '',
    initials: site.short,
    address: site.footer.contact.address,
    email: site.footer.contact.email,
    phone: site.footer.contact.phone,
    contact_url: site.footer.contact.moreHref,
    sections: site.footer.sections,
    links: site.footer.bar,
    tabs: site.tabs,
  };
  files['requirements.txt'] = `Django>=6.0,<7\nggds-django==${version}\n`;
  files['manage.py'] = `#!/usr/bin/env python
"""Django's command line: python manage.py runserver."""
import os
import sys

if __name__ == "__main__":
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
    from django.core.management import execute_from_command_line
    execute_from_command_line(sys.argv)
`;
  files['config/__init__.py'] = '';
  files['config/wsgi.py'] = `"""The WSGI application, for gunicorn or mod_wsgi: gunicorn config.wsgi."""
import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
application = get_wsgi_application()
`;
  const formsOrigin = raw.forms ? new URL(raw.forms).origin : '';
  files['config/settings.py'] = `"""Settings for ${raw.name.replace(/"/g, '')}'s website, built with GGDS ${version} and ggds-django.

Set DJANGO_SECRET_KEY and DJANGO_DEBUG=0 on the server. The security settings below send the headers
@ggds/check asks for, including a strict Content Security Policy (Django 6's own).
"""
import os
from pathlib import Path

from django.utils.csp import CSP

BASE_DIR = Path(__file__).resolve().parent.parent
SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "only-for-your-own-computer-set-DJANGO_SECRET_KEY-on-the-server")
DEBUG = os.environ.get("DJANGO_DEBUG", "1") == "1"
ALLOWED_HOSTS = [${JSON.stringify(raw.host)}, "localhost", "127.0.0.1"]

INSTALLED_APPS = ["django.contrib.staticfiles", "ggds_django", "website"]
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.middleware.csp.ContentSecurityPolicyMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "website.middleware.permissions_policy",
]
ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"
TEMPLATES = [{
    "BACKEND": "django.template.backends.django.DjangoTemplates",
    "APP_DIRS": True,
    "OPTIONS": {"context_processors": [
        "django.template.context_processors.request",
        "ggds_django.context_processors.site",
    ]},
}]
DATABASES = {}
LANGUAGE_CODE = "en-gb"
USE_I18N = True
USE_TZ = True
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

# The security headers GGDS asks for (docs/starter-hosting.mjs has the same for static hosting).
SECURE_CSP = {
    "default-src": [CSP.SELF],
    "style-src": [CSP.SELF],
    "script-src": [CSP.SELF],
    "img-src": [CSP.SELF, "data:"],
    "form-action": [CSP.SELF${formsOrigin ? `, ${JSON.stringify(formsOrigin)}` : ''}],
    "frame-ancestors": [CSP.NONE],
    "base-uri": [CSP.SELF],
    "object-src": [CSP.NONE],
}
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"
X_FRAME_OPTIONS = "DENY"
if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
# HSTS preload is a promise to serve every address under your domain over HTTPS for good: decide it with whoever
# runs your domain, then set SECURE_HSTS_PRELOAD = True and remove this line.
SILENCED_SYSTEM_CHECKS = ["security.W021"]

# The parts around every page (ggds/page.html): your name, contact details, navigation and footer links.
GGDS_SITE = ${py(ggdsSite)}
`;
  files['config/urls.py'] = `"""Every page's address. Each page is a template in website/templates/website/."""
from django.urls import path
from django.views.generic import TemplateView


def page(route, name, section=None, tab=None):
    """A page: its template, the header link to mark (section) and the tab bar's (tab)."""
    return path(route, TemplateView.as_view(template_name=f"website/{name}.html",
                                            extra_context={"ggds_current": section, "ggds_tab": tab}), name=name)


urlpatterns = [
${pages.filter((p) => p.file !== '404.html').map((p) => `    page(${JSON.stringify(p.route.slice(1))}, ${JSON.stringify(p.slug)}${p.section || p.tab ? `, ${p.section ? JSON.stringify(p.section) : 'None'}${p.tab ? `, ${JSON.stringify(p.tab)}` : ''}` : ''}),`).join('\n')}
]
`;
  files['website/__init__.py'] = '';
  files['website/middleware.py'] = `"""The one security header Django does not send itself."""


def permissions_policy(get_response):
    def middleware(request):
        response = get_response(request)
        response.setdefault("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()")
        return response
    return middleware
`;
  files['website/templates/website/base.html'] = `{% extends "ggds/page.html" %}
{% load static %}
{% comment %}Every page of the website: GGDS's page (ggds-django's ggds/page.html) with this website's own files.{% endcomment %}
{% block head %}${isTheme(raw.theme) ? '' : `
<link rel="stylesheet" href="{% static 'website/theme.css' %}">`}
<link rel="stylesheet" href="{% static 'website/site.css' %}">
<script type="module" src="{% static 'website/site.js' %}"></script>
{% endblock %}
{% block main_class %}{% endblock %}
`;
  for (const p of pages) {
    const path = p.file === '404.html' ? 'website/templates/404.html' : `website/templates/website/${p.slug}.html`;
    files[path] = `{% extends "website/base.html" %}
{% load static %}
${p.file === 'index.html' ? '' : `{% block title %}${esc(p.title)} | {{ ggds_site.name }}{% endblock %}\n`}${p.search ? `{% block head %}{{ block.super }}<script type="module" src="{% static 'website/search.js' %}"></script>{% endblock %}\n` : ''}{% block content %}
${statics(djangoText(p.main)).trim()}
{% endblock %}
`;
  }
  Object.assign(files, staticFiles(model, 'website/static/website/'));
  files['website/static/website/site.css'] = model.assets.siteCss;
  if (!isTheme(raw.theme)) files['website/static/website/theme.css'] = model.assets.themeCss;
  files['website/static/website/site.js'] = formsJs(model, '../ggds/js/index.js');
  if (pages.some((p) => p.search)) {
    files['website/static/website/search.js'] = searchJs(model, '/static/website/search-index.json');
    files['website/static/website/search-index.json'] = searchIndex(model);
  }
  files['hosting/dns-records.txt'] = model.assets.hosting['hosting/dns-records.txt'];
  files['.gitignore'] = '.venv/\n__pycache__/\nstaticfiles/\n';
  files['README.md'] = frameworkReadme(model, {
    name: 'Django', version, run: 'python -m venv .venv\n. .venv/bin/activate\npip install -r requirements.txt\npython manage.py runserver', build: 'python manage.py collectstatic', out: '`staticfiles/` (serve it at /static/ from your web server)',
    layout: '- `website/templates/website/`: one template per page, holding its words. `base.html` puts ggds-django\'s `ggds/page.html` (skip link, banner, header, footer, tab bar) around every page.\n- `config/settings.py`: `GGDS_SITE` holds your name, contact details, navigation and footer links, in one place; the security settings send the headers `@ggds/check` asks for.\n- `config/urls.py`: every page\'s address.\n- `website/static/website/`: `site.js` checks forms before they are sent and shows errors the GGDS way; `search.js`: search, as you type; your documents in `files/`.',
    extra: `- **Forms.** The forms are plain HTML, so you can see every part. To keep what people send, make each one a Django
  form: ggds-django draws every field the GGDS way, with errors and the error summary (see its README).
- **Serving.** Run it with gunicorn (\`gunicorn config.wsgi\`) behind your web server, with \`DJANGO_SECRET_KEY\` set and
  \`DJANGO_DEBUG=0\`.`,
  });
  return { files, assetDir: 'website/static/website/' };
}

// ---- README -----------------------------------------------------------------------------------------------------

function frameworkReadme(model, { name, version, run, build, out, layout, extra }) {
  const { raw } = model;
  return `# ${raw.name}: a GGDS website in ${name}

A complete government website, built with GGDS ${version}, the Ghana Government Design System, in ${name}. It has the
same pages as the plain HTML starter, and every page is checked against it by GGDS's tests.

## Run it

\`\`\`sh
${run}
\`\`\`

To publish it: \`${build}\`, then put ${out} online.

## What is in it

${layout}
- \`${'ggds-site.json'}\`: your settings. Keep it: \`npx @ggds/create --from ggds-site.json --stack ${model.stack}\` makes this website again.

The parts around every page come from GGDS's \`Page\` component, so a newer GGDS package updates them: you do not
copy them by hand. The words of each page are GGDS markup, ready for you to rewrite.

## Make it yours

1. **Your name, address, contact details and colour** are in one file (above). Change them there.
2. **Your logo.** Until your logo is approved, your initials (${raw.short}) are shown in a round badge.
3. **Your content.** The words on each page are an example: rewrite each page in plain words for your own
   services. https://ghana-gds.github.io/ggds/get-started/content.html helps.

## Before you go live

- **Forms.** ${raw.forms ? `Every form sends to ${raw.forms}. Your server must check every answer again.` : 'Each form goes to the next page of this example, so nothing is sent anywhere yet. Your server must check every answer again, keep what people send, and give them a reference number.'}
${extra ? `${extra}\n` : ''}- **Search engines.** ${raw.live ? 'The pages let search engines find them.' : 'The pages ask search engines not to list them. Remove that (search for "robots") when you go live.'}
- Test it with a keyboard only, with a screen reader, at 200% zoom and on a low-cost phone, then run
  \`npx @ggds/check https://${raw.host}\`.

## Help

The GGDS documentation: https://ghana-gds.github.io/ggds/ · Questions and problems: https://github.com/ghana-gds/ggds/issues
`;
}

const WRITERS = { next: nextFiles, astro: astroFiles, django: djangoFiles };

/**
 * A framework project from the starter's model (docs/starter.mjs starterModel), as { files: { path: text },
 * assetDir }: assetDir is where the website's own files (its logo) go.
 */
export function stackFiles(model, stack, { version }) {
  const write = WRITERS[stack];
  if (!write) throw new Error(`unknown stack "${stack}": choose ${STACK_IDS.join(', ')}`);
  const out = write({ ...model, stack }, { version });
  out.files['ggds-site.json'] = model.assets.siteJson;
  return out;
}
