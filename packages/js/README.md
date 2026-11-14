# @ggds/js

[![npm](https://img.shields.io/npm/v/@ggds/js)](https://www.npmjs.com/package/@ggds/js)
[![Licence: Apache-2.0](https://img.shields.io/badge/licence-Apache--2.0-blue)](https://github.com/ghana-gds/ggds/blob/main/LICENSE.md)

**Documentation:** [ghana-gds.github.io/ggds](https://ghana-gds.github.io/ggds/) · [Get started as a developer](https://ghana-gds.github.io/ggds/get-started/developers.html)

The small, optional script for GGDS, the Ghana Government Design System. It adds the phone menu to the header,
moves focus to the error summary, counts characters, adds the Show button to password fields, opens dialogs and runs
the timeout warning. Every GGDS part works without it except a dialog and the timeout warning, which need it: a
dialog's opener is a link to a confirmation page, so the task still works.

ES modules, about 17 KB unminified (5 KB with gzip), no dependencies, TypeScript types included. No inline scripts, so it runs under
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
| `initCharacterCount(field)` | Enhances one character count |
| `initPasswordInput(field)` | Adds the Show / Hide button to one password field |
| `initDialogOpener(link)` | Makes one `[data-ggds-dialog]` link open its dialog |
| `initDialog(dialog)` | Makes the `[data-ggds-dialog-close]` buttons in one dialog close it |
| `initTimeoutWarning(dialog)` | Starts one timeout warning |

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

### Character count

Finds `[data-ggds-module="character-count"]`. The limit hint becomes a count that updates as people type, and
screen readers hear it when they pause.

### Password input

Finds `[data-ggds-module="password-input"]`. Shows the hidden Show button, which switches the field between hidden
and visible, says which it is to screen readers, and hides the password again when the form is sent.

### Dialog

Finds `[data-ggds-dialog]` links. The link goes to a confirmation page without the script; with it, it opens the
`<dialog class="ggds-dialog">` it names as a modal. Escape and `[data-ggds-dialog-close]` close it, and focus goes
back to the link.

### Timeout warning

Finds `[data-ggds-module="timeout-warning"]`. Opens the warning `data-ggds-warn` seconds before `data-ggds-timeout`,
counts down, requests `data-ggds-keep-alive` when people choose "Stay signed in" (or press Escape), and goes to
`data-ggds-sign-out` when time runs out.

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
