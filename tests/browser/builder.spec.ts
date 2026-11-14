// The website builder (builder.html), in a real browser under the strict Content Security Policy. Someone goes
// through the five steps:
// - chooses their kind of institution and gets its services;
// - writes their own service and its page, and sees it in the preview;
// - gets the GGDS error summary for anything missing in a step;
// - downloads their website in the way that suits them: a zip for their IT team with a handover, or a WordPress
//   import.
// What they type is kept on their device, and the settings file fills the form again.
import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { readZip } from '../../docs/zip.mjs';

const watchCsp = (page: Page) => {
  const csp: string[] = [];
  page.on('console', (m) => { if (/Content Security Policy|Refused to/i.test(m.text())) csp.push(m.text()); });
  page.on('pageerror', (e) => csp.push(`page error: ${e.message}`));
  return csp;
};
const step = (page: Page, n: number) => page.locator(`[data-step="${n}"]`);
const next = (page: Page, n: number) => step(page, n).getByRole('button', { name: 'Continue' }).click();

/** Step 1, filled in: a district assembly. */
async function who(page: Page) {
  await page.getByLabel('District assembly').check();
  await page.locator('#wb-name').fill('Tamale Metropolitan Assembly');
  await page.locator('#wb-short').fill('tama');
  await page.locator('#wb-purpose').fill('We plan, build and look after Tamale.');
  await page.locator('#wb-host').fill('www.tama.gov.gh');
}

test('without JavaScript, the page says so and offers the example download', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/builder.html');
  await expect(page.locator('[data-wb-fallback]')).toBeVisible();
  await expect(page.locator('[data-wb]')).toBeHidden();
  await expect(page.locator('[data-wb-fallback] a[download]')).toHaveAttribute('href', /downloads\/ggds-agency-starter-.*\.zip$/);
  await context.close();
});

test('each step is checked before the next: the error summary, focused, linking to each field', async ({ page }) => {
  const csp = watchCsp(page);
  await page.goto('/builder.html');
  await expect(step(page, 0)).toBeVisible();
  await expect(step(page, 1)).toBeHidden();
  await next(page, 0);
  const summary = page.locator('#wb-errors');
  await expect(summary).toBeFocused();
  await expect(page).toHaveTitle(/^Error: /);
  await expect(summary.getByRole('link')).toHaveText(["Enter your institution's name", "Enter your institution's initials", "Enter your website's address"]);
  await summary.getByRole('link', { name: "Enter your website's address" }).click();
  await expect(page.locator('#wb-host')).toBeFocused();
  await expect(page.locator('#wb-host')).toHaveAttribute('aria-invalid', 'true');
  await who(page);
  await next(page, 0);
  await expect(step(page, 1)).toBeVisible();
  await expect(page.locator('#wb-errors')).toBeHidden();
  await expect(page.getByRole('heading', { name: 'Step 2 of 5: what people come to do' })).toBeFocused();
  expect(csp).toEqual([]);
});

test('an institution known to GGDS fills in its name, initials and colour', async ({ page }) => {
  await page.goto('/builder.html');
  await page.locator('#wb-known').selectOption('nca');
  await expect(page.locator('#wb-name')).toHaveValue('National Communications Authority');
  await expect(page.locator('#wb-short')).toHaveValue('NCA');
  await expect(page.locator('#wb-theme')).toHaveValue('nca');
  await expect(page.locator('#wb-preview .ggds-header__name')).toHaveText('National Communications Authority');
});

