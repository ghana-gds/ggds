// The tutorial (get-started/tutorial.html): set GGDS up from a CDN, the download or npm, build a page, then a
// sign-in page that shows errors the GGDS way. The pages people copy and the live demos (examples/tutorial/) come
// from the same templates below, with only the file paths changed, so what the tutorial shows is what is tested.
import { icon } from '../packages/icons/dist/all.js';

/** Where the GGDS files come from, for each way of setting up. */
export function setups(version) {
  const cdn = `https://cdn.jsdelivr.net/npm`;
  return {
    cdn: {
      head: `  <link rel="stylesheet" href="${cdn}/@ggds/css@${version}/dist/ggds.min.css">
  <script type="module" src="${cdn}/@ggds/js@${version}/dist/auto.js"></script>`,
      js: `${cdn}/@ggds/js@${version}/dist/index.js`,
      script: 'sign-in.js',
    },
    download: {
      head: `  <link rel="stylesheet" href="ggds/ggds.min.css">
  <script type="module" src="ggds/auto.js"></script>`,
      js: './ggds/index.js',
      script: 'sign-in.js',
    },
    npm: {
      head: '  <script type="module" src="/src/main.js"></script>',
      js: '@ggds/js',
      script: '/src/sign-in.js',
    },
    // The live demos in the documentation: site/examples/tutorial/.
    demo: {
      head: `  <link rel="stylesheet" href="../../assets/ggds.css">
  <script type="module" src="../../assets/js/auto.js"></script>`,
      js: '../../assets/js/index.js',
      script: 'sign-in.js',
    },
  };
}

const banner = `<section class="ggds-banner" aria-label="Official government website">
  <details class="ggds-banner__details ggds-container">
    <summary class="ggds-banner__summary">
      <svg class="ggds-banner__flag" viewBox="0 0 30 20" aria-hidden="true" focusable="false">
        <rect class="ggds-banner__flag-red" width="30" height="6.67"/>
        <rect class="ggds-banner__flag-gold" y="6.67" width="30" height="6.67"/>
        <rect class="ggds-banner__flag-green" y="13.33" width="30" height="6.67"/>
        <polygon class="ggds-banner__flag-star" points="15,6.8 15.73,8.99 18.04,9.01 16.19,10.39 16.88,12.59 15,11.25 13.12,12.59 13.81,10.39 11.96,9.01 14.27,8.99"/>
      </svg>
      <span class="ggds-banner__text">An official website of the Government of Ghana</span>
      <span class="ggds-banner__toggle">How to tell</span>
    </summary>
    <div class="ggds-banner__content">
      <div class="ggds-banner__item">
        <p class="ggds-banner__heading">Check the address</p>
        <p>The official address of this website is <strong>www.example.gov.gh</strong>. Most government websites end in <strong>.gov.gh</strong>, but some official websites do not.</p>
      </div>
      <div class="ggds-banner__item">
        <p class="ggds-banner__heading">We will never ask for your PIN</p>
        <p>Government officials will never ask for your PIN, password or mobile money code, by phone, by SMS or on a website.</p>
      </div>
    </div>
  </details>
</section>`;

const header = `<header class="ggds-header">
  <div class="ggds-container ggds-header__inner">
    <a class="ggds-header__identity" href="index.html">
      <span class="ggds-header__monogram" aria-hidden="true">EA</span>
      <span class="ggds-header__text">
        <span class="ggds-header__name">Example Agency</span>
        <span class="ggds-header__country">Republic of Ghana</span>
        <span class="ggds-visually-hidden"> – home</span>
      </span>
    </a>
    <nav class="ggds-header__nav" id="ggds-header-nav" aria-label="Main">
      <ul class="ggds-header__list">
        <li><a class="ggds-header__link" href="index.html">Services</a></li>
        <li><a class="ggds-header__link" href="sign-in.html">Sign in</a></li>
      </ul>
    </nav>
    <button type="button" class="ggds-header__menu-button" aria-controls="ggds-header-nav" aria-expanded="false" hidden>${icon('menu', 'ggds-header__icon ggds-header__icon--menu')}${icon('close', 'ggds-header__icon ggds-header__icon--close')}<span class="ggds-visually-hidden">Menu</span></button>
  </div>
</header>`;

