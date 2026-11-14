# GGDS for WordPress

The [Ghana Government Design System](https://ghana-gds.github.io/ggds/) as a WordPress theme. Pages use GGDS's
own markup and styles, so a WordPress website looks and works like every other GGDS website: the government
banner, header, homepage hero, footer and tab bar, readable pages and news, search, and a "page not found" page.

**Documentation:** [ghana-gds.github.io/ggds](https://ghana-gds.github.io/ggds/) ·
[Versions and support](https://ghana-gds.github.io/ggds/versions.html)

- **Accessible**: every template passes the automated WCAG 2.2 AA checks (axe) at desktop and phone widths, in a
  real WordPress.
- **Secure by default**: the front end has no inline scripts or styles, so it runs under a strict Content Security
  Policy. Comments are off, and WordPress does not announce its version.
- **Fast**: about 40 KB of CSS and 4 KB of JavaScript, all served from your website. No fonts or other files to
  download.

Needs WordPress 6.5 or later and PHP 8.1 or later. A classic theme, so it works with the block editor for
content and gives GGDS full control of the page.

## Already have a WordPress website?

[GGDS Switch](ggds-switch/README.md) turns it into a GGDS one: it carries your pages, menus and logo over, cleans
page-builder layouts into plain, accessible pages, and can be undone. Upload `ggds-switch-<version>.zip` in Plugins,
then open **GGDS > Switch to GGDS**.

## Install

1. Download `ggds-wordpress-<version>.zip` from the
   [releases page](https://github.com/ghana-gds/ggds/releases).
2. In WordPress: **Appearance > Themes > Add New Theme > Upload Theme**, choose the zip, then **Activate**.

## Set up your website

1. **Settings > General**: the site title is your institution's full name. The tagline says what you do in one
   sentence; it shows at the top of the homepage.
2. **Appearance > Customise > GGDS**: your short name, your institution theme (its colour), your official address
   (such as `example.gov.gh`), the register of official websites, the homepage question, and your contact details for
   the footer.
3. **Appearance > Customise > Site identity**: your approved logo. Until you add one, a round badge shows your
   initials.
4. **Appearance > Menus**: four menus.

   | Menu location | What goes in it |
   |---|---|
   | Main sections | 3 to 6 main sections. They show in the header, on the homepage as cards (with each item's description), and the first three in the tab bar on phones |
   | Common tasks | Up to 6 things people most often come to do, such as "Make a complaint". They show under the homepage search |
   | Footer sections | Each section, with up to five of its most-used pages under it |
   | Footer links | Accessibility, Privacy, Disclaimer and Contact |

5. **Settings > Reading**: a static homepage, and a page for news (the posts page).

The banner says the website is official only when it is served from the official address you set. On any other
address, such as a test server, it says "This copy is not the official … website".

## Writing content

- Pages show breadcrumbs, the title, the page's excerpt as an introduction, the content, then cards for the pages
  under it.
- Posts are news and notices: their first category shows as a tag, with the date.
- Use headings in order (Heading 2, then Heading 3), and link text that makes sense on its own. See
  [Get started as a content designer](https://ghana-gds.github.io/ggds/get-started/content.html).
- Colours, font sizes and gradients are switched off in the editor: GGDS sets them, so every page keeps its
  contrast.

## Content Security Policy

Serve the front end with a strict policy, for example in your web server:

```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'self'
```

The admin area (`/wp-admin/`) needs a looser policy: WordPress's editor uses inline scripts. Apply the strict one
to the public pages only. Plugins can add inline scripts and styles: check each plugin's pages with your policy
before you use it. The theme removes the Customiser's "Additional CSS", which WordPress prints inline; put your own
CSS in a child theme's stylesheet instead.

## Develop

The theme is `packages/wordpress/ggds/`. `pnpm run build` copies the GGDS styles, themes, script and icons into
its `assets/` folder and sets its version. `pnpm run release` makes the zip.

`pnpm run test:wordpress` starts WordPress in Docker, creates an example website, and tests every template: axe at
desktop and phone widths, no inline scripts or styles under a strict policy, no sideways scrolling, and the same
header, banner, footer and tab bar markup as the documentation. Add `--keep`
(`node scripts/test-wordpress.mjs --keep`) to look at the site afterwards at http://localhost:8089.

## Licence

Apache-2.0. The flag, the coat of arms and institutions' logos are not covered: see `LICENSE.md`.