test('from kind of institution to website: their own services and words, in the preview and in the zip', async ({ page }) => {
  const csp = watchCsp(page);
  await page.goto('/builder.html');
  await who(page);
  const preview = page.locator('#wb-preview');
  await expect(preview.locator('.ggds-header__name')).toHaveText('Tamale Metropolitan Assembly');
  await expect(preview.locator('.ggds-hero__task').first()).toHaveText('Apply for a building permit');
  await next(page, 0);

  // Step 2: the assembly's services; change one, add their own and write its page.
  await expect(page.locator('#wb-svc-0-title')).toHaveValue('Apply for a building permit');
  await page.locator('#wb-question').fill('What do you need from the assembly today?');
  await page.getByRole('button', { name: 'Add a service' }).click();
  await expect(page.locator('#wb-svc-4-title')).toBeFocused();
  await page.locator('#wb-svc-4-title').fill('Get a market stall');
  await page.locator('#wb-svc-4-summary').fill('In Aboabo and the central market.');
  await page.locator('#wb-svc-4-task').check();
  await step(page, 1).locator('[data-preview-service="4"] summary').click();
  await page.locator('#wb-svc-4-need').fill('your Ghana Card\nyour business name');
  await expect(page.locator('#wb-preview-page')).toHaveValue('get-a-market-stall.html');
  await expect(preview.locator('.ggds-main p').filter({ hasText: 'Get a market stall' }).first()).toBeVisible();
  await expect(preview.getByText('your business name')).toBeVisible();
  // One service at most has the online application.
  await page.locator('#wb-svc-4-online').check();
  await expect(page.locator('#wb-svc-0-online')).not.toBeChecked();
  await page.locator('#wb-svc-4-online').uncheck();
  await page.locator('#wb-svc-0-online').check();
  await next(page, 1);

  // Step 3: no jobs; about us in their words.
  await page.locator('#wb-part-jobs').uncheck();
  await page.locator('#wb-about-who').fill('The metropolitan chief executive leads the assembly.');
  await next(page, 2);

  // Step 4: contact details and their own colour.
  await page.locator('#wb-phone').fill('0372 022 000');
  await page.locator('#wb-email').fill('info@tama.gov.gh');
  await page.locator('#wb-office1-lines').fill('Assembly Hall\nTamale\nNT-000-0001');
  await page.locator('#wb-theme').selectOption('custom');
  await page.locator('#wb-colour').fill('#7a1fa2');
  await expect(page.locator('#wb-colour-status')).toContainText('passes every contrast check');
  expect(await preview.evaluate((el) => el.style.getPropertyValue('--ggds-color-institution'))).toBe('#7a1fa2');
  await next(page, 3);

  // Step 5: the words still the example's, then the zip for their IT team.
  await expect(page.locator('#wb-examples')).toBeVisible();
  await expect(page.locator('#wb-examples-list')).toContainText('Business operating permit: the whole page');
  await expect(page.locator('#wb-examples-list')).not.toContainText('Homepage');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download my website' }).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe('tama-website.zip');
  await expect(page.locator('#wb-done')).toBeFocused();
  await expect(page.locator('#wb-next')).toContainText('HANDOVER.md');

  const zip = readZip(new Uint8Array(readFileSync(await file.path())));
  const text = (f: string) => new TextDecoder().decode(zip[`tama-website/${f}`]);
  for (const f of ['index.html', 'get-a-market-stall.html', 'apply-for-a-building-permit.html', 'apply.html', 'ggds/ggds.min.css', 'assets/theme.css', '.htaccess', 'HANDOVER.md', 'ggds-site.json', 'README.md']) {
    expect(zip[`tama-website/${f}`], f).toBeTruthy();
  }
  expect(zip['tama-website/jobs.html']).toBeUndefined();
  expect(text('index.html')).toContain('What do you need from the assembly today?');
  expect(text('index.html')).toContain('href="get-a-market-stall.html">Get a market stall</a>');
  expect(text('get-a-market-stall.html')).toContain('<li>your Ghana Card</li><li>your business name</li>');
  expect(text('about.html')).toContain('The metropolitan chief executive leads the assembly.');
  expect(text('apply.html')).toContain('Which building permit do you need?');
  expect(text('HANDOVER.md')).toContain('www.tama.gov.gh');
  const saved = JSON.parse(text('ggds-site.json'));
  expect(saved).toMatchObject({ kind: 'assembly', name: 'Tamale Metropolitan Assembly', short: 'TAMA', theme: '#7a1fa2', parts: { jobs: false } });

  // What they typed is kept on this device: after a reload, the form is as they left it.
  await page.reload();
  await expect(page.locator('#wb-restored')).toBeVisible();
  await expect(step(page, 4)).toBeVisible();
  await page.locator('[data-goto="1"]').click();
  await expect(page.locator('#wb-svc-4-title')).toHaveValue('Get a market stall');

  // The settings file fills the form on another device.
  await page.getByRole('button', { name: 'Start again with an empty form' }).click();
  await expect(page.locator('#wb-name')).toHaveValue('');
  await page.locator('#wb-settings').setInputFiles({ name: 'ggds-site.json', mimeType: 'application/json', buffer: Buffer.from(text('ggds-site.json')) });
  await expect(page.locator('#wb-name')).toHaveValue('Tamale Metropolitan Assembly');
  await expect(page.locator('#wb-theme')).toHaveValue('custom');
  await expect(page.getByLabel('District assembly')).toBeChecked();
  await page.locator('[data-goto="1"]').click();
  await expect(page.locator('#wb-svc-4-title')).toHaveValue('Get a market stall');
  expect(csp).toEqual([]);
});

