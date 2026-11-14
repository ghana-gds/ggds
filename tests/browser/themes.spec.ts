// Themes change the identity surfaces and nothing else.
import { expect, test, type Page } from '@playwright/test';
import { EXAMPLE_SITES, NO_EXAMPLE_SITES } from './pages';

const colour = (page: Page, selector: string, prop: string) =>
  page.locator(selector).first().evaluate((el, p) => getComputedStyle(el).getPropertyValue(p), prop);

test('the default is MoCDTI: hero and footer in #005d8c, header name in #005f8f', async ({ page }) => {
  await page.goto('/examples/page/1-default.html');
  expect(await colour(page, '.ggds-footer', 'background-color')).toBe('rgb(0, 93, 140)');
  expect(await colour(page, '.ggds-header__name', 'color')).toBe('rgb(0, 95, 143)');
});

test('an agency theme changes identity surfaces, never buttons or links', async ({ page }) => {
  await page.goto('/themes.html');
  const moc = page.locator('[data-ggds-theme="mocdti"]').first();
  const pcsrc = page.locator('li[data-ggds-theme="pcsrc"]');
  const bg = (l: typeof moc, s: string) => l.locator(s).evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(await bg(pcsrc, '.docs-theme__hero')).toBe('rgb(178, 9, 18)'); // #b20912
  expect(await bg(moc, '.docs-theme__hero')).toBe('rgb(0, 93, 140)');
  expect(await bg(pcsrc, '.ggds-button')).toBe(await bg(moc, '.ggds-button'));
});

test('a single theme stylesheet themes the whole agency page', async ({ page }) => {
  test.skip(!EXAMPLE_SITES, NO_EXAMPLE_SITES);
  await page.goto('/agencies/gdcl.html');
  expect(await colour(page, '.ggds-hero', 'background-color')).toBe('rgb(0, 103, 50)'); // #006732
  expect(await colour(page, '.ggds-header', 'border-bottom-color')).toBe('rgb(0, 110, 53)'); // #006e35
});

test('the ministry directory shows each agency card in its own colour', async ({ page }) => {
  test.skip(!EXAMPLE_SITES, NO_EXAMPLE_SITES);
  await page.goto('/agencies/index.html');
  expect(await colour(page, '[data-ggds-theme="nita"]', 'background-image')).toContain('rgb(0, 52, 43)'); // #00342b, the card's top rule
});

// The theme builder on the Themes page: it runs under the strict CSP, checks a colour with the same rule as the
// packages, previews it and gives the files.
test.describe('theme builder', () => {
  test('a passing colour previews and gives the CSS and design tokens', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('/themes.html');
    const builder = page.locator('[data-theme-builder]');
    await expect(builder).toBeVisible();
    await expect(page.locator('[data-theme-builder-fallback]')).toBeHidden();
    await page.getByLabel("Your institution's colour").fill('#006e35');
    await page.getByLabel('Institution name (optional)').fill('Ghana Digital Centres');
    await expect(page.locator('#tb-status')).toContainText('#006e35 can be your institution');
    expect(await colour(page, '#tb-preview .docs-theme__hero', 'background-color')).toBe('rgb(0, 103, 50)'); // #006732
    expect(await colour(page, '#tb-preview .docs-theme__name', 'color')).toBe('rgb(0, 110, 53)');
    await expect(page.locator('#tb-preview-name')).toHaveText('Ghana Digital Centres');
    await expect(page.locator('#tb-css')).toContainText('--ggds-color-institution-deep: #006732;');
    await expect(page.locator('#tb-tokens')).toContainText('"$value": "#006e35"');
    await expect(page.locator('#tb-checks tr')).toHaveCount(3);
    await expect(page.locator('#tb-checks .ggds-tag--danger')).toHaveCount(0);
    const download = page.waitForEvent('download');
    await page.locator('#tb-download-css').click();
    expect((await download).suggestedFilename()).toBe('theme.css');
    expect(new URL(page.url()).searchParams.get('colour')).toBe('006e35');
    expect(errors).toEqual([]);
  });

  test('a colour too light to read suggests the nearest shade that passes', async ({ page }) => {
    await page.goto('/themes.html');
    await page.getByLabel("Your institution's colour").fill('#7fb3d5');
    await expect(page.locator('#tb-status')).toContainText('too light');
    await expect(page.locator('#tb-checks .ggds-tag--danger')).toHaveCount(1);
    await page.getByRole('button', { name: 'Use #577b92 instead' }).click();
    await expect(page.getByLabel("Your institution's colour")).toHaveValue('#577b92');
    await expect(page.locator('#tb-status')).toContainText('#577b92 can be your institution');
  });

  test('a theme name scopes the CSS to data-ggds-theme, and a bad one is an error', async ({ page }) => {
    await page.goto('/themes.html?colour=b20912&slug=pcsrc');
    await expect(page.locator('#tb-css')).toContainText('[data-ggds-theme="pcsrc"]');
    await expect(page.locator('#tb-download-css')).toHaveAttribute('download', 'pcsrc.css');
    await page.getByLabel('Theme name (optional)').fill('Not OK');
    await expect(page.locator('#tb-slug-error')).toBeVisible();
    await expect(page.getByLabel('Theme name (optional)')).toHaveAttribute('aria-invalid', 'true');
    await page.getByLabel("Your institution's colour").fill('nonsense');
    await expect(page.locator('#tb-colour-error')).toContainText('hex code');
  });

  test('the builder fits the screen: no sideways scrolling', async ({ page }) => {
    await page.goto('/themes.html');
    await expect(page.locator('[data-theme-builder]')).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('every ready-made theme links to its CSS and Figma tokens', async ({ page, request }) => {
    await page.goto('/themes.html');
    const hrefs = await page.locator('.docs-theme-files a[download]').evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).getAttribute('href')!));
    expect(hrefs.length).toBe(24);
    for (const href of hrefs) expect((await request.get(`/${href}`)).ok(), href).toBe(true);
  });
});
