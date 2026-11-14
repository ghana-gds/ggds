// Builds the GGDS WordPress theme: copies the built GGDS styles, themes, script and icons into ggds/assets/, and
// sets the theme's version (style.css) to the GGDS version. Run after the CSS, theme and JavaScript builds
// (pnpm run build does). The theme for a website is the ggds/ folder; the release has it as a zip.
// Then GGDS Switch (ggds-switch/), the plugin that turns an existing website into a GGDS one, gets its own copy of
// the theme (ggds-switch/theme/ggds/), so one upload does everything, and the same version.
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ICONS } from '../icons/dist/all.js';

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

const plugin = join(here, 'ggds-switch');
rmSync(join(plugin, 'theme'), { recursive: true, force: true });
cpSync(theme, join(plugin, 'theme', 'ggds'), { recursive: true, filter: (f) => !/\/\.[^/]*$/.test(f) });
const main = join(plugin, 'ggds-switch.php');
writeFileSync(main, readFileSync(main, 'utf8').replace(/^( \* Version: +).*$/m, `$1${version}`));
// Tidy up content's phrases: the same list ggds-check uses, so the plugin and the check always agree.
cpSync(join(packages, 'check', 'placeholders.json'), join(plugin, 'placeholders.json'));
console.log(`wordpress: theme and GGDS Switch ${version} → ${theme}, ${plugin}`);
