# @ggds/icons

[![npm](https://img.shields.io/npm/v/@ggds/icons)](https://www.npmjs.com/package/@ggds/icons)
[![Licence: Apache-2.0](https://img.shields.io/badge/licence-Apache--2.0-blue)](https://github.com/ghana-gds/ggds/blob/main/LICENSE.md)

**Documentation:** [All the icons](https://ghana-gds.github.io/ggds/icons.html) · [Icon component](https://ghana-gds.github.io/ggds/components/icon.html)

The icons of GGDS, the Ghana Government Design System: 143 line icons for government services, drawn for GGDS on
one grid so they look like one set. They cover navigation and actions, status, accounts and identity (Ghana Card,
passport), documents, payments (including the cedi), government, and public services from health and education to
farming, fisheries, energy and transport.

Each icon is about 90 bytes. Import only the ones you use and your bundler leaves out the rest.

> **Draft, version 0.2.** GGDS is NITA guidance in preparation. Names may change before version 1.0; each change
> is listed in the [changelog](https://github.com/ghana-gds/ggds/blob/main/CHANGELOG.md).

## Install

```sh
npm install @ggds/icons
```

The `ggds-icon` class that sizes icons is in [`@ggds/css`](https://www.npmjs.com/package/@ggds/css). Without npm,
the [GGDS download](https://github.com/ghana-gds/ggds/releases) has every icon in `ggds/icons/`.

## What is in it

| Import | What it is |
|---|---|
| `@ggds/icons` | One export per icon (`arrowRight`, `idCard`, …) and `svg()`: only the icons you import are bundled |
| `@ggds/icons/all` | `ICONS` (every icon by name), `NAMES` and `icon(name)`, for templates that pick icons by name |
| `@ggds/icons/svg/<name>.svg` | Each icon as a standalone SVG file |
| `@ggds/icons/sprite.svg` | Every icon as a `<symbol>`, for `<use href="sprite.svg#name">` |
| `@ggds/icons/icons.json` | `{ name: inner SVG }`, for Python, PHP and other languages |
| `@ggds/icons/catalogue.json` | Each icon's category and search keywords |
| `@ggds/icons/ggds-icons.svg` | Every icon on one labelled sheet, as named layers, for Figma and other design tools |

## Use the icons

In JavaScript, import the icons you need:

```js
import { download, svg } from '@ggds/icons';

link.insertAdjacentHTML('afterbegin', svg(download));
// <svg class="ggds-icon" viewBox="0 0 24 24" … aria-hidden="true" focusable="false">…</svg>
```

By name, for example in a template where the icon comes from content:

```js
import { icon } from '@ggds/icons/all';

icon('id-card');                 // class "ggds-icon"
icon('id-card', 'my-class');     // your own class
```

In HTML, with the sprite (the browser downloads it once and keeps it):

```html
<a href="/apply" class="ggds-with-icon">
  <svg class="ggds-icon" aria-hidden="true" focusable="false"><use href="/ggds/icons/sprite.svg#document"/></svg>
  <span>Apply for a licence</span>
</a>
```

In Django, `{% ggds_icon "download" %}` (from `ggds-django`); in the GGDS WordPress theme, `ggds_icon( 'download' )`;
in Astro, `icon('download')` from `@ggds/astro/icons.mjs`.

Sizes come from `@ggds/css`: `ggds-icon` is 20px, `ggds-icon--sm` 16px, `ggds-icon--lg` 24px and
`ggds-icon--xl` 32px. Icons are drawn in the colour of the text around them (`currentColor`), so set `color` to
change it.

## API

### `@ggds/icons`

| Export | What it does |
|---|---|
| `arrowRight`, `idCard`, … | One string per icon: its inner SVG. The name is the icon's name in camelCase |
| `svg(body, { class?, label? })` | A complete `<svg>`. Class `ggds-icon` by default. Hidden from screen readers unless you give a `label`, which you should do only for an icon with no words beside it |

### `@ggds/icons/all`

| Export | What it does |
|---|---|
| `ICONS` | Every icon's inner SVG, by name (`'id-card'`) |
| `NAMES` | Every icon's name |
| `icon(name, class?)` | A complete `<svg>` hidden from screen readers. Throws for a name that does not exist, so typos fail at build time |

TypeScript types are included; `IconName` is the union of every name.

## For designers

Download [every icon on one sheet](https://ghana-gds.github.io/ggds/assets/icons/ggds-icons.svg) and drag it into
Figma: each icon is a layer named after it, on its 24px frame. Single icons are on the
[icons page](https://ghana-gds.github.io/ggds/icons.html).

Every icon follows the same rules: a 24 by 24 frame with 2px clear on every side, lines 2px wide with round ends
and corners, no fills or colours, straight lines on whole pixels. The build checks them and stops with the reason if
a drawing breaks one.

## Add an icon

1. Draw it on the 24px grid following the rules above, and save it as `src/<name>.svg`, starting with the same
   `<svg>` element as the other files.
2. Add the name, with words people might search for, to a category in `catalogue.json`.
3. Run `pnpm run build` from the repository. The icon is then in every format, and in Django, WordPress, Astro and
   the documentation.

Ask for an icon in [GitHub issues](https://github.com/ghana-gds/ggds/issues).

## Accessibility

Icons hide from screen readers by default, because the words beside them say the same. Put words next to every
icon: people guess the meaning of an icon on its own differently. Icons use the text colour, so they keep its
contrast in every theme and in Windows high contrast mode.

## Related packages

- [`@ggds/css`](https://www.npmjs.com/package/@ggds/css): the component styles, including `ggds-icon`
- [`@ggds/astro`](https://www.npmjs.com/package/@ggds/astro): the page parts as Astro components
- [`@ggds/tokens`](https://www.npmjs.com/package/@ggds/tokens): the design tokens, including the icon sizes

## Contributing and support

Report problems and ask questions in [GitHub issues](https://github.com/ghana-gds/ggds/issues), and see
[Contribute](https://ghana-gds.github.io/ggds/contribute.html) and [Versions and support](https://ghana-gds.github.io/ggds/versions.html). Report security problems
privately: [security policy](https://github.com/ghana-gds/ggds/security/policy).

## Licence

Apache-2.0. The flag, the coat of arms and institutions' logos are not covered: see `LICENSE.md` in the package.
