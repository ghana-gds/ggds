// The website builder page (builder.html): a guided form, in five steps, that makes an institution's own website: who
// it is, what people come to do (its services, each with the words of its own page), its other pages, its contact
// details and look, and how it will go online (a zip for its IT team or host, step by step hosting for someone on their
// own, a WordPress import, or a framework project for a developer). docs/builder.js does the work, with the same code
// the build uses (docs/starter-bundle.mjs), and keeps what people type on their own device as they go. Without
// JavaScript the page says so and offers the example download and `npx @ggds/create` instead.
import { esc } from './parts.mjs';
import { KINDS } from './starter-kinds.mjs';
import { PARTS } from './starter-site.mjs';
import { STACKS } from './starter-stacks.mjs';

/** The builder's own few styles: layout only, GGDS tokens only. Written to assets/builder/builder.css. */
export const BUILDER_CSS = `/* The website builder (builder.html): layout only, with GGDS tokens. */
.wb[hidden], .wb [hidden] { display: none; }
.wb { display: grid; gap: var(--ggds-space-8); align-items: start; }
.wb > * { min-width: 0; }
@media (min-width: 64rem) { .wb { grid-template-columns: minmax(0, 3fr) minmax(0, 2fr); } .wb__aside { position: sticky; top: var(--ggds-space-4); } }
.wb__steps { display: flex; flex-wrap: wrap; gap: var(--ggds-space-2); margin: 0 0 var(--ggds-space-6); padding: 0; list-style: none; counter-reset: wb-step; }
.wb__steps li { counter-increment: wb-step; }
.wb__step-link { display: inline-flex; align-items: center; gap: var(--ggds-space-2); padding: var(--ggds-space-1) var(--ggds-space-3); border: 1px solid var(--ggds-color-border-subtle); border-radius: var(--ggds-radius-full, 999px); color: var(--ggds-color-text); font-size: var(--ggds-font-size-sm); text-decoration: none; }
.wb__step-link::before { content: counter(wb-step); display: inline-grid; place-items: center; inline-size: 1.5rem; block-size: 1.5rem; border-radius: 50%; background: var(--ggds-color-surface-sunken); font-weight: 700; }
.wb__step-link[aria-current="step"] { border-color: var(--ggds-color-institution); font-weight: 700; }
.wb__step-link[aria-current="step"]::before { background: var(--ggds-color-institution); color: var(--ggds-color-text-inverse, #fff); }
.wb__step > h2 { margin-top: 0; }
.wb__form .ggds-fieldset { margin-bottom: var(--ggds-space-8); }
.wb__form .ggds-fieldset__legend { font-size: var(--ggds-font-size-lg); }
.wb__item { margin: 0 0 var(--ggds-space-6); padding: var(--ggds-space-4) var(--ggds-space-4) var(--ggds-space-2); border: 1px solid var(--ggds-color-border-subtle); border-left: 4px solid var(--ggds-color-institution); border-radius: var(--ggds-radius-md); background: var(--ggds-color-surface); }
.wb__item-head { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: var(--ggds-space-2); margin-bottom: var(--ggds-space-2); }
.wb__item-head h3, .wb__item-head h4 { margin: 0; font-size: var(--ggds-font-size-lg); }
.wb__row { display: grid; gap: var(--ggds-space-2); grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr)); align-items: end; margin-bottom: var(--ggds-space-4); }
.wb__row .ggds-field { margin-bottom: 0; }
.wb__link-button { padding: 0; border: 0; background: none; color: var(--ggds-color-link); font: inherit; text-decoration: underline; cursor: pointer; }
.wb__nav { display: flex; flex-wrap: wrap; gap: var(--ggds-space-4); align-items: center; margin-top: var(--ggds-space-8); }
.wb__toolbar { display: flex; flex-wrap: wrap; gap: var(--ggds-space-2); align-items: end; margin-bottom: var(--ggds-space-2); }
.wb__toolbar .ggds-field { margin-bottom: 0; flex: 1 1 12rem; }
.wb__preview { max-block-size: 75vh; overflow: auto; border: 1px solid var(--ggds-color-border-subtle); border-radius: var(--ggds-radius-lg); background: var(--ggds-color-background, #fff); }
.wb__preview-inner { width: 200%; transform: scale(0.5); transform-origin: 0 0; }
.wb__preview--phone { max-inline-size: 24.375rem; margin-inline: auto; }
.wb__preview--phone .wb__preview-inner { width: 100%; transform: none; }
/* Full screen: the preview over the whole page, with the toolbar at the top. Not the Fullscreen API, which iPhones do not
   have for elements. While it is open, everything behind it is inert and the page does not scroll. */
html.wb-full { overflow: hidden; }
.wb__aside.wb__aside--full { position: fixed; inset: 0; z-index: var(--ggds-layer-modal); display: flex; flex-direction: column; gap: var(--ggds-space-2); block-size: 100dvh; padding: var(--ggds-space-4); background: var(--ggds-color-background, #fff); }
.wb__aside--full .wb__toolbar { margin-bottom: 0; }
.wb__aside--full .wb__preview { flex: 1 1 auto; inline-size: 100%; max-block-size: none; }
.wb__aside--full .wb__preview--phone { max-inline-size: 24.375rem; }
.wb__aside--full .wb__preview-inner { width: 100%; transform: none; }
@media (prefers-reduced-motion: no-preference) {
  .wb__aside--full { animation: wb-full-in var(--ggds-motion-duration-base) var(--ggds-motion-easing-enter) both; }
}
@keyframes wb-full-in { from { opacity: 0; transform: scale(0.98); } }
/* The preview's page title is a paragraph (this page has its own h1). It looks like an h1, in GGDS's base layer as an
   h1's style is, so the hero's and panel's own styles still win over it. */
@layer ggds.base {
  .wb__preview-inner .wb__h1 { margin: 0 0 var(--ggds-space-4); font-size: var(--ggds-font-size-3xl); font-weight: var(--ggds-font-weight-bold); line-height: var(--ggds-line-height-tight); color: var(--ggds-color-text); text-wrap: balance; }
}
.wb__caption { margin: 0 0 var(--ggds-space-2); color: var(--ggds-color-text-muted); font-size: var(--ggds-font-size-sm); }
.wb__colour { display: flex; gap: var(--ggds-space-2); align-items: center; }
.wb__picker { inline-size: 3rem; block-size: 2.75rem; padding: 0; border: 1px solid var(--ggds-color-border-strong); border-radius: var(--ggds-radius-md); background: none; }
.wb__done[hidden] { display: none; }
.wb__start { display: grid; gap: var(--ggds-space-4); grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr)); margin-bottom: var(--ggds-space-8); }
.wb__start .ggds-file-upload { max-inline-size: 100%; }
`;

