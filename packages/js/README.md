# @ggds/js

The small, optional script for GGDS, the Ghana Government Design System. It adds the phone menu and moves focus
to the error summary. Every GGDS part works without it.

**Draft, version 0.1.** See the [GGDS repository](https://github.com/ghana-gds/ggds).

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

You can also start one part on its own: `initMenu(button)` or `initErrorSummary(element)`.

It is a set of ES modules with no dependencies and no inline scripts, so it runs under a strict Content Security
Policy.

## Licence

Apache-2.0. See `LICENSE.md` for what it does not cover.
