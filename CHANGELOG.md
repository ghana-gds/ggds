# What's new

## Version 0.1.0 (draft, not yet released)

The first version of GGDS, taken from the shared MoCDTI agency platform and made to work for any government institution.

### Decided on 9 November 2026

- The default government blue palette is approved. The flag colours stay as placeholders until an official specification is published.
- NITA looks after GGDS. Version 1 will be NITA guidance, recommended for all government websites.
- The code is licensed under Apache-2.0, with a sign-off line on every contribution. The flag, the coat of arms and institutions' logos are not part of the licence.
- An accessibility auditor and Ghanaian disability organisations will test GGDS before version 1.0.

### Components

- 20 components in four groups: page structure, navigation, forms and content.
- New: tab bar, for quick links on phones.
- Header, hero, footer and cards match the shared platform's design: one-row header with the flag-colour line, woven flag band in the footer, institution cards with a line in each institution's colour.
- The phone menu pushes the page down instead of covering it, so keyboard users never land on content they cannot see.
- The error summary no longer scrolls the page around it when shown inside a frame.
- The hero can show a drawing beside the text (`ggds-hero--art`), with a shared animated drawing, `ggds-hero-art`. It moves only for people who have not asked for less motion.

### Getting GGDS

- Download: each release has `ggds-<version>.zip`, one `ggds` folder to copy into a website, with checksums (`SHA256SUMS`) and `integrity` values for every file (`integrity.json`). It needs no build tools and works under a strict Content Security Policy.
- npm: `@ggds/tokens`, `@ggds/themes`, `@ggds/css`, `@ggds/js` and `@ggds/astro` are published under the `@ggds` organisation, with provenance.
- Every stylesheet has a minified copy (`ggds.min.css` and so on). `ggds.min.css` is 6.9 KB with gzip, against 10.8 KB for `ggds.css`.

### Packages

- New: `@ggds/astro`, the page parts as Astro components (skip link, banner, header, hero, footer, tab bar).
- New: `ggds-django`, for Django and Django-based CMSs such as Wagtail: the page parts as template tags, a form renderer that turns any Django form into GGDS markup with an error summary and accessible errors, and the GGDS styles, themes and script as static files.
- New: `ggds_django.admin_theme` gives Django admin GGDS's colours, type, focus style and header, from the tokens and the institution's theme. Admin keeps its own layout.
- `@ggds/css` can be loaded in parts: `core.css`, then one file per component in `components/`.
- Four tokens added for the shared platform: spring easing, stagger, and the bottom sheet's radius and shadow.
- The shared MoCDTI agency platform now uses GGDS for its tokens and every component GGDS has: skip link, banner, header, hero, footer, tab bar, buttons, cards, notices, tags, form fields, radios, error summary, tables, accordions, rich text, breadcrumbs, pagination and tab links.
- `ggds-container` keeps clear of a phone's notch in landscape.

### Themes

- 12 ready-made institution themes, plus the default.
- `institutionCss('#rrggbb')` makes a theme from any colour that is dark enough to read on white.
- DPC now uses its logo blue `#1276bc` and GDNR its seal blue `#1848f0`. DPC's navy was almost the same as CSA's, and GDNR had NCA's colour, so their sites looked alike. Both colours still need the agencies' approval.

### Documentation

- Every component page now says when to use it, when not to, how to use it and what it does for accessibility, with do and don't examples and related components.
- Search, "On this page" lists, previous and next links, and a copy button on code.
- Get started explains how to use a local build, with a starter page to copy.
- The homepage drawing shows what GGDS is: a page put together from its parts, changing institution theme while links and buttons stay the same.
- The example sites show each agency's own animated drawing from the live platform (`pnpm run sync:scenes`).
- 12 example government websites, with an example page behind every link. Logos and contact details are left out until each institution confirms them.