const hint = (id, text) => (text ? `\n<p class="ggds-hint" id="wb-${id}-hint">${text}</p>` : '');
const errorLine = (id) => `<p class="ggds-error-message" id="wb-${id}-error" hidden><span class="ggds-visually-hidden">Error:</span> <span data-message></span></p>`;

/** A text field bound to a setting (data-path). lines: a textarea whose lines are a list. */
const text = (id, label, o = {}) => `<div class="ggds-field" data-field="${o.field ?? id}">
<label class="ggds-label" for="wb-${id}">${label}</label>${hint(id, o.hint)}
${errorLine(id)}
${o.textarea || o.lines
    ? `<textarea class="ggds-textarea" id="wb-${id}" name="${id}" rows="${o.rows ?? 3}" data-path="${o.path ?? id}"${o.lines ? ' data-lines' : ''}${o.hint ? ` aria-describedby="wb-${id}-hint"` : ''}></textarea>`
    : `<input class="ggds-input${o.width ? ` ggds-input--width-${o.width}` : ''}" id="wb-${id}" name="${id}" type="${o.type ?? 'text'}" data-path="${o.path ?? id}"${o.autocomplete ? ` autocomplete="${o.autocomplete}"` : ''}${o.inputmode ? ` inputmode="${o.inputmode}"` : ''}${o.spellcheck === false ? ' spellcheck="false" autocapitalize="off"' : ''}${o.hint ? ` aria-describedby="wb-${id}-hint"` : ''}>`}
</div>`;

const check = (id, label, hintText, path) => `<div class="ggds-choice">
<input class="ggds-choice__input" id="wb-${id}" name="${id}" type="checkbox" value="yes" data-path="${path}"${hintText ? ` aria-describedby="wb-${id}-hint"` : ''}>
<label class="ggds-choice__label" for="wb-${id}">${label}${hintText ? ` <span class="ggds-choice__hint" id="wb-${id}-hint">${hintText}</span>` : ''}</label>
</div>`;

