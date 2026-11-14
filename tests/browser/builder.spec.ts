// The website builder (builder.html), in a real browser under the strict Content Security Policy: someone fills in
// their institution's details, gets the GGDS error summary when something is missing, sees a preview in their colour,
// and downloads a zip that is their own website, with the GGDS files in it. Then the same zip's settings file fills
// the form again.
import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { readZip } from '../../docs/zip.mjs';

const watchCsp = (page: Page) => {
  const csp: string[] = [];
  page.on('console', (m) => { if (/Content Security Policy|Refused to/i.test(m.text())) csp.push(m.text()); });
  page.on('pageerror', (e) => csp.push(`page error: ${e.message}`));
  return csp;
};

test('without JavaScript, the page says so and offers the example download', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/builder.html');
  await expect(page.locator('[data-wb-fallback]')).toBeVisible();
  await expect(page.locator('[data-wb]')).toBeHidden();
  await expect(page.locator('[data-wb-fallback] a[download]')).toHaveAttribute('href', /downloads\/ggds-agency-starter-.*\.zip$/);
  await context.close();
});

test('missing details: the error summary, focused, linking to each field', async ({ page }) => {
  const csp = watchCsp(page);
  await page.goto('/builder.html');
  await page.getByRole('button', { name: 'Download my website' }).click();
  const summary = page.locator('#wb-errors');
  await expect(summary).toBeVisible();
  await expect(summary).toBeFocused();
  await expect(page).toHaveTitle(/^Error: /);
  await expect(summary.getByRole('link')).toHaveText([
    "Enter your institution's name", "Enter your institution's initials", "Enter your website's address",
    'Enter the email address people should use', 'Enter the phone number people should call',
  ]);
  await summary.getByRole('link', { name: "Enter your website's address" }).click();
  await expect(page.locator('#wb-host')).toBeFocused();
  await expect(page.locator('#wb-host')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#wb-host')).toHaveAttribute('aria-describedby', /wb-host-error/);
  expect(csp).toEqual([]);
});

test('details in, website out: a zip of their own website, with GGDS in it', async ({ page }) => {
  const csp = watchCsp(page);
  await page.goto('/builder.html');
  await page.locator('#wb-name').fill('Ghana Roads Authority');
  await page.locator('#wb-short').fill('gra');
  await page.locator('#wb-purpose').fill('We build and look after the roads of Ghana.');
  await page.locator('#wb-host').fill('www.roads.gov.gh');
  await page.locator('#wb-phone').fill('0302 123 456');
  await page.locator('#wb-email').fill('info@roads.gov.gh');
  await page.locator('#wb-office1-lines').fill('5 Main Street\nTamale\nNT-123-4567');
  await page.locator('#wb-theme').selectOption('custom');
  await page.locator('#wb-colour').fill('#7a1fa2');
  await page.locator('#wb-part-jobs').uncheck();

  // The preview: their name, their initials, their colour.
  const preview = page.locator('#wb-preview');
  await expect(preview.locator('.ggds-header__name')).toHaveText('Ghana Roads Authority');
  await expect(preview.locator('.ggds-header__monogram')).toHaveText('GRA');
  await expect(preview.locator('.ggds-hero__purpose')).toHaveText('We build and look after the roads of Ghana.');
  expect(await preview.evaluate((el) => el.style.getPropertyValue('--ggds-color-institution'))).toBe('#7a1fa2');
  await expect(page.locator('#wb-colour-status')).toContainText('passes every contrast check');

  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download my website' }).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe('gra-website.zip');
  await expect(page.locator('#wb-done')).toBeFocused();
  await expect(page.locator('#wb-next-host')).toHaveText('www.roads.gov.gh');

  const zip = readZip(new Uint8Array(readFileSync(await file.path())));
  const text = (f: string) => new TextDecoder().decode(zip[`gra-website/${f}`]);
  for (const f of ['index.html', 'contact.html', 'ggds/ggds.min.css', 'ggds/auto.js', 'ggds/index.js', 'assets/theme.css', 'assets/site.js', '.htaccess', '_headers', 'ggds-site.json', 'README.md', 'LICENSE']) {
    expect(zip[`gra-website/${f}`], f).toBeTruthy();
  }
  expect(zip['gra-website/jobs.html']).toBeUndefined();
  expect(text('index.html')).toContain('<title>Ghana Roads Authority</title>');
  expect(text('index.html')).toContain('href="assets/theme.css"');
  expect(text('assets/theme.css')).toContain('--ggds-color-institution: #7a1fa2;');
  expect(text('contact.html')).toContain('<address>5 Main Street<br>Tamale<br>NT-123-4567</address>');
  expect(text('index.html')).not.toContain('Example Agency');
  const saved = JSON.parse(text('ggds-site.json'));
  expect(saved).toMatchObject({ name: 'Ghana Roads Authority', short: 'GRA', host: 'www.roads.gov.gh', theme: '#7a1fa2', parts: { jobs: false } });

  // Start again from the settings file: the form fills in as it was.
  await page.goto('/builder.html');
  await page.locator('#wb-settings').setInputFiles({ name: 'ggds-site.json', mimeType: 'application/json', buffer: Buffer.from(text('ggds-site.json')) });
  await expect(page.locator('#wb-name')).toHaveValue('Ghana Roads Authority');
  await expect(page.locator('#wb-theme')).toHaveValue('custom');
  await expect(page.locator('#wb-colour')).toHaveValue('#7a1fa2');
  await expect(page.locator('#wb-part-jobs')).not.toBeChecked();
  await expect(page.locator('#wb-office1-lines')).toHaveValue('5 Main Street\nTamale\nNT-123-4567');
  expect(csp).toEqual([]);
});

test('a colour too light to read: the website uses the nearest darker shade, and says so', async ({ page }) => {
  await page.goto('/builder.html');
  await page.locator('#wb-theme').selectOption('custom');
  await page.locator('#wb-colour').fill('#ffcc00');
  await expect(page.locator('#wb-colour-status')).toContainText('too light to read on white');
  expect(await page.locator('#wb-preview').evaluate((el) => el.style.getPropertyValue('--ggds-color-institution'))).not.toBe('#ffcc00');
});

test('the homepage leads to the builder', async ({ page }) => {
  await page.goto('/index.html');
  await page.locator('.docs-starter').getByRole('link', { name: 'Make your website' }).click();
  await expect(page).toHaveURL(/builder\.html$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Make your website');
});
