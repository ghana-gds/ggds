// Builds the download for websites that do not use npm: release/ggds-<version>.zip, holding one "ggds" folder to
// copy into a website as it is. Run after `pnpm run build`.
//
//   ggds/ggds.css, ggds.min.css         everything (the .min file for production)
//   ggds/ggds-components(.min).css      for sites that load the tokens separately
//   ggds/core(.min).css                 then one file per part from components/
//   ggds/components/<name>(.min).css
//   ggds/tokens.css
//   ggds/themes/<slug>.css, themes.css  institution themes
//   ggds/auto.js, index.js and the other .js files   the optional script: keep them together (auto.js loads the rest)
//   ggds/icons/sprite.svg, icons/svg/<name>.svg, icons/ggds-icons.svg   the icons: a sprite, single files, a design sheet
//   ggds/subset.mjs, icons/subset.mjs  make one CSS file and one sprite holding only what the site uses (Node.js)
//   ggds/**/*.br, *.gz                  every CSS, JS, SVG and JSON file compressed in advance, for servers that
//                                       send ready-compressed files (nginx gzip_static/brotli_static, Caddy)
//   ggds/LICENSE, LICENSE.md, README.txt
//
// Next to the zip: SHA256SUMS (checksums for the zip and every file in it) and integrity.json (the "integrity"
// value for each CSS and JS file, for <link integrity="…"> when the files are served from a CDN).
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { execFileSync } from 'node:child_process';
import { brotliCompressSync, constants as zlib, gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const pkg = (p) => join(root, 'packages', p);
const { version } = JSON.parse(readFileSync(join(pkg('css'), 'package.json'), 'utf8'));
const out = join(root, 'release');
const dir = join(out, 'ggds');
const zipName = `ggds-${version}.zip`;

const need = [join(pkg('icons'), 'dist', 'sprite.svg'), join(pkg('css'), 'dist', 'ggds.min.css'), join(pkg('themes'), 'dist', 'themes.css'), join(pkg('js'), 'dist', 'auto.js')];
for (const f of need) if (!existsSync(f)) throw new Error(`${relative(root, f)} is missing: run pnpm run build first`);

rmSync(out, { recursive: true, force: true });
mkdirSync(dir, { recursive: true });

const cssDist = join(pkg('css'), 'dist');
for (const f of readdirSync(cssDist)) cpSync(join(cssDist, f), join(dir, f), { recursive: true });
cpSync(join(pkg('tokens'), 'dist', 'tokens.css'), join(dir, 'tokens.css'));
mkdirSync(join(dir, 'themes'));
for (const f of readdirSync(join(pkg('themes'), 'dist')).filter((f) => f.endsWith('.css'))) {
  cpSync(join(pkg('themes'), 'dist', f), join(dir, 'themes', f));
}
for (const f of readdirSync(join(pkg('js'), 'dist')).filter((f) => f.endsWith('.js'))) cpSync(join(pkg('js'), 'dist', f), join(dir, f));
mkdirSync(join(dir, 'icons'));
for (const f of ['sprite.svg', 'ggds-icons.svg', 'catalogue.json', 'svg']) cpSync(join(pkg('icons'), 'dist', f), join(dir, 'icons', f), { recursive: true });
cpSync(join(pkg('css'), 'subset.mjs'), join(dir, 'subset.mjs'));
cpSync(join(pkg('icons'), 'subset.mjs'), join(dir, 'icons', 'subset.mjs'));
for (const f of ['LICENSE', 'LICENSE.md']) cpSync(join(root, f), join(dir, f));
writeFileSync(join(dir, 'README.txt'), `GGDS ${version}: Ghana Government Design System
https://github.com/ghana-gds/ggds

Copy this "ggds" folder into your website, then add to every page:

  <link rel="stylesheet" href="/ggds/ggds.min.css">
  <link rel="stylesheet" href="/ggds/themes/nca.css">      (optional: your institution's theme)
  <script type="module" src="/ggds/auto.js"></script>     (optional: every part works without it)

Copy the HTML for each part from the GGDS documentation.

Icons: icons/svg has one file per icon; icons/sprite.svg has them all, used like this:

  <svg class="ggds-icon" aria-hidden="true"><use href="/ggds/icons/sprite.svg#arrow-right"/></svg>

Designers: import icons/ggds-icons.svg into Figma or another design tool for every icon, named and labelled.
The files work under a strict Content Security Policy: style-src 'self'; script-src 'self'.

FAST PAGES

1. Keep each version in its own folder, and let browsers keep the files: copy this folder to /ggds/${version}/
   (so the links read /ggds/${version}/ggds.min.css) and send, for everything under /ggds/:
     Cache-Control: public, max-age=31536000, immutable
   Returning visitors then download nothing. To update GGDS, add the new version's folder beside the old one and
   change the links: never change the files inside a version's folder.
     nginx:   location /ggds/ { add_header Cache-Control "public, max-age=31536000, immutable"; gzip_static on; }
     Apache:  <Location /ggds/> Header set Cache-Control "public, max-age=31536000, immutable" </Location>
     IIS:     <clientCache cacheControlMode="UseMaxAge" cacheControlMaxAge="365.00:00:00" /> in web.config

2. Send the files compressed. Every CSS, JS, SVG and JSON file has a .br (Brotli) and .gz (gzip) copy made in
   advance at the strongest setting: nginx sends them with gzip_static on (and brotli_static on, with the Brotli
   module), Caddy with "file_server { precompressed br gzip }". Otherwise switch on your server's compression.

3. Load only what the site uses (needs Node.js, run from your website's folder):
     node ggds/${version}/subset.mjs --scan templates --out ggds/${version}/site.min.css
     node ggds/${version}/icons/subset.mjs --scan templates --out ggds/${version}/icons/site.svg
   then link site.min.css in place of ggds.min.css, and use icons/site.svg#name in place of icons/sprite.svg#name.
   A page that uses a few components loads about half the CSS, and a few icons instead of all of them. Run them
   again whenever the site starts using another component or icon (node ggds/${version}/subset.mjs --help).

Licence: Apache-2.0 (LICENSE). The flag, the coat of arms and institutions' logos are not covered (LICENSE.md).
`);

// Ready-compressed copies of every text file, at the strongest settings (no cost to the server at request time).
const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
for (const f of walk(dir).filter((f) => /\.(css|js|svg|json)$/.test(f))) {
  const data = readFileSync(f);
  writeFileSync(`${f}.gz`, gzipSync(data, { level: 9 }));
  writeFileSync(`${f}.br`, brotliCompressSync(data, { params: { [zlib.BROTLI_PARAM_QUALITY]: 11, [zlib.BROTLI_PARAM_SIZE_HINT]: data.length } }));
}

const files = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? files(join(d, f)) : [join(d, f)])).sort();
const all = files(dir);
const digest = (alg, enc, f) => createHash(alg).update(readFileSync(f)).digest(enc);

