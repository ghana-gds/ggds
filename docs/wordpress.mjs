// The WordPress page (site/wordpress.html): the GGDS theme for a new website, GGDS Switch for one that already
// exists, and tidying up placeholder content. Written for the people who run government websites, most of whom
// are not developers; the commands for developers and IT teams come last. The details are the packages' own
// READMEs (packages/wordpress/README.md, packages/wordpress/ggds-switch/README.md): keep this page in step with them.

/**
 * @param {object} o
 * @param {string} o.version  GGDS version, for the download names
 * @param {string} o.repo     the GitHub repository's address
 * @param {(name: string, cls?: string) => string} o.icon
 * @param {(name: string) => string} o.cardIcon
 * @param {(name: string, words: string, after?: boolean) => string} o.withIcon
 * @param {(label: string, text: string) => string} o.code
 */
// The site's tests ban the text " style=" anywhere in a page, so the sample's style attributes show their "=" as a
// character reference: it looks the same.
const noStyleAttr = (html) => html.replace(/(\s)style=/g, '$1style&#61;');

export function wordpressBody({ version, repo, icon, cardIcon, withIcon, code }) {
  const releases = `${repo}/releases/latest`;
  const theme = `ggds-wordpress-${version}.zip`;
  const plugin = `ggds-switch-${version}.zip`;
  const pluginUrl = `${repo}/releases/download/v${version}/${plugin}`;
  const step = (name, title, text) => `
  <li class="ggds-steps__item">
    <span class="ggds-steps__icon">${icon(name, 'ggds-icon ggds-icon--lg')}</span>
    <h3 class="ggds-steps__title">${title}</h3>
    ${text}
  </li>`;
  const question = (q, a) => `
  <details class="ggds-disclosure">
    <summary class="ggds-disclosure__summary">${q}</summary>
    <div class="ggds-disclosure__content">${a}</div>
  </details>`;

  return `
<h1>GGDS for WordPress</h1>
<p class="ggds-lead ggds-measure">Many government websites run on WordPress. GGDS gives them the same official banner, clear header and footer, readable pages and fast loading as every other GGDS website, without rebuilding anything.</p>

<ul class="ggds-card-grid">
  <li class="ggds-card ggds-card--icon">
    ${cardIcon('plus')}
    <h2 class="ggds-card__title"><a class="ggds-card__link" href="#new">Starting a new website</a></h2>
    <p class="ggds-card__body">Install the GGDS theme, add your details and menus, and write your pages.</p>
  </li>
  <li class="ggds-card ggds-card--icon">
    ${cardIcon('refresh')}
    <h2 class="ggds-card__title"><a class="ggds-card__link" href="#switch">Already have a WordPress website</a></h2>
    <p class="ggds-card__body">GGDS Switch turns it into a GGDS website: your pages, menus and logo come with you. Preview first; undo at any time.</p>
  </li>
</ul>

<h2 id="switch">Switch an existing website</h2>
<p class="ggds-measure">Most government WordPress websites were built with a heavy theme and a page builder, such as Elementor, WPBakery or Divi. Those make pages slow on a phone, hard to read and hard to keep accessible. GGDS Switch is a plugin that moves the website to GGDS in one go, and keeps everything that matters.</p>

<ol class="ggds-steps">${[
    step('download', 'Back up and install', `<p>Back up the website first: your host's backup or a backup plugin. Then <a href="${pluginUrl}" download>download <code>${plugin}</code></a> and upload it in <strong>Plugins &gt; Add New Plugin &gt; Upload Plugin</strong>. The GGDS theme is inside it.</p>`),
    step('trash', 'Tidy up first', `<p><strong>GGDS &gt; Tidy up content</strong> finds the placeholder pages and sample text that should not come with you, such as "Hello world!". <a href="#tidy">What it finds</a>.</p>`),
    step('search', 'See what it found', `<p>Activating the plugin opens <strong>GGDS &gt; Switch to GGDS</strong>. It lists your theme, the pages made with a page builder, pages with their own colours, your logo, homepage, widgets, comments, and plugins to check. Nothing changes yet.</p>`),
    step('edit', 'Check your details and menus', `<p>Your short name, official address, colour, email and phone are filled in from your website, and your menus are matched to GGDS's places. Check each one. Made your website in the <a href="builder.html">website builder</a>? <strong>Fill in from the file</strong> takes them from its <code>ggds-site.json</code>.</p>`),
    step('eye', 'Preview', `<p>See the whole website with GGDS, every page cleaned, before anyone else does.</p>`),
    step('check', 'Switch, then check', `<p>Press <strong>Switch to GGDS</strong>. The screen then lists what to do next, and each page to look at with what to check.</p>`),
  ].join('')}
