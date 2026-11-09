# @ggds/tokens

The design tokens of GGDS, the Ghana Government Design System: its colours, text sizes and spacing as named
values. You only need this package on its own if you build your own styles; `@ggds/css` already includes them.

**Draft, version 0.1.** See the [GGDS repository](https://github.com/ghana-gds/ggds).

## Install

```sh
npm install @ggds/tokens
```

## What is in it

| File | What it is |
|---|---|
| `tokens.css` | Every token as a CSS custom property, such as `--ggds-color-brand-700` |
| `tokens.json` | The source, in the W3C design tokens format (DTCG) |
| `tokens.flat.json` | Every token resolved to its final value, for other tools |
| `institution.mjs` | The institution colour rule, as code |
| `lib.mjs` | Helpers to read the tokens and check colour contrast |

```css
@import "@ggds/tokens/tokens.css";
```

## Make a theme from an institution's colour

```js
import { institutionCss, institutionColourProblems } from '@ggds/tokens/institution.mjs';

institutionColourProblems('#7fb3d5'); // ['#7fb3d5 has 2.26:1 contrast on white; …']
institutionCss('#006e35');           // CSS to load after ggds.css
```

The colour must have 4.5:1 contrast on white, because the header shows the institution's name in it. Put the CSS
in a stylesheet, not an inline style: GGDS pages run under a Content Security Policy that blocks inline styles.

## Licence

Apache-2.0. See `LICENSE.md` for what it does not cover.
