// Tests ggds-django (packages/django) and renders its example site into site/django/, where the browser tests
// check it. Needs uv (https://docs.astral.sh/uv/) to make the package's Python environment; without uv it says so
// and skips, so the rest of GGDS can be tested on machines without Python.
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const pkg = join(root, 'packages', 'django');
const python = join(pkg, '.venv', 'bin', 'python');
const run = (cmd, args, env = {}) => {
  const r = spawnSync(cmd, args, { cwd: pkg, stdio: 'inherit', env: { ...process.env, ...env } });
  if (r.status !== 0) process.exit(r.status ?? 1);
};

if (!existsSync(python)) {
  if (spawnSync('uv', ['--version']).status !== 0) {
    console.warn('test:django skipped: install uv to test ggds-django (https://docs.astral.sh/uv/).');
    process.exit(0);
  }
  run('uv', ['venv', '.venv']);
  run('uv', ['pip', 'install', '--python', '.venv', 'django>=5.0']);
}
run(python, ['-m', 'django', 'test', 'tests', '--settings', 'tests.settings'], { PYTHONPATH: 'src:.' });
run(python, ['demo/render.py', join(root, 'site')], { PYTHONPATH: 'src' });