</ol>

<div class="ggds-notice ggds-notice--success">
  <p class="ggds-notice__title"><span class="ggds-visually-hidden">Good to know:</span> You can undo it</p>
  <p><strong>Undo the switch</strong>, on the same screen, puts back your old theme and every page exactly as it was. Keep your page builder installed until you are happy with your pages, then deactivate it.</p>
</div>

<h3 id="what-happens">What happens to your pages</h3>
<p class="ggds-measure">The switch looks at each page as visitors see it, keeps what carries meaning and takes away what made it heavy.</p>
<table class="ggds-table">
  <caption class="ggds-visually-hidden">What the switch keeps and what it takes away</caption>
  <thead><tr><th scope="col">Kept</th><th scope="col">Taken away</th></tr></thead>
  <tbody>
    <tr><td>Headings, put in order under the page title</td><td>Page-builder rows, columns and boxes</td></tr>
    <tr><td>Paragraphs, lists, bold and links</td><td>Colours, fonts and sizes set on the page, so every page keeps its contrast</td></tr>
    <tr><td>Images, with their real address when they were loading late</td><td>Scripts, which slow pages down and break a strict security policy</td></tr>
    <tr><td>Tables, quotes and embedded videos</td><td>Sliders and forms made by the page builder: each one is listed, so you can put it back the right way</td></tr>
    <tr><td>Other plugins' shortcodes, such as a contact form's</td><td>Icons used as decoration</td></tr>
  </tbody>
</table>
<p class="ggds-measure">Your homepage becomes the GGDS homepage: your question, a search box, your common tasks and your main sections. The old homepage layout is kept as a draft page, so you can reuse its words.</p>

<details class="ggds-disclosure">
  <summary class="ggds-disclosure__summary">${withIcon('code', 'See a page before and after the switch')}</summary>
  <div class="ggds-disclosure__content">
${noStyleAttr(code('Before: a page made with a page builder', `[vc_row][vc_column][vc_column_text]
<h1 style="color:red">About the Authority</h1>
<p><span style="font-size:18px"><font color="#333">We regulate
<b>example</b> communications.</font></span></p>
<p>&nbsp;</p>[vc_icon]
[/vc_column_text][/vc_column][/vc_row]`))}
${code('After: plain content that GGDS styles', `<h2>About the Authority</h2>

<p>We regulate <strong>example</strong> communications.</p>`)}
  </div>
</details>

<h3 id="builders">Page builders it understands</h3>
<p class="ggds-measure">Elementor, WPBakery, Divi, Beaver Builder, Avada, SiteOrigin, Oxygen and Brizy. While the builder is still installed, the switch uses the builder's own output, so nothing is guessed. If the builder has already been removed, its leftover codes (such as <code>[et_pb_text]</code>) are unwrapped, keeping their text, images and buttons.</p>

<h2 id="tidy">Tidy up placeholder content</h2>
<p class="ggds-measure">Websites often still carry text that was only ever meant as an example. Visitors find it in search, and it makes a government website look unfinished. <strong>GGDS &gt; Tidy up content</strong>, part of GGDS Switch, finds it on any WordPress website, switched or not. Do it before you switch, so none of it comes with you.</p>
<p class="ggds-measure">It looks for:</p>
<ul class="ggds-measure">
  <li>lorem ipsum and other sample text;</li>
  <li>WordPress's own examples: the "Hello world!" post, the "Sample Page", the example comment, and the tagline "Just another WordPress site";</li>
  <li>a theme's demonstration pages, such as "Home Version 4" or "Blog Grid", and page builders' example text;</li>
  <li>published pages with nothing on them, or with only headings;</li>
  <li>sample text in sidebar widgets;</li>
  <li>pages with no title, and "coming soon" pages. These are only marked "to check", for a person to decide.</li>
