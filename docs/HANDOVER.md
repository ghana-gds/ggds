# Handover: GGDS to NITA

For the team that takes over the Ghana Government Design System (GGDS). It says what GGDS is, where it stands,
how to build, test and release it, what has been decided, and what is still open. Written in November 2026, at
version 0.1.0 (draft).

## What GGDS is

Ready-made styles and page parts for Government of Ghana websites: design tokens, CSS, a small optional script,
the HTML for each component, and packages for Astro and Django. Every part works without JavaScript and under a
strict Content Security Policy, meets WCAG 2.2 AA in automated tests, and fits a 320px screen.

It was taken from the shared website platform MoCDTI built for the ministry and its 11 agencies, and made to work
for any government institution. NITA is its custodian (decision D-02).

## Where things are

| Path | What |
|---|---|
| `packages/tokens` | Design tokens (`tokens.json`) → CSS custom properties. `institution.mjs` makes a theme from an institution's colour and rejects colours too light to read. |
| `packages/themes` | Ready-made institution themes (MoCDTI is the default), from the platform's agency profiles |
| `packages/css` | All component styles, in cascade layers; also one file per component (`dist/components/`) |
| `packages/js` | The optional script: phone menu and error summary (TypeScript) |
| `packages/html` | The canonical HTML and guidance for each of the 23 components and the patterns; the documentation is built from it (not published) |
| `packages/astro` | `@ggds/astro`: the page parts as Astro components |
| `packages/django` | `ggds-django`: template tags, a form renderer and the static files, for Django and Wagtail |
| `packages/wordpress` | GGDS for WordPress: a classic theme (`ggds/`), its build, and a Docker set-up for its tests (`pnpm run test:wordpress`) |
| `docs/` | The documentation site builder (plain Node, no framework); output in `site/`. `docs/guides/` holds the get-started guides, `docs/pages/` the about pages (contribute, versions, accessibility statement) |
| `docs/scenes/` | The agencies' hero drawings, copied from the platform by `pnpm run sync:scenes` |
| `tests/` | Unit tests (Node) and browser tests (Playwright with axe, desktop and phone) |
| `scripts/` | Serve, release, npm publishing, scene sync, Django tests |
| `.github/workflows/` | CI on every push, then the documentation website to GitHub Pages from `main`; release on a version tag |
| `.github/ISSUE_TEMPLATE/` | Forms for problems, accessibility problems and proposals |
| `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md` | How to change the code, the code of conduct, how to report security problems privately |

## Build and test

