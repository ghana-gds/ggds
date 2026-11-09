// Builds ggds-django for PyPI: release/pypi/ggds_django-<version>-py3-none-any.whl and the .tar.gz source.
// Run after `pnpm run build` (which copies the GGDS styles, themes, script and icons into the package). Needs uv.
//
//   node scripts/pack-django.mjs      (pnpm run pack:django)
//
// The release workflow runs this, then publishes the files with PyPI trusted publishing.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const pkg = join(root, 'packages', 'django');
const out = join(root, 'release', 'pypi');
const run = (cmd, args) => {
  const r = spawnSync(cmd, args, { cwd: pkg, stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status ?? 1);
};

if (!existsSync(join(pkg, 'src', 'ggds_django', 'static', 'ggds', 'ggds.min.css'))) {
  console.error('ggds-django has no static files: run pnpm run build first.');
  process.exit(1);
}
run('node', [join(root, 'scripts', 'package-files.mjs')]); // LICENSE and LICENSE.md, as for the npm packages
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
run('uv', ['build', '--out-dir', out]);
