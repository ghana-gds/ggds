# @ggds/astro

The page parts of GGDS, the Ghana Government Design System, as Astro components. They output the same HTML as the
GGDS documentation: `SkipLink`, `Banner`, `Header`, `Hero`, `Footer` and `TabBar`.

**Draft, version 0.1.** See the [GGDS repository](https://github.com/ghana-gds/ggds).

## Install

```sh
npm install @ggds/astro @ggds/css
```

## Use

```astro
---
import '@ggds/css/ggds.css';
import Header from '@ggds/astro/Header.astro';
---
<Header name="Example Agency" initials="EA" nav={[{ label: 'Services', href: '/services/' }]} />
```

For the phone menu, also install [`@ggds/js`](https://www.npmjs.com/package/@ggds/js) and call `initAll()`.

## Licence

Apache-2.0. See `LICENSE.md` for what it does not cover.
