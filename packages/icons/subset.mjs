#!/usr/bin/env node
// A sprite holding only the icons a site uses, instead of all of them (sprite.svg): the smallest icon download.
// It finds the icons in the site's own files (sprite.svg#name, icon('name'), {% ggds_icon "name" %},
// <Icon name="name">, ...: any quoted name or #name that is an icon's), or takes them by name.
//
//   npx --package=@ggds/icons ggds-icons-subset --scan src --out public/sprite.svg      scan a folder (or files)
//   npx --package=@ggds/icons ggds-icons-subset arrow-right search menu close > sprite.svg
//
//   --scan <path>   a file or folder to look in (more than once is fine); node_modules and .git are skipped
//   --out <file>    write here instead of to standard output
//
// Use the sprite exactly as the full one: <svg class="ggds-icon" aria-hidden="true"><use href="/sprite.svg#search"/></svg>.
// A name the site builds at run time (icon(`arrow-${dir}`)) cannot be found by scanning: name those icons too.
// Bundled JavaScript does not need this: import single icons from "@ggds/icons" and the bundler keeps only those.
// No dependencies: it reads dist/sprite.svg.
import { existsSync, readFileSync, readdirSync, realpathSync, statSync, writeFileSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// The full sprite: dist/sprite.svg in the npm package; beside this file in the release download (ggds/icons/).
const full = () => readFileSync(['./dist/sprite.svg', './sprite.svg'].map((f) => fileURLToPath(new URL(f, import.meta.url))).find(existsSync)
  ?? fileURLToPath(new URL('./dist/sprite.svg', import.meta.url)), 'utf8');

/** Every icon in the full sprite: name → its <symbol> element. */
export function symbols(sprite = full()) {
  return new Map([...sprite.matchAll(/<symbol id="([a-z0-9-]+)"[^>]*>.*?<\/symbol>/g)].map((m) => [m[1], m[0]]));
}

const SKIP_DIRS = new Set(['node_modules', '.git', '.svn', '.hg', '__pycache__', '.venv', 'venv', '.cache']);
const BINARY = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif', '.ico', '.woff', '.woff2', '.ttf', '.otf', '.eot',
  '.pdf', '.zip', '.gz', '.br', '.mp4', '.webm', '.mp3', '.wasm', '.map', '.lock']);

/** The icon names in a piece of text: each quoted string, or #name, that is exactly an icon's name. */
export function iconsIn(text, names) {
  const found = new Set();
  for (const m of text.matchAll(/[#"'`]([a-z0-9]+(?:-[a-z0-9]+)*)(?=["'`\s)]|$)/g)) if (names.has(m[1])) found.add(m[1]);
  return found;
}

function* files(path) {
  const s = statSync(path);
  if (s.isFile()) { if (!BINARY.has(extname(path).toLowerCase())) yield path; return; }
  for (const e of readdirSync(path, { withFileTypes: true })) {
    if (e.isDirectory() && (SKIP_DIRS.has(e.name) || e.name.startsWith('.'))) continue;
    yield* files(join(path, e.name));
  }
}

/**
 * The icons used anywhere under the given paths. A file that names more than half of all icons is a copy of the
 * icon set (a sprite, icons.json, all.js), not a page that uses them: it is skipped and listed in skipped.
 */
export function scan(paths, all = symbols(), skipped = []) {
  const names = new Set(all.keys());
  const found = new Set();
  for (const p of paths) {
    for (const f of files(resolve(p))) {
      const inFile = iconsIn(readFileSync(f, 'utf8'), names);
      if (inFile.size > names.size / 2) { skipped.push(f); continue; }
      for (const n of inFile) found.add(n);
    }
  }
  return [...found].sort();
}

/** A sprite with only the named icons, in the same form as the full sprite.svg. */
export function subset(names, all = symbols()) {
  const unknown = names.filter((n) => !all.has(n));
  if (unknown.length) throw new Error(`@ggds/icons has no icon called ${unknown.join(', ')} (see catalogue.json)`);
  return `<svg xmlns="http://www.w3.org/2000/svg">${[...new Set(names)].sort().map((n) => all.get(n)).join('')}</svg>\n`;
}

function cli(argv) {
  const scanPaths = [];
  const names = [];
  let out = null;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--scan') scanPaths.push(argv[++i]);
    else if (a === '--out' || a === '-o') out = argv[++i];
    else if (a === '--help' || a === '-h') {
      process.stdout.write(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1).filter((l) => l.startsWith('//')).map((l) => l.slice(3)).join('\n') + '\n');
      return;
    } else if (a.startsWith('-')) throw new Error(`unknown option ${a} (see --help)`);
    else names.push(a);
  }
  if (scanPaths.some((p) => !p)) throw new Error('--scan needs a path');
  if (!scanPaths.length && !names.length) throw new Error('name the icons, or --scan the site (see --help)');
  const all = symbols();
  const skipped = [];
  const chosen = [...new Set([...names, ...scan(scanPaths, all, skipped)])].sort();
  for (const f of skipped) process.stderr.write(`ggds-icons-subset: skipped ${f}: it holds the whole icon set\n`);
  const svg = subset(chosen, all);
  if (out) writeFileSync(out, svg);
  else process.stdout.write(svg);
  process.stderr.write(`ggds-icons-subset: ${chosen.length} of ${all.size} icons (${(Buffer.byteLength(svg) / 1024).toFixed(1)} KB)${out ? ` → ${out}` : ''}: ${chosen.join(', ') || 'none found'}\n`);
}

// Run as a command (npx links bin files, so compare real paths).
if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  try { cli(process.argv.slice(2)); } catch (e) { process.stderr.write(`ggds-icons-subset: ${e.message}\n`); process.exit(1); }
}