test('changing the kind of institution changes the example words, but never words someone has written', async ({ page }) => {
  await page.goto('/builder.html');
  await page.getByLabel('Hospital or health service').check();
  await page.locator('[data-goto="1"]').click();
  await expect(page.locator('#wb-svc-0-title')).toHaveValue('Book an appointment');
  await page.locator('#wb-question').fill('Our own question');
  await page.locator('[data-goto="0"]').click();
  await page.getByLabel('School, college or university').check();
  await page.locator('[data-goto="1"]').click();
  await expect(page.locator('#wb-svc-0-title')).toHaveValue('Apply for admission');
  await expect(page.locator('#wb-question')).toHaveValue('Our own question');
});

test('on WordPress: the pages, news and menus as a WordPress import', async ({ page }) => {
  await page.goto('/builder.html');
  await who(page);
  await page.locator('[data-goto="3"]').click();
  await page.locator('#wb-phone').fill('0372 022 000');
  await page.locator('#wb-email').fill('info@tama.gov.gh');
  await page.locator('[data-goto="4"]').click();
  await page.getByLabel('On WordPress').check();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download my website' }).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe('tama-wordpress.zip');
  await expect(page.locator('#wb-next')).toContainText('Tools > Import > WordPress');
  const zip = readZip(new Uint8Array(readFileSync(await file.path())));
  const wxr = new TextDecoder().decode(zip['tama-wordpress/wordpress-import.xml']);
  expect(wxr).toContain('<wp:term_name><![CDATA[Main sections]]></wp:term_name>');
  expect(wxr).toContain('<title>Apply for a building permit</title>');
  expect(zip['tama-wordpress/README.md']).toBeTruthy();
  expect(zip['tama-wordpress/index.html']).toBeUndefined();
});

test('the preview at full screen: over the whole page, nothing behind it can be reached, and Escape closes it', async ({ page }) => {
  // Measured without the short scale-in, which would make the box smaller for a moment.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/builder.html');
  const full = page.getByRole('button', { name: 'Full screen' });
  await full.click();
  const aside = page.locator('.wb__aside');
  await expect(page.getByRole('button', { name: 'Exit full screen' })).toHaveAttribute('aria-pressed', 'true');
  const box = await aside.boundingBox();
  const view = page.viewportSize()!;
  expect(box!.width).toBeGreaterThanOrEqual(view.width - 1);
  expect(box!.height).toBeGreaterThanOrEqual(view.height - 1);
  expect(await page.locator('#wb-form').evaluate((el) => el.closest('[inert]') !== null)).toBe(true);
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflow)).toBe('hidden');
  // Phone size still works inside it.
  await page.getByRole('button', { name: 'Phone size' }).click();
  await expect(page.locator('#wb-preview')).toHaveClass(/wb__preview--phone/);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Full screen' })).toBeFocused();
  await expect(page.getByRole('button', { name: 'Full screen' })).toHaveAttribute('aria-pressed', 'false');
  expect(await page.locator('#wb-form').evaluate((el) => el.closest('[inert]') !== null)).toBe(false);
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflow)).not.toBe('hidden');
});

test('a colour too light to read: the website uses the nearest darker shade, and says so', async ({ page }) => {
  await page.goto('/builder.html');
  await page.locator('[data-goto="3"]').click();
  await page.locator('#wb-theme').selectOption('custom');
  await page.locator('#wb-colour').fill('#ffcc00');
  await expect(page.locator('#wb-colour-status')).toContainText('too light to read on white');
  expect(await page.locator('#wb-preview').evaluate((el) => el.style.getPropertyValue('--ggds-color-institution'))).not.toBe('#ffcc00');
});

test('the homepage leads to the builder, and the builder to GGDS Switch for WordPress websites', async ({ page }) => {
  await page.goto('/index.html');
  await page.locator('.docs-starter').getByRole('link', { name: 'Make your website' }).click();
  await expect(page).toHaveURL(/builder\.html$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Make your website');
  await page.getByRole('link', { name: 'GGDS Switch' }).click();
  await expect(page).toHaveURL(/wordpress\.html$/);
});
