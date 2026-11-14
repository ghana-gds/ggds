# @ggds/check

One command any Government of Ghana website can run to see what it still needs before it goes live, and to keep
checking afterwards. It reports on the GGDS page parts and footer links, accessibility, HTTPS and security headers,
the email domain, and speed, and every result names the published source it comes from.

```sh
npx @ggds/check https://www.example.gov.gh     # the live site: pages, server, email domain and speed
npx @ggds/check ./dist                         # the built pages in a folder (page checks only), for CI
```

It exits with 1 when a check fails, so a CI job can stop on it.

**This is a readiness check, not a statement of NITA compliance.** Each rule is taken from a published source:
WCAG 2.2, the GGDS guidance (including the footer links NITA's standards ask for), the OWASP Secure Headers
Project, the RFCs for SPF, DMARC and CAA, and the checks the MoCDTI agency websites were audited against in
October 2026. NITA's clauses will be mapped to these rules, and NITA-only rules added, when the standard is
published. Automated checks find only some problems, accessibility ones especially: test with people too.

## What it checks

| Group | Checks |
|---|---|
| Every page | Language, title, zoom, image alternative text, skip link, government website banner, header, one main landmark, footer, the footer's Accessibility, Privacy and Disclaimer links, phone tab bar, image sizes |
| GGDS | The site uses GGDS, and which version |
| Accessibility | WCAG 2.2 A and AA rules with [axe-core](https://github.com/dequelabs/axe-core) in a real browser, on a computer and on a phone; nothing scrolls sideways at 320px (WCAG 1.4.10); the first Tab goes to a working skip link (WCAG 2.4.1); the main content shows without JavaScript |
| Address and server | A `.gov.gh` address, HTTPS only, Strict-Transport-Security, Content-Security-Policy, framing, `nosniff`, Referrer-Policy, Permissions-Policy, no software version announced, no public list of WordPress user accounts |
| Email domain | SPF, DMARC (quarantine or reject), CAA |
| Privacy (a live site) | What the first visit loads from other websites, and the cookies it sets before people agree: warnings for a person to judge, as the GGDS cookie banner guidance asks |
| Speed | Compression, browser caching, what the homepage downloads (information, or a failure over the budget you set with `--budget-kb`) |

A live check looks at the homepage and up to 9 more pages it links to, under the address it started from. A
folder check looks at every `.html` file.

## Options

| Option | |
|---|---|
| `--pages <n>` | How many pages to check (default 10 for a live site; every page in a folder) |
| `--json` | The results as JSON |
| `--no-dns` | Skip the email domain checks |
| `--strict` | Warnings fail too |
| `--budget-kb <n>` | Fail when the homepage downloads more than this many KB. No published budget exists, so without it the weight is information |

## The browser checks

It runs when the site has Playwright and the axe-core plugin installed, and says it did not run otherwise:

```sh
npm install --save-dev @playwright/test @axe-core/playwright
npx playwright install chromium
```

## In a build script

```js
import { check, report } from '@ggds/check';

const result = await check('https://www.example.gov.gh', { pages: 20 });
console.log(report(result));          // or result.results: { 'web.csp': { status, detail }, ... }
```

The rules and their sources are in `@ggds/check/rules`.

## Licence

[Apache-2.0](https://github.com/ghana-gds/ggds/blob/main/LICENSE).
