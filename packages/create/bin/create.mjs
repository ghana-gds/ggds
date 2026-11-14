#!/usr/bin/env node
// @ggds/create: makes a Government of Ghana website with GGDS, the same website the builder on the GGDS website
// makes (https://ghana-gds.github.io/ggds/builder.html), from the same code.
//
//   npm init @ggds                              asks for your institution's details, then makes the website
//   npx @ggds/create --from ggds-site.json      makes it again from saved settings, with this version of GGDS
//   npx @ggds/create --update my-website        moves a website you have changed to this version of GGDS:
//                                               replaces only its ggds/ folder, so your words are kept
//
//   --stack <kind>    html (plain pages, the default), next (Next.js with @ggds/react), astro (Astro with
//                     @ggds/astro) or django (Django with ggds-django): the same pages in each
//   --out <folder>    where to make it (default: <initials>-website)
//   --logo <file>     your approved logo: SVG, PNG, JPEG or WebP, under 200 KB
//   --force           write into a folder that already has files in it
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { fileURLToPath } from 'node:url';
import { starterProject } from '../lib/starter.js';
import { DEFAULT_SITE, PARTS, SITE_FILE, checkSite, normaliseSite, pagesFor } from '../lib/starter-site.js';
import { STACKS, STACK_IDS } from '../lib/starter-stacks.js';

const here = fileURLToPath(new URL('../', import.meta.url));
const { version } = JSON.parse(readFileSync(join(here, 'package.json'), 'utf8'));
const GGDS = join(here, 'ggds');
// The ready-made themes: one file each (themes.css holds them all, for a page that shows several institutions).
const THEMES = readdirSync(join(GGDS, 'themes')).filter((f) => f.endsWith('.css') && f !== 'themes.css').map((f) => f.slice(0, -4)).sort();

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const option = (name) => {
  const i = args.indexOf(`--${name}`);
  if (i === -1) return undefined;
  const v = args[i + 1];
  if (!v || v.startsWith('--')) fail(`--${name} needs a value`);
  return v;
};
function fail(message) {
  console.error(`ggds-create: ${message}`);
  process.exit(1);
}

if (flag('help') || flag('h')) {
  console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1).filter((l) => l.startsWith('//')).map((l) => l.slice(3)).join('\n'));
  process.exit(0);
}
if (flag('version')) { console.log(version); process.exit(0); }

const stackProblem = (v) => (STACK_IDS.includes(v) ? '' : `choose ${STACK_IDS.join(', ')}`);
let stack = option('stack');
if (stack && stackProblem(stack)) fail(`--stack ${stack}: ${stackProblem(stack)}`);

const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((f) => (f.isDirectory() ? walk(join(d, f.name)) : [join(d, f.name)]));
/** The GGDS files every website gets, as { path in the website: file in this package }. */
const ggdsFiles = () => Object.fromEntries(walk(GGDS).map((f) => {
  const rel = f.slice(GGDS.length + 1).split('\\').join('/');
  return [/^LICENSE(\.md)?$/.test(rel) ? rel : `ggds/${rel}`, f];
}));

// ---- --update: a newer GGDS for a website someone has already changed ---------------------------------------
const update = option('update');
if (update) {
  const dir = resolve(update);
  if (!existsSync(join(dir, 'ggds', 'ggds.min.css'))) {
    if (existsSync(join(dir, 'manage.py'))) fail(`${update} is a Django website: move it to a newer GGDS with pip install --upgrade ggds-django`);
    if (existsSync(join(dir, 'package.json'))) fail(`${update} uses GGDS from npm: move it to a newer GGDS with npm update (its @ggds packages), then check the changelog`);
    fail(`${update} is not a GGDS website: it has no ggds/ggds.min.css`);
  }
  rmSync(join(dir, 'ggds'), { recursive: true, force: true });
  for (const [to, from] of Object.entries(ggdsFiles())) {
    if (!to.startsWith('ggds/')) continue;
    mkdirSync(dirname(join(dir, to)), { recursive: true });
    copyFileSync(from, join(dir, to));
  }
  const settings = join(dir, SITE_FILE);
  if (existsSync(settings)) {
    const saved = JSON.parse(readFileSync(settings, 'utf8'));
    writeFileSync(settings, `${JSON.stringify({ ...saved, ggds: version }, null, 2)}\n`);
  }
  console.log(`${update}: now GGDS ${version}. Your pages are as they were. Check what changed: https://ghana-gds.github.io/ggds/changelog.html`);
  process.exit(0);
}

