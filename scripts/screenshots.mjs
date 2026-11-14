// Takes the homepage's screenshots of example sites (docs/screenshots/<n>-<slug>.jpg) from the built site, so
// "What you can build" shows what GGDS builds: the showcase (docs/screenshots/showcase-<slug>.jpg) and the example
// sites. Run after pnpm run build, whenever the example sites' look changes:
//
//   pnpm run screenshots
//
// An example site is a 1280 × 800 view of its homepage; a showcase is its whole first page, 1280 wide (390 for a
// phone-first one). Both are saved at half size (phone at full size). The "Example" bar stays in the picture, so no
// screenshot can pass for a real website.
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { SHOWCASES } from '../docs/showcase.mjs';

const SITES = ['mocdti', 'nca', 'gmet', 'nita'];
const PORT = 4397;
const out = fileURLToPath(new URL('../docs/screenshots/', import.meta.url));
mkdirSync(out, { recursive: true });
// The agency example sites are built only with GGDS_AGENCY_SITES=1; without them, their screenshots are kept as they are.
const agencySites = existsSync(fileURLToPath(new URL('../site/agencies/', import.meta.url)));
const SHOTS = agencySites ? SITES : [];
for (const f of readdirSync(out).filter((f) => f.endsWith('.jpg') && (agencySites || f.startsWith('showcase-')))) rmSync(new URL(f, `file://${out}`));

const server = spawn(process.execPath, [fileURLToPath(new URL('./serve.mjs', import.meta.url))], { env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
try {
  for (let i = 0; ; i++) {
    try { await fetch(`http://localhost:${PORT}/index.html`); break; } catch { if (i > 50) throw new Error('server did not start'); await new Promise((r) => setTimeout(r, 100)); }
  }
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 0.5, reducedMotion: 'reduce' });
  for (const [i, slug] of SHOTS.entries()) {
    await page.goto(`http://localhost:${PORT}/agencies/${slug}.html`);
    await page.screenshot({ path: `${out}${i + 1}-${slug}.jpg`, type: 'jpeg', quality: 80 });
  }
  // The showcase: the whole of each example's first page, which its tile scrolls through when pointed at. A
  // phone-first example is taken at phone size; its tile draws the phone around it.
  for (const sc of SHOWCASES) {
    const shot = sc.phone
      ? await browser.newPage({ viewport: { width: 390, height: 780 }, deviceScaleFactor: 1, reducedMotion: 'reduce' })
      : page;
    await shot.goto(`http://localhost:${PORT}/showcase/${sc.pages[0].file}`);
    await shot.screenshot({ path: `${out}showcase-${sc.slug}.jpg`, type: 'jpeg', quality: 78, fullPage: true });
    if (sc.phone) await shot.close();
  }
  // The README's pictures of the showcase and the agency website starter (.github/assets/), taken from the built
  // documentation, sharp on high-density screens.
  const readme = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1.5, reducedMotion: 'reduce' });
  const assets = fileURLToPath(new URL('../.github/assets/', import.meta.url));
  mkdirSync(assets, { recursive: true });
  await readme.goto(`http://localhost:${PORT}/index.html`);
  const grid = readme.locator('.docs-showcase').first();
  await readme.evaluate(() => document.querySelectorAll('.docs-showcase__summary').forEach((e) => e.remove())); // the README says it
  await grid.scrollIntoViewIfNeeded();
  await readme.waitForLoadState('networkidle');
  await grid.screenshot({ path: `${assets}showcase.jpg`, type: 'jpeg', quality: 82 });
  await readme.goto(`http://localhost:${PORT}/starter/index.html`);
  await readme.waitForLoadState('networkidle');
  await readme.evaluate(() => document.querySelectorAll('.docs-exit').forEach((e) => e.remove())); // the download has no preview bar
  await readme.screenshot({ path: `${assets}starter.jpg`, type: 'jpeg', quality: 82, clip: { x: 0, y: 0, width: 1280, height: 760 } });
  await readme.close();
  await browser.close();
  console.log(`docs/screenshots: ${SHOTS.length + SHOWCASES.length} screenshots`);
  await (await import('./images.mjs')).optimise(); // the AVIF and WebP copies the site serves
} finally {
  server.kill();
}
