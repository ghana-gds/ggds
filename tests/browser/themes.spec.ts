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
