// Copies the built GGDS styles, themes and script into the Django app's static files, and the shared icons into
// icons.json, so the Django package serves exactly what the other GGDS packages do. Run after the CSS, theme and
// JavaScript builds (pnpm run build does).
import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ICONS } from '../astro/icons.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const app = join(here, 'src', 'ggds_django');
const out = join(app, 'static', 'ggds');
const packages = join(here, '..');

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
cpSync(join(packages, 'css', 'dist'), out, { recursive: true });
cpSync(join(packages, 'themes', 'dist'), join(out, 'themes'), { recursive: true, filter: (f) => !f.endsWith('.json') });
cpSync(join(packages, 'js', 'dist'), join(out, 'js'), { recursive: true, filter: (f) => !f.endsWith('.d.ts') });
writeFileSync(join(app, 'icons.json'), `${JSON.stringify(ICONS, null, 1)}\n`);
console.log(`django: static files and icons → ${app}`);