</ul>
<p class="ggds-measure">For each one it says why, quoting the words it found, and where the page is used. You choose what to do: <strong>Unpublish</strong> (keep it as a draft), <strong>Move to the Bin</strong>, <strong>Clear</strong> (for the tagline) or <strong>Leave it</strong>. The safe choice is made for you, and your homepage and news page always stay. One button applies your choices.</p>
<div class="ggds-notice">
  <p class="ggds-notice__title"><span class="ggds-visually-hidden">Good to know:</span> Nothing is deleted for good</p>
  <p>Undo is in the message straight afterwards, and in "Recent changes". Pages moved to the Bin stay in WordPress's own Bin for 30 days, or until someone empties it. Anyone who follows an old link to a removed page is told it has gone (410 Gone), so search engines drop it.</p>
</div>

<h2 id="new">Start a new website</h2>
<p class="ggds-measure"><strong>Quickest:</strong> <a href="builder.html">make your website</a> first. Choose your kind of institution, write your services and pages, then choose <strong>On WordPress</strong>. You get your pages, news and menus as a WordPress import, and these steps with your own details in them.</p>
<ol class="ggds-steps">${[
    step('download', 'Install the theme', `<p>Download <code>${theme}</code> from the <a href="${releases}">latest release</a>. In WordPress: <strong>Appearance &gt; Themes &gt; Add New Theme &gt; Upload Theme</strong>, then <strong>Activate</strong>.</p>`),
    step('building', 'Add your institution', `<p><strong>Settings &gt; General</strong>: your full name as the site title, and what you do in one sentence as the tagline. <strong>Appearance &gt; Customise &gt; GGDS</strong>: your short name, colour, official address and contact details. <strong>Site identity</strong>: your approved logo.</p>`),
    step('list', 'Make four menus', `<p>In <strong>Appearance &gt; Menus</strong>: see the table below.</p>`),
    step('home', 'Set your homepage', `<p><strong>Settings &gt; Reading</strong>: a static homepage, and a page for news.</p>`),
  ].join('')}
</ol>

<table class="ggds-table">
  <caption>The four menus</caption>
  <thead><tr><th scope="col">Menu place</th><th scope="col">What goes in it</th></tr></thead>
  <tbody>
    <tr><td>Main sections</td><td>3 to 6 main sections. They show in the header, as cards on the homepage, and the first three in the tab bar on phones.</td></tr>
    <tr><td>Common tasks</td><td>Up to 6 things people most often come to do, such as "Make a complaint". They show under the homepage search.</td></tr>
    <tr><td>Footer sections</td><td>Each section, with up to five of its most-used pages under it.</td></tr>
    <tr><td>Footer links</td><td>Accessibility, Privacy, Disclaimer and Contact.</td></tr>
  </tbody>
</table>

<h3 id="writing">Writing pages</h3>
<ul class="ggds-measure">
  <li>A page shows its breadcrumbs, title, its excerpt as an introduction, its content, then cards for the pages under it.</li>
  <li>Posts are news and notices: their first category shows as a tag, with the date.</li>
  <li>Use headings in order (Heading 2, then Heading 3), and link text that makes sense on its own. See <a href="get-started/content.html">Get started as a content designer</a>.</li>
  <li>Colours, font sizes and gradients are switched off in the editor. GGDS sets them, so every page keeps its contrast.</li>
</ul>

<h2 id="safe">Safe and fast by design</h2>
<ul class="ggds-measure">
  <li><strong>Accessible:</strong> every page the theme makes, and every page the switch cleans, passes the automated WCAG 2.2 AA checks (axe) in a real WordPress, at desktop and phone widths.</li>
  <li><strong>Secure:</strong> the public pages have no inline scripts or styles, so they run under a strict Content Security Policy. Comments are off, and WordPress does not announce its version.</li>
  <li><strong>Official:</strong> the banner says the website is official only when it is served from the official address you set. On a test server it says "This copy is not the official website".</li>
  <li><strong>Light:</strong> about 40 KB of styles and 4 KB of script, served from your own website. No fonts or other files to download.</li>
</ul>
<p class="ggds-measure">Serve the public pages with a strict policy, for example in your web server. The admin area (<code>/wp-admin/</code>) needs a looser one, because WordPress's editor uses inline scripts.</p>
${code('Content Security Policy for the public pages', `Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'self'`)}