const footer = `<footer class="ggds-footer">
  <div class="ggds-container ggds-footer__main">
    <div>
      <p class="ggds-footer__identity"><span class="ggds-header__monogram" aria-hidden="true">EA</span><span>Example Agency</span></p>
      <p class="ggds-footer__purpose">We license businesses and protect consumers.</p>
    </div>
  </div>
  <div class="ggds-footer__bottom">
    <ul class="ggds-container ggds-footer__bar">
      <li>© 2026 Example Agency</li>
      <li><a href="accessibility.html">Accessibility</a></li>
      <li><a href="privacy.html">Privacy</a></li>
    </ul>
  </div>
</footer>`;

const doc = (title, head, main) => `<!doctype html>
<html lang="en-GB">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
${head}
</head>
<body>
<a class="ggds-skip-link" href="#main">Skip to main content</a>
${banner}
${header}
${main}
${footer}
</body>
</html>
`;

/** The tutorial's files for one setup: page.html, sign-in.html, account.html and sign-in.js. */
export function tutorialFiles(setup) {
  const signInHead = `${setup.head}\n  <script type="module" src="${setup.script}"></script>`;
  return {
    'index.html': doc('Example Agency', setup.head, `<main class="ggds-main ggds-container" id="main" tabindex="-1">
  <h1>Apply for a business permit</h1>
  <p class="ggds-lead ggds-measure">Apply online for a permit to run a business in Ghana. It takes about 15 minutes.</p>
  <div class="ggds-prose">
    <h2>Before you start</h2>
    <p>You will need:</p>
    <ul>
      <li>your Ghana Card number</li>
      <li>your business registration certificate</li>
    </ul>
  </div>
  <p><a class="ggds-button" href="sign-in.html">Start now</a></p>
</main>`),

    'sign-in.html': doc('Sign in | Example Agency', signInHead, `<main class="ggds-main ggds-container" id="main" tabindex="-1">
  <div class="ggds-error-summary" role="alert" aria-labelledby="error-summary-title" tabindex="-1" hidden>
    <h2 class="ggds-error-summary__title" id="error-summary-title">There is a problem</h2>
    <ul class="ggds-error-summary__list"></ul>
  </div>
  <h1>Sign in to your account</h1>
  <form id="sign-in" method="post" novalidate>
    <div class="ggds-field">
      <label class="ggds-label" for="email">Email address</label>
      <input class="ggds-input ggds-input--width-long" id="email" name="email" type="email" autocomplete="username" spellcheck="false">
    </div>
    <div class="ggds-field">
      <label class="ggds-label" for="password">Password</label>
      <input class="ggds-input ggds-input--width-medium" id="password" name="password" type="password" autocomplete="current-password">
    </div>
    <div class="ggds-button-group">
      <button class="ggds-button" type="submit">Sign in</button>
      <a href="forgotten-password.html">Forgotten your password?</a>
    </div>
  </form>
  <h2>If you do not have an account</h2>
  <p><a href="create-account.html">Create an account</a>. You will need your Ghana Card number.</p>
</main>`),

    'account.html': doc('Your account | Example Agency', setup.head, `<main class="ggds-main ggds-container" id="main" tabindex="-1">
  <h1>Your account</h1>
  <p class="ggds-lead ggds-measure">You are signed in.</p>
  <ul class="ggds-card-grid">
    <li class="ggds-card"><h2 class="ggds-card__title"><a class="ggds-card__link" href="index.html">Apply for a business permit</a></h2><p class="ggds-card__body">Start a new application.</p></li>
    <li class="ggds-card"><h2 class="ggds-card__title"><a class="ggds-card__link" href="applications.html">Your applications</a></h2><p class="ggds-card__body">See where your applications are.</p></li>
  </ul>
</main>`),

    'sign-in.js': `// Checks the sign-in form in the browser and shows any errors the GGDS way: a summary at the top of the page,
// a message on each field, and "Error:" at the start of the page title. Your server must check the details
// again: this only saves people waiting for the page to reload.
import { initErrorSummary } from '${setup.js}';

const form = document.getElementById('sign-in');
const summary = document.querySelector('.ggds-error-summary');
const pageTitle = document.title;

// What to check, and the message for each problem. Say what to do, not what went wrong.
const checks = {
  email: (value) => {
    if (!value) return 'Enter your email address';
    if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(value)) return 'Enter an email address in the correct format, like name@example.com';
    return '';
  },
  password: (value) => (value ? '' : 'Enter your password'),
};

/** Shows or clears the error on one field. */
function setError(input, message) {
  const field = input.closest('.ggds-field');
  const id = \`\${input.id}-error\`;
  document.getElementById(id)?.remove();
  field.classList.toggle('ggds-field--error', Boolean(message));
  if (!message) {
    input.removeAttribute('aria-invalid');
    input.removeAttribute('aria-describedby');
    return;
  }
  const error = document.createElement('p');
  error.className = 'ggds-error-message';
  error.id = id;
  const hidden = document.createElement('span');
  hidden.className = 'ggds-visually-hidden';
  hidden.textContent = 'Error:';
  error.append(hidden, \` \${message}\`);
  input.before(error);
  input.setAttribute('aria-invalid', 'true');
  input.setAttribute('aria-describedby', id);
}

form.addEventListener('submit', (event) => {
  const errors = [];
  for (const [name, check] of Object.entries(checks)) {
    const input = form.elements[name];
    const message = check(input.value.trim());
    setError(input, message);
    if (message) errors.push({ id: input.id, message });
  }

  if (errors.length === 0) {
    // This tutorial has no server, so go to the next page here. With a server, delete these two lines:
    // the form then sends the details to your server, which signs the person in or shows the errors.
    event.preventDefault();
    window.location.href = 'account.html';
    return;
  }

  event.preventDefault();
  const list = summary.querySelector('.ggds-error-summary__list');
  list.replaceChildren(...errors.map(({ id, message }) => {
    const item = document.createElement('li');
    const link = document.createElement('a');
    link.href = \`#\${id}\`;
    link.textContent = message;
    item.append(link);
    return item;
  }));
  summary.hidden = false;
  document.title = \`Error: \${pageTitle}\`;
  // The first time, GGDS's script moves focus to the summary and makes its links work; after that, just focus it.
  if (summary.dataset.ggdsReady) summary.focus();
  else initErrorSummary(summary);
});
`,
  };
}

