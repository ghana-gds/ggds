// "Set GGDS up in your framework", for the developers' guide: the same four steps for every kind of website (install,
// styles and theme, the script, then pages), so a developer can add GGDS whatever they build with.

/** [anchor, name, logo (docs/stack-logos.mjs), what it uses] for the cards at the top of the guide. */
export const STACKS = [
  ['react', 'React', 'react', 'Components from @ggds/react, or JSX to copy.'],
  ['nextjs', 'Next.js', 'nextjs', '@ggds/react in the app layout, with server components.'],
  ['vue', 'Vue and Nuxt', 'vue', 'Paste the HTML into templates as it is.'],
  ['svelte', 'Svelte and SvelteKit', 'svelte', 'Paste the HTML into components as it is.'],
  ['angular', 'Angular', 'angular', 'Paste the HTML into templates as it is.'],
  ['astro', 'Astro', 'astro', 'Components from @ggds/astro.'],
  ['django', 'Django and Wagtail', 'django', 'Template tags and every form, from ggds-django.'],
  ['wordpress', 'WordPress', 'wordpress', 'The GGDS theme, and GGDS Switch for websites you already have.'],
  ['server', 'Laravel, PHP, Rails and others', 'laravel', 'The download, or npm with your build tool.'],
  ['download-the-files', 'Plain HTML', 'html', 'The download: no tools needed.'],
];

/** A framework's logo in its own colours, for its card. Decorative: the card's title names the framework. */
export function stackLogo(key, logos) {
  const l = logos[key];
  // Angular's logo is a red-to-purple gradient (angular.dev/press-kit); the others are one brand colour.
  const fill = key === 'angular' ? 'url(#docs-angular-gradient)' : l.colour;
  const defs = key === 'angular' ? '<defs><linearGradient id="docs-angular-gradient" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e40035"/><stop offset=".55" stop-color="#dc087d"/><stop offset="1" stop-color="#7b1ef0"/></linearGradient></defs>' : '';
  return `<span class="ggds-card__icon docs-stack-logo docs-stack-logo--${key}"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${defs}<path fill="${fill}" d="${l.path}"/></svg></span>`;
}

/** The framework sections. code(label, text) makes a code block; version: the GGDS version. */
export function stacksSection({ code, version, repo }) {
  return `<h2 id="frameworks">Set it up in your framework</h2>
<p>Every framework needs the same three things: the GGDS stylesheet, your theme if you have one, and the small script for the phone menu and the error summary. Here is where each goes. The <a href="../components/index.html">component pages</a> have the HTML for every part, and a JSX version for React.</p>
<p><strong>Starting a new website?</strong> <code>npx @ggds/create --stack next</code>, <code>--stack astro</code> or <code>--stack django</code> makes a whole government website in that framework, with GGDS set up as below: a homepage, services, forms, search and the required pages, from your institution's details. The <a href="../builder.html">website builder</a> makes the same projects. Every page comes from the framework's <code>Page</code> component, so a newer GGDS updates the parts around it.</p>

<h3 id="react">React (with Vite)</h3>
<p><code>@ggds/react</code> has the page parts and form fields as components: <code>Header</code>, <code>Footer</code>, <code>TextInput</code>, <code>Radios</code>, <code>ErrorSummary</code> and more. They write the HTML GGDS tests, with labels, hints and errors wired up for screen readers, and the menu and error summary work inside React, so you do not need <code>@ggds/js</code>.</p>
${code('Install for React', 'npm install @ggds/react @ggds/css')}
${code('src/main.jsx', `import '@ggds/css/ggds.css';
// import '@ggds/themes/nca.css';   // your theme, after GGDS (npm install @ggds/themes)
import { createRoot } from 'react-dom/client';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(<App />);`)}
${code('A form with errors, in src/App.jsx', `import { ErrorSummary, TextInput, Button } from '@ggds/react';

export default function Apply({ errors = {} }) {
  return (
    <main className="ggds-main ggds-container" id="main" tabIndex={-1}>
      <ErrorSummary errors={errors.fullName ? [{ href: '#fullName', text: errors.fullName }] : []} />
      <h1>Apply for a permit</h1>
      <form method="post" noValidate>
        <TextInput id="fullName" name="fullName" label="Full name" hint="As shown on your Ghana Card"
          width="long" autoComplete="name" error={errors.fullName} />
        <Button type="submit">Continue</Button>
      </form>
    </main>
  );
}`)}
<p>For parts without a component, switch the code on any component page to <strong>JSX (React)</strong> and copy it. <a href="../examples/react/index.html">See a form built with <code>@ggds/react</code></a>: send it empty to see the errors.</p>

<h3 id="nextjs">Next.js</h3>
<p>Install as for React. Load the styles once, in the root layout, and put the page parts around every page. Only <code>Header</code> and <code>ErrorSummary</code> run in the browser; the other components are server components.</p>
${code('app/layout.tsx', `import '@ggds/css/ggds.css';
import { SkipLink, Banner, Footer } from '@ggds/react';
import { SiteHeader } from './site-header';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <body>
        <SkipLink />
        <Banner shortName="Example Agency" host="www.example.gov.gh" official />
        <SiteHeader />
        <main className="ggds-main ggds-container" id="main" tabIndex={-1}>{children}</main>
        <Footer name="Example Agency" bar={[{ label: 'Privacy', href: '/privacy/' }]} />
      </body>
    </html>
  );
}`)}
<p>The header marks the section people are in, so it needs the current address. Give it its own small client component:</p>
${code('app/site-header.tsx', `'use client';
import { usePathname } from 'next/navigation';
import { Header } from '@ggds/react';

