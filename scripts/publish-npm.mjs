// Packs the public packages and publishes them to npm, dependencies first. Run after `pnpm run build`.
//
//   node scripts/publish-npm.mjs            pack into release/npm and stop (check what would be published)
//   node scripts/publish-npm.mjs --publish  pack, then publish each one that is not on npm yet
//   add --dry-run to --publish             npm checks each package but uploads nothing
//
// pnpm packs (it turns "workspace:^" into real version ranges); the npm CLI publishes, because it supports
// trusted publishing from GitHub Actions and provenance. A version already on npm is skipped, so the script can
// be run again after a failure. @ggds/html is not published: its markup reaches people through the documentation.
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ORDER = ['tokens', 'icons', 'themes', 'css', 'js', 'astro', 'react', 'check', 'create'];
const root = fileURLToPath(new URL('../', import.meta.url));
const out = join(root, 'release', 'npm');
const publish = process.argv.includes('--publish');
const dryRun = process.argv.includes('--dry-run'); // with --publish: npm checks everything but uploads nothing
const provenance = process.env.GITHUB_ACTIONS === 'true';

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

const run = (cmd, args, cwd) => execFileSync(cmd, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] });
const onNpm = (name, version) => {
  try {
    return execFileSync('npm', ['view', `${name}@${version}`, 'version'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() === version;
  } catch { return false; } // npm answers 404 for a package or version not published yet
};

for (const dir of ORDER) {
  const cwd = join(root, 'packages', dir);
  const { name, version, private: isPrivate } = JSON.parse(readFileSync(join(cwd, 'package.json'), 'utf8'));
  if (isPrivate) throw new Error(`${name} is marked private`);
  run('pnpm', ['pack', '--pack-destination', out], cwd);
  const tgz = join(out, `${name.replace('@', '').replace('/', '-')}-${version}.tgz`);
  if (!publish) { console.log(`packed ${name}@${version}`); continue; }
  if (onNpm(name, version)) { console.log(`skip ${name}@${version}: already on npm`); continue; }
  run('npm', ['publish', tgz, '--access', 'public', ...(provenance ? ['--provenance'] : []), ...(dryRun ? ['--dry-run'] : [])], root);
  console.log(`${dryRun ? 'would publish' : 'published'} ${name}@${version}`);
}
console.log(publish ? 'npm: done' : `npm: packed ${ORDER.length} packages into ${out}; add --publish to publish them`);
