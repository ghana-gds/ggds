// GGDS Switch, on a website with a heavy theme and page-builder content (set up by scripts/test-wordpress.mjs).
// @before: the admin screen finds what is there, proposes the details and menus, and switches.
// @after: the switched website is a GGDS website: accessible, under a strict security policy, with every page's
// words kept and the builders' wrappers, styles, sliders and forms gone.
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const CSP = "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'self'";

async function login(page: Page) {
  await page.goto('/wp-login.php');
  // WordPress moves the focus to the first box shortly after the page loads: fill both until they hold.
  await expect(async () => {
    await page.fill('#user_login', 'admin');
    await page.fill('#user_pass', 'admin-password-not-secret');
    await expect(page.locator('#user_login')).toHaveValue('admin', { timeout: 500 });
    await expect(page.locator('#user_pass')).toHaveValue('admin-password-not-secret', { timeout: 500 });
  }).toPass();
  await page.click('#wp-submit');
  await page.waitForURL(/wp-admin/);
}

test('the admin screen finds the website as it is, proposes GGDS\'s details and menus, and switches @before', async ({ page }) => {
  await login(page);
  await page.goto('/wp-admin/admin.php?page=ggds-switch');
  const found = page.locator('.ggds-switch__found');
  await expect(found).toContainText('Bloated (test)');
  await expect(found).toContainText('with WPBakery');
  await expect(found).toContainText('with Divi');
  await expect(found).toContainText('with Elementor');
  await expect(found).toContainText('Carried over');
  await expect(found).toContainText('"Home" becomes the GGDS homepage');
  // Proposals from the website: the short name from the site title, contact details from the contact page, and
  // the menus from the old theme's places.
  await expect(page.getByLabel('Short name')).toHaveValue('NEA');
  await expect(page.getByLabel('Email')).toHaveValue('info@example.gov.gh');
  await expect(page.getByLabel('Phone')).toHaveValue('030 000 0000');
  await expect(page.getByLabel('Main sections')).toHaveValue(await page.getByLabel('Main sections').locator('option', { hasText: 'Main menu' }).getAttribute('value') ?? '');
  await expect(page.getByLabel('Footer links').locator('option:checked')).toHaveText('Footer menu');
  await expect(page.getByLabel('Footer sections').locator('option:checked')).toHaveText('Main menu');
  await expect(page.getByLabel('Common tasks').locator('option:checked')).toHaveText('None');
  // The admin screen itself is accessible.
  const { violations } = await new AxeBuilder({ page }).include('.ggds-switch').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);

  await page.getByLabel('Official address').fill('localhost');
  await page.getByLabel('Institution colour').selectOption('nca');
  await page.getByRole('button', { name: 'Switch to GGDS' }).click();
  await expect(page.getByText('Your website now uses GGDS.')).toBeVisible();
  // What to do next, in plain words, and the pages to look at.
  await expect(page.locator('.wrap')).toContainText('Add 3 to 6 common tasks');
  await expect(page.locator('.wrap')).toContainText(/sidebars had \d+ widgets/);
  await expect(page.locator('.wrap')).toContainText('A slider or carousel was taken apart');
  await expect(page.locator('.wrap')).toContainText('A form made by the page builder was removed');
  await expect(page.getByRole('button', { name: 'Undo the switch' })).toBeVisible();
});

/** Serve the page with a strict Content Security Policy; returns what the browser refused. */
async function strict(page: Page) {
  const refused: string[] = [];
  page.on('console', (m) => { if (/Content Security Policy|Refused to/i.test(m.text())) refused.push(m.text()); });
  await page.route('**/*', async (route) => {
    if (route.request().resourceType() !== 'document') return route.continue();
    const response = await route.fetch();
    await route.fulfill({ response, headers: { ...response.headers(), 'content-security-policy': CSP } });
  });
  return refused;
}

