// Progressive enhancement: the menu, the error summary, and everything still usable without JavaScript.
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
import { EXAMPLE_SITES, NO_EXAMPLE_SITES, PAGES } from './pages';

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

// Every example (so each component page can say it was checked at 320px), and the main documentation pages.
const NARROW_PATHS = [...PAGES.filter((p) => p.startsWith('/examples/') && !p.includes('/links/')), '/index.html', '/get-started.html', '/get-started/developers.html', '/get-started/designers.html',
  '/foundations.html', '/icons.html', '/themes.html', '/components/index.html', ...PAGES.filter((p) => p.startsWith('/showcase/')), '/components/header.html', ...(EXAMPLE_SITES ? ['/agencies/mocdti.html'] : [])];

// Both checks visit every example, so they grow with the components: give them three times the usual time.
test('no horizontal scrolling at 320px', async ({ page }) => {
  test.slow();
  await page.setViewportSize({ width: 320, height: 800 });
  for (const path of NARROW_PATHS) {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, path).toBeLessThanOrEqual(0);
  }
});

// Phones and Linux have wider fallback fonts than macOS: the same check with a wide font, so a page that only
// just fits on one computer fails here instead of on someone's phone (or in CI). The test font is added with the
// page's Content Security Policy bypassed, for this check only.
test('no horizontal scrolling at 320px with a wide font', async ({ browser }) => {
  test.slow();
  const context = await browser.newContext({ viewport: { width: 320, height: 800 }, bypassCSP: true });
  const page = await context.newPage();
  for (const path of NARROW_PATHS) {
    await page.goto(path);
    await page.addStyleTag({ content: '*{font-family:Verdana,"DejaVu Sans",sans-serif !important}' });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `${path} with a wide font`).toBeLessThanOrEqual(0);
  }
  await context.close();
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

  test('the icons filter finds icons by meaning, and every icon is listed without JavaScript', async ({ page, browser }) => {
    await page.goto('/icons.html');
    const all = await page.locator('.docs-icons__item').count();
    expect(all).toBeGreaterThanOrEqual(140);
    await page.getByLabel('Find an icon').fill('ghana card');
    await expect(page.locator('.docs-icons__item:visible')).toHaveCount(1);
    await expect(page.locator('.docs-icons__item:visible code')).toHaveText('id-card');
    await expect(page.getByRole('status')).toHaveText('1 icon found');
    await expect(page.getByRole('heading', { name: 'Navigation' })).toBeHidden();
    await page.getByLabel('Find an icon').fill('');
    await expect(page.locator('.docs-icons__item:visible')).toHaveCount(all);
    const context = await browser.newContext({ javaScriptEnabled: false });
    const plain = await context.newPage();
    await plain.goto('/icons.html');
    await expect(plain.locator('.docs-icons__filter')).toBeHidden();
    await expect(plain.locator('.docs-icons__item:visible')).toHaveCount(all);
    await context.close();
  });

  test('an icon from the sprite draws the same as one written into the page', async ({ page }) => {
    await page.goto('/icons.html');
    const box = await page.evaluate(() => {
      const ns = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(ns, 'svg');
      svg.setAttribute('class', 'ggds-icon ggds-icon--xl');
      const use = document.createElementNS(ns, 'use');
      use.setAttribute('href', 'assets/icons/sprite.svg#download');
      svg.append(use);
      document.querySelector('main')!.append(svg);
      return new Promise<{ w: number; stroke: string; width: string }>((done) => setTimeout(() => {
        const b = use.getBBox();
        const cs = getComputedStyle(svg);
        done({ w: b.width, stroke: cs.stroke, width: cs.strokeWidth });
      }, 500));
    });
    expect(box.w).toBeGreaterThan(10);
    expect(box.stroke).not.toBe('none');
    expect(box.width).toBe('2px');
  });

  test('the homepage drawing: each part shows what it is and where it is used, by mouse or keyboard, and links to its page', async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) < 768, 'the drawing shows from 48rem');
    await page.goto('/index.html');
    const opacity = (sel: string) => page.locator(sel).first().evaluate((el) => Number(getComputedStyle(el).opacity));
    await expect.poll(() => opacity('.ga-tip--default')).toBeGreaterThan(0.5);
    await page.locator('.ga-hit--button').hover();
    await expect.poll(() => opacity('.ga-tip--button')).toBe(1);
    await expect.poll(() => opacity('.ga-use--button')).toBe(1);
    await expect.poll(() => opacity('.ga-tip--default')).toBe(0);
    await page.mouse.move(0, 0);
    await page.locator('.ga-hit--colour').focus();
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toHaveAttribute('aria-label', 'Aa: type');
    await expect.poll(() => opacity('.ga-tip--type')).toBe(1);
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/foundations\.html#text$/);
  });

  test('the tutorial\'s sign-in page shows errors the GGDS way, then signs in', async ({ page }) => {
    await page.goto('/examples/tutorial/sign-in.html');
    const summary = page.locator('.ggds-error-summary');
    await expect(summary).toBeHidden();
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(summary).toBeVisible();
    await expect(summary).toBeFocused();
    await expect(page).toHaveTitle('Error: Sign in | Example Agency');
    await expect(summary.getByRole('link')).toHaveText(['Enter your email address', 'Enter your password']);
    await expect(page.getByLabel('Email address')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByLabel('Email address')).toHaveAccessibleDescription('Error: Enter your email address');
    await summary.getByRole('link', { name: 'Enter your password' }).click();
    await expect(page.getByLabel('Password')).toBeFocused();

    await page.getByLabel('Email address').fill('kofi.example.com');
    await page.getByLabel('Password').fill('a long password');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(summary.getByRole('link')).toHaveText(['Enter an email address in the correct format, like name@example.com']);
    await expect(summary).toBeFocused();
    await expect(page.getByLabel('Password')).not.toHaveAttribute('aria-invalid', /.*/);
    await expect(page.locator('.ggds-error-message')).toHaveCount(1);

    await page.getByLabel('Email address').fill('kofi@example.com');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/tutorial\/account\.html$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Your account');
  });

  test('the @ggds/react example: errors the GGDS way, and the header menu, all in React', async ({ page }) => {
    await page.goto('/examples/react/index.html');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Apply for a business permit');
    await page.getByRole('button', { name: 'Send application' }).click();
    const summary = page.locator('.ggds-error-summary');
    await expect(summary).toBeFocused();
    await expect(page).toHaveTitle(/^Error: /);
    await expect(summary.getByRole('link')).toHaveText(['Enter your full name', 'Enter your mobile phone number', 'Select the type of business']);
    await expect(page.getByLabel('Full name')).toHaveAccessibleDescription('As shown on your Ghana Card Error: Enter your full name');
    await summary.getByRole('link', { name: 'Select the type of business' }).click();
    await expect(page.getByLabel('Sole proprietor')).toBeFocused();
    await page.getByLabel('Full name').fill('Ama Mensah');
    await page.getByLabel('Mobile phone number').fill('024 123');
    await page.getByLabel('Limited company').check();
    await page.getByRole('button', { name: 'Send application' }).click();
    await expect(summary.getByRole('link')).toHaveText(['Enter a mobile phone number with 10 digits, like 024 123 4567']);
    await expect(summary).toBeFocused();
    await page.getByLabel('Mobile phone number').fill('024 123 4567');
    await page.getByRole('button', { name: 'Send application' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Application sent');

    await page.setViewportSize({ width: 375, height: 800 });
    const menu = page.getByRole('button', { name: 'Menu' });
    await expect(menu).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByRole('link', { name: 'Laws & regulations' })).toBeHidden();
    await menu.click();
    await expect(menu).toHaveAttribute('aria-expanded', 'true');
    await page.getByRole('link', { name: 'Laws & regulations' }).focus();
    await page.keyboard.press('Escape');
    await expect(menu).toHaveAttribute('aria-expanded', 'false');
    await expect(menu).toBeFocused();
  });

  test('code switches between HTML and JSX, on every block, and the choice carries to the next page', async ({ page }) => {
    await page.goto('/components/field.html');
    const block = page.locator('.docs-codeblock--switch').first();
    await page.locator('details.docs-example__code').first().evaluate((d) => { (d as HTMLDetailsElement).open = true; });
    const html = block.locator('pre').first();
    const jsx = block.locator('pre').nth(1);
    await expect(html).toBeVisible();
    await expect(jsx).toBeHidden();
    await block.getByRole('button', { name: 'JSX (React)' }).first().click();
    await expect(jsx).toBeVisible();
    await expect(html).toBeHidden();
    await expect(jsx).toContainText('className="ggds-field"');
    await expect(block.locator('.docs-codeblock__bar:visible')).toHaveCount(1);
    await expect(block.locator('.docs-codeblock__bar[data-lang="jsx"]').getByRole('button', { name: 'JSX (React)' })).toBeFocused();
    await expect(block.locator('.docs-codeblock__bar[data-lang="jsx"]').getByRole('button', { name: 'JSX (React)' })).toHaveAttribute('aria-pressed', 'true');
    await page.goto('/components/button.html');
    await page.locator('details.docs-example__code').first().evaluate((d) => { (d as HTMLDetailsElement).open = true; });
    await expect(page.locator('.docs-codeblock--switch pre').nth(1)).toBeVisible();
    await expect(page.locator('.docs-codeblock--switch pre').nth(1)).toContainText('className="ggds-button"');
  });

  test('the showcase: an online service and a booking work by clicking from start to finish', async ({ page }) => {
    await page.goto('/showcase/apply-start.html');
    await page.getByRole('link', { name: 'Start now' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('About your canoe');
    await page.getByLabel('Canoe name').fill('Nyame Adom');
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Check your answers before you apply');
    await page.getByRole('link', { name: 'Change canoe number' }).click();
    await expect(page.locator(':target')).toHaveAttribute('id', 'number');
    await page.goBack();
    await page.getByLabel(/I confirm my answers are true/).check();
    await page.getByRole('button', { name: /Apply and pay/ }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Application sent');

    await page.goto('/showcase/book.html');
    await page.getByLabel(/Example Polyclinic/).check();
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Choose a time');
    await expect(page.getByLabel(/10:00am/)).toBeDisabled();
    await page.getByLabel(/8:30am/).first().check();
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Vaccination booked');
  });

  test('"What you can build": pointing at an example scrolls through its page and says what it is built from', async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) < 768, 'hover is for wide screens; phones tap straight through');
    await page.goto('/index.html');
    const tile = page.locator('.docs-showcase__link').nth(5);
    const img = tile.locator('.docs-showcase__img');
    await expect(img).toHaveCSS('object-position', /^50% 0(%|px)$/);
    await tile.hover();
    await expect(tile.locator('.docs-showcase__peek')).toHaveCSS('opacity', '1');
    await expect.poll(() => img.evaluate((el) => getComputedStyle(el).objectPosition), { timeout: 8000 }).toBe('50% 100%');
    await expect(page.locator('.docs-showcase').first().locator('.docs-showcase__item')).toHaveCount(8);
  });

  test('the agency website starter: forms check answers the GGDS way, and search works', async ({ page }) => {
    await page.goto('/starter/apply.html');
    await page.getByRole('button', { name: 'Continue' }).click();
    const summary = page.locator('.ggds-error-summary');
    await expect(summary).toBeFocused();
    await expect(page).toHaveTitle(/^Error: /);
    await expect(summary.getByRole('link')).toHaveText(['Enter your full name', 'Enter your Ghana Card number', 'Enter your mobile phone number', 'Select the licence you need']);
    await summary.getByRole('link', { name: 'Select the licence you need' }).click();
    await expect(page.getByLabel('Internet service provider')).toBeFocused();
    await page.getByLabel('Full name').fill('Ama Owusu');
    await page.getByLabel('Ghana Card number').fill('GHA-12345');
    await page.getByLabel('Mobile phone number').fill('024 123 4567');
    await page.getByLabel('Courier service').check();
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(summary.getByRole('link')).toHaveText(['Enter a Ghana Card number in the right format, like GHA-123456789-0']);
    await expect(page.getByLabel('Ghana Card number')).toHaveAttribute('aria-invalid', 'true');
    await page.getByLabel('Ghana Card number').fill('GHA-123456789-0');
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Check your answers before you apply');
    await expect(page.locator('[data-answer="name"]')).toHaveText('Ama Owusu');
    await expect(page.locator('[data-answer="licence"]')).toHaveText('Courier service');
    await page.getByRole('button', { name: 'Send application' }).click();
    await expect(page.locator('.ggds-error-summary').getByRole('link')).toHaveText(['Confirm your answers are true']);
    await page.getByLabel(/I confirm my answers/).check();
    await page.getByRole('button', { name: 'Send application' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Application sent');

    await page.goto('/starter/search.html');
    await page.getByLabel('Search Example Agency').fill('licence fees');
    await expect(page.locator('#search-status')).toContainText('for “licence fees”');
    await expect(page.locator('#search-results a')).toContainText(['Have your say on licence fees for 2027', 'Fees and charges']);
    await expect(page).toHaveURL(/\?q=licence\+fees/);
    await page.locator('#search-results').getByRole('link', { name: 'Fees and charges' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Fees and charges');
    await page.getByRole('link', { name: 'Back to GGDS documentation' }).first().click();
    await expect(page).toHaveURL(/\/index\.html$/);
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
    await page.goto('/get-started/developers.html');
    await page.getByRole('button', { name: 'Copy code' }).first().click();
    await expect(page.getByRole('button', { name: 'Copied' })).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('https://cdn.jsdelivr.net/npm/@ggds/css@');
  });

  test('"On this page" links to every section, and pages lead on to the next', async ({ page }) => {
    await page.goto('/components/header.html');
    const contents = page.getByRole('navigation', { name: 'On this page' });
    // Closed on phones, open on wide screens.
    const summary = contents.locator('summary');
    if (!(await contents.locator('details').evaluate((d) => (d as HTMLDetailsElement).open))) await summary.click();
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
    await expect(page.locator('.docs-search__az').getByRole('link', { name: 'Get started', exact: true })).toBeVisible();
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

// WCAG 2.2.2 (Pause, Stop, Hide): the hero drawings move only while the page loads, and are still within 5
// seconds, so they need no pause button.
// The drawings show only on wide screens (they are hidden on phones), so this runs at desktop width.
test.describe('moving drawings', () => {
  test.use({ viewport: { width: 1280, height: 900 } });
  for (const path of ['/index.html', '/examples/hero/3-art.html']) {
    test(`everything on ${path} stops moving within 5 seconds`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await page.goto(path);
      expect(await page.evaluate(() => document.getAnimations().length), 'the drawing should move at first').toBeGreaterThan(0);
      await page.waitForTimeout(5100);
      const running = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running')
        .map((a) => `${(a.effect as KeyframeEffect | null)?.target?.getAttribute('class') ?? '?'} (${(a as CSSAnimation).animationName})`));
      expect(running).toEqual([]);
    });
  }
});