const radio = (name, value, label, hintText, checked = false) => `<div class="ggds-choice">
<input class="ggds-choice__input" id="wb-${name}-${value}" name="${name}" type="radio" value="${value}"${checked ? ' checked' : ''}${hintText ? ` aria-describedby="wb-${name}-${value}-hint"` : ''}>
<label class="ggds-choice__label" for="wb-${name}-${value}">${label}${hintText ? ` <span class="ggds-choice__hint" id="wb-${name}-${value}-hint">${hintText}</span>` : ''}</label>
</div>`;

const STEPS = [
  ['who', 'Who you are'],
  ['do', 'What people come to do'],
  ['pages', 'Your other pages'],
  ['look', 'Contact details and look'],
  ['get', 'Get your website'],
];

const nav = (i) => `<div class="wb__nav">
${i < STEPS.length - 1 ? `<button class="ggds-button" type="button" data-next>Continue</button>` : '<button class="ggds-button" type="submit">Download my website</button>'}
${i > 0 ? '<button class="ggds-button ggds-button--secondary" type="button" data-back>Back</button>' : ''}
</div>`;

/** The page body. themes: [{ slug, name, shortName, accent, deep }]; starterZip: the example download's file name. */
export function builderBody({ themes, defaultTheme, starterZip, version }) {
  return `<h1>Make your website</h1>
<p class="ggds-lead ggds-measure">Answer a few questions about your institution and write the words of your pages. You get a complete government website, built with GGDS ${esc(version)}, ready to put online, with a guide for whoever does it.</p>
<p class="ggds-measure">Everything happens in your browser: nothing you type is sent anywhere. What you type is kept on this device, so you can stop and come back. Most people take 20 to 40 minutes.</p>

<div class="ggds-notice" data-wb-fallback>
<p class="ggds-notice__title">The website builder needs JavaScript</p>
<p>Without it, <a href="downloads/${esc(starterZip)}" download>download the example website</a> and change its name and details by hand, or, with Node.js, run <code>npx @ggds/create</code>, which asks the same questions.</p>
</div>

<div class="wb" data-wb hidden>
<div>
<div class="wb__start">
  <div class="ggds-card">
    <h2 class="ggds-card__title">Already have a WordPress website?</h2>
    <p class="ggds-card__body">You may not need to start again. <a href="wordpress.html">GGDS Switch</a> turns the website you have into a GGDS one, and keeps your pages.</p>
  </div>
  <div class="ggds-card">
    <h2 class="ggds-card__title">Made a website here before?</h2>
    <div class="ggds-field" data-field="settings">
    <label class="ggds-label" for="wb-settings">Open its <code>ggds-site.json</code> to carry on</label>
    ${errorLine('settings')}
    <input class="ggds-file-upload" id="wb-settings" type="file" accept=".json,application/json">
    </div>
  </div>
</div>

<div class="ggds-notice" id="wb-restored" hidden>
<p class="ggds-notice__title"><span class="ggds-visually-hidden">Information:</span> We kept what you typed last time</p>
<p>It is only on this device. <button class="wb__link-button" type="button" id="wb-reset">Start again with an empty form</button></p>
</div>

<div class="ggds-error-summary" id="wb-errors" role="alert" aria-labelledby="wb-errors-title" tabindex="-1" hidden>
<h2 class="ggds-error-summary__title" id="wb-errors-title">There is a problem</h2>
<ul class="ggds-error-summary__list"></ul>
</div>

<div class="ggds-panel wb__done" id="wb-done" tabindex="-1" hidden>
<h2 class="ggds-panel__title">Your website is ready</h2>
<p class="ggds-panel__body">Your browser has saved <strong id="wb-done-file">website.zip</strong></p>
</div>
<div class="wb__done ggds-measure" id="wb-next" hidden></div>

<nav aria-label="Steps">
<ol class="wb__steps">
${STEPS.map(([id, label], i) => `<li><a class="wb__step-link" href="#wb-step-${id}" data-goto="${i}">${label}</a></li>`).join('\n')}
</ol>
</nav>

<form class="wb__form" id="wb-form" action="#" novalidate>

<section class="wb__step" id="wb-step-who" data-step="0" aria-labelledby="wb-step-who-h" data-preview="index.html">
<h2 id="wb-step-who-h">Step 1 of 5: who you are</h2>
<div class="ggds-field" data-field="known">
<label class="ggds-label" for="wb-known">Your institution, if GGDS already knows it</label>
<p class="ggds-hint" id="wb-known-hint">Fills in your name, initials and colour. Not in the list? Leave it, and type them below.</p>
<select class="ggds-select" id="wb-known" aria-describedby="wb-known-hint">
<option value="">Not in the list</option>
${themes.map((t) => `<option value="${esc(t.slug)}" data-name="${esc(t.name)}" data-short="${esc(t.shortName ?? '')}">${esc(t.name)}</option>`).join('\n')}
</select>
</div>
<div class="ggds-field" data-field="kind">
<fieldset class="ggds-fieldset" aria-describedby="wb-kind-hint">
<legend class="ggds-fieldset__legend">What kind of institution are you?</legend>
<p class="ggds-hint" id="wb-kind-hint">Your website starts with the services and pages this kind of institution needs, in example words you then make your own. Something else? Choose the nearest: you can change every word.</p>
<div class="ggds-choices">
${KINDS.map((k, i) => radio('kind', k.id, esc(k.label), esc(k.hint), i === 0)).join('\n')}
</div>
</fieldset>
</div>
${text('name', 'Full name', { hint: 'As people know it, such as National Communications Authority', autocomplete: 'organization' })}
${text('short', 'Initials', { hint: 'Shown in a round badge until your logo is approved, and in reference numbers. Such as NCA', width: 'short', spellcheck: false })}
${text('purpose', 'What you do, in one sentence', { hint: 'At the top of the homepage and in search results. Start with "We", such as "We license communications services and protect the people who use them."', textarea: true, rows: 2 })}
${text('host', 'Your website\'s address', { hint: 'Such as www.nca.gov.gh. The government banner on every page says this is your official address.', width: 'long', inputmode: 'url', spellcheck: false })}
${nav(0)}
</section>

<section class="wb__step" id="wb-step-do" data-step="1" aria-labelledby="wb-step-do-h" data-preview="index.html" hidden>
<h2 id="wb-step-do-h">Step 2 of 5: what people come to do</h2>
<p class="ggds-measure">Most people come to a government website to do one thing. Put those things first. Each service gets its own page; write what people need to know, in plain words.</p>
<fieldset class="ggds-fieldset">
<legend class="ggds-fieldset__legend">The top of your homepage</legend>
${text('question', 'The question people see first', { hint: 'Such as "What do you need to do?"', width: 'long', path: 'question' })}
${text('lede', 'The line under it', { hint: 'The three or four things most people come to do, in one sentence.', textarea: true, rows: 2, path: 'lede' })}
</fieldset>
<h3>Your services</h3>
<p class="ggds-hint">Open each one to write its page. The ones marked "on the homepage" are the common tasks under the search box.</p>
<div id="wb-services" data-list="services"></div>
<p><button class="ggds-button ggds-button--secondary" type="button" data-add="services">Add a service</button></p>
${nav(1)}
</section>

<section class="wb__step" id="wb-step-pages" data-step="2" aria-labelledby="wb-step-pages-h" data-preview="about.html" hidden>
<h2 id="wb-step-pages-h">Step 3 of 5: your other pages</h2>
<p class="ggds-measure">Every website has a homepage, a page for each service, about us, contact us, search, and the accessibility, privacy and disclaimer pages. Choose the rest, and write their words.</p>
<div class="ggds-field" data-field="parts">
<fieldset class="ggds-fieldset">
<legend class="ggds-fieldset__legend">What else your website needs</legend>
<div class="ggds-choices">
${PARTS.filter((p) => p.id !== 'apply').map((p) => check(`part-${p.id}`, p.label, p.hint, `parts.${p.id}`)).join('\n')}
</div>
</fieldset>
</div>
<details class="ggds-disclosure" data-preview="about.html" open>
<summary class="ggds-disclosure__summary">About us</summary>
<div class="ggds-disclosure__content">
${text('about-what', 'What you do', { hint: 'One thing a line.', lines: true, rows: 4, path: 'about.what' })}
${text('about-who', 'Who runs you', { hint: 'Your board, your head, and who runs you day to day.', textarea: true, rows: 3, path: 'about.who' })}
${text('about-funded', 'How you are funded', { textarea: true, rows: 2, path: 'about.funded' })}
</div>
</details>
<details class="ggds-disclosure" data-part="fees" data-preview="fees.html">
<summary class="ggds-disclosure__summary">Fees and charges</summary>
<div class="ggds-disclosure__content">
${text('fees-lead', 'What people should know first', { hint: 'Such as when the fees apply from, and how to pay.', textarea: true, rows: 2, path: 'fees.lead' })}
<div id="wb-fees" data-list="fees"></div>
<p><button class="ggds-button ggds-button--secondary" type="button" data-add="fees">Add a fee</button></p>
</div>
</details>
<details class="ggds-disclosure" data-part="news" data-preview="news-article.html">
<summary class="ggds-disclosure__summary">News and notices</summary>
<div class="ggds-disclosure__content">
<p class="ggds-hint">Your first news. Add more later, as the website grows. The first one with a full article is the article page.</p>
<div id="wb-news" data-list="news"></div>
<p><button class="ggds-button ggds-button--secondary" type="button" data-add="news">Add news</button></p>
</div>
</details>
<details class="ggds-disclosure" data-part="publications" data-preview="publications.html">
<summary class="ggds-disclosure__summary">Documents to download</summary>
<div class="ggds-disclosure__content">
<p class="ggds-hint">Each one gets a place in the website. Put the real file there before you go live: the guide says how.</p>
<div id="wb-publications" data-list="publications"></div>
<p><button class="ggds-button ggds-button--secondary" type="button" data-add="publications">Add a document</button></p>
</div>
</details>
<details class="ggds-disclosure" data-part="jobs" data-preview="jobs.html">
<summary class="ggds-disclosure__summary">Jobs</summary>
<div class="ggds-disclosure__content">
<div id="wb-jobs" data-list="jobs"></div>
<p><button class="ggds-button ggds-button--secondary" type="button" data-add="jobs">Add a job</button></p>
</div>
</details>
${nav(2)}
</section>

<section class="wb__step" id="wb-step-look" data-step="3" aria-labelledby="wb-step-look-h" data-preview="contact.html" hidden>
<h2 id="wb-step-look-h">Step 4 of 5: contact details and look</h2>
<fieldset class="ggds-fieldset">
<legend class="ggds-fieldset__legend">How people contact you</legend>
${text('phone', 'Phone number', { width: 'medium', type: 'tel', inputmode: 'tel', autocomplete: 'tel' })}
${text('hours', 'Opening hours', { hint: 'Such as Monday to Friday, 8am to 5pm', width: 'long' })}
${text('email', 'Email address', { hint: 'For enquiries. The pages also name accessibility@, privacy@ and consultations@ at the same domain: make sure they reach someone.', width: 'long', type: 'email', autocomplete: 'email', spellcheck: false })}
${text('office1-name', 'Main office', { width: 'medium', field: 'offices', path: 'offices.0.name' })}
${text('office1-lines', 'Its address', { hint: 'One line for each part, with the digital address last', lines: true, rows: 3, field: 'offices', path: 'offices.0.lines' })}
${text('office2-name', 'Another office (optional)', { width: 'medium', field: 'offices', path: 'offices.1.name' })}
${text('office2-lines', 'Its address', { lines: true, rows: 3, field: 'offices', path: 'offices.1.lines' })}
</fieldset>
<fieldset class="ggds-fieldset">
<legend class="ggds-fieldset__legend">Your look</legend>
<div class="ggds-field" data-field="logo">
<label class="ggds-label" for="wb-logo">Your logo (optional)</label>
<p class="ggds-hint" id="wb-logo-hint">Only an approved logo. A square SVG, PNG, JPEG or WebP image, under 200 KB.</p>
${errorLine('logo')}
<input class="ggds-file-upload" id="wb-logo" type="file" accept=".svg,.png,.jpg,.jpeg,.webp,image/svg+xml,image/png,image/jpeg,image/webp" aria-describedby="wb-logo-hint">
</div>
<div class="ggds-field" data-field="theme">
<label class="ggds-label" for="wb-theme">Your colour</label>
<p class="ggds-hint" id="wb-theme-hint">In the header, the homepage and the footer. Links, buttons and forms stay the same on every government website.</p>
${errorLine('theme')}
<select class="ggds-select" id="wb-theme" name="theme" aria-describedby="wb-theme-hint">
${themes.map((t) => `<option value="${esc(t.slug)}" data-accent="${esc(t.accent)}" data-deep="${esc(t.deep)}"${t.slug === defaultTheme ? ' selected' : ''}>${esc(t.name)}</option>`).join('\n')}
<option value="custom">My own colour</option>
</select>
</div>
<div class="ggds-field" data-field="colour" id="wb-colour-field" hidden>
<label class="ggds-label" for="wb-colour">Your own colour</label>
<p class="ggds-hint" id="wb-colour-hint">A hex code from your brand guidelines, such as #006e35. If it is too light to read on white, the website uses the nearest darker shade.</p>
${errorLine('colour')}
<div class="wb__colour">
<input class="ggds-input ggds-input--width-short" id="wb-colour" name="colour" type="text" spellcheck="false" autocapitalize="off" autocomplete="off" aria-describedby="wb-colour-hint" value="#006e35">
<input class="wb__picker" id="wb-picker" type="color" value="#006e35" aria-label="Pick a colour">
</div>
<p class="ggds-hint" id="wb-colour-status" role="status"></p>
</div>
</fieldset>
${nav(3)}
</section>

<section class="wb__step" id="wb-step-get" data-step="4" aria-labelledby="wb-step-get-h" data-preview="index.html" hidden>
<h2 id="wb-step-get-h">Step 5 of 5: get your website</h2>
<div class="ggds-notice ggds-notice--warning" id="wb-examples" hidden>
<p class="ggds-notice__title"><span class="ggds-visually-hidden">Warning:</span> Some words are still the example's</p>
<p>You can download your website now and change them later, but rewrite them before it goes live:</p>
<ul id="wb-examples-list"></ul>
</div>
<div class="ggds-field" data-field="output">
<fieldset class="ggds-fieldset" aria-describedby="wb-output-hint">
<legend class="ggds-fieldset__legend">How will your website go online?</legend>
<p class="ggds-hint" id="wb-output-hint">You get the same website each way, with a guide written for that way.</p>
<div class="ggds-choices">
${radio('output', 'team', 'Our IT team or web host puts it online', 'You get the website as a zip, with a one-page guide to give them.', true)}
${radio('output', 'self', 'I will put it online myself', 'Step by step, on hosting with a control panel (cPanel) or a free host. No coding.')}
${radio('output', 'wordpress', 'On WordPress', 'Your pages, news and menus as a WordPress import, for the GGDS theme.')}
${radio('output', 'developer', 'Our developer builds it with a framework', 'Next.js, Astro or Django, with GGDS set up.')}
</div>
</fieldset>
</div>
<div class="ggds-field" data-field="stack" id="wb-stacks" hidden>
<fieldset class="ggds-fieldset">
<legend class="ggds-fieldset__legend">Which framework?</legend>
<div class="ggds-choices">
${STACKS.filter((s) => s.id !== 'html').map((s, i) => radio('stack', s.id, esc(s.label), esc(s.hint), i === 0)).join('\n')}
</div>
</fieldset>
</div>
<details class="ggds-disclosure">
<summary class="ggds-disclosure__summary">For your developer: forms and search engines</summary>
<div class="ggds-disclosure__content">
${text('forms', 'Where your forms send their answers', { hint: 'The address of your server that receives applications, complaints and messages, starting https://. Leave it empty for now: the forms then show the next page of the example without sending anything.', width: 'long', type: 'url', inputmode: 'url', spellcheck: false })}
<div class="ggds-field" data-field="live">
${errorLine('live')}
<div class="ggds-choices">
${check('live', 'Ready to go live', 'Lets search engines find the website. Leave it until you have rewritten the example words.', 'live')}
</div>
</div>
</div>
</details>
${nav(4)}
<p class="ggds-hint">A zip of 250 KB at most. Keep the <code>ggds-site.json</code> inside it: open it here to change your website, or to make it again with a newer GGDS.</p>
</section>
</form>
</div>

<aside class="wb__aside" aria-labelledby="wb-preview-h">
<h2 id="wb-preview-h" class="ggds-visually-hidden">Preview</h2>
<div class="wb__toolbar">
<div class="ggds-field">
<label class="ggds-label" for="wb-preview-page">Preview a page</label>
<select class="ggds-select" id="wb-preview-page"></select>
</div>
<div class="ggds-button-group">
<button class="ggds-button ggds-button--secondary" type="button" id="wb-preview-size" aria-pressed="false">Phone size</button>
<button class="ggds-button ggds-button--secondary" type="button" id="wb-preview-full" aria-pressed="false">Full screen</button>
</div>
</div>
<div class="wb__preview" id="wb-preview" role="region" tabindex="0" aria-label="Preview of the page, as it will look"><div class="wb__preview-inner" id="wb-preview-inner" inert></div></div>
</aside>
</div>`;
}
