# @ggds/js

[![npm](https://img.shields.io/npm/v/@ggds/js)](https://www.npmjs.com/package/@ggds/js)
[![Licence: Apache-2.0](https://img.shields.io/badge/licence-Apache--2.0-blue)](https://github.com/ghana-gds/ggds/blob/main/LICENSE.md)

**Documentation:** [ghana-gds.github.io/ggds](https://ghana-gds.github.io/ggds/) · [Get started as a developer](https://ghana-gds.github.io/ggds/get-started/developers.html)

The small, optional script for GGDS, the Ghana Government Design System. It adds the phone menu to the header and
moves focus to the error summary. Every GGDS part works without it: this script only makes two of them easier to
use.

ES modules, about 4 KB unminified, no dependencies, TypeScript types included. No inline scripts, so it runs under
a strict Content Security Policy (`script-src 'self'`).

> **Draft, version 0.1.** Changes are listed in the
> [changelog](https://github.com/ghana-gds/ggds/blob/main/CHANGELOG.md).

## Install

```sh
npm install @ggds/js
```

## Use

With a bundler, start it once:

```js
import { initAll } from '@ggds/js';

initAll();
```

Without a bundler, copy the files from the release zip and load `auto.js`. It runs `initAll()` for you:

```html
<script type="module" src="ggds/auto.js"></script>
```

## API

| Export | What it does |
|---|---|
| `initAll(root?)` | Enhances every GGDS part inside `root` (default: the whole document). Safe to call more than once, for example after adding content to the page |
| `initMenu(button)` | Enhances one header menu button |
| `initErrorSummary(element)` | Enhances one error summary |

`@ggds/js/auto` runs `initAll()` when it loads.

### Phone menu

Finds `.ggds-header__menu-button[aria-controls]`. The button is in the header's HTML with the `hidden` attribute,
so without the script it stays hidden and the navigation shows as a list. With the script, below 80rem:

- the button appears, and toggles the navigation and `aria-expanded`;
- the menu opens in place and pushes the page down, so it never covers content that keyboard users could tab onto;
- Escape closes it and returns focus to the button;
- the menu closes when the screen grows past 80rem.

### Error summary

Finds `[data-ggds-module="error-summary"]`. When the page loads, it moves focus to the summary, so screen-reader
and keyboard users hear the errors first. The summary's links (`href="#field-id"`) work without the script; with
it, following a link also scrolls the field's label or legend into view, not only the input.

## Browser support

Browsers that run ES modules: current Chrome, Edge, Firefox and Safari. Older browsers skip the script and get the
version without it, which works.

## Related packages

- [`@ggds/css`](https://www.npmjs.com/package/@ggds/css): the component styles
- [`@ggds/astro`](https://www.npmjs.com/package/@ggds/astro): the page parts as Astro components
- [`@ggds/themes`](https://www.npmjs.com/package/@ggds/themes): ready-made institution themes
- [`@ggds/tokens`](https://www.npmjs.com/package/@ggds/tokens): the design tokens

## Contributing and support

Report problems and ask questions in [GitHub issues](https://github.com/ghana-gds/ggds/issues), and see
[Contribute](https://ghana-gds.github.io/ggds/contribute.html) and [Versions and support](https://ghana-gds.github.io/ggds/versions.html). Report security problems
privately: [security policy](https://github.com/ghana-gds/ggds/security/policy).

## Licence

Apache-2.0. See `LICENSE.md` in the package for what the licence does not cover.
