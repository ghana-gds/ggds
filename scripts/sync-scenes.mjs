// Copies each agency's homepage drawing from the MoCDTI platform into docs/scenes/, so the example sites show
// exactly what the live sites draw beside their hero. The scenes are Astro components that compute their drawing
// from each agency's settings, so the platform's own dev server renders them, one agency at a time.
//
//   pnpm run sync:scenes          (needs the platform at GGDS_PLATFORM_DIR, default ../agencies/platform)
//
// Each scene's stylesheet is copied with the platform's --site-* colours swapped for the GGDS tokens, so the
// drawings follow GGDS themes. Scene scripts are not copied: every scene works without one (it shows its first
// item). The scene's own script is copied too, converted from TypeScript, as a module file the strict Content
// Security Policy allows. The markup is captured as the server sends it, before any script runs.
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import ts from 'typescript';
import { platformDir } from '../packages/themes/sync.mjs';
import { hideContacts } from '../docs/contacts.mjs';

const out = fileURLToPath(new URL('../docs/scenes/', import.meta.url));
const platform = platformDir();
const web = join(platform, 'apps', 'web');
const PORT = Number(process.env.SCENE_PORT ?? 4398);
const VARS = {
  '--site-agency-deep': '--ggds-color-institution-deep',
  '--site-agency': '--ggds-color-institution',
  '--site-brand-700': '--ggds-color-brand-700',
  '--site-brand-900': '--ggds-color-brand-900',
  '--site-flag-gold': '--ggds-color-flag-gold',
  '--site-flag-green': '--ggds-color-flag-green',
  '--site-flag-red': '--ggds-color-flag-red',
  '--site-ink': '--ggds-color-text',
};

if (!existsSync(web)) throw new Error(`The platform is not at ${platform} (set GGDS_PLATFORM_DIR).`);
const slugs = readdirSync(join(platform, 'agencies'), { withFileTypes: true })
  .filter((d) => d.isDirectory() && existsSync(join(platform, 'agencies', d.name, 'profile.json')))
  .map((d) => ({ slug: d.name, profile: JSON.parse(readFileSync(join(platform, 'agencies', d.name, 'profile.json'), 'utf8')) }))
  .filter((a) => a.profile.status !== 'fixture' && !a.profile.modules.hub) // a ministry hub's homepage has no drawing
  .map((a) => a.slug);

const swap = (css) => {
  let result = css;
  for (const [from, to] of Object.entries(VARS)) result = result.replaceAll(`var(${from},`, `var(${to},`).replaceAll(`var(${from})`, `var(${to})`);
  const left = result.match(/--site-[a-z0-9-]+/g);
  if (left) throw new Error(`A scene uses platform colours GGDS has no token for: ${[...new Set(left)].join(', ')}`);
  return result;
};
const astro = (args, slug) => execSync(`npx astro dev ${args}`, { cwd: web, stdio: 'ignore', env: { ...process.env, AGENCY_SLUG: slug ?? '' } });
const ready = async () => {
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(`http://localhost:${PORT}/`)).ok) return; } catch { /* starting */ }
    await new Promise((r) => setTimeout(r, 1500));
  }
  throw new Error('The platform dev server did not start.');
};

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({ javaScriptEnabled: false }); // the markup as the server sends it
const index = {};
try {
  for (const slug of slugs) {
    try { astro('stop'); } catch { /* not running */ }
    astro(`--port ${PORT}`, slug);
    await ready();
    const page = await context.newPage();
    await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });
    const art = page.locator('[data-hero-art]').first();
    if (!(await art.count())) { console.log(`${slug}: no drawing`); await page.close(); continue; }
    let html = await art.innerHTML();
    const href = html.match(/<link rel="stylesheet" href="(\/src\/components\/scenes\/([A-Za-z]+)\.css)">/);
    let css;
    let scene;
    if (href) {
      scene = href[2];
      css = readFileSync(join(web, href[1]), 'utf8');
    } else {
      scene = 'DefaultHeroArt';
      css = await page.evaluate(() => [...document.querySelectorAll('style')].map((s) => s.textContent).find((t) => t.includes('default-hero-art')) ?? '');
    }
    // The scene's colours: the platform puts them in each page's head (config/agency.ts sceneColours), keyed by
    // data-c. The theme rule (html:root) and the hub's card colours are left out: GGDS themes cover those.
    const colours = await page.evaluate(() => [...document.querySelectorAll('style')].map((s) => s.textContent ?? '')
      .find((t) => t.includes('html:root{--site-agency')) ?? '');
    css += `\n/* Scene colours (the platform's config/agency.ts) */\n${colours.replace(/html:root\{[^}]*\}/, '').replace(/\[data-agency="[^"]+"\]\{[^}]*\}/g, '')}`;
    await page.close();
    html = html.replace(/<link [^>]*>/g, '').replace(/<script[\s\S]*?<\/script>/g, '').trim();
    if (/\sstyle="/.test(html)) throw new Error(`${slug}: the drawing has style attributes, which the strict Content Security Policy blocks`);
    // Unconfirmed reporting channels never reach this repository (docs/contacts.mjs).
    const siteJson = join(platform, 'agencies', slug, 'site.json');
    html = hideContacts(html, existsSync(siteJson) ? JSON.parse(readFileSync(siteJson, 'utf8')).home : {});
    writeFileSync(join(out, `${slug}.html`), `${html}\n`);
    // The scene's script, from its source, as JavaScript.
    if (scene !== 'DefaultHeroArt') {
      const source = readFileSync(join(web, 'src', 'components', 'scenes', `${scene}.astro`), 'utf8');
      const script = source.match(/<script>([\s\S]*?)<\/script>/)?.[1];
      if (script) {
        const js = ts.transpileModule(script, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
        writeFileSync(join(out, `${slug}.js`), `// ${scene}, copied from the MoCDTI platform by scripts/sync-scenes.mjs. Do not edit.\n${js}`);
      }
    }
    writeFileSync(join(out, `${slug}.css`), `/* ${scene}, copied from the MoCDTI platform by scripts/sync-scenes.mjs. Do not edit. */\n${swap(css)}\n`);
    index[slug] = scene;
    console.log(`${slug}: ${scene}`);
  }
} finally {
  await browser.close();
  try { astro('stop'); } catch { /* already stopped */ }
}
writeFileSync(join(out, 'scenes.json'), `${JSON.stringify(index, null, 2)}\n`);