const nav = [{ label: 'Services', href: '/services/' }, { label: 'About', href: '/about/' }];

export function SiteHeader() {
  const path = usePathname();
  return <Header name="Example Agency" initials="EA" nav={nav} current={nav.find((n) => path.startsWith(n.href))?.href} />;
}`)}

<h3 id="vue">Vue and Nuxt</h3>
<p>Vue templates are HTML, so the HTML on the component pages pastes in as it is: <code>class</code> and <code>for</code> work. Install the styles and the script:</p>
${code('Install for Vue', 'npm install @ggds/css @ggds/js')}
${code('src/main.js (Vue with Vite)', `import '@ggds/css/ggds.css';
import { createApp } from 'vue';
import { initAll } from '@ggds/js';
import App from './App.vue';
import router from './router';

createApp(App).use(router).mount('#app');
router.afterEach(() => setTimeout(initAll)); // after each page change; safe to run more than once`)}
<p>With Nuxt, add the stylesheet in <code>nuxt.config.ts</code> and start the script in a plugin:</p>
${code('nuxt.config.ts', `export default defineNuxtConfig({
  css: ['@ggds/css/ggds.css'],
  app: { head: { htmlAttrs: { lang: 'en-GB' } } },
});`)}
${code('plugins/ggds.client.ts', `import { initAll } from '@ggds/js';

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('app:mounted', () => initAll());
  nuxtApp.hook('page:finish', () => initAll());
});`)}

<h3 id="svelte">Svelte and SvelteKit</h3>
<p>Svelte components are HTML too: paste the GGDS HTML in as it is. In SvelteKit, load the styles and start the script in the root layout:</p>
${code('Install for SvelteKit', 'npm install @ggds/css @ggds/js')}
${code('src/routes/+layout.svelte', `<script>
  import '@ggds/css/ggds.css';
  import { afterNavigate } from '$app/navigation';
  import { initAll } from '@ggds/js';

  let { children } = $props();
  afterNavigate(() => initAll()); // on the first page and after each page change
</script>

{@render children()}`)}
<p>Set <code>&lt;html lang="en-GB"&gt;</code> in <code>src/app.html</code>.</p>

<h3 id="angular">Angular</h3>
<p>Angular templates take the GGDS HTML as it is. Add the stylesheet to the build and start the script once the app has drawn:</p>
${code('Install for Angular', 'npm install @ggds/css @ggds/js')}
${code('angular.json (in your project\'s build options)', `"styles": [
  "node_modules/@ggds/css/dist/ggds.css",
  "src/styles.css"
]`)}
${code('src/app/app.component.ts', `import { AfterViewInit, Component, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { initAll } from '@ggds/js';

@Component({ selector: 'app-root', imports: [RouterOutlet], templateUrl: './app.component.html' })
export class AppComponent implements AfterViewInit {
  private router = inject(Router);

  ngAfterViewInit() {
    initAll();
    this.router.events.subscribe((e) => { if (e instanceof NavigationEnd) setTimeout(initAll); });
  }
}`)}

<h3 id="astro">Astro</h3>
<p><code>npm install @ggds/astro @ggds/css</code>, from <a href="https://www.npmjs.com/package/@ggds/astro">npm</a>. It has the page parts as Astro components, with the same HTML as these pages: <code>SkipLink</code>, <code>Banner</code>, <code>Header</code>, <code>Hero</code>, <code>Footer</code> and <code>TabBar</code>. Import <code>@ggds/css/ggds.css</code> in your layout and <code>@ggds/js/auto</code> in a <code>&lt;script&gt;</code>.</p>
${code('Astro example', `---
import '@ggds/css/ggds.css';
import Header from '@ggds/astro/Header.astro';
---
<Header name="Example Agency" initials="EA"
  nav={[{ label: 'Services', href: '/services/' }]} current={Astro.url.pathname} />
<script>import '@ggds/js/auto';</script>`)}

