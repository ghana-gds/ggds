// Progressive enhancement: the menu, the error summary, and everything still usable without JavaScript.
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
import { EXAMPLE_SITES, NO_EXAMPLE_SITES } from './pages';

test.describe('header menu on a narrow screen', () => {
  test.use({ viewport: { width: 375, height: 800 } });

  test('opens in place, closes with Escape and returns focus', async ({ page }) => {
    await page.goto('/examples/header/1-default.html');
    const button = page.locator('.ggds-header__menu-button');
    const nav = page.locator('.ggds-header__nav');
    await expect(button).toBeVisible();
    await expect(nav).toBeHidden();
    await button.click();
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    await expect(nav).toBeVisible();
    await nav.locator('a').first().focus();
    await page.keyboard.press('Escape');
    await expect(nav).toBeHidden();
    await expect(button).toBeFocused();
  });
});

test('error summary takes focus on load', async ({ page }) => {
  await page.goto('/examples/error-summary/1-form-with-errors.html');
  await expect(page.locator('[data-ggds-module="error-summary"]')).toBeFocused();
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false, viewport: { width: 375, height: 800 } });

  test('navigation is visible and the menu button is not', async ({ page }) => {
    await page.goto('/examples/header/1-default.html');
    await expect(page.locator('.ggds-header__nav a').first()).toBeVisible();
    await expect(page.locator('.ggds-header__menu-button')).toBeHidden();
  });

  test('the identification banner opens', async ({ page }) => {
    await page.goto('/examples/banner/1-official.html');
    await page.locator('.ggds-banner__summary').click();
    await expect(page.getByText('A padlock is not proof')).toBeVisible();
  });
});

test('no horizontal scrolling at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  const paths = ['/examples/page/1-default.html', '/examples/hero/1-default.html', '/themes.html', ...(EXAMPLE_SITES ? ['/agencies/mocdti.html'] : [])];
  for (const path of paths) {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, path).toBeLessThanOrEqual(0);
  }
});

test.describe('header layout, as on the MoCDTI platform', () => {
  test.skip(!EXAMPLE_SITES, NO_EXAMPLE_SITES);

  test('one row from 80rem: name, navigation and Search side by side', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/agencies/mocdti.html');
    await expect(page.locator('.ggds-header__menu-button')).toBeHidden();
    const box = async (s: string) => (await page.locator(s).first().boundingBox())!;
    const [name, nav, search] = [await box('.ggds-header__identity'), await box('.ggds-header__nav'), await box('.ggds-header__search')];
    for (const b of [nav, search]) expect(Math.abs((b.y + b.height / 2) - (name.y + name.height / 2))).toBeLessThan(12);
    expect(nav.x).toBeGreaterThan(name.x + name.width - 1);
  });

  test('a menu button below 80rem', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 800 });
    await page.goto('/agencies/nca.html');
    await expect(page.locator('.ggds-header__menu-button')).toBeVisible();
    await expect(page.locator('.ggds-header__nav')).toBeHidden();
  });
});

test('the header row fits inside the page at 1280px and 1440px, even with six sections', async ({ page }) => {
  test.skip(!EXAMPLE_SITES, NO_EXAMPLE_SITES);
  for (const width of [1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const slug of ['nca', 'mocdti']) {
      await page.goto(`/agencies/${slug}.html`);
      const inner = (await page.locator('.ggds-header__inner').boundingBox())!;
      const search = (await page.locator('.ggds-header__search').boundingBox())!;
      const name = (await page.locator('.ggds-header__identity').boundingBox())!;
      const nav = (await page.locator('.ggds-header__nav').boundingBox())!;
      expect(search.x + search.width, `${slug} at ${width}px`).toBeLessThanOrEqual(inner.x + inner.width + 1);
      expect(nav.x, `${slug} at ${width}px`).toBeGreaterThan(name.x + name.width);
    }
  }
});

