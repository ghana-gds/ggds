// The framework starters (docs/starter-stacks.mjs) are the same website as the plain HTML starter: every page of the
// Next.js and Astro projects is rendered with the real @ggds/react and @ggds/astro and compared with the HTML
// starter's page, element by element, with the classes and the attributes that carry meaning, at the framework's
// addresses. ggds-django's test_starter.py does the same for the Django project.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { starterFiles, starterProject } from '../../docs/starter.mjs';
import { STACK_IDS, relinkPages, route } from '../../docs/starter-stacks.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const reactDist = join(root, 'packages', 'react', 'dist', 'index.js');
const astroPkg = join(root, 'packages', 'astro');
const astroBin = join(astroPkg, 'node_modules', 'astro', 'bin', 'astro.mjs');
const reactReady = { skip: !existsSync(reactDist) && 'run pnpm run build' };
const astroReady = { skip: (!existsSync(astroBin) && 'Astro is not installed') || (!existsSync(join(root, 'packages', 'js', 'dist', 'auto.js')) && 'run pnpm run build') };

const VERSION = '0.4.0';
// The made-up Example Agency, and a website with its own colour, a logo, a forms server and fewer parts.
const SITES = {
  example: { version: VERSION, theme: 'mocdti' },
  own: { version: VERSION, site: { name: 'Fisheries Commission of the Republic of Ghana', short: 'FC', theme: '#7fd1ae', logo: 'assets/logo.svg', forms: 'https://forms.fc.gov.gh/submit', live: true, parts: { news: false, jobs: false } } },
};

const KEEP = ['class', 'href', 'id', 'src', 'action', 'method', 'aria-label', 'aria-current', 'aria-hidden', 'aria-controls', 'aria-labelledby', 'aria-describedby', 'role', 'type', 'for', 'name', 'value', 'hidden', 'autocomplete', 'tabindex', 'data-validate', 'data-required', 'data-pattern'];
/**
 * Every start tag in order, with the attributes that carry meaning. Scripts are not compared, nor <link>: React
 * writes a preload link for an image, which Next.js puts in the head.
 */
