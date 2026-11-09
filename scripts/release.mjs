// Builds the download for websites that do not use npm: release/ggds-<version>.zip, holding one "ggds" folder to
// copy into a website as it is. Run after `pnpm run build`.
//
//   ggds/ggds.css, ggds.min.css         everything (the .min file for production)
//   ggds/ggds-components(.min).css      for sites that load the tokens separately
//   ggds/core(.min).css                 then one file per part from components/
//   ggds/components/<name>(.min).css
//   ggds/tokens.css
//   ggds/themes/<slug>.css, themes.css  institution themes
//   ggds/auto.js, index.js, menu.js, error-summary.js   the optional script: keep the four together
//   ggds/LICENSE, LICENSE.md, README.txt
//
// Next to the zip: SHA256SUMS (checksums for the zip and every file in it) and integrity.json (the "integrity"
// value for each CSS and JS file, for <link integrity="…"> when the files are served from a CDN).
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const pkg = (p) => join(root, 'packages', p);
const { version } = JSON.parse(readFileSync(join(pkg('css'), 'package.json'), 'utf8'));
const out = join(root, 'release');
const dir = join(out, 'ggds');
const zipName = `ggds-${version}.zip`;

const need = [join(pkg('css'), 'dist', 'ggds.min.css'), join(pkg('themes'), 'dist', 'themes.css'), join(pkg('js'), 'dist', 'auto.js')];
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
for (const f of ['LICENSE', 'LICENSE.md']) cpSync(join(root, f), join(dir, f));
writeFileSync(join(dir, 'README.txt'), `GGDS ${version}: Ghana Government Design System
https://github.com/ghana-gds/ggds

Copy this "ggds" folder into your website, then add to every page:

  <link rel="stylesheet" href="/ggds/ggds.min.css">
  <link rel="stylesheet" href="/ggds/themes/nca.css">      (optional: your institution's theme)
  <script type="module" src="/ggds/auto.js"></script>     (optional: every part works without it)

Copy the HTML for each part from the GGDS documentation.
The files work under a strict Content Security Policy: style-src 'self'; script-src 'self'.

Licence: Apache-2.0 (LICENSE). The flag, the coat of arms and institutions' logos are not covered (LICENSE.md).
`);

const files = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? files(join(d, f)) : [join(d, f)])).sort();
const all = files(dir);
const digest = (alg, enc, f) => createHash(alg).update(readFileSync(f)).digest(enc);

// -X leaves out file attributes that differ between machines; files are added in sorted order.
execFileSync('zip', ['-X', '-q', join(out, zipName), ...all.map((f) => relative(out, f))], { cwd: out });

const sums = [join(out, zipName), ...all].map((f) => `${digest('sha256', 'hex', f)}  ${relative(out, f)}`);
writeFileSync(join(out, 'SHA256SUMS'), `${sums.join('\n')}\n`);
const integrity = Object.fromEntries(all.filter((f) => /\.(css|js)$/.test(f))
  .map((f) => [relative(dir, f), `sha384-${digest('sha384', 'base64', f)}`]));
writeFileSync(join(out, 'integrity.json'), `${JSON.stringify({ version, files: integrity }, null, 2)}\n`);

const size = statSync(join(out, zipName)).size;
console.log(`release: ${zipName} (${all.length} files, ${(size / 1024).toFixed(0)} KB), SHA256SUMS, integrity.json → ${out}`);
