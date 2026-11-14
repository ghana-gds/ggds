# @ggds/themes

[![npm](https://img.shields.io/npm/v/@ggds/themes)](https://www.npmjs.com/package/@ggds/themes)
[![Licence: Apache-2.0](https://img.shields.io/badge/licence-Apache--2.0-blue)](https://github.com/ghana-gds/ggds/blob/main/LICENSE.md)

**Documentation:** [ghana-gds.github.io/ggds](https://ghana-gds.github.io/ggds/) · [Themes](https://ghana-gds.github.io/ggds/themes.html)

Ready-made example institution themes for GGDS, the Ghana Government Design System. A theme changes an institution's
colour in five places only: the line under the header, the institution's name, the homepage hero, the footer and
its card in a list. Links, buttons, form fields and messages stay the same on every government website, so people
recognise them wherever they are.

> **Draft, version 0.1.** Each institution still has to confirm its colour before its theme is final. Changes are
> listed in the [changelog](https://github.com/ghana-gds/ggds/blob/main/CHANGELOG.md).

## Install

```sh
npm install @ggds/themes
```

It installs [`@ggds/tokens`](https://www.npmjs.com/package/@ggds/tokens) with it. You also need
[`@ggds/css`](https://www.npmjs.com/package/@ggds/css) for the styles the theme colours.

## Use

One institution for the whole site: load its theme after `ggds.css`.

```css
@import "@ggds/css/ggds.css";
@import "@ggds/themes/<theme>.css";   /* your theme's name, from the list below */
```

```html
<link rel="stylesheet" href="ggds/ggds.min.css">
<link rel="stylesheet" href="ggds/themes/<theme>.css">
```

Several institutions on one page, such as a list of agencies: load `themes.css` and mark each element.

```html
<link rel="stylesheet" href="ggds/themes/themes.css">
<li class="ggds-card ggds-card--institution" data-ggds-theme="gmet">…</li>
```

## Themes

| Slug | Institution |
|---|---|
| `mocdti` | Ministry of Communication, Digital Technology and Innovations (the default) |
| `csa` | Cyber Security Authority |
| `dpc` | Data Protection Commission |
| `gdcl` | Ghana Digital Centres Limited |
| `gdnr` | Ghana Domain Name Registry |
| `gifec` | Ghana Investment Fund for Electronic Communications |
| `gmet` | Ghana Meteorological Agency |
| `gpcl` | Ghana Post Company Limited |
| `gi-kace` | Ghana-India Kofi Annan Centre of Excellence in ICT |
| `nca` | National Communications Authority |
| `nita` | National Information Technology Agency |
| `pcsrc` | Postal and Courier Services Regulatory Commission |

Each theme is `@ggds/themes/<slug>.css`. All of them together, keyed by `data-ggds-theme`, are
`@ggds/themes/themes.css`. The data is in `@ggds/themes/themes.json`.

## Make your own theme

No theme for your institution yet? You need only its colour.

- **Designers and anyone without code:** use the
  [theme builder](https://ghana-gds.github.io/ggds/themes.html#make-a-theme). Type or pick the colour, see it on a
  page, and download the stylesheet and the design tokens. If the colour is too light to read, it suggests the
  nearest shade that passes.
- **Developers:** use the command line. It needs Node.js and no code.

```sh
npx @ggds/themes check '#7fb3d5'                  # does it pass? If not, the nearest shade that does (exit 1)
npx @ggds/themes '#006e35' --out theme.css         # the stylesheet, for the whole site
npx @ggds/themes '#006e35' --slug my-agency        # only for elements marked data-ggds-theme="my-agency"
npx @ggds/themes '#006e35' --format tokens --out theme.tokens.json   # design tokens for Figma
npx @ggds/themes nca --format tokens               # a ready-made theme, in any format
npx @ggds/themes list                              # the ready-made themes
```

In a build script, use `institutionCss()`, `institutionTokens()` and `checkInstitutionColour()` from
[`@ggds/tokens/institution.mjs`](https://www.npmjs.com/package/@ggds/tokens). The builder, the command line and this
package all use that one rule.

To add your institution to this package, open an [issue](https://github.com/ghana-gds/ggds/issues).

## Design tokens for Figma

Every theme is also `@ggds/themes/tokens/<slug>.tokens.json`: W3C design tokens with the same names as
`@ggds/tokens` (`color.institution.default` and `color.institution.deep`). In Figma, open **Local variables >
Import** and choose the file. Import several as modes of one collection to switch a design between institutions.
They also work with Tokens Studio and Style Dictionary.

## API

For build tools in Node.

```js
import { themes, getTheme, themeCss, themeTokens, allThemesCss, DEFAULT_THEME } from '@ggds/themes';

getTheme('nca');                        // { slug, name, shortName, color, accent, deep, status, source }
themeCss('nca');                        // the theme as CSS for the whole page (:root)
themeCss('nca', { scope: 'attribute' }); // the theme for elements marked data-ggds-theme="nca"
themeTokens('nca');                     // the theme as W3C design tokens
```

| Export | What it is |
|---|---|
| `themes` | Every theme, the default first. Frozen objects: `slug`, `name`, `shortName`, `color`, `accent`, `deep`, `status`, `source` |
| `getTheme(slug)` | One theme. Throws for an unknown slug, so a typo cannot silently fall back to the default |
| `themeCss(slug, { scope })` | A theme as CSS. `scope: 'root'` (default) themes the whole page; `'attribute'` themes elements with `data-ggds-theme` |
| `themeTokens(slug)` | A theme as W3C design tokens (DTCG), the same as `tokens/<slug>.tokens.json` |
| `allThemesCss()` | Every theme keyed by `data-ggds-theme`, the same as `themes.css` |
| `DEFAULT_THEME` | `'mocdti'` |

## Accessibility

Every theme colour has at least 4.5:1 contrast on white, and its deep shade at least 7:1 behind white text. A
theme cannot change the colours of links, buttons, focus or error messages.

## Related packages

- [`@ggds/css`](https://www.npmjs.com/package/@ggds/css): the component styles
- [`@ggds/tokens`](https://www.npmjs.com/package/@ggds/tokens): the design tokens and the institution colour rule
- [`@ggds/js`](https://www.npmjs.com/package/@ggds/js): the optional script
- [`@ggds/astro`](https://www.npmjs.com/package/@ggds/astro): the page parts as Astro components

## Contributing and support

Report problems and ask questions in [GitHub issues](https://github.com/ghana-gds/ggds/issues), and see
[Contribute](https://ghana-gds.github.io/ggds/contribute.html) and [Versions and support](https://ghana-gds.github.io/ggds/versions.html). Report security problems
privately: [security policy](https://github.com/ghana-gds/ggds/security/policy).

## Licence

Apache-2.0. Using a theme does not give anyone the right to use an institution's name or logo, or to present a
website as a Government of Ghana website: see `LICENSE.md` in the package.
