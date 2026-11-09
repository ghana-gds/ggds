# @ggds/css

The styles for every part of GGDS, the Ghana Government Design System. Plain CSS: it works with any website or
framework, and needs no JavaScript.

**Draft, version 0.1.** See the [GGDS repository](https://github.com/ghana-gds/ggds) for the guidance and the HTML
for each part.

## Install

```sh
npm install @ggds/css
```

Or download `ggds-<version>.zip` from the [releases page](https://github.com/ghana-gds/ggds/releases) and copy the
`ggds` folder into your website. No build step is needed.

## Use

Everything in one file:

```css
@import "@ggds/css/ggds.css";
```

```html
<link rel="stylesheet" href="ggds/ggds.min.css">
```

Or only the parts you use, which keeps pages lighter:

```css
@import "@ggds/css/core.css";               /* colours, text, spacing and base styles */
@import "@ggds/css/components/header.css";  /* then one file per part */
@import "@ggds/css/components/footer.css";
```

| File | What it is |
|---|---|
| `ggds.css` | Everything: tokens, base styles and every component |
| `ggds-components.css` | Base styles and components, for sites that load `@ggds/tokens/tokens.css` themselves |
| `core.css` | Tokens and base styles only |
| `components/<name>.css` | One component |

Every file has a minified copy: `ggds.min.css`, `core.min.css`, `components/header.min.css` and so on.

All styles sit in the cascade layers `ggds.base` and `ggds.components`, so your own CSS wins without
`!important`. For your institution's colour, add a theme from [`@ggds/themes`](https://www.npmjs.com/package/@ggds/themes).

## Licence

Apache-2.0. The flag, the coat of arms and institutions' logos are not covered: see `LICENSE.md`.
