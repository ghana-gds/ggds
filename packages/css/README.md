# @ggds/css

[![npm](https://img.shields.io/npm/v/@ggds/css)](https://www.npmjs.com/package/@ggds/css)
[![Licence: Apache-2.0](https://img.shields.io/badge/licence-Apache--2.0-blue)](https://github.com/ghana-gds/ggds/blob/main/LICENSE.md)

**Documentation:** [ghana-gds.github.io/ggds](https://ghana-gds.github.io/ggds/) · [Components](https://ghana-gds.github.io/ggds/components/index.html)

The styles for every part of GGDS, the Ghana Government Design System: page structure, navigation, forms and
content. Plain CSS: it works with any website or framework, needs no JavaScript, and runs under a strict Content
Security Policy.

> **Draft, version 0.1.** GGDS is NITA guidance in preparation. Class names may change before version 1.0; each
> change is listed in the [changelog](https://github.com/ghana-gds/ggds/blob/main/CHANGELOG.md).

## Install

```sh
npm install @ggds/css
```

Or, with no build tools: download `ggds-<version>.zip` from the
[releases page](https://github.com/ghana-gds/ggds/releases) and copy its `ggds` folder into your website. The
release also lists a checksum and an `integrity` value for every file.

## Use

Everything in one file (37 KB, 7 KB with gzip):

```css
@import "@ggds/css/ggds.css";
```

```html
<link rel="stylesheet" href="ggds/ggds.min.css">
```

Or only the parts you use, which keeps pages lighter:

```css
@import "@ggds/css/core.css";               /* tokens and base styles: always first */
@import "@ggds/css/components/header.css";  /* then one file per part */
@import "@ggds/css/components/footer.css";
```

Then write the HTML for each part as shown in the
[GGDS documentation](https://ghana-gds.github.io/ggds/components/index.html). Every class starts with
`ggds-`. For your institution's colour, add a theme from
[`@ggds/themes`](https://www.npmjs.com/package/@ggds/themes).

## Files

| Import | What it is |
|---|---|
| `@ggds/css` or `@ggds/css/ggds.css` | Everything: tokens, base styles and every component |
| `@ggds/css/ggds-components.css` | Base styles and components without the tokens, for sites that load `@ggds/tokens/tokens.css` themselves |
| `@ggds/css/core.css` | Tokens and base styles only |
| `@ggds/css/components/<name>.css` | One component file (below) |
| `@ggds/css/base.css` | Base styles only: `core.css` without the tokens |
| `@ggds/css/components.json` | Which component styles each class, for `ggds-css-subset` |

Every file has a minified copy: `ggds.min.css`, `core.min.css`, `components/header.min.css` and so on. The
unbuilt sources are in `src/`.

| Component file | Parts |
|---|---|
| `banner.css` | Government website banner |
| `skip-link.css` | Skip link |
| `header.css` | Header, with the phone menu |
| `hero.css` | Homepage hero |
| `page-heading.css` | Page heading: the top of an inner page in the institution's colour |
| `footer.css` | Footer |
| `tab-bar.css` | Tab bar for phones |
| `navigation.css` | Breadcrumbs, pagination, tab links |
| `button.css` | Buttons |
| `field.css` | Labels, hints, error messages, text inputs, textareas, selects, file upload, radios and checkboxes |
| `date-input.css` | Date input: day, month and year |
| `progress.css` | Progress through a task: "Question 3 of 4" |
| `summary-list.css` | Summary list, for check answers pages and records |
| `panel.css` | Confirmation panel |
| `error-summary.css` | Error summary |
| `card.css` | Cards and card grids |
| `notice.css` | Notices |
| `tag.css` | Tags |
| `table.css` | Tables |
| `meter.css` | Meter: an amount drawn as a bar, such as in a table |
| `key-figures.css` | Key figures: the numbers that matter most on a page |
| `timeline.css` | Timeline: what has happened and what happens next |
| `steps.css` | Steps: a few numbered things to do |
| `disclosure.css` | Accordions and details |
| `prose.css` | Rich text from a CMS |
| `layout.css` | Layout: stacks, rows that wrap, grids, a side column, and spacing, text, surface and size classes, so a website needs no CSS framework |

## Only the components a site uses

`ggds-css-subset` makes one minified file holding only the components a site uses, found from the `ggds-` classes
in its own files. Pages look exactly the same as with `ggds.min.css`: each component keeps its cascade layer and order.

```sh
npx --package=@ggds/css ggds-css-subset --scan templates --out static/ggds/site.min.css   # scan files or folders
npx --package=@ggds/css ggds-css-subset header footer button field > site.min.css         # or name the components
```

`--no-tokens` leaves the tokens out (for sites that load `@ggds/tokens`), `--readable` writes unminified CSS, and
`--help` lists everything. Run it again when the site starts using another component. In a build script:
`import { scan, subset } from '@ggds/css/subset'`. A form page (skip link, banner, header, footer, buttons,
fields, error summary, tab bar) is about half of `ggds.min.css`, compressed. See [Fast pages](https://ghana-gds.github.io/ggds/performance.html) for caching and compression.

## Your own styles

All GGDS styles sit in the cascade layers `ggds.base`, `ggds.components` and `ggds.utilities` (the layout
classes), in that order, so a layout class on a component wins over the component's own spacing. Styles you write
outside a layer always win, so you never need `!important` to override GGDS. To change a colour or a size, override its token:

```css
:root { --ggds-color-institution: #006e35; }
```

## Accessibility

- Every page part meets WCAG 2.2 AA in GGDS's automated tests (axe), at desktop and phone widths.
- Every part fits a 320px screen without sideways scrolling.
- Native form controls throughout, so forced colours (Windows High Contrast), zoom and screen readers work.
- Animation runs only for people who have not asked for less motion.
- No inline styles and no JavaScript is needed, so a strict Content Security Policy (`style-src 'self'`) works.

Automated tests find only part of the barriers people meet. An accessibility audit with disabled users is planned
before version 1.0.

## Browser support

Current versions of Chrome, Edge, Firefox and Safari, on phones and computers. The styles use cascade layers,
which these browsers have supported since 2022 (Chrome and Edge 99, Firefox 97, Safari 15.4). Some details, such
as card hover effects and the wide-screen header, use `:has()` and container queries; browsers without them show a
plainer version that still works.

## Related packages

- [`@ggds/tokens`](https://www.npmjs.com/package/@ggds/tokens): the design tokens
- [`@ggds/themes`](https://www.npmjs.com/package/@ggds/themes): ready-made institution themes
- [`@ggds/js`](https://www.npmjs.com/package/@ggds/js): the optional script: phone menu, error summary, character count, password Show button, dialogs and timeout warning
- [`@ggds/astro`](https://www.npmjs.com/package/@ggds/astro): the page parts as Astro components
- [`ggds-django`](https://github.com/ghana-gds/ggds/tree/main/packages/django): template tags and a form renderer for Django and Wagtail

## Contributing and support

Report problems and ask questions in [GitHub issues](https://github.com/ghana-gds/ggds/issues), and see
[Contribute](https://ghana-gds.github.io/ggds/contribute.html) and [Versions and support](https://ghana-gds.github.io/ggds/versions.html). Report security problems
privately: [security policy](https://github.com/ghana-gds/ggds/security/policy).

## Licence

Apache-2.0. The flag, the coat of arms and institutions' logos are not covered: see `LICENSE.md` in the package.