test.describe('documentation features', () => {
  test('search finds pages as you type and keeps the search in the address', async ({ page }) => {
    await page.goto('/search.html');
    await page.getByLabel('Search the GGDS documentation').fill('error summary');
    await expect(page.locator('#search-status')).toContainText('for “error summary”');
    await expect(page.locator('.docs-search__result a').first()).toHaveText('Error summary');
    await expect(page).toHaveURL(/\?q=error\+summary/);
    await page.locator('.docs-search__result a').first().click();
    await expect(page.locator('h1')).toHaveText('Error summary');
  });

  test('the homepage search goes to results', async ({ page }) => {
    await page.goto('/index.html');
    await page.getByLabel('Search the GGDS documentation').fill('theme');
    await page.getByLabel('Search the GGDS documentation').press('Enter');
    await expect(page).toHaveURL(/search\.html\?q=theme/);
    await expect(page.locator('.docs-search__result').first()).toBeVisible();
  });

  test('copy code puts the example HTML on the clipboard', async ({ page, context, browserName }) => {
    test.skip(browserName !== 'chromium');
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/get-started.html');
    await page.getByRole('button', { name: 'Copy code' }).first().click();
    await expect(page.getByRole('button', { name: 'Copied' })).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('<link rel="stylesheet" href="ggds/ggds.min.css">');
  });

  test('"On this page" links to every section, and pages lead on to the next', async ({ page }) => {
    await page.goto('/components/header.html');
    const contents = page.getByRole('navigation', { name: 'On this page' });
    for (const name of ['When to use', 'When not to use', 'How to use', 'Accessibility', 'Related components']) {
      await expect(contents.getByRole('link', { name, exact: true })).toBeVisible();
    }
    await page.getByRole('navigation', { name: 'Previous and next pages' }).getByRole('link', { name: /Next/ }).click();
    await expect(page.locator('h1')).toHaveText('Footer');
  });
});

test.describe('documentation without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('search lists every page from A to Z', async ({ page }) => {
    await page.goto('/search.html');
    await expect(page.getByRole('heading', { name: 'Every page, A to Z' })).toBeVisible();
    await expect(page.locator('.docs-search__az a', { hasText: 'Get started' })).toBeVisible();
  });
});

test('from an example site, one click leads back to the documentation', async ({ page }) => {
  test.skip(!EXAMPLE_SITES, NO_EXAMPLE_SITES);
  await page.goto('/agencies/nca/services.html');
  await page.getByRole('navigation', { name: 'Example site' }).getByRole('link', { name: 'Back to GGDS documentation' }).click();
  await expect(page).toHaveURL(/\/index\.html$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Build government websites people can trust');
});

test('the example sites\' drawings render without errors and move like the live sites', async ({ page }) => {
  test.skip(!EXAMPLE_SITES, NO_EXAMPLE_SITES);
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const slug of ['csa', 'dpc', 'gdcl', 'gdnr', 'gi-kace', 'gifec', 'gmet', 'gpcl', 'nca', 'nita', 'pcsrc']) {
    await page.goto(`/agencies/${slug}.html`);
    await expect(page.locator('.ggds-hero__art svg').first(), slug).toBeVisible();
  }
  expect(errors).toEqual([]);
  // A scene's script lights one item at a time; after its interval another item is lit.
  await page.goto('/agencies/gmet.html');
  const kind = () => page.locator('[data-weather-map]').getAttribute('data-kind');
  const first = await kind();
  await expect.poll(kind, { timeout: 8000 }).not.toBe(first);
});

test.describe('ggds-django example site', () => {
  test.skip(!existsSync(fileURLToPath(new URL('../../site/django/form-errors.html', import.meta.url))), 'needs Python and Django (pnpm run test:django)');

  test('after a failed submit the error summary is read first, and its links reach each field', async ({ page }) => {
    await page.goto('/django/form-errors.html');
    const summary = page.locator('.ggds-error-summary');
    await expect(summary).toBeFocused();
    await summary.locator('a[href="#id_contact_0"]').click(); // the radio group "How should we contact you?"
    await expect(page.locator('#id_contact_0')).toBeFocused();
    await expect(page.locator('#id_name')).toHaveAttribute('aria-describedby', 'id_name-hint id_name-error');
    await expect(page.getByRole('group', { name: 'How should we contact you?' })).toBeVisible();
  });

  test('pagination keeps the search', async ({ page }) => {
    await page.goto('/django/search.html');
    await expect(page.getByRole('navigation', { name: 'Pages of results' }).getByRole('link', { name: 'Page 6' })).toHaveAttribute('href', '?q=licence&page=6');
  });
});
