# @ggds/tokens

[![npm](https://img.shields.io/npm/v/@ggds/tokens)](https://www.npmjs.com/package/@ggds/tokens)
[![Licence: Apache-2.0](https://img.shields.io/badge/licence-Apache--2.0-blue)](https://github.com/ghana-gds/ggds/blob/main/LICENSE.md)

**Documentation:** [ghana-gds.github.io/ggds](https://ghana-gds.github.io/ggds/) · [Foundations](https://ghana-gds.github.io/ggds/foundations.html)

The design tokens of GGDS, the Ghana Government Design System: its colours, text sizes, spacing, radii, shadows
and motion as named values, with the rule that decides whether a colour can be an institution's colour.

You only need this package on its own if you build your own styles or tools. [`@ggds/css`](https://www.npmjs.com/package/@ggds/css)
already includes every token.

> **Draft, version 0.1.** GGDS is NITA guidance in preparation. Names may change before version 1.0; each change
> is listed in the [changelog](https://github.com/ghana-gds/ggds/blob/main/CHANGELOG.md).

## Install

```sh
npm install @ggds/tokens
```

## What is in it

| Import | What it is |
|---|---|
| `@ggds/tokens/tokens.css` | Every token as a CSS custom property, such as `--ggds-color-brand-700` |
| `@ggds/tokens/tokens.json` | The source, in the W3C design tokens format (DTCG) |
| `@ggds/tokens/tokens.flat.json` | Every token resolved to its final value, for other tools |
| `@ggds/tokens/compat-site.css` | Aliases for older token names, for sites moving to GGDS |
| `@ggds/tokens/institution.mjs` | The institution colour rule, as code |
| `@ggds/tokens/lib.mjs` | Helpers to read the tokens and check colour contrast (Node) |

## Use the tokens in CSS

```css
@import "@ggds/tokens/tokens.css";

.my-panel {
  padding: var(--ggds-space-4);
  color: var(--ggds-color-text);
  border-inline-start: 4px solid var(--ggds-color-brand-700);
}
```

Every name starts with `--ggds-`. Tokens that refer to other tokens are written as `var()`, so overriding one
token also updates the tokens that depend on it.

## Make a theme from an institution's colour

```js
import { institutionColourProblems, institutionPalette, institutionCss } from '@ggds/tokens/institution.mjs';

institutionColourProblems('#7fb3d5'); // ['#7fb3d5 has 2.26:1 contrast on white; …']
institutionPalette('#006e35');        // { accent: '#006e35', deep: '#006732' }
institutionCss('#006e35');            // CSS to load after ggds.css
```

The colour must have at least 4.5:1 contrast on white, because the header shows the institution's name in it. The
deep shade, used behind white text in the footer, is darkened only as far as 7:1 contrast needs, so it keeps the
colour's hue. Put the CSS in a stylesheet, not an inline style: GGDS pages run under a Content Security Policy that
blocks inline styles.

## API

### `@ggds/tokens/institution.mjs`

| Export | What it does |
|---|---|
| `institutionColourProblems(hex)` | Why a `#rrggbb` colour cannot be an institution colour, as an array of messages; `[]` when it can |
| `institutionPalette(hex)` | `{ accent, deep }`: the colour, and a deep shade of it for the footer. Throws for a colour that fails the rule |
| `institutionCss(hex)` | A stylesheet that sets the institution colour for a site |
| `MIN_ON_WHITE` | `4.5`: the contrast the colour needs on white |
| `MIN_WHITE_ON_DEEP`, `MIN_GOLD_ON_DEEP` | `7` and `4.5`: the contrast white text and the gold accent need on the deep shade |
| `GOLD` | The flag gold, `#fcd116` (a placeholder until the flag colours are officially specified) |

### `@ggds/tokens/lib.mjs`

For build tools in Node. No dependencies.

| Export | What it does |
|---|---|
| `loadTokens(path)` | Reads a DTCG token file |
| `flatten(tree)` | Every token as `{ path, type, value, description }` |
| `resolveAll(tokens)` | A map from dotted path to resolved token, following `{a.b.c}` references |
| `cssName(path)` | The custom property name: `color.text.default` → `--ggds-color-text` |
| `cssValue(token, all)` | A token's value written as CSS |
| `contrast(a, b)` | The WCAG 2.2 contrast ratio between two `#rrggbb` colours |
| `luminance(hex)` | The relative luminance of a `#rrggbb` colour |

## Accessibility

Every colour pair GGDS uses is listed in `tokens.json` with its minimum contrast: 4.5:1 for text, 3:1 for borders
and focus lines. GGDS's tests check each pair, and no version is released while one falls short.

## Related packages

- [`@ggds/css`](https://www.npmjs.com/package/@ggds/css): the component styles, built on these tokens
- [`@ggds/themes`](https://www.npmjs.com/package/@ggds/themes): ready-made institution themes
- [`@ggds/js`](https://www.npmjs.com/package/@ggds/js): the optional script
- [`@ggds/astro`](https://www.npmjs.com/package/@ggds/astro): the page parts as Astro components

## Contributing and support

Report problems and ask questions in [GitHub issues](https://github.com/ghana-gds/ggds/issues), and see
[Contribute](https://ghana-gds.github.io/ggds/contribute.html) and [Versions and support](https://ghana-gds.github.io/ggds/versions.html). Report security problems
privately: [security policy](https://github.com/ghana-gds/ggds/security/policy).

## Licence

Apache-2.0. The flag, the coat of arms and institutions' logos are not covered: see `LICENSE.md` in the package.