<h3 id="django">Django and Wagtail</h3>
<p><code>pip install ggds-django</code>, from <a href="https://pypi.org/project/ggds-django/">PyPI</a>. It works with Wagtail and other Django-based content management systems.</p>
${code('Django settings', `INSTALLED_APPS = [..., "django.contrib.staticfiles", "ggds_django"]
FORM_RENDERER = "ggds_django.forms.GGDSFormRenderer"`)}
<p>Then <code>{{ form }}</code> renders every form in GGDS markup, with an error summary and each field's error wired up for screen readers. The page parts are template tags, and <code>{% ggds_assets %}</code> loads the styles, your theme and the script:</p>
${code('Django template', `{% load ggds %}
{% ggds_assets theme="nca" %}
{% ggds_banner short_name="EA" host="example.gov.gh" official=True %}
{% ggds_header name="Example Agency" nav=nav %}
{% ggds_pagination page_obj %}
{% ggds_footer name="Example Agency" sections=sections links=links %}`)}
<p>For Django admin in GGDS colours with your institution's header, add <code>"ggds_django.admin_theme"</code> above <code>"django.contrib.admin"</code> and set <code>GGDS_ADMIN = {"theme": "nca", "name": "Example Agency"}</code>. Every tag is in the <a href="${repo}/tree/main/packages/django#readme">README</a>.</p>

<h3 id="wordpress">WordPress</h3>
<p>Download <code>ggds-wordpress-${version}.zip</code> from the <a href="${repo}/releases/latest">latest GitHub release</a>, then in WordPress go to <strong>Appearance &gt; Themes &gt; Add New Theme &gt; Upload Theme</strong>. It is a classic theme that outputs the GGDS HTML.</p>
<ul>
<li>Set your institution's short name, theme, official address and contact details in <strong>Appearance &gt; Customise &gt; GGDS</strong>, and your logo in <strong>Site identity</strong>.</li>
<li>Make four menus: main sections, common tasks, footer sections and footer links.</li>
<li>Its front end has no inline scripts or styles, so you can serve it with a strict Content Security Policy. Every template is tested with axe in a real WordPress.</li>
</ul>
<p><strong>Already have a WordPress website?</strong> GGDS Switch, a plugin, turns it into a GGDS website: your pages, menus and logo come with you, page-builder layouts become plain, accessible pages, and you can undo it. Everything is on <a href="../wordpress.html">GGDS for WordPress</a>.</p>

<h3 id="server">Laravel, PHP, Rails, .NET, Go and other server-rendered websites</h3>
<p>Anything that sends HTML pages can use GGDS: write the GGDS HTML in your templates. Add the files one of two ways.</p>
<p><strong>Without build tools:</strong> copy the <code>ggds</code> folder from <a href="#download-the-files">the download</a> into your public folder (<code>public/</code> in Laravel and Rails, <code>wwwroot/</code> in .NET) and put these lines in your layout's <code>&lt;head&gt;</code>:</p>
${code('Layout head, from the download', `<link rel="stylesheet" href="/ggds/ggds.min.css">
<link rel="stylesheet" href="/ggds/themes/nca.css">   <!-- your theme, if you have one -->
<script type="module" src="/ggds/auto.js"></script>`)}
<p><strong>With Vite</strong>, as Laravel uses: <code>npm install @ggds/css @ggds/js</code>, then</p>
${code('resources/css/app.css', `@import "@ggds/css/ggds.css";
@import "@ggds/themes/nca.css";   /* your theme: npm install @ggds/themes */`)}
${code('resources/js/app.js', "import '@ggds/js/auto';")}
<p>Your framework's form helpers can write GGDS fields: give each its <code>ggds-*</code> classes, and when there is an error, the message, <code>aria-invalid</code> and <code>aria-describedby</code> as on the <a href="../components/field.html">text input page</a>, and the <a href="../components/error-summary.html">error summary</a> at the top of the page.</p>

<h3 id="anything-else">Anything else</h3>
<p>If your tool makes web pages, GGDS works with it. Load <code>ggds.css</code> (and your theme), use the HTML from the component pages, and load <code>auto.js</code>, or call <code>initAll()</code> from <code>@ggds/js</code> after the page or a new part of it appears. Every part works without the script; it only adds the phone menu and moves focus to the error summary.</p>`;
}
