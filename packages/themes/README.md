# @ggds/themes

Ready-made institution themes for GGDS, the Ghana Government Design System. A theme changes an institution's
colour in five places only: the line under the header, the institution's name, the homepage hero, the footer and
its card in a list. Links, buttons, form fields and messages stay the same on every government website.

**Draft, version 0.1.** See the [GGDS repository](https://github.com/ghana-gds/ggds).

## Install

```sh
npm install @ggds/themes
```

## Use

One institution for the whole site: load its theme after `ggds.css`.

```html
<link rel="stylesheet" href="ggds/ggds.min.css">
<link rel="stylesheet" href="ggds/themes/nca.css">
```

Several institutions on one page: load `themes.css` and mark each element.

```html
<link rel="stylesheet" href="ggds/themes/themes.css">
<li class="ggds-card ggds-card--institution" data-ggds-theme="gmet">…</li>
```

In Node, for build tools:

```js
import { themes, getTheme, themeCss } from '@ggds/themes';

getTheme('nca');      // { slug, name, shortName, color, accent, deep, … }
themeCss('nca');      // the theme as CSS
```

No theme for your institution yet? Make one with `institutionCss('#rrggbb')` from
[`@ggds/tokens/institution.mjs`](https://www.npmjs.com/package/@ggds/tokens). It rejects colours too light to read
on white.

## Licence

Apache-2.0. Using a theme does not give anyone the right to use an institution's name or logo: see `LICENSE.md`.
