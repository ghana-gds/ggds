// The GGDS WordPress theme in a real WordPress: every template passes axe at desktop and phone widths and runs
// under a strict Content Security Policy, and its page parts have the same markup as the documentation.
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
// @ts-expect-error: plain JavaScript module
import * as parts from '../../docs/parts.mjs';

const CSP = "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'self'";
const PAGES: [string, number][] = [
  ['/', 200], ['/services/', 200], ['/services/apply-for-a-licence/', 200], ['/news/', 200], ['/news/page/2/', 200],
  ['/example-notice-1/', 200], ['/category/press-release/', 200], ['/?s=licence', 200], ['/?s=zzzqqq', 200], ['/?s=', 200],
  ['/no-such-page/', 404],
];

/** Serve every page with a strict Content Security Policy, as a GGDS website should. */
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

for (const [path, status] of PAGES) {
  test(`${path}: accessible, no inline scripts or styles, no CSP errors`, async ({ page }) => {
    const refused = await strict(page);
    const response = await page.goto(path);
    expect(response?.status()).toBe(status);
    const inline = await page.evaluate(() => [
      ...[...document.querySelectorAll('script:not([src])')].filter((s) => s.getAttribute('type') !== 'application/ld+json').map((s) => `<script>${s.textContent?.slice(0, 60)}`),
      ...[...document.querySelectorAll('style')].map((s) => `<style id="${s.id}">`),
      ...[...document.querySelectorAll('[style]')].map((e) => `${e.tagName.toLowerCase()} style="${e.getAttribute('style')}"`),
    ]);
    expect(inline).toEqual([]);
    const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
    expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    expect(refused).toEqual([]);
  });
}

/** Every element's tag and classes, in order. */
const shape = (page: Page, selector: string) => page.locator(selector).first().evaluate((root) =>
  [root, ...root.querySelectorAll('*')].map((e) => `${e.tagName.toLowerCase()}.${[...e.classList].join('.')}`));

test('header, banner, footer and tab bar have the documentation\'s markup', async ({ browser }) => {
  // As WordPress serves it: the GGDS script adds classes once it runs, on this page and on any other.
  const served = await browser.newContext({ javaScriptEnabled: false });
  const page = await served.newPage();
  await page.goto('/services/apply-for-a-licence/');
  const nav = [{ label: 'Services', href: '/services/' }, { label: 'News', href: '/news/' }, { label: 'About us', href: '/about-us/' }];
  const docs = {
    '.ggds-header': parts.header({ name: 'Example Agency', logo: parts.mark({ initials: 'EA' }), nav, current: '/services/', search: '/?s=' }),
    '.ggds-banner': parts.banner({ unofficial: true, shortName: 'EA', host: 'example.gov.gh', registerHref: '/register/' }),
    '.ggds-footer': parts.footer({ name: 'Example Agency', logo: parts.mark({ initials: 'EA', cls: 'ggds-footer__logo' }), purpose: 'We help.',
      contact: { address: 'Accra', email: 'a@example.gov.gh', phone: '0', moreHref: '/contact/' },
      sections: [{ label: 'Services', href: '/services/', links: [{ label: 'Apply', href: '/apply/' }] }], bar: [['Accessibility', '/a/'], ['Contact us', '/c/']] }),
    '.ggds-tab-bar': parts.tabBar([{ label: 'Home', href: '/', icon: 'home' }, ...nav.map((n, i) => ({ ...n, icon: ['services', 'building', 'help'][i] })), { label: 'Search', href: '/?s=', icon: 'search' }]),
  };
  const reference = await browser.newPage();
  for (const [selector, html] of Object.entries(docs)) {
    await reference.setContent(html);
    expect(await shape(page, selector), selector).toEqual(await shape(reference, selector));
  }
  await reference.close();
  await expect(page.locator('.ggds-header__link[aria-current="page"]')).toHaveText('Services');
  await expect(page.locator('.ggds-breadcrumbs__item[aria-current="page"]')).toHaveText('Apply for a licence');
  await served.close();
});

test('the institution theme, the script and the official banner', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('link[href*="/assets/themes/nca.css"]')).toHaveCount(1);
  await expect(page.locator('script[type="module"][src*="/assets/js/auto.js"]')).toHaveCount(1);
  // Served from localhost, not the official address: the banner says this copy is not official.
  await expect(page.locator('.ggds-banner')).toHaveClass(/ggds-banner--unofficial/);
  await expect(page.locator('.ggds-hero__title')).toHaveText('What do you need help with?');
  await expect(page.locator('.ggds-hero__task')).toHaveCount(2);
  await expect(page.locator('meta[name="generator"]')).toHaveCount(0);
});

test('search keeps the query in pagination and counts results', async ({ page }) => {
  await page.goto('/?s=notice');
  await expect(page.getByText('12 results')).toBeVisible();
  await expect(page.locator('.ggds-pagination__link[rel="next"]')).toHaveAttribute('href', /s=notice/);
});
