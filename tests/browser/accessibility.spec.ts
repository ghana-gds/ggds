// axe (WCAG 2.2 A and AA rules) on every page of the built site, with no Content Security Policy violation.
// Automated checks find only part of the problems: manual assistive-technology testing is still required (D-09).
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { PAGES } from './pages.ts';

for (const path of PAGES) {
  test(`axe: ${path}`, async ({ page }) => {
    const csp: string[] = [];
    page.on('console', (m) => { if (/Content Security Policy|Refused to/i.test(m.text())) csp.push(m.text()); });
    await page.goto(path);
    const { violations } = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
    expect(csp).toEqual([]);
  });
}
