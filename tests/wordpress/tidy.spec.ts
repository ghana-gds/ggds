// GGDS > Tidy up content (and the GGDS menu, and the Switch screen's import), on a website seeded with packages/wordpress/test/tidy-fixture.mjs (the Ministry of
// Communication's old website's problems, plus what WordPress installs). scripts/test-wordpress.mjs runs it in steps
// and checks the database between them:
// @look:  what the screen lists, what it chooses for people, and that it is accessible, at desktop and phone widths
// @apply: one button makes the changes, and the message says what changed, with an undo button
// @undo:  "Recent changes" undoes them
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

// One at a time, with room for a slow WordPress in Docker.
test.describe.configure({ mode: 'serial', timeout: 120_000 });

async function open(page: Page) {
  // Logged in with a request, not by typing: WordPress's login page moves the focus as it loads, which races typing.
  const base = process.env.WP_URL ?? 'http://localhost:8089';
  await page.context().addCookies([{ name: 'wordpress_test_cookie', value: 'WP Cookie check', url: base }]);
  const res = await page.request.post(`${base}/wp-login.php`, { form: { log: 'admin', pwd: 'admin-password-not-secret', 'wp-submit': 'Log In', testcookie: '1', redirect_to: `${base}/wp-admin/` } });
  expect(res.ok()).toBe(true);
  await page.goto('/wp-admin/admin.php?page=ggds-tidy');
  await expect(page.getByRole('heading', { level: 1, name: 'Tidy up content' })).toBeVisible();
}

/** The row for an item, by its whole title ("Home", not "Home Version 4"). */
const row = (page: Page, title: string) => page.locator('.ggds-tidy__table tbody tr')
  .filter({ has: page.locator('th > strong').getByText(title, { exact: true }) });

test('GGDS has its own menu, the Plugins list links to it, and the old Tools addresses still work @look', async ({ page }) => {
  await open(page);
  const menu = page.locator('#adminmenu li.toplevel_page_ggds-switch');
  await expect(menu.locator('.wp-menu-name')).toHaveText('GGDS');
  await expect(menu.locator('.wp-submenu a')).toHaveText(['Switch to GGDS', 'Tidy up content']);
  await page.goto('/wp-admin/tools.php?page=ggds-tidy');
  await expect(page).toHaveURL(/admin\.php\?page=ggds-tidy$/);
  await page.goto('/wp-admin/plugins.php');
  const links = page.locator('tr[data-slug="ggds-switch"] .row-actions');
  await expect(links.getByRole('link', { name: 'Switch to GGDS' })).toBeVisible();
  await expect(links.getByRole('link', { name: 'Tidy up content' })).toBeVisible();
});

