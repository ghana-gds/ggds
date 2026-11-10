# What's new

## Version 0.3.0 (draft, 10 November 2026)

### Documentation

- The status “beta” now means a component works, is tested and is ready to use on government websites (it said “already used on government websites”, which is not yet true while the new websites are being built).
- A new README, with pictures drawn from GGDS itself (its own icons, the institution colours, and the real number of components and size of the files), the showcase, the agency website starter, and how to start with any framework. `pnpm run readme:art` redraws the pictures when GGDS changes.
- New: an agency website starter to download (`ggds-agency-starter-<version>.zip`, on the showcase page, the homepage and every GitHub release). It is a complete website for a made-up institution, with 20 pages: a homepage, services, a licence application from start page to confirmation, fees, a complaint form, news, publications, jobs and tenders, about and contact with a message form, search, page not found, an accessibility statement and privacy. Forms check their answers the GGDS way, and search works as you type, with no server. It is plain HTML with GGDS and every theme, works under a strict Content Security Policy, and comes with a README on making it your own and going live. The live preview in the documentation has a bar back to the documentation; the download does not.
- New: the [showcase](https://ghana-gds.github.io/ggds/showcase/index.html), what you can build with GGDS, starting with what institutions build most often: an online service (start page, questions, check your answers, confirmation), paying a fee by mobile money with a receipt, tracking an application, booking an appointment on a phone, checking a licence in a public register, a personal account, a staff tool with the page where an officer decides, and jobs and tenders. Open data and an emergency warning are further examples. Each is its own made-up organisation with its own colour and several pages that work by clicking; each lists the GGDS components and patterns it is built from, what a team still builds behind it, and the HTML of every page to copy. On the homepage, pointing at an example scrolls through its whole page.
- Code stands out: every code block is a dark panel with syntax colours, a bar naming its language (HTML, CSS, JavaScript, Terminal, Python, Django template, Astro) and its Copy button. The colours are added when the site is built, with no script, and each has at least 4.5:1 contrast. Code in sentences is a tinted chip.
- Easier to find your way: breadcrumbs on every inner page, a menu of all patterns beside each pattern, and clearer example links ("Open this example on its own page", "HTML code for …").
- The documentation's cards have icons from GGDS's own icon set: the homepage, Get started, every component and every pattern.
- "Find your setup" in the developers' guide shows each framework's own logo in its colours (from Simple Icons, credited on the page; the logos stay on the documentation website and are not part of GGDS).
- Get started for any stack: the developers' guide shows where the styles, theme and script go in React, Next.js, Vue and Nuxt, Svelte and SvelteKit, Angular, Astro, Django, WordPress, Laravel, PHP and other server-rendered websites.
- The tutorial teaches the ready-made themes: what a theme changes, every theme with its colour, how to add one from the CDN, the download or npm, a live preview, and how to make one for an institution without a theme yet.
- New: a [tutorial](https://ghana-gds.github.io/ggds/get-started/tutorial.html) that sets GGDS up from a CDN, the download or npm, then builds a government page and a sign-in page that shows errors the GGDS way, with a security checklist. Every page in it is a live, tested example.
- "What you can build" on the homepage shows the showcase, not the agency example sites. The MoCDTI and agency example sites are no longer published, until the real sites go live: MoCDTI and its agencies stay as themes, and every template can be seen in their colours. `GGDS_AGENCY_SITES=1 pnpm run build:docs` still builds the example sites.
- The homepage drawing shows what GGDS is, read from the bottom up: foundations (colours, type, icons, spacing, WCAG 2.2 AA), the components built on them, and a government service built from those, on a computer and a phone. It no longer cycles through theme colours. Every part links to its documentation; pointing at it or tabbing to it says what it is and rings where it is used in the service, with no JavaScript. Solid arrows marked "build" draw themselves between the layers, and a light carries the message up from the foundations through the components to the service, lighting each layer as it arrives. It is all still within 4.5 seconds, and none of it moves for people who have asked for less motion.
- Get started is easier to follow: the developers' guide is four numbered steps, and both pages link to where GGDS is published: npm, PyPI, GitHub releases and the GitHub repository.
- The developers' guide puts the quickest way first. It opens with "Try it in one minute": a complete page to save and open that loads GGDS from the jsDelivr CDN, with nothing to install. The ways to add GGDS are ordered quickest first (CDN, download, WordPress, Django, npm), each shows the two lines to put in a page, and the theme step shows the line for the CDN, the download and npm. For a CDN on a live website, it shows where to find the `integrity` values.
- The guidance and code examples no longer name a particular institution: they use "Example Agency" and `<theme>`, so they read the same for every institution.
- The homepage explains what GGDS is, who it is for, whether you have to use it, what it costs and who maintains it, shows screenshots of example sites, and leads with what GGDS does for the people who use government websites.
- The documentation is easier to use on a phone: a component's page starts with the component, not the list of all components; "On this page" comes after the heading on every page and takes one line until opened; the draft notice is one line; the role tabs wrap instead of scrolling; and every page ends with "Back to top".

### React

- New package: `@ggds/react`, GGDS as React components: the page parts (skip link, banner, header, hero, footer, tab bar, breadcrumbs), form fields with their labels, hints and errors wired up for screen readers (text input, textarea, select, radios, checkboxes, error summary), buttons, notices, tags, cards and icons. They render exactly the HTML the documentation tests, checked element by element on every change, and work in Next.js: only the header and the error summary run in the browser.
- Every HTML example in the documentation has a JSX version: switch any code block to **JSX (React)** and the choice is remembered. Every JSX snippet is checked to parse, and every React example to type-check.
- A live example form built with `@ggds/react`, tested for accessibility and behaviour like every other page.

### Icons

- New package: `@ggds/icons`, GGDS's own set of 143 line icons for government services, in 9 categories: navigation, actions, status, people and accounts (including the Ghana Card and passport), communication, documents, money (including the cedi), government, and public services from health and education to farming, fisheries, energy and transport. All are drawn on one 24px grid with a 2px line, so they look like a set.
- Each icon comes as a standalone SVG file, in a sprite, as a JavaScript export (only the icons you import are bundled; about 90 bytes each), and in JSON. Designers get every icon on one labelled sheet, as named layers to import into Figma.
- The build checks every drawing against the icon rules (frame, grid, line, no colours or fills) and stops with the reason if one breaks them.
- The documentation has an [icons page](https://ghana-gds.github.io/ggds/icons.html) with every icon, a search by name or meaning, downloads, and the rules for drawing new ones.
- The GGDS download has the icons in `ggds/icons/`. Django, WordPress and Astro have every icon: `{% ggds_icon "name" %}`, `ggds_icon( 'name' )` and `icon('name')`.
- `@ggds/astro/icons.mjs` now comes from `@ggds/icons`, and `icon()` throws for a name that does not exist instead of drawing the services icon.

### Components

- New: page heading, the top of an inner page in the institution's colour, with the page's `<h1>`, for an account's welcome or a service's start; `ggds-page-heading--danger` for a warning in force. <!-- components: page-heading -->
- New: key figures, the 2 to 4 numbers that matter most on a page, each with what it measures and how it has changed, in words. `ggds-key-figure--danger` for one that needs action, `ggds-key-figures--inverse` on a page heading. <!-- components: key-figures -->
- New: progress, "Question 3 of 4" in words and as a native `<progress>`, so it needs no style attributes. <!-- components: progress -->
- New: timeline, what has happened and what happens next, such as an application's stages; each stage says "Done", "Now" or "Next" to screen readers. <!-- components: timeline -->
- New: meter, an amount as a bar in a table, so a table is also a chart; a native `<meter>`, hidden from screen readers because the number is next to it. <!-- components: meter -->
- New: steps, 3 to 6 numbered things to do, each with an icon; `ggds-steps--urgent` for an emergency. <!-- components: steps -->
- These six came from the showcase, which drew them by hand; they are tested like every other component, and `ggds-django` has a tag for each: `ggds_page_heading`, `ggds_key_figures`, `ggds_progress`, `ggds_timeline`, `ggds_meter` and `ggds_steps`. `ggds.css` grows from 7.6 KB to 8.3 KB minified and gzipped; load only the components you use to keep it smaller.
- New: icon, `ggds-icon` with sizes `ggds-icon--sm`, `--lg` and `--xl`, and `ggds-with-icon` to put an icon and its words side by side. <!-- components: icon -->
- Card: new `ggds-card--icon`, a card with a GGDS icon in a circle tinted with the institution colour, for pages of services or topics; beside the title on phones, above it on wider screens. The documentation's cards use it. <!-- components: card -->
- Table: hidden text for screen readers in a cell (such as “, EX-PA-T-2026-031” after a link) no longer makes a narrow page scroll sideways. <!-- components: table -->
- Card grid: space below it, so the next section's heading is not cramped. <!-- components: card -->
- Button group: space below it, like a form field, so a heading or text after the buttons is not cramped. <!-- components: button -->
- Tab bar: labels are 12px instead of 11.2px, easier to read on a phone. <!-- components: tab-bar -->

## Version 0.2.0 (draft, 10 November 2026)

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

- `ggds-django` is on PyPI: `pip install ggds-django`. Earlier versions were only installable from the repository.
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

The first version of GGDS, a design system for any Government of Ghana institution, built on WCAG 2.2 and on patterns proven by established government design systems.

### Decided on 9 November 2026

- The default government blue palette is approved. The flag colours stay as placeholders until an official specification is published.
- NITA looks after GGDS. Version 1 will be NITA guidance, recommended for all government websites.
- The code is licensed under Apache-2.0, with a sign-off line on every contribution. The flag, the coat of arms and institutions' logos are not part of the licence.
- An accessibility auditor and Ghanaian disability organisations will test GGDS before version 1.0.

### Components

- 20 components in four groups: page structure, navigation, forms and content.
- New: tab bar, for quick links on phones. <!-- components: tab-bar -->
- Header, hero, footer and cards share one design: one-row header with the flag-colour line, woven flag band in the footer, institution cards with a line in each institution's colour. <!-- components: header, hero, footer, card -->
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
- Four tokens added: spring easing, stagger, and the bottom sheet's radius and shadow.
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
- The example sites show each institution's own animated drawing (`pnpm run sync:scenes`).
- 12 example government websites, with an example page behind every link. Logos and contact details are left out until each institution confirms them.