// ---- The settings: from a file, or asked for ----------------------------------------------------------------
async function ask() {
  if (!process.stdin.isTTY) fail(`give your settings with --from ${SITE_FILE}, or run this in a terminal to answer the questions`);
  // One queue of lines, so answers typed ahead or pasted are kept in order (rl.question drops them).
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const lines = rl[Symbol.asyncIterator]();
  const line = async (prompt) => {
    process.stdout.write(prompt);
    const { value, done } = await lines.next();
    if (done) fail('stopped before every question was answered');
    return value;
  };
  const q = async (label, { example, initial = '', required = true, check } = {}) => {
    for (;;) {
      const hint = initial ? ` [${initial}]` : example ? ` (such as ${example})` : '';
      const answer = (await line(`${label}${hint}: `)).trim() || initial;
      if (!answer && required) { console.log('  Please answer this one.'); continue; }
      const problem = answer && check?.(answer);
      if (problem) { console.log(`  ${problem}`); continue; }
      return answer;
    }
  };
  const yes = async (label, initial) => {
    const a = (await line(`${label} [${initial ? 'Y/n' : 'y/N'}]: `)).trim().toLowerCase();
    return a ? a.startsWith('y') : initial;
  };
  const fieldCheck = (field) => (value) => checkSite({ ...DEFAULT_SITE, [field]: value }, { themes: THEMES }).find((p) => p.field === field && !p.warning)?.message;

  console.log(`\nGGDS ${version}: a website for your institution. Press Enter to keep the answer in [brackets].\n`);
  const site = {};
  site.name = await q('Your institution\'s full name', { example: 'National Communications Authority' });
  site.short = await q('Its initials', { example: 'NCA', check: fieldCheck('short') });
  site.purpose = await q('What you do, in one sentence', { example: DEFAULT_SITE.purpose });
  site.host = await q("Your website's address", { example: 'www.nca.gov.gh', check: fieldCheck('host') });
  if (!/\.gov\.gh$/.test(normaliseSite(site).host)) console.log('  Most government websites end in .gov.gh. Check the address before you go live.');
  site.phone = await q('Phone number', { example: DEFAULT_SITE.phone, check: fieldCheck('phone') });
  site.hours = await q('Opening hours', { initial: DEFAULT_SITE.hours });
  site.email = await q('Email address for enquiries', { example: `info@${normaliseSite(site).host.replace(/^www\./, '')}`, check: fieldCheck('email') });
  const office = await q('Your main office\'s address, with commas between the lines', { example: '1 Example Road, Accra, GA-000-0000' });
  site.offices = [{ name: 'Head office', lines: office.split(',').map((l) => l.trim()).filter(Boolean) }];
  console.log(`\n  Themes: ${THEMES.join(', ')}. Or give your own colour as a hex code, such as #006e35.`);
  site.theme = await q('Theme or colour', { initial: DEFAULT_SITE.theme, check: fieldCheck('theme') });
  console.log('\n  Every website has a homepage, services, about us, contact us, search, and the accessibility, privacy and disclaimer pages.');
  site.parts = {};
  for (const p of PARTS) site.parts[p.id] = await yes(`  ${p.label}: ${p.hint.toLowerCase()}?`, true);
  site.forms = await q('\nThe address your forms send to (Enter to leave it for now)', { required: false, check: fieldCheck('forms') });
  if (!stack) {
    console.log(`\n  ${STACKS.map((s) => `${s.id}: ${s.label}. ${s.hint}`).join('\n  ')}`);
    stack = await q('What to make it with', { initial: 'html', check: stackProblem });
  }
  rl.close();
  return site;
}