// -X leaves out file attributes that differ between machines; files are added in sorted order.
execFileSync('zip', ['-X', '-q', join(out, zipName), ...all.map((f) => relative(out, f))], { cwd: out });

// The WordPress theme, as WordPress expects it: a zip holding the "ggds" theme folder, uploaded in Appearance >
// Themes > Add New Theme. Its assets come from pnpm run build.
const wpName = `ggds-wordpress-${version}.zip`;
const wpTheme = join(pkg('wordpress'), 'ggds');
if (!existsSync(join(wpTheme, 'assets', 'ggds.min.css'))) throw new Error('packages/wordpress/ggds/assets is missing: run pnpm run build first');
for (const f of ['LICENSE', 'LICENSE.md']) cpSync(join(root, f), join(wpTheme, f));
execFileSync('zip', ['-X', '-q', '-r', join(out, wpName), 'ggds', '-x', 'ggds/.*'], { cwd: pkg('wordpress') });

// The agency website starter (docs/starter.mjs), as the documentation offers it: built by pnpm run build.
const starterName = `ggds-agency-starter-${version}.zip`;
const starterZip = join(root, 'site', 'downloads', starterName);
if (!existsSync(starterZip)) throw new Error(`site/downloads/${starterName} is missing: run pnpm run build first`);
cpSync(starterZip, join(out, starterName));

const sums = [join(out, zipName), join(out, wpName), join(out, starterName), ...all].map((f) => `${digest('sha256', 'hex', f)}  ${relative(out, f)}`);
writeFileSync(join(out, 'SHA256SUMS'), `${sums.join('\n')}\n`);
const integrity = Object.fromEntries(all.filter((f) => /\.(css|js)$/.test(f))
  .map((f) => [relative(dir, f), `sha384-${digest('sha384', 'base64', f)}`]));
writeFileSync(join(out, 'integrity.json'), `${JSON.stringify({ version, files: integrity }, null, 2)}\n`);

const size = statSync(join(out, zipName)).size;
console.log(`release: ${zipName} (${all.length} files, ${(size / 1024).toFixed(0)} KB), ${wpName}, ${starterName}, SHA256SUMS, integrity.json → ${out}`);