function shape(html) {
  const out = [];
  for (const [, tag, attrs] of html.replace(/<!--[\s\S]*?-->/g, '').replace(/<script\b[\s\S]*?<\/script>/gi, '').replace(/<link\b[^>]*>/gi, '').matchAll(/<([a-z][a-z0-9]*)\b([^>]*)>/gi)) {
    const a = Object.fromEntries([...attrs.matchAll(/([a-z-:]+)(?:="([^"]*)")?/gi)].map(([, k, v]) => [k.toLowerCase(), (v ?? '').replace(/&amp;/g, '&')]));
    out.push(`${tag.toLowerCase()} ${KEEP.filter((k) => k in a).map((k) => `${k}="${a[k]}"`).join(' ')}`.trim());
  }
  return out;
}
/** What is inside <body>, or the whole of a rendered fragment. */
const body = (html) => (html.includes('<body') ? html.slice(html.indexOf('>', html.indexOf('<body')) + 1, html.lastIndexOf('</body>')) : html);

/** The HTML starter's pages, at a framework's addresses: what each framework page must match. */
function expected(site, assetBase) {
  const files = starterFiles(site);
  return Object.fromEntries(Object.entries(relinkPages(files, assetBase)).map(([file, html]) => [file, shape(body(html))]));
}

test('every framework is a stack the starter knows, and plain HTML is the default', () => {
  assert.deepEqual(STACK_IDS, ['html', 'next', 'astro', 'django']);
  assert.deepEqual(starterFiles(SITES.example), starterFiles({ ...SITES.example, stack: 'html' }));
  assert.throws(() => starterFiles({ ...SITES.example, stack: 'vue' }), /unknown stack "vue"/);
});

test('pages move to clean addresses, and no link still names an .html file', () => {
  assert.equal(route('index.html'), '/');
  assert.equal(route('apply-for-a-licence.html'), '/apply-for-a-licence/');
  for (const stack of ['next', 'astro', 'django']) {
    for (const site of Object.values(SITES)) {
      const { files } = starterProject({ ...site, stack });
      for (const [path, text] of Object.entries(files)) {
        if (!/\.(jsx|astro|html|json)$/.test(path)) continue;
        assert.doesNotMatch(text, /(?:href|action|src)="(?!https?:)[a-z0-9-]+\.html/, `${stack} ${path}: a link to an .html file`);
        assert.doesNotMatch(text, /(?:href|src)="assets\//, `${stack} ${path}: a relative link to assets/`);
      }
      assert.ok(files['ggds-site.json'] && files['README.md'], `${stack}: settings and README`);
    }
  }
});

test('the framework projects keep the strict security policy: no inline script or style in a page', () => {
  for (const stack of ['next', 'astro', 'django']) {
    const { files } = starterProject({ ...SITES.own, stack });
    for (const [path, text] of Object.entries(files)) {
      if (!/\.(jsx|astro|html)$/.test(path)) continue;
      assert.doesNotMatch(text, /\sstyle=|dangerouslySetInnerHTML|\son[a-z]+=/i, `${stack} ${path}`);
    }
  }
  const django = starterProject({ ...SITES.own, stack: 'django' }).files['config/settings.py'];
  assert.match(django, /"script-src": \[CSP\.SELF\]/);
  assert.match(django, /"form-action": \[CSP\.SELF, "https:\/\/forms\.fc\.gov\.gh"\]/, 'the forms server is allowed');
  assert.match(starterProject({ ...SITES.own, stack: 'next' }).files['package.json'], /"build": "next build && node scripts\/csp\.mjs"/, 'Next.js adds its inline scripts\' hashes to the policy');
});

// ---- Next.js: each page rendered with the real @ggds/react ----------------------------------------------------

async function renderNext(site) {
  const { files } = starterProject({ ...site, stack: 'next' });
  const ts = createRequire(join(root, 'package.json'))('typescript');
  const req = createRequire(join(root, 'packages', 'react', 'package.json'));
  const dir = mkdtempSync(join(tmpdir(), 'ggds-next-'));
  const resolved = {
    '@ggds/react': pathToFileURL(reactDist).href,
    react: pathToFileURL(req.resolve('react')).href,
    'react/jsx-runtime': pathToFileURL(req.resolve('react/jsx-runtime')).href,
  };
  try {
    for (const [path, text] of Object.entries(files)) {
      if (!/\.jsx?$/.test(path) || path.startsWith('scripts/') || path === 'app/layout.jsx') continue;
      const { outputText } = ts.transpileModule(text, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
      const js = outputText
        .replace(/from ['"]([^'"]+)['"]/g, (m, spec) => (spec in resolved ? `from '${resolved[spec]}'` : spec.startsWith('.') ? `from '${spec.replace(/\.jsx?$/, '.mjs')}'` : m))
        .replace(/import\(['"]([^'"]+)['"]\)/g, (m, spec) => `import('${spec.replace(/\.jsx?$/, '.mjs')}')`);
      const out = join(dir, path.replace(/\.jsx?$/, '.mjs'));
      mkdirSync(dirname(out), { recursive: true });
      writeFileSync(out, js);
    }
    const React = req('react');
    const { renderToStaticMarkup } = req('react-dom/server');
    const pages = {};
    for (const path of Object.keys(files).filter((p) => /^app\/(?:.+\/)?page\.jsx$|^app\/not-found\.jsx$/.test(p))) {
      const mod = await import(pathToFileURL(join(dir, path.replace(/\.jsx$/, '.mjs'))).href);
      const file = path === 'app/page.jsx' ? 'index.html' : path === 'app/not-found.jsx' ? '404.html' : `${path.split('/')[1]}.html`;
      pages[file] = renderToStaticMarkup(React.createElement(mod.default));
    }
    return pages;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test('Next.js: every page matches the HTML starter, element by element', reactReady, async () => {
  for (const [name, site] of Object.entries(SITES)) {
    const want = expected(site, '/assets/');
    const got = await renderNext(site);
    assert.deepEqual(Object.keys(got).sort(), Object.keys(want).sort(), `${name}: the same pages`);
    for (const [file, html] of Object.entries(got)) assert.deepEqual(shape(html), want[file], `${name}: ${file}`);
  }
});

// ---- Astro: the project built with the real astro and @ggds/astro ---------------------------------------------

function buildAstro(site, dir) {
  const { files } = starterProject({ ...site, stack: 'astro' });
  rmSync(dir, { recursive: true, force: true });
  // Inside packages/astro, so astro resolves from its node_modules; the GGDS packages from this repository.
  const swaps = [
    [/@ggds\/astro\/Page\.astro/, () => 'packages/astro/src/Page.astro'],
    [/@ggds\/js\/auto/, () => 'packages/js/dist/auto.js'],
    [/@ggds\/js/, () => 'packages/js/dist/index.js'],
    [/@ggds\/themes\/([a-z0-9-]+)\.css/, (slug) => `packages/themes/dist/${slug}.css`],
  ];
  for (const [path, text] of Object.entries(files)) {
    const out = join(dir, path);
    let t = text;
    if (path.startsWith('src/')) {
      for (const [spec, to] of swaps) {
        t = t.replace(new RegExp(`(['"])${spec.source}\\1`, 'g'), (_, q, slug) => {
          const rel = relative(dirname(out), join(root, to(slug))).split('\\').join('/');
          return `${q}${rel}${q}`;
        });
      }
    }
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, t);
  }
  execFileSync(process.execPath, [astroBin, 'build', '--silent'], { cwd: dir, stdio: ['ignore', 'ignore', 'inherit'] });
  const pages = {};
  const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((f) => (f.isDirectory() ? walk(join(d, f.name)) : [join(d, f.name)]));
  for (const f of walk(join(dir, 'dist')).filter((x) => x.endsWith('.html'))) {
    const rel = relative(join(dir, 'dist'), f).split('\\').join('/');
    const file = rel === 'index.html' ? 'index.html' : rel === '404.html' ? '404.html' : `${rel.replace(/\/index\.html$/, '')}.html`;
    pages[file] = readFileSync(f, 'utf8');
  }
  return pages;
}

test('Astro: every page matches the HTML starter, element by element, with no inline script or style', astroReady, () => {
  for (const [name, site] of Object.entries(SITES)) {
    const dir = join(astroPkg, `.starter-test-${name}`);
    try {
      const want = expected(site, '/assets/');
      const got = buildAstro(site, dir);
      assert.deepEqual(Object.keys(got).sort(), Object.keys(want).sort(), `${name}: the same pages`);
      for (const [file, html] of Object.entries(got)) {
        assert.deepEqual(shape(body(html)), want[file], `${name}: ${file}`);
        assert.doesNotMatch(html, /<script(?![^>]*\bsrc=)[^>]*>[^<]/, `${name}: ${file} has an inline script`);
        assert.doesNotMatch(html, /<style\b|\sstyle="/, `${name}: ${file} has an inline style`);
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }
});
