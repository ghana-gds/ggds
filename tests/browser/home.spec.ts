// The documentation homepage's interactive sections (docs/home.mjs, docs/home.js).
import { expect, test } from '@playwright/test';

test('choosing an institution re-themes the page, never the buttons', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/index.html');
  const bg = (s: string) => page.locator(s).first().evaluate((el) => getComputedStyle(el).backgroundColor);
  const button = await bg('.ggds-hero .ggds-button, .home-theme__preview .ggds-button');
  await page.locator('label[for="home-theme-pcsrc"]').click();
  await expect(page.locator('#home-theme-pcsrc')).toBeChecked();
  expect(await bg('.ggds-hero')).toBe('rgb(178, 9, 18)'); // PCSRC's deep shade, #b20912
  expect(await bg('.ggds-footer')).toBe('rgb(178, 9, 18)');
  expect(await bg('.ggds-hero .ggds-button, .home-theme__preview .ggds-button')).toBe(button);
  await expect(page.locator('.home-theme__name[data-theme="pcsrc"]')).toBeVisible();
});

test('the theme picker works from the keyboard', async ({ page }) => {
  await page.goto('/index.html');
  await page.locator('#home-theme-mocdti').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#home-theme-csa')).toBeChecked();
});

test('the form to try shows the error summary, then the confirmation', async ({ page }) => {
  await page.goto('/index.html');
  const input = page.getByLabel('What is your Ghana Card number?');
  await page.locator('#home-try-form').getByRole('button', { name: 'Continue' }).click();
  await expect(page.locator('#home-try-summary')).toBeFocused();
  await expect(page.locator('#home-try-summary')).toContainText('Enter your Ghana Card number');
  await expect(input).toHaveAttribute('aria-invalid', 'true');
  await page.locator('#home-try-summary-link').click();
  await expect(input).toBeFocused();
  await input.fill('gha 123456789 0');
  await page.locator('#home-try-form').getByRole('button', { name: 'Continue' }).click();
  await expect(page.locator('#home-try-reference')).toHaveText('GHA-123456789-0');
  await expect(page.locator('#home-try-panel')).toBeFocused();
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(input).toHaveValue('');
});

test('the page frame resizes, and never makes the homepage scroll sideways', async ({ page }) => {
  await page.goto('/index.html');
  const device = page.locator('[data-home-screens-device]');
  await page.getByRole('button', { name: /Laptop/ }).click();
  await expect(page.getByRole('button', { name: /Laptop/ })).toHaveAttribute('aria-pressed', 'true');
  // The frame glides to its new width, so wait for it to settle.
  const width = () => device.evaluate((el) => (el as HTMLElement).offsetWidth);
  await expect.poll(width).toBe(1280);
  await page.getByRole('button', { name: /Small phone/ }).click();
  await expect.poll(width).toBe(320);
  await expect(page.locator('#home-width-out')).toContainText('320px');
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
});