test('the Switch screen fills in the institution from the website builder\'s ggds-site.json @look', async ({ page }) => {
  await open(page);
  await page.goto('/wp-admin/admin.php?page=ggds-switch');
  const site = { name: 'National Example Authority', short: 'nea', host: 'https://www.nea.gov.gh/', theme: 'nca', email: 'info@nea.gov.gh',
    phone: '030 222 0000', purpose: 'We license example services.', offices: [{ name: 'Head office', lines: ['1 Example Road', 'Accra'] }], kind: 'agency' };
  await page.getByLabel('Your ggds-site.json').setInputFiles({ name: 'ggds-site.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(site)) });
  await page.getByRole('button', { name: 'Fill in from the file' }).click();
  await expect(page.locator('.notice', { hasText: 'Filled in' })).toContainText('Filled in 7 details from ggds-site.json');
  await expect(page.getByLabel('Short name')).toHaveValue('NEA');
  await expect(page.getByLabel('Official address')).toHaveValue('www.nea.gov.gh');
  await expect(page.getByLabel('Institution colour')).toHaveValue('nca');
  await expect(page.getByLabel('Address', { exact: true })).toHaveValue('1 Example Road, Accra');
  await expect(page.getByLabel('Email', { exact: true })).toHaveValue('info@nea.gov.gh');
  // The screen, with its new parts, is accessible.
  const results = await new AxeBuilder({ page }).include('.ggds-switch').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(' ')}`)).toEqual([]);
  // A file that is not one is said so, and fills in nothing.
  await page.getByLabel('Your ggds-site.json').setInputFiles({ name: 'other.json', mimeType: 'application/json', buffer: Buffer.from('{"hello":1}') });
  await page.getByRole('button', { name: 'Fill in from the file' }).click();
  await expect(page.locator('.notice', { hasText: 'ggds-site.json' })).toContainText('is not a ggds-site.json');
  await expect(page.getByLabel('Short name')).toHaveValue('NEA');
});

test('the dashboard says there is sample content, and links to the screen @look', async ({ page }) => {
  await open(page);
  await page.goto('/wp-admin/');
  const notice = page.locator('.notice', { hasText: 'look like sample or example content' });
  await expect(notice).toBeVisible();
  await notice.getByRole('link', { name: 'Review them' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Tidy up content' })).toBeVisible();
});

test('the screen lists what to fix and check, with why, where it is used, and a safe choice made for each @look', async ({ page }) => {
  await open(page);
  await expect(page.locator('.ggds-tidy__summary')).toContainText('to fix');

  // WordPress's examples and the theme's demonstration pages: to the Bin.
  for (const title of ['Sample Page', 'Hello world!', 'Home Version 4', 'Blog Grid Two Column']) {
    await expect(row(page, title).locator('select'), title).toHaveValue('bin');
  }
  await expect(row(page, 'Home Version 4')).toContainText('A theme\'s demonstration page');
  await expect(row(page, 'Sample Page')).toContainText('Linked from “About the Ministry”');

  // The institution's own pages with sample text, or nothing under their headings: unpublished, to be rewritten.
  for (const title of ['Services', 'Analysis Of Security', 'Digital Terrestrial TV']) {
    await expect(row(page, title).locator('select'), title).toHaveValue('unpublish');
  }
  await expect(row(page, 'Services')).toContainText('In the “Main sections” menu. Unpublishing or binning it takes it out of the menu too.');
  await expect(row(page, 'Digital Terrestrial TV')).toContainText('Has headings, but nothing under them');
  await expect(row(page, 'Analysis Of Security')).toContainText('Lorem ipsum dolor sit amet');

  // A page with real pages under it in the menu, and under it in the site: left, with why; never the Bin.
  const projects = row(page, 'Projects');
  await expect(projects.locator('select')).toHaveValue('leave');
  await expect(projects).toContainText('with 1 item under it');
  await expect(projects.locator('option[value="bin"]')).toHaveCount(0);

  // The homepage stays, and the sidebar widget is for Appearance > Widgets: neither has a choice.
  await expect(row(page, 'Home').locator('select')).toHaveCount(0);
  await expect(row(page, 'Home')).toContainText('This is your homepage, so it stays.');
  await expect(row(page, 'Project Related news')).toContainText('Go to Widgets');

  // The tagline: cleared.
  await expect(row(page, 'Your tagline').locator('select')).toHaveValue('clear');

  // To check: "coming soon" and the untitled page. Nothing is chosen for them.
  const check = page.locator('h2', { hasText: 'To check' }).locator('xpath=following-sibling::table[1]');
  await expect(check.locator('tbody tr')).toHaveCount(2);
  for (const select of await check.locator('select').all()) await expect(select).toHaveValue('leave');
  await expect(check).toContainText('Says it is unfinished');
  await expect(check).toContainText('Has no title');

  // Drafts are folded away, and nothing is chosen for them; the privacy page is never suggested for the Bin.
  const hidden = page.locator('details.ggds-tidy__hidden');
  await expect(hidden).not.toHaveAttribute('open', '');
  await hidden.locator('summary').click();
  await expect(row(page, 'Draft press release').locator('select')).toHaveValue('leave');
  await expect(row(page, 'Privacy Policy')).toContainText('This is your privacy page');

  // Real words that share a few of the phrases' words are not listed.
  await expect(row(page, 'About the Ministry')).toHaveCount(0);

  // The button says what it will do, and changes with the choices.
  const button = page.locator('#ggds-tidy-apply');
  await expect(button).toHaveText('Unpublish 3 items, move 4 items to the Bin and clear the tagline');
  await row(page, 'Your tagline').locator('select').selectOption('leave');
  await expect(button).toHaveText('Unpublish 3 items and move 4 items to the Bin');
  for (const select of await page.locator('#ggds-tidy-form select').all()) await select.selectOption('leave');
  await expect(button).toHaveText('Nothing to change');
  await expect(button).toBeDisabled();
});

test('the screen is accessible and fits a phone @look', async ({ page }) => {
  await open(page);
  await page.locator('details.ggds-tidy__hidden summary').click();
  const results = await new AxeBuilder({ page }).include('.ggds-tidy').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(' ')}`)).toEqual([]);
  const over = await page.evaluate(() => (document.querySelector('.ggds-tidy') as HTMLElement).scrollWidth - (document.querySelector('.ggds-tidy') as HTMLElement).clientWidth);
  expect(over).toBeLessThanOrEqual(0);
  // Every choice has a name that says which page it is for.
  for (const select of await page.locator('#ggds-tidy-form select').all()) await expect(select).toHaveAccessibleName(/^What to do with “/);
});

test('one button makes the chosen changes, and the message says what changed, with undo @apply', async ({ page }) => {
  await open(page);
  await page.locator('#ggds-tidy-apply').click();
  const flash = page.locator('.ggds-tidy__flash');
  await expect(flash).toContainText('Unpublished');
  await expect(flash).toContainText('to the Bin');
  await expect(flash).toContainText('cleared your tagline');
  await expect(flash.getByRole('button', { name: 'Undo' })).toBeVisible();
  // What is left: what a person must do themselves (the homepage, the menu, the widget), to check, and drafts.
  await expect(row(page, 'Sample Page')).toHaveCount(0);
  await expect(row(page, 'Home')).toBeVisible();
  await expect(page.locator('.ggds-tidy__recent')).toContainText('admin');
  await expect(page.locator('.ggds-tidy__recent + .description')).toContainText('stay there for 30 days');
});

test('"Recent changes" undoes them @undo', async ({ page }) => {
  await open(page);
  await page.locator('.ggds-tidy__recent').getByRole('button', { name: 'Undo' }).click();
  await expect(page.locator('.ggds-tidy__flash')).toContainText('Undone: everything is back as it was.');
  await expect(page.locator('.ggds-tidy__recent')).toContainText('Undone by admin');
  await expect(row(page, 'Sample Page').locator('select')).toHaveValue('bin');
});
