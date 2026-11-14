# @ggds/react

[![npm](https://img.shields.io/npm/v/@ggds/react)](https://www.npmjs.com/package/@ggds/react)
[![Licence: Apache-2.0](https://img.shields.io/badge/licence-Apache--2.0-blue)](https://github.com/ghana-gds/ggds/blob/main/LICENSE.md)

**Documentation:** [Set it up in React](https://ghana-gds.github.io/ggds/get-started/developers.html#react) · [Next.js](https://ghana-gds.github.io/ggds/get-started/developers.html#nextjs) · [Live example](https://ghana-gds.github.io/ggds/examples/react/index.html)

GGDS, the Ghana Government Design System, as React components: the page parts every government website needs,
form fields with their labels, hints and errors wired up for screen readers, and the GGDS icons.

Each component renders exactly the HTML the GGDS documentation tests, so a React page meets the same accessibility
checks. GGDS's tests compare the two, element by element, on every change.

> **Draft, version 0.2.** GGDS is NITA guidance in preparation. Names may change before version 1.0; each change
> is listed in the [changelog](https://github.com/ghana-gds/ggds/blob/main/CHANGELOG.md).

## Install

```sh
npm install @ggds/react @ggds/css
```

Load the styles once, where your app starts (`src/main.jsx`, or `app/layout.tsx` in Next.js):

```js
import '@ggds/css/ggds.css';
import '@ggds/themes/nca.css';   // optional: your institution's theme (npm install @ggds/themes)
```

You do not need `@ggds/js`: the header menu and the error summary work inside React.

## Use

```jsx
import { SkipLink, Banner, Header, Footer, ErrorSummary, TextInput, Radios, Button } from '@ggds/react';

export default function Apply({ errors }) {
  return (
    <>
      <SkipLink />
      <Banner shortName="Example Agency" host="www.example.gov.gh" official />
      <Header name="Example Agency" initials="EA" nav={[{ label: 'Services', href: '/services/' }]} current="/services/" />
      <main className="ggds-main ggds-container" id="main" tabIndex={-1}>
        <ErrorSummary errors={[
          errors.fullName && { href: '#fullName', text: errors.fullName },
          errors.business && { href: '#business-sole', text: errors.business },   // radios: the first one
        ].filter(Boolean)} />
        <h1>Apply for a permit</h1>
        <form method="post" noValidate>
          <TextInput id="fullName" name="fullName" label="Full name" hint="As shown on your Ghana Card"
            width="long" autoComplete="name" error={errors.fullName} />
          <Radios name="business" legend="What type of business is it?" error={errors.business}
            items={[{ value: 'sole', label: 'Sole proprietor' }, { value: 'company', label: 'Limited company' }]} />
          <Button type="submit">Continue</Button>
        </form>
      </main>
      <Footer name="Example Agency" bar={[{ label: 'Privacy', href: '/privacy/' }]} />
    </>
  );
}
```

For a GGDS part with no component here, switch the code on its [component page](https://ghana-gds.github.io/ggds/components/index.html)
to **JSX (React)** and copy it.

### Next.js

The components work in the App Router. `Header` and `ErrorSummary` are client components (they carry
`'use client'`); the others are server components. To mark the current section, give the header the current path
from a small client component:

```tsx
'use client';
import { usePathname } from 'next/navigation';
import { Header } from '@ggds/react';

const nav = [{ label: 'Services', href: '/services/' }, { label: 'About', href: '/about/' }];

export function SiteHeader() {
  const path = usePathname();
  return <Header name="Example Agency" initials="EA" nav={nav} current={nav.find((n) => path.startsWith(n.href))?.href} />;
}
```

## Components

| Component | What it is |
|---|---|
| `Page` | A whole page inside `<body>`: skip link, banner, header, `<main id="main">`, footer and tab bar in GGDS's order, from `banner`, `header`, `footer` and `tabs` props (server component) |
| `SkipLink` | "Skip to main content", first on every page |
| `Banner` | "An official website of the Government of Ghana", and how to tell |
| `Header` | The institution's name and main sections; a menu on phones (client component) |
| `Hero` | The top of a homepage: a question, a search and common tasks |
| `Footer` | Who runs the website, contact details, sections and required links |
| `TabBar` | Quick links fixed to the bottom of the screen on phones |
| `Breadcrumbs` | Where the page sits in the website |
| `TextInput`, `Textarea`, `Select` | A question with its label, hint and error message, wired up with `aria-describedby` and `aria-invalid` |
| `Radios`, `Checkboxes` | One or more answers from a short list, in a fieldset with its legend, hint and error |
| `ErrorSummary` | The problems after a failed submit; takes the focus, and its links move to each field (client component) |
| `Button`, `ButtonGroup` | Buttons: `variant` is `primary`, `secondary`, `quiet` or `warning`; with `href`, a link that starts a task |
| `Notice` | A message: `type` is `info`, `success`, `warning` or `danger` |
| `Tag` | A short status, such as "Approved" |
| `Card`, `CardGrid` | Linked summaries in a grid; `icon` adds a GGDS icon |
| `Icon` | Any of the [GGDS icons](https://ghana-gds.github.io/ggds/icons.html) by name, hidden from screen readers unless it has a `label` |
| `CodeInput` | One box for a code sent by SMS or email, which phones fill in; text, so leading zeros stay |
| `PasswordInput` | A password field with a Show button that tells screen readers what it did (client component) |
| `CharacterCount` | A textarea with a limit and a count that updates as people type (client component) |
| `TaskList` | The sections of a long application, each with its status, and how many are complete |
| `Dialog` | A box over the page to confirm an action, with Cancel first (client component) |
| `TimeoutWarning` | Warns before people are signed out, counts down and lets them stay signed in (client component) |
| `PageHeading`, `KeyFigures` | The top of an inner page in the institution's colour, and figures that matter |
| `Progress`, `Timeline`, `Steps`, `Meter` | How far through a task, what happens next, what to do, an amount as a bar |
| `BackLink`, `SideNav`, `Contents` | Back to the previous page, the pages of a section, and "On this page" |
| `PhaseBanner`, `CookieBanner`, `LanguageSwitcher` | A new service, the cookie question, and the page in other languages |
| `Feedback` | "Did this page help you?" at the end of a page: Yes and No send a form (`action`) with the `page` address; `answered` says thank you; `reportHref` links to report a problem |
| `errorTitle()` | The page title while a form has errors: "Error: Apply for a licence" |
| `stringsFor(code)`, `STRINGS`, `TRANSLATIONS`, `LANGUAGES` | GGDS's own words in a language, for the `strings` prop |

Every component takes the props its documentation page shows, with TypeScript types. The form fields pass any other
props (`autoComplete`, `inputMode`, `defaultValue`, `onChange`…) to the `<input>`, `<textarea>` or `<select>`.
`TextInput` takes `prefix` and `suffix` for a unit beside the box, such as `prefix="GH₵"`: say the unit in the label too.

### Field ids

A field's hint is `<id>-hint` and its error `<id>-error`. For radios and checkboxes, each input's id is
`<name>-<value>`: link the error summary to the first one, such as `#business-sole`.

## Accessibility

The components write the HTML that GGDS tests with axe at desktop and phone widths. What you still need to do:
put words next to every icon, start the page title with "Error: " when there are errors, and check every answer
again on your server.

## Related packages

- [`@ggds/css`](https://www.npmjs.com/package/@ggds/css): the styles (needed)
- [`@ggds/themes`](https://www.npmjs.com/package/@ggds/themes): institution themes
- [`@ggds/icons`](https://www.npmjs.com/package/@ggds/icons): the icons, for use outside React
- [`@ggds/astro`](https://www.npmjs.com/package/@ggds/astro): the same page parts for Astro

## Contributing and support

Report problems and ask questions in [GitHub issues](https://github.com/ghana-gds/ggds/issues), and see
[Contribute](https://ghana-gds.github.io/ggds/contribute.html) and [Versions and support](https://ghana-gds.github.io/ggds/versions.html). Report security problems
privately: [security policy](https://github.com/ghana-gds/ggds/security/policy).

## Licence

Apache-2.0. The flag, the coat of arms and institutions' logos are not covered: see `LICENSE.md` in the package.
