# GGDS Switch

Turns an existing WordPress website into a [GGDS](https://ghana-gds.github.io/ggds/) government website: the official
banner, a clear header and footer, a homepage built around what people come to do, and pages that are easy to read
on any phone. Your pages, posts, menus and logo come with you. Preview first; undo at any time.

Needs WordPress 6.5 or later and PHP 8.1 or later. The GGDS theme is inside the plugin: there is nothing else to
download.

## Switch a website

1. Back up the website (your host's backup, or a backup plugin). The switch can be undone, but a backup is the rule
   before any big change.
2. Download `ggds-switch-<version>.zip` from the [releases page](https://github.com/ghana-gds/ggds/releases), and
   upload it in **Plugins > Add New Plugin > Upload Plugin**. Activate it.
3. Activating it opens **GGDS > Switch to GGDS**, in its own place in the sidebar. Nothing changes until you press
   "Switch to GGDS". (Tidy up content first: see below.)
   1. **What we found**: the theme, pages made with a page builder, pages with their own colours, the logo, the
      homepage, widgets, comments, and plugins to check.
   2. **Your institution**: filled in from your website. Check the short name, official address (such as
      `nca.gov.gh`), colour and contact details. Made your website with the
      [GGDS website builder](https://ghana-gds.github.io/ggds/builder.html)? Load its `ggds-site.json` to fill these
      in.
   3. **Menus**: which of your menus goes in each GGDS place.
   4. **Preview**, then **Switch to GGDS**.
4. Afterwards the same screen lists what to do next, and each page to look at, with what to check.

Keep the page builder installed until you are happy with your pages, then deactivate it.

## What happens to your pages

The switch takes what visitors see on each page and keeps what carries meaning: headings, paragraphs, lists, links,
images, tables, quotes and embedded videos. It takes away what made the website heavy and hard to read:

- page-builder wrappers, columns and rows;
- inline styles, colours and fonts, so every page keeps GGDS's contrast;
- scripts, sliders and forms (each one is noted, so a person can put it back the right way).

It also puts headings in order under the page title, and gives lazy-loaded images their real address.

Pages built with Elementor, WPBakery, Divi, Beaver Builder, Avada, SiteOrigin, Oxygen or Brizy are rendered with
the builder's own code while it is installed. Shortcodes left by a builder that has been removed are unwrapped,
keeping their text, images and buttons. Other shortcodes, such as a contact form's, are left in place.

Every page keeps its original content and builder settings. **Undo the switch** puts back the old theme and every page
exactly as it was.

## Tidy up content

**GGDS > Tidy up content** takes off what should never be on a live government website. It works on any WordPress
website, switched to GGDS or not. Tidy up before you switch, so no sample pages come with you.

It finds:

- sample text, such as lorem ipsum;
- WordPress's own example post, page, comment and tagline ("Hello world!", "Sample Page", "Just another WordPress
  site");
- a theme's demonstration pages, such as "Home Version 4" or "Blog Grid";
- a page builder's example text, such as "Click edit button to change this text";
- published pages with nothing on them, or only headings;
- sample text in sidebar widgets.

For each one it says why it is listed, quoting the words, and where the page is used: the homepage, a menu (and
what is under it there), pages under it, and other pages that link to it.

What to do is chosen for you only where that is safe:

| Found | Chosen for you |
|---|---|
| WordPress's examples, a theme's demonstration pages | Move to the Bin |
| Your own page with sample text, or nothing on it | Unpublish (keep as a draft, to rewrite) |
| WordPress's example tagline | Clear it |
| "Coming soon", a page with no title, drafts, your privacy page, a page with others under it in a menu | Leave it: you decide |
| The homepage and the news page | They always stay: rewrite them |

Change any choice, then press the button. It says what it will do, such as "Unpublish 3 items and move 4 items to
the Bin".

**Nothing is deleted for good.** The message afterwards has an undo button, and every change stays in "Recent
changes", with who made it and its own undo. Pages moved to the Bin stay there for 30 days, then WordPress deletes
them; empty the Bin to delete them sooner. Only the status of a page changes: its content, dates and author are never
saved again. An unpublished page leaves the menus, and comes back to them on undo. A removed page's address answers
"410 Gone", so search engines drop it.

The dashboard and the lists of pages and posts say when there is something to tidy up. `@ggds/check` finds the same
things on the live website (`content.placeholder` and `content.wp-sample`), from the same list of phrases.

## Many websites

The same switch from WP-CLI:

```sh
wp ggds-switch scan                     # what is there, and what the switch proposes
wp ggds-switch show 42                  # page 42 as the switch would clean it
wp ggds-switch run --dry-run            # what would change; nothing is changed
wp ggds-switch run --short_name=NCA --official_host=nca.gov.gh --theme=nca
wp ggds-switch undo

wp ggds-switch tidy scan                # what GGDS > Tidy up content lists
wp ggds-switch tidy apply --dry-run     # what the suggested choices would do; nothing is changed
wp ggds-switch tidy apply               # do them
wp ggds-switch tidy undo                # undo the latest change (or: tidy undo <id>, from tidy log)
```

## Licence

Apache-2.0. The flag, the coat of arms and institutions' logos are not covered: see `LICENSE.md`.