Needs Node (version in `.nvmrc`), pnpm, and for the Django package [uv](https://docs.astral.sh/uv/).

```sh
pnpm install
pnpm run build    # tokens → themes → css → js → django static files → documentation in site/
pnpm run serve    # http://localhost:4173, under the strict Content Security Policy
pnpm test         # build, Django tests, unit tests, then axe and behaviour tests on every page
```

At handover, all of it passes: 26 Django tests, 34 unit tests and 488 browser tests.

What the tests guard:

- every page passes axe (WCAG 2.2 A and AA rules) at desktop and phone widths, with no Content Security Policy errors;
- every colour pair meets its contrast minimum (the build fails otherwise);
- component CSS uses tokens only, the agreed breakpoints and layers;
- the Django page parts output the same markup as the documentation (`packages/django/tests/test_parity.py`);
- the Django admin theme uses only tokens that exist (`packages/django/tests/test_admin.py`);
- no link in the documentation or the example sites leads to a missing page;
- the example sites publish no unconfirmed agency data (logos, phone numbers, emails) and are not indexed.

## Release

Set the same version in `packages/{tokens,themes,css,js,astro,html}/package.json`,
`packages/django/pyproject.toml` and `packages/django/src/ggds_django/__init__.py`, move the "Unreleased" changes
in `CHANGELOG.md` under the new version, then push a tag such as `v0.1.2`. The release workflow tests the build,
publishes the npm packages under `@ggds` with provenance and `ggds-django` to PyPI, and makes a GitHub release with
`ggds-<version>.zip` (the recommended way for government websites: self-hosted files, no build step). Follow
the rules on the [Versions and support](https://ghana-gds.github.io/ggds/versions.html) page for what each kind
of release may change.

The documentation website, [ghana-gds.github.io/ggds](https://ghana-gds.github.io/ggds/), is published from
`main` by the `docs` job in `ci.yml`, after every test passes. It is built without the platform, so it has no
example sites (see "Wording to approve" below). A `.gov.gh` address can replace it later (decision D-08).

Publishing:

- npm: done. `@ggds/tokens`, `@ggds/themes`, `@ggds/css`, `@ggds/js` and `@ggds/astro` are published from
  0.1.1, using an `NPM_TOKEN` secret. Move to trusted publishing on npmjs.com (workflow `release.yml`, environment
  `npm`) and delete the token: npm is restricting tokens that skip two-factor authentication.
- PyPI: `ggds-django` publishes from 0.2.0 by trusted publishing (project `ggds-django`, owner `ghana-gds`,
  repository `ggds`, workflow `release.yml`, environment `pypi`). No token is stored. 0.1.0 and 0.1.1 were never
  on PyPI.
- Security: private vulnerability reporting is on for the repository (`SECURITY.md`).

## Decisions

The full register is in the GGDS assessment (`docs/ggds-assessment/10-decision-register.md` in the platform).

Decided on 9 November 2026:

| ID | Decision |
|---|---|
| D-01 | The MoCDTI blue palette is the GGDS default. Flag colours appear only as thin lines and bands. System fonts. No coat of arms in v1. |
| D-02 | NITA is custodian. v1 is NITA guidance, recommended for government websites, moving to a gazetted standard after the pilot. |
| D-09 | An external accessibility auditor, together with Ghanaian disability organisations, tests GGDS before v1.0. |
| D-10 | Apache-2.0 for the code, with a sign-off line (DCO) on every commit. The flag, the coat of arms and institutions' logos are not covered. |

Still open, and what each blocks:

| ID | Open question | Blocks |
|---|---|---|
| D-01 (part) | An official specification of the flag colours: the values in `tokens.json` are placeholders | Final colours |
| D-03 | The banner's wording ("An official website of the Government of Ghana"), including for state-owned companies, and licensing the coat of arms under Act 61 | v1 banner |
| D-05 | NITA's "official graphic design template", if it exists: compare it with this palette | — |
| D-06 | Who keeps the register of official government websites that the banner tells people to check (`site/register.html` explains it does not exist yet) | Banner link |
| D-08 | Code hosting and CI. GitHub (`ghana-gds/ggds`) is in use; a government mirror is allowed | — |
| D-11 | Budget, including the accessibility audit (D-09) | v1.0 |
| D-12 | A GGDS contact address for people without a GitHub account: accessibility reports, code of conduct reports. The accessibility statement and code of conduct say one will be added | Accessibility statement |
| D-13 | Confirm the support commitments proposed on the Versions and support page and in `SECURITY.md`: 5 working days to reply, 6 months' notice before removing something, 12 months of fixes for the previous major version, monthly review of proposals | v1.0 |

Each institution still has to confirm its theme colour, logo and contact details. The approval tracker used for
the four decisions above also holds a sign-off item per institution theme.

## The MoCDTI platform

The platform (`agencies/platform`, a separate repository that is not on GitHub) runs the ministry's and the 11
agencies' websites on Astro with a Django and Wagtail CMS. In November 2026 it was moved onto GGDS: its tokens and
every component GGDS has (banner, header, hero, footer, tab bar, buttons, cards, notices, tags, forms, error
summary, tables, accordions, rich text, breadcrumbs, pagination and tab links). Its own end-to-end and
accessibility suites pass as before (204 passed, 32 need a live CMS). It links the GGDS packages from a local copy;
when GGDS is published it should depend on the published versions instead.

GGDS reads the platform in three places, from `GGDS_PLATFORM_DIR` (default `../agencies/platform`):

- `pnpm run sync:themes` refreshes the institution themes from the agency profiles (the build fails if they drift);
- `pnpm run sync:scenes` copies each agency's hero drawing, rendered by the platform's dev server;
- the documentation build makes the 12 example sites from the agencies' settings, and checks the menus against the
  platform's.

Without the platform, those steps are skipped and everything else builds and tests. CI cannot reach the platform,
so the example-site checks run on a developer's machine only.

[`PLATFORM-MIGRATION.md`](PLATFORM-MIGRATION.md) maps each GGDS component to the platform code it replaced.

## Known issues and next steps

- **Accessibility audit (D-09).** Automated tests find only part of the barriers people meet. The brief for the
  audit is ready: [`ACCESSIBILITY-AUDIT.md`](ACCESSIBILITY-AUDIT.md). Commission the audit
  with disabled users before calling anything v1.0.
- **Platform stylesheet size.** The platform's largest stylesheet was close to its 16 KB budget after the
  migration. Its remaining own components (search, filter sheet, steps, metadata lists) are candidates to become GGDS
  components if other sites need them.
- **Platform test.** One platform unit test (`agency-profile.test.ts`, NCA identity) expects NCA's logo without the
  small logo file the profile now has. It failed before GGDS work began; update the test.
- **Wording to approve.** The banner text (D-03) and the "Example only" notices on the example sites. Until the
  notices are approved, the published documentation leaves the example sites out (`EXAMPLES` in `docs/build.mjs`).
- **Example sites' drawings.** The agencies' hero drawings copied from the platform (`docs/scenes/`) still move
  without end, as on the live platform sites. Give them the same 5-second limit as `ggds-hero-art`, on the platform.
- **Figma library.** Not made yet: it needs the Figma connector authorised for a designer's Figma account. The
  tokens are in the W3C format (`packages/tokens/tokens.json`), which Figma variables plugins can import. Build the
  library from them and the components, in an organisation Figma team NITA owns.
- **Templates for other stacks.** Astro, Django and WordPress have packages; others copy the HTML from the
  documentation. Add packages where institutions need them.
