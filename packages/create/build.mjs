// Builds @ggds/create (pnpm run build:create, and before it is packed): lib/ holds the starter's own code, the same
// modules the website builder runs (docs/starter-bundle.mjs), and ggds/ the GGDS files every website gets. Both are
// copies, git-ignored, so the package has no dependencies and each version makes websites with its own GGDS.
import { copyFileSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { starterModules } from '../../docs/starter-bundle.mjs';

const here = fileURLToPath(new URL('./', import.meta.url));
const root = join(here, '..', '..');
const pkg = (...p) => join(root, 'packages', ...p);

rmSync(join(here, 'lib'), { recursive: true, force: true });
for (const [file, text] of Object.entries(starterModules())) {
  mkdirSync(dirname(join(here, 'lib', file)), { recursive: true });
  writeFileSync(join(here, 'lib', file), text);
}

// The GGDS files, as the agency website starter has them (docs/build.mjs).
const ggds = join(here, 'ggds');
rmSync(ggds, { recursive: true, force: true });
mkdirSync(join(ggds, 'themes'), { recursive: true });
copyFileSync(pkg('css', 'dist', 'ggds.min.css'), join(ggds, 'ggds.min.css'));
for (const f of readdirSync(pkg('js', 'dist')).filter((f) => f.endsWith('.js'))) copyFileSync(pkg('js', 'dist', f), join(ggds, f));
for (const f of readdirSync(pkg('themes', 'dist')).filter((f) => f.endsWith('.css'))) copyFileSync(pkg('themes', 'dist', f), join(ggds, 'themes', f));
for (const f of ['LICENSE', 'LICENSE.md']) copyFileSync(join(root, f), join(ggds, f));
console.log('create: lib/ and ggds/');