/** What a server sends back when the details are wrong: the same parts, written into the page. */
const serverErrors = `<div class="ggds-error-summary" data-ggds-module="error-summary" role="alert" aria-labelledby="error-summary-title" tabindex="-1">
  <h2 class="ggds-error-summary__title" id="error-summary-title">There is a problem</h2>
  <ul class="ggds-error-summary__list">
    <li><a href="#email">Enter a correct email address and password</a></li>
  </ul>
</div>
<h1>Sign in to your account</h1>
<form id="sign-in" method="post" novalidate>
  <div class="ggds-field ggds-field--error">
    <label class="ggds-label" for="email">Email address</label>
    <p class="ggds-error-message" id="email-error"><span class="ggds-visually-hidden">Error:</span> Enter a correct email address and password</p>
    <input class="ggds-input ggds-input--width-long" id="email" name="email" type="email" autocomplete="username" spellcheck="false" value="kofi@example.com" aria-invalid="true" aria-describedby="email-error">
  </div>
  …the password field, empty, and the rest of the form as before…
</form>`;

/** The tutorial page's body. esc: HTML escaping. */
/** The themes the tutorial's live demo is shown in. */
export const demoThemes = ['nca', 'gmet', 'csa'];

/** The tutorial page's body. esc: HTML escaping. themes: the ready-made themes; defaultName: the default theme's institution. */
export function tutorialBody({ esc, version, repo, themes, defaultName }) {
  const s = setups(version);
  const cdn = tutorialFiles(s.cdn);
  const code = (label, text) => `<pre class="docs-code" tabindex="0" aria-label="${esc(label)}"><code>${esc(text)}</code></pre>`;
  const demo = (file, text) => `<p><a class="ggds-with-icon" href="../examples/tutorial/${file}"><span>${text}</span>${icon('arrow-right')}</a></p>`;
  return `<h1>Tutorial: build a page and a sign-in form</h1>
<p class="ggds-lead ggds-measure">Set GGDS up, make a government web page, then a sign-in page that tells people clearly what to fix. You need a text editor and a web browser. It takes about 20 minutes.</p>
<div class="ggds-prose">
<p>You will make four files: a service page, a sign-in page, the script that checks the sign-in form, and the page people see once they are signed in. Then you will give them your institution's colour with a ready-made theme. Every page in this tutorial is tested by GGDS for accessibility, on computers and phones.</p>

<h2 id="set-up">Step 1: Set GGDS up</h2>
<p>Make a new folder for your website, such as <code>my-service</code>. Then choose one way to add GGDS. You can change later: only the lines that load GGDS are different.</p>
<div class="ggds-table-wrap" role="region" aria-labelledby="setup-caption" tabindex="0"><table class="ggds-table">
<caption class="ggds-table__caption" id="setup-caption">Ways to set GGDS up</caption>
<thead><tr><th scope="col">Way</th><th scope="col">Best for</th><th scope="col">You need</th></tr></thead>
<tbody>
<tr><th scope="row"><a href="#from-a-cdn">A CDN link</a></th><td>Trying GGDS out, and this tutorial</td><td>Nothing else</td></tr>
<tr><th scope="row"><a href="#from-the-download">The download</a></th><td>A live website without build tools</td><td>The GGDS zip</td></tr>
<tr><th scope="row"><a href="#from-npm">npm</a></th><td>A website with a build step, such as Vite, Astro or Next.js</td><td>Node.js</td></tr>
</tbody></table></div>

<p>Building with React, Next.js, Vue, Svelte, Angular, Django or WordPress? This tutorial works the same in plain HTML, and <a href="developers.html#frameworks">Set it up in your framework</a> shows where each part goes in yours. React has its own components, in <code>@ggds/react</code>.</p>
<h3 id="from-a-cdn">From a CDN (quickest)</h3>
<p>A CDN serves the GGDS files from the internet, so there is nothing to download. Put these two lines in the <code>&lt;head&gt;</code> of each page. The pages in this tutorial already have them.</p>
${code('CDN links', s.cdn.head.replace(/^ {2}/gm, ''))}
<p>Always name the exact version, as here (<code>@${version}</code>), so your pages do not change when GGDS does. For a live government website, use the download or npm instead: then your website does not depend on another company's service.</p>

<h3 id="from-the-download">From the download</h3>
<ol>
<li>Download <code>ggds-${version}.zip</code> from the <a href="${repo}/releases/latest">latest GitHub release</a>.</li>
<li>Unzip it and copy the <code>ggds</code> folder into your <code>my-service</code> folder.</li>
<li>In each page, use these two lines instead of the CDN links:</li>
</ol>
${code('Download links', s.download.head.replace(/^ {2}/gm, ''))}
<p>In <code>sign-in.js</code> (step 4), import from <code>'${s.download.js}'</code> instead of the CDN address.</p>

<h3 id="from-npm">From npm</h3>
<p>With <a href="https://nodejs.org/">Node.js</a> installed, make a project with <a href="https://vite.dev/">Vite</a> and add GGDS:</p>
${code('Create a project and install GGDS', `npm create vite@latest my-service -- --template vanilla
cd my-service
npm install @ggds/css @ggds/js`)}
<p>Delete the example files Vite made in <code>src/</code>, and put this in <code>src/main.js</code>:</p>
${code('src/main.js', `import '@ggds/css/ggds.css';
import '@ggds/js/auto';`)}
<p>In each page, use this line in the <code>&lt;head&gt;</code> instead of the CDN links:</p>
${code('npm script tag', s.npm.head.replace(/^ {2}/gm, ''))}
<p>Put <code>sign-in.js</code> in <code>src/</code>, load it with <code>&lt;script type="module" src="${s.npm.script}"&gt;&lt;/script&gt;</code>, and import from <code>'${s.npm.js}'</code>. Run <code>npm run dev</code> and open the address it shows. Before you build for production, list every page as Vite's guide to <a href="https://vite.dev/guide/build#multi-page-app">multi-page apps</a> says.</p>

<h2 id="a-page">Step 2: Make a page</h2>
<p>Make <code>index.html</code> in your folder and copy this into it. It has the parts every government website needs, in this order:</p>
<ul>
<li>a <a href="../components/skip-link.html">skip link</a>, for people who use a keyboard</li>
<li>the <a href="../components/banner.html">government website banner</a>, so people can tell the website is official</li>
<li>the <a href="../components/header.html">header</a>, with your institution's name and main sections</li>
<li>the page's content, in <code>&lt;main&gt;</code>, starting with one <code>&lt;h1&gt;</code></li>
<li>the <a href="../components/footer.html">footer</a></li>
</ul>
${code('index.html', cdn['index.html'])}
<p>Open the file in your browser. Make the window narrow: on a phone-sized screen the sections move into a menu.</p>
${demo('index.html', 'See the finished page')}
<p>To make the page your own, change "Example Agency", the initials (<code>EA</code>), the sections and the content. Keep the parts in the same order.</p>

<h2 id="sign-in-page">Step 3: Make a sign-in page</h2>
<p>Make <code>sign-in.html</code>. The header, banner and footer are the same as before; only <code>&lt;main&gt;</code> and the page title are new.</p>
${code('sign-in.html', cdn['sign-in.html'])}
<p>What makes this sign-in page work well for everyone:</p>
<ul>
<li>Every box has a <code>&lt;label&gt;</code>, so screen readers say what it is for and people can tap the words to reach the box.</li>
<li><code>autocomplete="username"</code> and <code>autocomplete="current-password"</code> let browsers and password managers fill the details in. People who use them make stronger passwords.</li>
<li><code>type="email"</code> shows the @ key on phones; <code>spellcheck="false"</code> stops the browser marking the address as a spelling mistake.</li>
<li><code>method="post"</code> sends the password in the body of the request, never in the web address. The form has no <code>action</code>, so it is sent back to the same address: your server shows the sign-in page and checks it at one address.</li>
<li><code>novalidate</code> turns off the browser's own error messages, which are hard to read and differ in every browser. GGDS's error messages replace them in step 4.</li>
<li>The error summary is already in the page, hidden, so the script in step 4 only has to fill it in.</li>
</ul>

<h2 id="errors">Step 4: Show errors</h2>
<p>When someone leaves a box empty or types an email address wrongly, GGDS shows the problem in three places, so everyone notices it:</p>
<ol>
<li>an <a href="../components/error-summary.html">error summary</a> at the top of the page, which takes the keyboard focus, so screen readers read it first; each problem links to its box</li>
<li>a red message above the box, saying what to do: "Enter your email address", not "Invalid input"</li>
<li>"Error:" at the start of the page title, which is the first thing a screen reader says</li>
</ol>
<p>Make <code>sign-in.js</code> next to <code>sign-in.html</code>. It checks the form when it is sent and shows any problems this way.</p>
${code('sign-in.js', cdn['sign-in.js'])}
${demo('sign-in.html', 'Try the finished sign-in page: send it empty, then with a wrong email address')}
<p>The script is loaded from its own file, not written into the page, so it runs under a strict Content Security Policy.</p>
<h3 id="server-errors">Errors from your server</h3>
<p>The script only saves people a wait: your server must check the details again, and it is the only thing that can tell whether the password is right. When it is not, the server sends the sign-in page back with the same parts written in, and GGDS's script moves the focus to the summary:</p>
${code('Sign-in page from the server, with an error', serverErrors)}
<p>When the email address or password is wrong, do not say which: "Enter a correct email address and password". Saying which one is wrong tells an attacker which email addresses have accounts. Keep what the person typed in the email address box, but never send the password back.</p>

<h2 id="signed-in">Step 5: The page after signing in</h2>
<p>Make <code>account.html</code>, the page people see once they are signed in. The tutorial's script goes there when the form is filled in; with a server, the server sends people there.</p>
${code('account.html', cdn['account.html'])}
${demo('account.html', 'See the finished account page')}

<h2 id="theme">Step 6: Use a ready-made theme</h2>
<p>Every government website looks the same except for one thing: the institution's colour. A theme sets it. It changes five places only: the line under the header, the institution's name, the homepage hero, the footer and the institution's card in a list. Links, buttons, form fields and error messages stay the same on every government website, so people recognise them wherever they are.</p>
<h3 id="choose-a-theme">Choose your theme</h3>
<p>GGDS has a ready-made theme for each of these institutions. Without one, your website uses the default, ${esc(defaultName)}.</p>
<div class="ggds-table-wrap" role="region" aria-labelledby="themes-caption" tabindex="0"><table class="ggds-table">
<caption class="ggds-table__caption" id="themes-caption">Ready-made themes</caption>
<thead><tr><th scope="col" class="docs-nowrap">Colour</th><th scope="col">Institution</th><th scope="col" class="docs-nowrap">Theme name</th></tr></thead>
<tbody>
${themes.map((t) => `<tr><td><span class="docs-swatch docs-theme-swatch" data-ggds-theme="${t.slug}"></span></td><th scope="row">${esc(t.name)} (${esc(t.shortName)})</th><td><code>${t.slug}</code></td></tr>`).join('\n')}
</tbody></table></div>
<h3 id="add-a-theme">Add it to your pages</h3>
<p>Load the theme <strong>after</strong> the GGDS stylesheet, in every page. This example uses the National Communications Authority's theme, <code>nca</code>: put your theme's name in its place.</p>
<p>From the CDN, add this line under the GGDS stylesheet:</p>
${code('Theme from the CDN', `<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@ggds/themes@${version}/dist/nca.css">`)}
<p>From the download, the themes are already in the <code>ggds/themes</code> folder:</p>
${code('Theme from the download', '<link rel="stylesheet" href="ggds/themes/nca.css">')}
<p>With npm, install the themes and import yours in <code>src/main.js</code>, after GGDS:</p>
${code('Install the themes', 'npm install @ggds/themes')}
${code('src/main.js with a theme', `import '@ggds/css/ggds.css';
import '@ggds/themes/nca.css';
import '@ggds/js/auto';`)}
<p>Reload the page: the line under the header, your institution's name and the footer are now in its colour.</p>
<iframe class="docs-frame docs-frame--h640" src="../examples/tutorial/index-nca.html" title="The tutorial page with the NCA theme" loading="lazy"></iframe>
<p>Try it with other themes: ${demoThemes.map((slug) => `<a href="../examples/tutorial/index-${slug}.html">${esc(themes.find((t) => t.slug === slug).shortName)}</a>`).join(', ')}. See every theme on a whole page on <a href="../themes.html">Themes</a>.</p>
<h3 id="make-a-theme">If your institution has no theme yet</h3>
<p>Make one from your institution's colour. The colour must have at least 4.5:1 contrast on white, because the header writes your institution's name in it; GGDS checks this for you and makes the darker shade the footer needs. With <a href="https://nodejs.org/">Node.js</a>, run <code>npm install @ggds/tokens</code>, then save this as <code>make-theme.mjs</code> and run <code>node make-theme.mjs</code>:</p>
${code('make-theme.mjs', `import { writeFileSync } from 'node:fs';
import { institutionColourProblems, institutionCss } from '@ggds/tokens/institution.mjs';

const colour = '#006e35'; // your institution's colour

const problems = institutionColourProblems(colour);
if (problems.length) throw new Error(problems.join('\\n')); // for example: too light to read on white

writeFileSync('my-theme.css', institutionCss(colour));`)}
<p>It writes <code>my-theme.css</code>. Load it after the GGDS stylesheet, like a ready-made theme. To have your institution's theme added to GGDS, <a href="${repo}/issues/new?title=${encodeURIComponent('Theme for ')}">ask for it on GitHub</a> with your approved colour.</p>
<h3 id="several-themes">Several institutions on one page</h3>
<p>A ministry's list of its agencies shows each agency in its own colour. Load <code>themes.css</code>, which has every theme, instead of one theme, and put <code>data-ggds-theme</code> with the theme's name on each agency's card:</p>
${code('Several themes on one page', `<link rel="stylesheet" href="ggds/themes/themes.css">

<li class="ggds-card ggds-card--institution" data-ggds-theme="nca">…</li>
<li class="ggds-card ggds-card--institution" data-ggds-theme="gmet">…</li>`)}
<p>Never set the colour with a <code>style</code> attribute: a strict Content Security Policy blocks it.</p>

<h2 id="before-you-go-live">Before you go live</h2>
<p>A sign-in page protects people's information. Before it is used for real:</p>
<ul>
<li>Serve the website over HTTPS only.</li>
<li>Check every detail again on the server, and store passwords only as a slow hash (such as Argon2 or bcrypt), never as they were typed.</li>
<li>Slow down repeated wrong attempts, and tell the person by email or SMS when their account is signed in to from a new device.</li>
<li>Let people paste into the password box: blocking it stops password managers.</li>
<li>Serve the GGDS files yourself (the download or npm), as <a href="developers.html#download-the-files">Get started as a developer</a> explains, and set a strict Content Security Policy.</li>
<li>Test the pages with a keyboard only, with a screen reader, at 200% zoom and on a low-cost phone. GGDS has tested its parts; you need to test how you put them together.</li>
</ul>
<h2 id="next">Next steps</h2>
<ul>
<li>Read the <a href="../patterns/ask-for-information.html">pattern for asking for information</a> before you build longer forms, and the <a href="../patterns/ghana-card-number.html">Ghana Card number pattern</a> to ask for it.</li>
<li>Browse the <a href="../components/index.html">components</a> and <a href="../icons.html">icons</a>.</li>
<li>For Django, WordPress or Astro, see <a href="developers.html#frameworks">Get started as a developer</a>: they write this HTML for you.</li>
</ul>
</div>`;
}

/** Pages the tutorial links to but does not build, for the live demo only: so no link there leads nowhere. */
export function demoPlaceholders(setup) {
  const pages = {
    'forgotten-password.html': 'Forgotten your password',
    'create-account.html': 'Create an account',
    'applications.html': 'Your applications',
    'accessibility.html': 'Accessibility statement',
    'privacy.html': 'Privacy',
  };
  return Object.fromEntries(Object.entries(pages).map(([file, title]) => [file, doc(`${title} | Example Agency`, setup.head, `<main class="ggds-main ggds-container" id="main" tabindex="-1">
  <h1>${title}</h1>
  <p>This page is not part of the tutorial. <a href="sign-in.html">Go back to the sign-in page</a>.</p>
</main>`)]));
}
