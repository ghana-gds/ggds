// Builds @ggds/react: the components (src/ → dist/, with TypeScript), then the live example for the documentation
// (demo/ → demo-dist/, with Vite), which docs/build.mjs copies to site/examples/react/.
import { execFileSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

const here = dirname(fileURLToPath(import.meta.url));
rmSync(join(here, 'dist'), { recursive: true, force: true });
execFileSync(join(here, '..', '..', 'node_modules', '.bin', 'tsc'), ['-p', here], { stdio: 'inherit' });

await build({
  root: join(here, 'demo'),
  base: './',
  logLevel: 'error', // quiet: the bundle ignores "use client", which only matters to Next.js
  build: { outDir: join(here, 'demo-dist'), emptyOutDir: true, modulePreload: { polyfill: false } },
});
console.log(`react: components → ${join(here, 'dist')}, live example → ${join(here, 'demo-dist')}`);
