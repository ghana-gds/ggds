// Builds the GGDS WordPress theme: copies the built GGDS styles, themes, script and icons into ggds/assets/, and
// sets the theme's version (style.css) to the GGDS version. Run after the CSS, theme and JavaScript builds
// (pnpm run build does). The theme for a website is the ggds/ folder; the release has it as a zip.
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ICONS } from '../astro/icons.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const theme = join(here, 'ggds');
const out = join(theme, 'assets');
const packages = join(here, '..');
const { version } = JSON.parse(readFileSync(join(packages, 'css', 'package.json'), 'utf8'));

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
cpSync(join(packages, 'css', 'dist', 'ggds.min.css'), join(out, 'ggds.min.css'));
cpSync(join(packages, 'themes', 'dist'), join(out, 'themes'), { recursive: true });
cpSync(join(packages, 'js', 'dist'), join(out, 'js'), { recursive: true, filter: (f) => !f.endsWith('.d.ts') });
for (const f of ['wordpress.css', 'editor.css']) cpSync(join(here, 'src', f), join(out, f));
writeFileSync(join(out, 'icons.json'), `${JSON.stringify(ICONS)}\n`);

const style = join(theme, 'style.css');
writeFileSync(style, readFileSync(style, 'utf8').replace(/^Version: .*$/m, `Version: ${version}`));
console.log(`wordpress: theme ${version} → ${theme}`);
