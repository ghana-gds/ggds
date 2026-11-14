// npx @ggds/create (packages/create): the website builder on the command line. From saved settings it makes the
// same website the builder makes, with the GGDS files in it; it will not write over a folder with files in it; it
// says what is wrong with settings in plain words; and --update moves a changed website to its GGDS without
// touching the pages.
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { starterFiles } from '../../docs/starter.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const pkg = join(root, 'packages', 'create');
const bin = join(pkg, 'bin', 'create.mjs');
const built = { skip: !existsSync(join(root, 'packages', 'css', 'dist', 'ggds.min.css')) && 'run pnpm run build' };
const { version } = JSON.parse(readFileSync(join(pkg, 'package.json'), 'utf8'));
const SITE = { name: 'Ghana Roads Authority', short: 'gra', purpose: 'We build roads.', host: 'www.roads.gov.gh', phone: '0302 123 456', email: 'info@roads.gov.gh', theme: 'nca', parts: { jobs: false } };

const create = (cwd, ...args) => spawnSync(process.execPath, [bin, ...args], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

test('from saved settings: the builder’s website, with GGDS, and it will not write over files', built, () => {
  execFileSync(process.execPath, [join(pkg, 'build.mjs')], { cwd: root, stdio: 'ignore' });
  const dir = mkdtempSync(join(tmpdir(), 'ggds-create-'));
  try {
    writeFileSync(join(dir, 'settings.json'), JSON.stringify(SITE));
    const made = create(dir, '--from', 'settings.json');
    assert.equal(made.status, 0, made.stderr);
    assert.match(made.stdout, /Made gra-website\/: 21 pages for Ghana Roads Authority/);
    const out = join(dir, 'gra-website');
    for (const [file, text] of Object.entries(starterFiles({ version, site: SITE }))) assert.equal(readFileSync(join(out, file), 'utf8'), text, file);
    for (const f of ['ggds/ggds.min.css', 'ggds/auto.js', 'ggds/index.js', 'ggds/themes/nca.css', 'LICENSE', 'LICENSE.md']) assert.ok(existsSync(join(out, f)), f);
    assert.ok(!existsSync(join(out, 'ggds', 'LICENSE')), 'the licences are at the top of the website, not in ggds/');

    const again = create(dir, '--from', 'settings.json');
    assert.equal(again.status, 1);
    assert.match(again.stderr, /already has files in it.*--update gra-website/s);

    // --update: a newer GGDS for a website someone has changed. Their pages stay as they are.
    writeFileSync(join(out, 'index.html'), '<p>Our own homepage</p>');
    writeFileSync(join(out, 'ggds', 'ggds.min.css'), '/* an old GGDS */');
    writeFileSync(join(out, 'ggds-site.json'), JSON.stringify({ ...SITE, ggds: '0.0.1' }));
    const updated = create(dir, '--update', 'gra-website');
    assert.equal(updated.status, 0, updated.stderr);
    assert.equal(readFileSync(join(out, 'index.html'), 'utf8'), '<p>Our own homepage</p>');
    assert.equal(readFileSync(join(out, 'ggds', 'ggds.min.css'), 'utf8'), readFileSync(join(root, 'packages', 'css', 'dist', 'ggds.min.css'), 'utf8'));
    assert.equal(JSON.parse(readFileSync(join(out, 'ggds-site.json'), 'utf8')).ggds, version);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('settings with problems: each one in plain words, and nothing made', built, () => {
  const dir = mkdtempSync(join(tmpdir(), 'ggds-create-'));
  try {
    writeFileSync(join(dir, 'bad.json'), JSON.stringify({ name: 'An Agency', short: 'A-B-C-D-E-F-G', host: 'not an address', theme: 'purple' }));
    const r = create(dir, '--from', 'bad.json');
    assert.equal(r.status, 1);
    for (const m of ['Initials must be 1 to 6 letters', 'Enter an address like www.example.gov.gh', 'Enter the email address people should use', 'Choose a theme from the list']) assert.ok(r.stderr.includes(m), m);
    const none = create(dir);
    assert.equal(none.status, 1);
    assert.match(none.stderr, /--from ggds-site\.json, or run this in a terminal/);
    assert.match(create(dir, '--update', 'nowhere').stderr, /not a GGDS website/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