const from = option('from');
let site;
if (from) {
  try { site = JSON.parse(readFileSync(resolve(from), 'utf8')); } catch (e) { fail(`could not read ${from}: ${e.message}`); }
} else site = await ask();

const problems = checkSite(site, { themes: THEMES });
for (const p of problems.filter((x) => x.warning)) console.warn(`warning: ${p.message}`);
const errors = problems.filter((x) => !x.warning);
if (errors.length) fail(`fix these in your settings first:\n${errors.map((p) => `  - ${p.field}: ${p.message}`).join('\n')}`);

// ---- The logo ------------------------------------------------------------------------------------------------
const logoFile = option('logo');
let logo;
if (logoFile) {
  const ext = extname(logoFile).toLowerCase().replace('.jpeg', '.jpg');
  if (!['.svg', '.png', '.jpg', '.webp'].includes(ext)) fail('--logo must be an SVG, PNG, JPEG or WebP image');
  if (statSync(logoFile).size > 200 * 1024) fail('--logo must be smaller than 200 KB');
  logo = { path: `assets/logo${ext}`, from: resolve(logoFile) };
  site = { ...site, logo: logo.path };
} else if (site.logo) {
  console.warn(`warning: your settings name a logo (${site.logo}), but ${SITE_FILE} does not hold it: give it again with --logo, or the initials are shown`);
  site = { ...site, logo: '' };
}

// ---- Make it -------------------------------------------------------------------------------------------------
const clean = normaliseSite(site);
const out = resolve(option('out') ?? `${clean.short.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-website`);
if (existsSync(out) && readdirSync(out).length && !flag('force')) {
  fail(`${basename(out)} already has files in it. Choose another --out, or add --force to write over them. To move a website you have changed to a newer GGDS, use --update ${basename(out)}.`);
}
stack ??= 'html';
const project = starterProject({ version, site: clean, stack });
for (const [path, text] of Object.entries(project.files)) {
  mkdirSync(dirname(join(out, path)), { recursive: true });
  writeFileSync(join(out, path), text);
}
// Plain HTML carries GGDS in ggds/; a framework project installs it as a package.
if (project.ggds) {
  for (const [to, fromFile] of Object.entries(ggdsFiles())) {
    mkdirSync(dirname(join(out, to)), { recursive: true });
    copyFileSync(fromFile, join(out, to));
  }
}
if (logo) {
  mkdirSync(join(out, project.assetDir), { recursive: true });
  copyFileSync(logo.from, join(out, project.assetDir, basename(logo.path)));
}

const pages = pagesFor(clean).size;
const name = basename(out);
const RUN = {
  html: `Read ${name}/README.md: how to put it online on your kind of hosting.`,
  next: `cd ${name} && npm install && npm run dev   (npm run build writes the website to out/)`,
  astro: `cd ${name} && npm install && npm run dev   (npm run build writes the website to dist/)`,
  django: `cd ${name} && python -m venv .venv && . .venv/bin/activate && pip install -r requirements.txt && python manage.py runserver`,
};
const again = `npx @ggds/create --from ${SITE_FILE}${stack === 'html' ? '' : ` --stack ${stack}`}`;
console.log(`
Made ${name}/: ${pages} pages for ${clean.name}, with GGDS ${version}${stack === 'html' ? '' : `, in ${STACKS.find((s) => s.id === stack).label}`}.

Next:
  1. ${RUN[stack]}
  2. Rewrite the example words on each page for your own services.
  3. Keep ${SITE_FILE}: it makes this website again (${again}).
  4. When it is online, check it: npx @ggds/check https://${clean.host}
`);