for (const path of ['/', '/about-us/', '/services/', '/contact-us/', '/news/', '/new-licence-fees/']) {
  test(`${path}: a GGDS page, accessible, with no inline scripts or styles @after`, async ({ page }) => {
    const refused = await strict(page);
    expect((await page.goto(path))?.status()).toBe(200);
    await expect(page.locator('.ggds-header')).toBeVisible();
    await expect(page.locator('.ggds-banner')).toContainText('An official website of the Government of Ghana');
    const inline = await page.evaluate(() => [
      ...[...document.querySelectorAll('script:not([src])')].map((s) => `<script>${s.textContent?.slice(0, 60)}`),
      ...[...document.querySelectorAll('style')].map((s) => `<style id="${s.id}">`),
      ...[...document.querySelectorAll('[style]')].map((e) => `${e.tagName.toLowerCase()} style="${e.getAttribute('style')}"`),
    ]);
    expect(inline).toEqual([]);
    await expect(page.locator('main')).not.toContainText('[vc_');
    await expect(page.locator('main')).not.toContainText('[et_pb');
    const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
    expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
    expect(refused).toEqual([]);
  });
}

test('every page keeps its words, with headings in order and the builders\' wrappers gone @after', async ({ page }) => {
  await page.goto('/about-us/');
  const prose = page.locator('.ggds-prose');
  await expect(page.locator('h1')).toHaveText(['About us']);
  await expect(prose.getByRole('heading', { level: 2 })).toHaveText('About the Authority');
  await expect(prose).toContainText('We regulate example communications.');
  await expect(prose.locator('strong')).toHaveText('example');
  expect(await prose.locator('div, span, font, i').count()).toBe(0);

  await page.goto('/services/');
  // Divi is not installed: its shortcodes are unwrapped, its button becomes a link, and h4 and h5 become h2 and h3.
  await expect(page.locator('.ggds-prose h2')).toHaveText('Licences');
  await expect(page.locator('.ggds-prose h3')).toHaveText('Fees');
  await expect(page.getByRole('link', { name: 'Apply now' })).toHaveAttribute('href', '/apply/');

  await page.goto('/contact-us/');
  // Elementor's switch is off, so its saved content shows: the lazy image has its real address; the form is gone.
  await expect(page.locator('.ggds-prose h2')).toHaveText('Talk to us');
  await expect(page.locator('.ggds-prose')).toContainText('Email info@example.gov.gh or call 030 000 0000.');
  await expect(page.locator('.ggds-prose img')).toHaveAttribute('src', '/wp-includes/images/w-logo-blue.png');
  expect(await page.locator('.ggds-prose form, .ggds-prose input').count()).toBe(0);

  await page.goto('/new-licence-fees/');
  // Blocks keep their structure without their colours; a third-party block becomes plain content.
  await expect(page.locator('.ggds-prose p').first()).toHaveText('The fees change in January.');
  await expect(page.locator('.ggds-prose h2')).toHaveText('What changes');
  await expect(page.locator('.ggds-prose')).toContainText('Class A licences cost less.');
});

test('the homepage is GGDS\'s, with the menus, logo and details carried over @after', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.ggds-hero__purpose')).toHaveText('We license and regulate example services.');
  await expect(page.locator('main')).not.toContainText('Slide one');
  await expect(page.locator('.ggds-card-grid .ggds-card__title')).toHaveText(['Services', 'About us', 'News', 'Contact us']);
  await expect(page.locator('.ggds-header__logo')).toHaveAttribute('src', /wordpress-logo/);
  await expect(page.locator('.ggds-header__name')).toHaveText('National Example Authority (NEA)');
  await expect(page.locator('.ggds-footer__bar')).toContainText('Privacy');
  await expect(page.locator('.ggds-footer__bar')).toContainText('Accessibility');
  await expect(page.locator('.ggds-footer__heading').first()).toHaveText('Services');
  await expect(page.locator('.ggds-footer__contact')).toContainText('info@example.gov.gh');
});