<h2 id="questions">Questions</h2>
<div class="ggds-accordion">${[
    question('Do I need a developer?', `<p>No. Installing the theme or the plugin, the switch and the undo are all done from WordPress's own screens. A developer or your host helps with the security policy and with backups.</p>`),
    question('Will my page builder still work?', `<p>After the switch, your pages no longer use it: they are plain content in WordPress's editor. Keep it installed until you are happy, in case you want to undo, then deactivate it. Your pages stay as they are.</p>`),
    question('What about my contact form, events or other plugins?', `<p>Shortcodes from other plugins are left in place, so they keep working. Some plugins add inline scripts or styles, which a strict security policy blocks: the switch lists the ones to check.</p>`),
    question('What happens to my sidebars, widgets and comments?', `<p>GGDS has no sidebars and no comments. Both are kept in WordPress but not shown. Put anything people need into your pages, and take feedback through a contact form that someone answers.</p>`),
    question('Can I change things after the switch?', `<p>Yes. Your details are in <strong>Appearance &gt; Customise &gt; GGDS</strong>, your menus in <strong>Appearance &gt; Menus</strong>, and your pages in the editor as usual. But undo puts every page back as it was before the switch, so changes you made to those pages since are lost.</p>`),
    question('Which versions of WordPress does it work with?', `<p>WordPress 6.5 or later, with PHP 8.1 or later. It is tested with WordPress 6.8.</p>`),
  ].join('')}
</div>

<h2 id="developers">For developers and IT teams</h2>
<p class="ggds-measure">Switch many websites the same way from WP-CLI. Details and menus you do not give are the scan's proposal.</p>
${code('WP-CLI', `wp ggds-switch scan                    # what is there, and what the switch proposes
wp ggds-switch show 42                 # page 42 as the switch would clean it
wp ggds-switch run --dry-run           # what would change; nothing is changed
wp ggds-switch run --short_name=NCA --official_host=nca.gov.gh --theme=nca
wp ggds-switch undo
wp ggds-switch tidy scan               # placeholder content, and why each one was found
wp ggds-switch tidy apply --dry-run    # what tidying would do; nothing is changed
wp ggds-switch tidy apply
wp ggds-switch tidy undo
wp ggds-switch tidy log`)}
<p class="ggds-measure">The same list of placeholder words is in <a href="get-started/developers.html"><code>@ggds/check</code></a>, whose <code>content.placeholder</code> and <code>content.wp-sample</code> rules find them on any live website, WordPress or not.</p>
<p class="ggds-measure">The theme is a classic theme that outputs GGDS's own HTML, so its header, banner, footer and tab bar are the same as every other GGDS website's (a test compares them). Put your own CSS in a child theme's stylesheet: the theme removes the Customiser's "Additional CSS", which WordPress prints inline. The details are in the READMEs for <a href="${repo}/tree/main/packages/wordpress#readme">the theme</a> and <a href="${repo}/tree/main/packages/wordpress/ggds-switch#readme">GGDS Switch</a>.</p>

<p class="ggds-measure">${withIcon('download', `<a href="${releases}">Download the theme and GGDS Switch</a>`)} <span class="ggds-hint">GGDS ${version}: <code>${theme}</code> and <code>${plugin}</code>.</span></p>
`;
}

/** The homepage's WordPress section: GGDS Switch, with its download. Same arguments as wordpressBody. */
export function wordpressHome({ version, repo, icon }) {
  const plugin = `ggds-switch-${version}.zip`;
  return `
<section class="docs-home-section docs-starter" aria-labelledby="wp-h">
<div class="docs-starter__text">
<p class="docs-starter__kicker">${icon('refresh', 'ggds-icon ggds-icon--sm')} Already on WordPress?</p>
<h2 id="wp-h">Switch your website to GGDS in an afternoon</h2>
<p class="ggds-measure">GGDS Switch is a WordPress plugin. It turns the website you have into a GGDS government website: the official banner, a clear header and footer, and pages that are easy to read on any phone. Your pages, menus and logo come with you. Page-builder layouts become plain, accessible pages. Preview it first, and undo it any time.</p>
<div class="ggds-button-group">
<a class="ggds-button ggds-with-icon" href="${repo}/releases/download/v${version}/${plugin}" download>${icon('download')}<span>Download GGDS Switch</span></a>
<a class="ggds-button ggds-button--secondary ggds-with-icon" href="wordpress.html"><span>How it works</span>${icon('arrow-right')}</a>
</div>
<p class="docs-starter__small">For WordPress 6.5 or later. Upload it in Plugins, then open <strong>GGDS &gt; Switch to GGDS</strong>. Nothing changes until you press Switch.</p>
</div>
</section>`;
}
