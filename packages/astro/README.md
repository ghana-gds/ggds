# @ggds/astro

[![npm](https://img.shields.io/npm/v/@ggds/astro)](https://www.npmjs.com/package/@ggds/astro)
[![Licence: Apache-2.0](https://img.shields.io/badge/licence-Apache--2.0-blue)](https://github.com/ghana-gds/ggds/blob/main/LICENSE.md)

**Documentation:** [ghana-gds.github.io/ggds](https://ghana-gds.github.io/ggds/) · [Get started as a developer](https://ghana-gds.github.io/ggds/get-started/developers.html#astro)

The page parts of GGDS, the Ghana Government Design System, as [Astro](https://astro.build) components:
`SkipLink`, `Banner`, `Header`, `Hero`, `Footer` and `TabBar`. They output the same HTML as the GGDS
documentation.

> **Draft, version 0.1.** Props may change before version 1.0; each change is listed in the
> [changelog](https://github.com/ghana-gds/ggds/blob/main/CHANGELOG.md).

## Install

```sh
npm install @ggds/astro @ggds/css
```

Needs Astro 5 or later. For the phone menu, also install [`@ggds/js`](https://www.npmjs.com/package/@ggds/js).

## Use

```astro
---
import '@ggds/css/ggds.css';
import SkipLink from '@ggds/astro/SkipLink.astro';
import Banner from '@ggds/astro/Banner.astro';
import Header from '@ggds/astro/Header.astro';
import Footer from '@ggds/astro/Footer.astro';

const nav = [
  { label: 'Services', href: '/services/' },
  { label: 'News', href: '/news/' },
  { label: 'About us', href: '/about/' },
];
---
<SkipLink />
<Banner official shortName="EA" host="example.gov.gh" />
<Header name="Example Agency" initials="EA" nav={nav} current={Astro.url.pathname} />
<main id="main" tabindex="-1">…</main>
<Footer name="Example Agency" purpose="What the agency does, in one sentence." />

<script>
  import { initAll } from '@ggds/js';
  initAll();
</script>
```

Every component also takes `class`, added to its outer element, and passes any other attribute (such as `data-*`)
to that element.

## Components

### `SkipLink`

The first thing on every page. Point it at `<main id="main" tabindex="-1">`.

| Prop | Type | Default |
|---|---|---|
| `href` | `string` | `'#main'` |
| `label` | `string` | `'Skip to main content'` |

### `Banner`

The government website banner. It opens without JavaScript (`<details>`) and is never sticky.

| Prop | Type | Default | What it is |
|---|---|---|---|
| `shortName` | `string` | required | The institution's short name |
| `host` | `string` | required | The official address, such as `example.gov.gh`; `''` if none is confirmed yet |
| `official` | `boolean` | `false` | This page is served from the official address. If `false`, the banner says this copy is not the official website |
| `addressNote` | `string` | `''` | Text after the address, when the page is not official |
| `register` | `{ href, label } \| null` | `null` | A link to the list of official government websites |

### `Header`

The flag-colour line, then one row with the logo, name and country, the main navigation and Search. Below 80rem
the navigation sits behind a menu button (with `@ggds/js`); without JavaScript it shows as a list.

| Prop | Type | Default | What it is |
|---|---|---|---|
| `name` | `string` | required | The institution's name |
| `nav` | `{ label, href, attrs? }[]` | required | The main sections |
| `current` | `string` | — | The `href` of the current section, marked `aria-current="page"` |
| `initials` | `string` | — | Initials for the round badge, used until a logo is approved |
| `country` | `string` | `'Republic of Ghana'` | The line under the name |
| `home` | `string` | `'/'` | Where the name links to |
| `search` | `{ href } \| false` | `{ href: '/search/' }` | The search page, or `false` for none |
| `navId` | `string` | `'ggds-header-nav'` | The navigation's `id` |

Slot `logo`: the institution's logo, in place of the initials.

### `Hero`

The top of a homepage, in the institution's dark shade. It leads with what the visitor came to do.

| Prop | Type | Default | What it is |
|---|---|---|---|
| `title` | `string` | required | A question about the visitor's need |
| `purpose` | `string` | — | One sentence on what the institution does |
| `lede` | `string` | — | A short paragraph under the title |
| `search` | `{ action, label, placeholder?, … }` | — | A search form; it works without JavaScript |
| `tasks` | `{ label, href, tag?, attrs? }[]` | `[]` | Up to six common tasks |
| `tasksLabel` | `string` | `'Common tasks:'` | The label before the tasks |
| `hub` | `boolean` | `false` | A ministry hero searching all its agencies; tag each task with its agency |
| `artDecorative` | `boolean` | `true` | Set to `false` if the drawing has links |

Slots: `art` (a drawing beside the text on wide screens, hidden on phones) and `after` (anything below the tasks,
such as a hotline card).

### `Footer`

The woven flag band, then the institution, its main sections and a bottom bar with the copyright line and the
required links.

| Prop | Type | Default | What it is |
|---|---|---|---|
| `name` | `string` | required | The institution's name |
| `purpose` | `string` | — | One sentence on what the institution does |
| `contact` | `{ address?, email?, phone?, phoneHref?, moreHref?, moreLabel? }` | — | Contact details |
| `sections` | `{ label, href, links: { label, href }[] }[]` | `[]` | Main sections, each with up to five of its most-used pages |
| `bar` | `{ label, href }[]` | `[]` | Links in the bottom bar, such as Privacy and Accessibility |
| `year` | `number` | this year | The copyright year |

Slots: `logo`, `contact` (more contact lines, social links) and `bar` (more `<li>` items in the bottom bar).

### `TabBar`

Home, up to three main sections and Search, fixed to the bottom of the screen on phones only.

| Prop | Type | What it is |
|---|---|---|
| `tabs` | `{ label, href, icon, current?, attrs? }[]` | The tabs. `icon` is the name of any [`@ggds/icons`](https://ghana-gds.github.io/ggds/icons.html) icon, such as `home`, `search` or `services` |

## Accessibility

The components output the HTML that GGDS tests in its documentation: it meets WCAG 2.2 AA in automated tests (axe)
at desktop and phone widths, and works under a strict Content Security Policy. They send no JavaScript to the
browser; the phone menu comes from `@ggds/js`.

### More parts

Each takes a `strings` prop for GGDS's own words in another language. Their props are on each component's
documentation page.

| Component | What it is |
|---|---|
| `Page` | A whole page inside `<body>` in GGDS's order: `banner`, `header` and `footer` (each part's props), `tabs`, `mainClass`; the content in the default slot, your logo in the `logo` and `footer-logo` slots |
| `BackLink` | Back to the previous page of a task: `href`, and `label` only if "Back" would be unclear |
| `PhaseBanner` | Under the header for a new service: `phase` (`'alpha'` or `'beta'`) and `feedbackHref` |
| `SideNav` | The pages of one section: `items` (each with optional `links`) and `current` |
| `Contents` | "On this page": `items` linking to the page's own headings |
| `LanguageSwitcher` | The same page in each language: `languages` and `current`. Nothing for one language |
| `CookieBanner` | Asks before setting analytics cookies; works without JavaScript: `service` and `choice` |
| `PasswordInput` | A password field; `@ggds/js` adds the Show button: `id`, `name`, `label`, `hint`, `error`, `autocomplete` |
| `CodeInput` | One box for a code sent by SMS or email: `id`, `name`, `label`, `hint`, `error`, `value` |
| `TaskList` | The sections of an application with their status: `tasks` of `{ label, href?, status, hint? }` |
| `Dialog` | Confirms an action: `id`, `title`, `warning`, `action`; the default slot says what happens, the `actions` slot holds the button, and Cancel comes first |
| `TimeoutWarning` | On every signed-in page: `timeout`, `warn`, `keepAlive` and `signOut`; `@ggds/js` runs it |
| `Feedback` | "Did this page help you?" at the end of a page: `action`, `page`, `reportHref`, and `answered` for the thank-you |

## Related packages

- [`@ggds/css`](https://www.npmjs.com/package/@ggds/css): the styles (required)
- [`@ggds/js`](https://www.npmjs.com/package/@ggds/js): the optional script: phone menu, error summary, character count, password Show button, dialogs and timeout warning
- [`@ggds/themes`](https://www.npmjs.com/package/@ggds/themes): ready-made institution themes
- [`@ggds/tokens`](https://www.npmjs.com/package/@ggds/tokens): the design tokens

## Contributing and support

Report problems and ask questions in [GitHub issues](https://github.com/ghana-gds/ggds/issues), and see
[Contribute](https://ghana-gds.github.io/ggds/contribute.html) and [Versions and support](https://ghana-gds.github.io/ggds/versions.html). Report security problems
privately: [security policy](https://github.com/ghana-gds/ggds/security/policy).

## Licence

Apache-2.0. See `LICENSE.md` in the package for what the licence does not cover.
