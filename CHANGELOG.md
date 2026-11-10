# What's new

## Unreleased

### Components

- New: summary list, for "Check your answers" pages and records: questions and answers, with Change links that say what they change. <!-- components: summary-list -->
- New: confirmation panel, for the end of a service: that it worked, and the reference number. <!-- components: panel -->
- New: date input, day, month and year boxes for dates people know, such as a date of birth. <!-- components: date-input -->
- New: `ggds-label--page`, for a question that is also the page's heading: `<h1><label class="ggds-label ggds-label--page">`. <!-- components: field -->
- New components start with the status "alpha": tested automatically, but not yet used on a live government website.
- The form patterns use the summary list on their check answers pages and the confirmation panel on their confirmation pages. Their examples use obviously fake phone numbers and references.

### Accessibility

- The hero drawing (`ggds-hero-art`) and the documentation's homepage drawing now stop moving within 5 seconds of loading, so they meet WCAG 2.2.2 (Pause, Stop, Hide) without a pause button. Tests check that nothing animates for ever and time it in the browser. <!-- components: hero -->
- A brief for the external accessibility audit (D-09): [docs/ACCESSIBILITY-AUDIT.md](https://github.com/ghana-gds/ggds/blob/main/docs/ACCESSIBILITY-AUDIT.md).

### Patterns

- New patterns for questions Ghanaian services ask most: a Ghana Card number, a phone number (including a mobile money number and network), and an address with a GhanaPostGPS digital address.

### Packages

- New: **GGDS for WordPress**, a theme with GGDS's own markup: banner, header, homepage hero with search and common tasks, cards, footer, tab bar, pages with breadcrumbs, news, search with pagination, and "page not found". Its front end has no inline scripts or styles, so it runs under a strict Content Security Policy; editors cannot set colours or font sizes that would break contrast; comments are off. Each release has `ggds-wordpress-<version>.zip`. Every template is tested in a real WordPress (Docker): axe at desktop and phone widths, a strict policy, no sideways scrolling, and the same header, banner, footer and tab bar markup as the documentation.
- `ggds-django`: `GGDSDateField` renders as a date input with `GGDSFormRenderer`. It accepts 3, 03, March or Mar for the month, gives GGDS's error messages, marks only the boxes with the problem, and links the error summary to the first of them. New template tags: `{% ggds_summary_list rows %}` and `{% ggds_panel "Complaint sent" reference=ref %}`.
- `@ggds/css`: `components/summary-list.css`, `components/panel.css` and `components/date-input.css`.
- A colour pair is checked for the panel: white text on the success green.

### Documentation

- Get started has a guide for each role: developers, designers, content designers and service owners, with GGDS's principles. The developers' guide leads with installing from npm, now that the packages are published, and shows the download and a CDN for trying it out.
- Patterns: whole tasks put together from components, with live examples: asking for information with a form, helping people find what they came for, and search results.
- Every component page now has: what GGDS does for accessibility and what you need to do; a "Use it" section with its stylesheet and size, any script, and its Astro and Django versions; a table of its classes and states; its accessibility tests, automated and by people; and its changes.
- New examples show the states of buttons, text inputs, radios and checkboxes, and disclosures, including focus.
- Every page links to report a problem, and guidance pages to suggest a change on GitHub.
- The documentation is published at [ghana-gds.github.io/ggds](https://ghana-gds.github.io/ggds/), from `main` after every test has passed. The example sites are left out of the published copy until the wording that marks them as examples is approved.
- More patterns: helping people contact you, making a complaint, publishing notices and documents, and pages for "page not found" and errors.
- Foundations now cover spacing, layout and breakpoints, sizes and touch targets, focus, corners and shadows, motion, layers and icons, with every token's value.
- Fuller guidance for tags, breadcrumbs, disclosures, the skip link, pagination, rich text, tables and tab links. <!-- components: tag, breadcrumbs, disclosure, skip-link, pagination, prose, table, tab-links -->
- New pages: an accessibility statement for GGDS, with what is not tested yet; how to contribute and how NITA decides on new components; and versions and support: what each kind of release can change, how things are removed, and how long a version is supported.
- The repository has a code of conduct, a security policy with private reporting, forms for reporting problems and proposing components, and a pull request checklist.

## Version 0.1.1 (draft, 10 November 2026)

Documentation only: no change to the styles, the script or the components.

- Each npm package's page now explains, with examples, how to install and use it and what it contains: every file and export, the Astro components' props and slots, the script's behaviour, accessibility, browser support and the related packages.
- The npm packages name their authors, link to their own folder in the repository, and describe themselves more clearly in npm search. `@ggds/css` has a `style` field, and `@ggds/astro` exports its `package.json`.

## Version 0.1.0 (draft, 10 November 2026)

The first version of GGDS, taken from the shared MoCDTI agency platform and made to work for any government institution.

### Decided on 9 November 2026

- The default government blue palette is approved. The flag colours stay as placeholders until an official specification is published.
- NITA looks after GGDS. Version 1 will be NITA guidance, recommended for all government websites.
- The code is licensed under Apache-2.0, with a sign-off line on every contribution. The flag, the coat of arms and institutions' logos are not part of the licence.
- An accessibility auditor and Ghanaian disability organisations will test GGDS before version 1.0.

### Components

- 20 components in four groups: page structure, navigation, forms and content.
- New: tab bar, for quick links on phones. <!-- components: tab-bar -->
- Header, hero, footer and cards match the shared platform's design: one-row header with the flag-colour line, woven flag band in the footer, institution cards with a line in each institution's colour. <!-- components: header, hero, footer, card -->
- The phone menu pushes the page down instead of covering it, so keyboard users never land on content they cannot see. <!-- components: header -->
- The error summary no longer scrolls the page around it when shown inside a frame. <!-- components: error-summary -->
- The hero can show a drawing beside the text (`ggds-hero--art`), with a shared animated drawing, `ggds-hero-art`. It moves only for people who have not asked for less motion. <!-- components: hero -->

### Getting GGDS

- Download: each release has `ggds-<version>.zip`, one `ggds` folder to copy into a website, with checksums (`SHA256SUMS`) and `integrity` values for every file (`integrity.json`). It needs no build tools and works under a strict Content Security Policy.
- npm: `@ggds/tokens`, `@ggds/themes`, `@ggds/css`, `@ggds/js` and `@ggds/astro` are published under the `@ggds` organisation, with provenance.
- Every stylesheet has a minified copy (`ggds.min.css` and so on). `ggds.min.css` is 6.9 KB with gzip, against 10.8 KB for `ggds.css`.

### Packages

- New: `@ggds/astro`, the page parts as Astro components (skip link, banner, header, hero, footer, tab bar). <!-- components: skip-link, banner, header, hero, footer, tab-bar -->
- New: `ggds_django.admin_theme` gives Django admin GGDS's colours, type, focus style and header, from the tokens and the institution's theme. Admin keeps its own layout.
- New: `ggds-django`, for Django and Django-based CMSs such as Wagtail: the page parts as template tags, a form renderer that turns any Django form into GGDS markup with an error summary and accessible errors, and the GGDS styles, themes and script as static files. <!-- components: skip-link, banner, header, hero, breadcrumbs, pagination, footer, tab-bar, field, choices, error-summary -->
- `@ggds/css` can be loaded in parts: `core.css`, then one file per component in `components/`.
- Four tokens added for the shared platform: spring easing, stagger, and the bottom sheet's radius and shadow.
- The shared MoCDTI agency platform now uses GGDS for its tokens and every component GGDS has: skip link, banner, header, hero, footer, tab bar, buttons, cards, notices, tags, form fields, radios, error summary, tables, accordions, rich text, breadcrumbs, pagination and tab links.
- `ggds-container` keeps clear of a phone's notch in landscape. <!-- components: page -->

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
