# Contributing to GGDS

GGDS is maintained by NITA as its custodian (decision D-02). Contributions from ministries, departments and
agencies, their suppliers, and the public are welcome. Everyone taking part follows the
[code of conduct](CODE_OF_CONDUCT.md).

How to report a problem, suggest a change or propose a new component, and how NITA decides, is on the
documentation website: [Contribute](https://ghana-gds.github.io/ggds/contribute.html). This file is for changing
the code.

- **Report a problem or propose something:** open an [issue](https://github.com/ghana-gds/ggds/issues/new/choose).
- **Security problem:** never in a public issue; see [SECURITY.md](SECURITY.md).
- **Small fixes** (a typo, a broken link, a wrong example): open a pull request directly.
- **Anything bigger** (a new component, option or token; a change to how a component looks or behaves): open an
  issue first, so effort is not wasted on something that will not be accepted.

## Sign off every commit (Developer Certificate of Origin)

GGDS uses the [Developer Certificate of Origin 1.1](https://developercertificate.org/) instead of a signed
contributor agreement (decision D-10). By adding a sign-off line to a commit, you certify that you wrote the
change, or otherwise have the right to submit it under the project's licence (Apache-2.0), and that you
understand the contribution is public.

Add the line with `git commit -s`. It must use your real name and an email address you can be reached at:

```
Signed-off-by: Ama Mensah <ama.mensah@example.gov.gh>
```

Commits without a sign-off cannot be merged. If you contribute as part of your job, check that your employer
allows it.

## Do not contribute

- Flag colours, the coat of arms or other national emblems as assets (see [`LICENSE.md`](LICENSE.md)).
- An agency's logo or name for use as a theme, unless the agency has approved it.
- Real personal data, or an institution's unconfirmed phone numbers, emails or addresses, in examples or tests.
  Use "Example Agency", `info@example.gov.gh` and `030 000 0000`.

## Set up

Node (the version in `.nvmrc`), pnpm, and for the Django package [uv](https://docs.astral.sh/uv/).

```sh
pnpm install
pnpm run build      # tokens → themes → css → js → django static files → documentation in site/
pnpm run serve      # http://localhost:4173, under the strict Content Security Policy
pnpm test           # build, Django tests, unit tests, then axe and behaviour tests at desktop and phone widths
```

## Where things are

| To change | Edit |
|---|---|
| A colour, size or other token | `packages/tokens/tokens.json` (and its `contrastPairs` for any new colour pair) |
| A component's styles | `packages/css/src/components/<name>.css` |
| A component's guidance | `packages/html/components/<name>/guidance.html` |
| A component's examples | `packages/html/components/<name>/examples/*.html` |
| A component's classes, states and tests table | `packages/html/components/<name>/component.json` |
| A pattern | `packages/html/patterns/<name>/` (same layout as a component) |
| A get-started guide | `docs/guides/<role>.html` |
| An about page (contribute, versions, accessibility) | `docs/pages/<name>.html` |
| The script | `packages/js/src/` (TypeScript) |
| Astro components | `packages/astro/src/` |
| Django template tags | `packages/django/src/ggds_django/` |
| GGDS's own text, and its translations | `packages/html/strings/en.json`, and `<code>.json` for each language |

## The rules every change must follow

The tests check most of these; a pull request that fails them cannot be merged.

- **Accessible:** WCAG 2.2 level AA in the automated checks (axe), at desktop and phone widths.
- **No JavaScript needed:** every component works without the script; JavaScript only improves it.
- **Strict Content Security Policy:** no inline scripts, inline styles or `style` attributes.
- **320px:** nothing scrolls sideways on a 320px screen, also with a wide font.
- **Tokens only:** no raw colours in component CSS, and media queries use only the breakpoints 48rem, 64rem and
  80rem or user preferences such as `prefers-reduced-motion`.
- **Cascade layers:** base styles in `ggds.base`, components in `ggds.components`. `!important` only in
  utilities; no raw `z-index` values.
- **Documented:** every class in the CSS is in its component's `component.json`, and every class there exists.
- **Same markup everywhere:** if you change a component's HTML, change its examples, its Astro component and its
  Django template too. The Django tests check that Django's output matches the documentation.
- **Plain English** in guidance: short sentences, British spelling, addressed to the website team. Say when to use
  it, when not to, how, and what websites need to do for accessibility.

## Translations

GGDS writes some text itself, such as "Skip to main content" and "There is a problem". The English is in
`packages/html/strings/en.json`; each language in `packages/html/strings/languages.json` has its own file with the
same keys, such as `tw.json` for Twi. `pnpm run build` makes the Django catalogues and the React and Astro modules
from them.

- **Only people who speak the language translate.** Do not add machine or AI translations unless a speaker has
  checked every one. Say in the pull request who translated and who checked.
- Translate the meaning for someone using a government service, not word for word. Keep it as plain as the English.
- Keep every `{placeholder}` exactly as it is; the build stops if a translation loses one or adds one.
- A key you leave out is shown in English, so a language can be translated a part at a time.
- When a speaker has checked a language's name and its translations, set `"checked": true` for it in
  `languages.json`.
- To add a language, add it to `languages.json` (an ISO 639 code, as in `<html lang>`) and add its file.
- A new or changed English text gets a new key, so no translation is left saying something else.

## Record your change

Add a line to `CHANGELOG.md` under "Unreleased", written for the people who use GGDS: what changed and what they
need to do. If it changes components, end the line with a marker so it also shows on their pages:

```md
- The phone menu closes when the screen grows wider. <!-- components: header -->
```

A change that needs websites to change their HTML or CSS is a breaking change: put it under "Changes you need to
make", and see [Versions and support](https://ghana-gds.github.io/ggds/versions.html).

## Releases

Maintainers release GGDS by pushing a version tag; see [docs/HANDOVER.md](docs/HANDOVER.md#release).
