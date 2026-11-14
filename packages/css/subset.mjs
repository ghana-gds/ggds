#!/usr/bin/env node
// One stylesheet holding only the GGDS components a site uses: the smallest CSS a site can load, in one request.
// It finds the components from the site's own files (every ggds-* class in its HTML, templates or scripts), or
// takes them by name. The result is the same as ggds.min.css for those pages, in the same cascade layers.
//
//   npx --package=@ggds/css ggds-css-subset --scan src > public/ggds.css          scan a folder (or files) for ggds-* classes
//   npx --package=@ggds/css ggds-css-subset header footer button field > ggds.css  name the components
//   npx --package=@ggds/css ggds-css-subset --scan templates --out static/ggds.css --no-tokens --readable
//
//   --scan <path>   a file or folder to look in (more than once is fine); node_modules, .git and CSS are skipped
//   --out <file>    write here instead of to standard output
//   --no-tokens     leave the design tokens out (for a site that loads @ggds/tokens or a theme's tokens itself)
//   --readable      the unminified CSS, for reading; production sites want the default, minified
//
// A site built with @ggds/react has no ggds-* classes in its own files: name its components instead, or scan the
// built pages (--scan dist). Scan again, or add the name, whenever the site starts using another component.
// No dependencies: it reads the files @ggds/css ships (dist/components.json and the CSS beside it).
import { existsSync, readFileSync, readdirSync, realpathSync, statSync, writeFileSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// The built files: dist/ in the npm package; the same folder in the release download (ggds/subset.mjs).
const dist = [fileURLToPath(new URL('./dist/', import.meta.url)), fileURLToPath(new URL('./', import.meta.url))]
  .find((d) => existsSync(join(d, 'components.json'))) ?? fileURLToPath(new URL('./dist/', import.meta.url));
const manifest = () => JSON.parse(readFileSync(join(dist, 'components.json'), 'utf8'));

const SKIP_DIRS = new Set(['node_modules', '.git', '.svn', '.hg', '__pycache__', '.venv', 'venv', '.cache']);
// Text a site's markup can live in. CSS is left out: GGDS's own CSS names every class and would select everything.
const TEXT = new Set(['.html', '.htm', '.xhtml', '.php', '.twig', '.njk', '.nunjucks', '.jinja', '.jinja2', '.j2', '.liquid',
  '.hbs', '.handlebars', '.mustache', '.ejs', '.erb', '.haml', '.slim', '.pug', '.astro', '.vue', '.svelte', '.js', '.mjs',
  '.cjs', '.jsx', '.ts', '.tsx', '.md', '.mdx', '.py', '.rb', '.go', '.cs', '.cshtml', '.razor', '.java', '.jsp', '.xml', '.json', '.txt']);

/** Every block class (ggds-field from ggds-field__hint or ggds-field--error) in a piece of text. */
export function classesIn(text) {
  return new Set([...text.matchAll(/ggds-[a-z0-9]+(?:-[a-z0-9]+)*/g)].map((m) => m[0]));
}

/** The components that style the given classes, in GGDS order. Classes no component styles are ignored. */
export function componentsFor(classes, map = manifest()) {
  const used = new Set();
  for (const cls of classes) for (const c of map.classes[cls] ?? []) used.add(c);
  return map.components.filter((c) => used.has(c));
}

/** The text files under a path (a file, or a folder searched through). */
function* textFiles(path) {
  const s = statSync(path);
  if (s.isFile()) { if (TEXT.has(extname(path).toLowerCase())) yield path; return; }
  for (const e of readdirSync(path, { withFileTypes: true })) {
    if (e.isDirectory() ? SKIP_DIRS.has(e.name) || e.name.startsWith('.') : false) continue;
    yield* textFiles(join(path, e.name));
  }
}

/** The components used anywhere under the given paths. */
export function scan(paths, map = manifest()) {
  const classes = new Set();
  for (const p of paths) for (const f of textFiles(resolve(p))) for (const c of classesIn(readFileSync(f, 'utf8'))) classes.add(c);
  return componentsFor(classes, map);
}

/**
 * The stylesheet for the given components: tokens (unless tokens is false), base, then each component in GGDS
 * order and in its layer. minify: false gives the readable CSS.
 */
export function subset(components, { tokens = true, minify = true } = {}) {
  const map = manifest();
  const unknown = components.filter((c) => !map.components.includes(c));
  if (unknown.length) throw new Error(`@ggds/css has no component called ${unknown.join(', ')}. The components: ${map.components.join(', ')}`);
  const ext = minify ? '.min.css' : '.css';
  const read = (f) => readFileSync(join(dist, f + ext), 'utf8');
  // Each file opens with the licence banner (and, readable, a "generated" note): keep the first file's only.
  const body = (css) => css.replace(/^\/\*![^\n]*\*\/\n/, '').replace(/^\/\* GGDS: [^\n]*\*\/\n/, '');
  const chosen = map.components.filter((c) => components.includes(c));
  const note = `/* GGDS subset: ${chosen.join(', ') || 'base only'}. Made by ggds-css-subset; make it again when the site uses another component. */\n`;
  const first = read(tokens ? 'core' : 'base');
  const banner = first.match(/^\/\*![^\n]*\*\/\n/)?.[0] ?? '';
  return banner + note + body(first).trimEnd() + '\n' + chosen.map((c) => body(read(`components/${c}`)).trimEnd()).join('\n') + '\n';
}

function cli(argv) {
  const scanPaths = [];
  const names = [];
  let out = null;
  let tokens = true;
  let minify = true;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--scan') scanPaths.push(argv[++i]);
    else if (a === '--out' || a === '-o') out = argv[++i];
    else if (a === '--no-tokens') tokens = false;
    else if (a === '--readable') minify = false;
    else if (a === '--help' || a === '-h') {
      process.stdout.write(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1).filter((l) => l.startsWith('//')).map((l) => l.slice(3)).join('\n') + '\n');
      return;
    } else if (a.startsWith('-')) throw new Error(`unknown option ${a} (see --help)`);
    else names.push(a);
  }
  if (scanPaths.some((p) => !p)) throw new Error('--scan needs a path');
  if (!scanPaths.length && !names.length) throw new Error('name the components, or --scan the site (see --help)');
  const components = [...new Set([...names, ...scan(scanPaths)])];
  const css = subset(components, { tokens, minify });
  const all = manifest().components.length;
  const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
  if (out) writeFileSync(out, css);
  else process.stdout.write(css);
  process.stderr.write(`ggds-css-subset: ${components.length} of ${all} components (${kb(Buffer.byteLength(css))})${out ? ` → ${out}` : ''}: ${manifest().components.filter((c) => components.includes(c)).join(', ') || 'none found'}\n`);
}

// Run as a command (npx links bin files, so compare real paths).
if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  try { cli(process.argv.slice(2)); } catch (e) { process.stderr.write(`ggds-css-subset: ${e.message}\n`); process.exit(1); }
}
