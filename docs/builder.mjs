// The website builder page (builder.html): a form for an institution's details that makes the agency website
// starter as that institution's own website, in the browser, as a zip. docs/builder.js does the work, with the same
// code the build uses (docs/starter-bundle.mjs). Without JavaScript the page says so and offers the example download
// and `npx @ggds/create` instead.
import { esc } from './parts.mjs';
import { DEFAULT_SITE, PARTS } from './starter-site.mjs';
import { STACKS } from './starter-stacks.mjs';

/** The builder's own few styles: layout only, GGDS tokens only. Written to assets/builder/builder.css. */
export const BUILDER_CSS = `/* The website builder (builder.html): layout only, with GGDS tokens. */
.wb[hidden] { display: none; }
.wb { display: grid; gap: var(--ggds-space-8); align-items: start; }
.wb > * { min-width: 0; }
@media (min-width: 64rem) { .wb { grid-template-columns: minmax(0, 3fr) minmax(0, 2fr); } .wb__aside { position: sticky; top: var(--ggds-space-4); } }
.wb__form .ggds-fieldset { margin-bottom: var(--ggds-space-8); }
.wb__form .ggds-fieldset__legend { font-size: var(--ggds-font-size-xl); }
.wb__preview { overflow: hidden; border: 1px solid var(--ggds-color-border-subtle); border-radius: var(--ggds-radius-lg); background: var(--ggds-color-surface); }
.wb__preview-inner { width: 200%; transform: scale(0.5); transform-origin: 0 0; margin-bottom: -50%; }
.wb__preview-inner .ggds-hero__inner { padding-block: var(--ggds-space-8); }
.wb__caption { margin: 0 0 var(--ggds-space-2); color: var(--ggds-color-text-muted); font-size: var(--ggds-font-size-sm); }
.wb__colour { display: flex; gap: var(--ggds-space-2); align-items: center; }
.wb__picker { inline-size: 3rem; block-size: 2.75rem; padding: 0; border: 1px solid var(--ggds-color-border-strong); border-radius: var(--ggds-radius-md); background: none; }
.wb__done[hidden] { display: none; }
`;

const text = (id, label, o = {}) => `<div class="ggds-field" data-field="${o.field ?? id}">
<label class="ggds-label" for="wb-${id}">${label}</label>${o.hint ? `
<p class="ggds-hint" id="wb-${id}-hint">${o.hint}</p>` : ''}
<p class="ggds-error-message" id="wb-${id}-error" hidden><span class="ggds-visually-hidden">Error:</span> <span data-message></span></p>
${o.textarea
    ? `<textarea class="ggds-textarea" id="wb-${id}" name="${id}" rows="${o.rows ?? 3}"${o.hint ? ` aria-describedby="wb-${id}-hint"` : ''}>${esc(o.value ?? '')}</textarea>`
    : `<input class="ggds-input${o.width ? ` ggds-input--width-${o.width}` : ''}" id="wb-${id}" name="${id}" type="${o.type ?? 'text'}"${o.autocomplete ? ` autocomplete="${o.autocomplete}"` : ''}${o.inputmode ? ` inputmode="${o.inputmode}"` : ''}${o.spellcheck === false ? ' spellcheck="false" autocapitalize="off"' : ''}${o.hint ? ` aria-describedby="wb-${id}-hint"` : ''}${o.placeholder ? ` placeholder="${esc(o.placeholder)}"` : ''} value="${esc(o.value ?? '')}">`}
</div>`;

const check = (id, name, label, hint, checked) => `<div class="ggds-choice">
<input class="ggds-choice__input" id="wb-${id}" name="${name}" type="checkbox" value="yes"${checked ? ' checked' : ''}${hint ? ` aria-describedby="wb-${id}-hint"` : ''}>
<label class="ggds-choice__label" for="wb-${id}">${label}${hint ? ` <span class="ggds-choice__hint" id="wb-${id}-hint">${hint}</span>` : ''}</label>
</div>`;

/** The page body. themes: [{ slug, name, accent, deep }]; starterZip: the example download's file name. */
export function builderBody({ themes, defaultTheme, starterZip, version }) {
  const d = DEFAULT_SITE;
  return `<h1>Make your website</h1>
<p class="ggds-lead ggds-measure">Give your institution's details and choose what your website needs. You get a complete government website, built with GGDS ${esc(version)}, ready to put online: every page, the server settings for security and speed, and a guide to hosting it.</p>
<p class="ggds-measure">Everything happens in your browser: nothing you type is sent anywhere. It takes about five minutes.</p>

<div class="ggds-notice" data-wb-fallback>
<p class="ggds-notice__title">The website builder needs JavaScript</p>
<p>Without it, <a href="downloads/${esc(starterZip)}" download>download the example website</a> and change its name and details by hand, or, with Node.js, run <code>npx @ggds/create</code>, which asks the same questions.</p>
</div>

<div class="wb" data-wb hidden>
<div>
<div class="ggds-error-summary" id="wb-errors" role="alert" aria-labelledby="wb-errors-title" tabindex="-1" hidden>
<h2 class="ggds-error-summary__title" id="wb-errors-title">There is a problem</h2>
<ul class="ggds-error-summary__list"></ul>
</div>

<div class="ggds-panel wb__done" id="wb-done" tabindex="-1" hidden>
<h2 class="ggds-panel__title">Your website is ready</h2>
<p class="ggds-panel__body">Your browser has saved <strong id="wb-done-file">website.zip</strong></p>
</div>
<div class="wb__done ggds-measure" id="wb-next" hidden>
<h2>What to do next</h2>
<ol>
<li>Open the zip and read <code>README.md</code>: it says how to run the website and put it online.</li>
<li>Rewrite the example words on each page for your own services. The <a href="get-started/content.html">content guide</a> helps.</li>
<li>Keep <code>ggds-site.json</code>. To change your details later, or move to a newer GGDS, start this page from it.</li>
<li>When the website is online, check it: <code>npx @ggds/check https://<span id="wb-next-host">your address</span></code></li>
</ol>
<p><a href="#wb-form" id="wb-again">Change something and download again</a></p>
</div>

<form class="wb__form" id="wb-form" action="#" novalidate>
<div class="ggds-field">
<label class="ggds-label" for="wb-settings">Start from my settings file (optional)</label>
<p class="ggds-hint" id="wb-settings-hint">If you have made your website here before, choose its <code>ggds-site.json</code> to fill in this form.</p>
<p class="ggds-error-message" id="wb-settings-error" hidden><span class="ggds-visually-hidden">Error:</span> <span data-message></span></p>
<input class="ggds-file-upload" id="wb-settings" type="file" accept=".json,application/json" aria-describedby="wb-settings-hint">
</div>

<fieldset class="ggds-fieldset">
<legend class="ggds-fieldset__legend">Your institution</legend>
${text('name', 'Full name', { hint: 'As people know it, such as National Communications Authority', autocomplete: 'organization', placeholder: d.name })}
${text('short', 'Initials', { hint: 'Shown in a round badge until your logo is approved, and in reference numbers. Such as NCA', width: 'short', spellcheck: false, placeholder: d.short })}
${text('purpose', 'What you do, in one sentence', { hint: 'On the homepage and in search results. Start with "We", such as "We license communications services and protect the people who use them."', textarea: true, rows: 2, placeholder: d.purpose })}
<div class="ggds-field" data-field="logo">
<label class="ggds-label" for="wb-logo">Your logo (optional)</label>
<p class="ggds-hint" id="wb-logo-hint">Only an approved logo. A square SVG, PNG, JPEG or WebP image, under 200 KB.</p>
<p class="ggds-error-message" id="wb-logo-error" hidden><span class="ggds-visually-hidden">Error:</span> <span data-message></span></p>
<input class="ggds-file-upload" id="wb-logo" type="file" accept=".svg,.png,.jpg,.jpeg,.webp,image/svg+xml,image/png,image/jpeg,image/webp" aria-describedby="wb-logo-hint">
</div>
</fieldset>

<fieldset class="ggds-fieldset">
<legend class="ggds-fieldset__legend">Your website's address</legend>
${text('host', 'Address', { hint: 'Such as www.nca.gov.gh. The government website banner on every page says this is your official address.', width: 'long', type: 'text', inputmode: 'url', spellcheck: false, placeholder: d.host })}
</fieldset>

<fieldset class="ggds-fieldset">
<legend class="ggds-fieldset__legend">How people contact you</legend>
${text('phone', 'Phone number', { width: 'medium', type: 'tel', inputmode: 'tel', autocomplete: 'tel', placeholder: d.phone })}
${text('hours', 'Opening hours', { hint: 'Such as Monday to Friday, 8am to 5pm', width: 'long', placeholder: d.hours })}
${text('email', 'Email address', { hint: 'For enquiries. The pages also name accessibility@, privacy@ and consultations@ at the same domain: make sure they reach someone.', width: 'long', type: 'email', autocomplete: 'email', spellcheck: false, placeholder: d.email })}
${text('office1-name', 'Main office', { width: 'medium', value: 'Head office', field: 'offices' })}
${text('office1-lines', 'Its address', { hint: 'One line for each part, with the digital address last', textarea: true, rows: 3, field: 'offices', placeholder: d.offices[0].lines.join('\n') })}
${text('office2-name', 'Another office (optional)', { width: 'medium', field: 'offices', placeholder: d.offices[1].name })}
${text('office2-lines', 'Its address', { textarea: true, rows: 3, field: 'offices' })}
</fieldset>

<fieldset class="ggds-fieldset">
<legend class="ggds-fieldset__legend">Your colour</legend>
<div class="ggds-field" data-field="theme">
<label class="ggds-label" for="wb-theme">Theme</label>
<p class="ggds-hint" id="wb-theme-hint">Your institution's colour, in the header, the homepage and the footer. Links, buttons and forms stay the same on every government website.</p>
<p class="ggds-error-message" id="wb-theme-error" hidden><span class="ggds-visually-hidden">Error:</span> <span data-message></span></p>
<select class="ggds-select" id="wb-theme" name="theme" aria-describedby="wb-theme-hint">
${themes.map((t) => `<option value="${esc(t.slug)}" data-accent="${esc(t.accent)}" data-deep="${esc(t.deep)}"${t.slug === defaultTheme ? ' selected' : ''}>${esc(t.name)}</option>`).join('\n')}
<option value="custom">My own colour</option>
</select>
</div>
<div class="ggds-field" data-field="colour" id="wb-colour-field" hidden>
<label class="ggds-label" for="wb-colour">Your colour</label>
<p class="ggds-hint" id="wb-colour-hint">A hex code from your brand guidelines, such as #006e35. If it is too light to read on white, the website uses the nearest darker shade.</p>
<p class="ggds-error-message" id="wb-colour-error" hidden><span class="ggds-visually-hidden">Error:</span> <span data-message></span></p>
<div class="wb__colour">
<input class="ggds-input ggds-input--width-short" id="wb-colour" name="colour" type="text" spellcheck="false" autocapitalize="off" autocomplete="off" aria-describedby="wb-colour-hint" value="#006e35">
<input class="wb__picker" id="wb-picker" type="color" value="#006e35" aria-label="Pick a colour">
</div>
<p class="ggds-hint" id="wb-colour-status" role="status"></p>
</div>
</fieldset>

<fieldset class="ggds-fieldset" aria-describedby="wb-parts-hint">
<legend class="ggds-fieldset__legend">What your website needs</legend>
<p class="ggds-hint" id="wb-parts-hint">Every website has a homepage, services, about us, contact us, search, and the accessibility, privacy and disclaimer pages. Choose the rest. Each comes with example words for you to rewrite.</p>
<div class="ggds-choices">
${PARTS.map((p) => check(`part-${p.id}`, `part-${p.id}`, p.label, p.hint, d.parts[p.id])).join('\n')}
</div>
</fieldset>

<fieldset class="ggds-fieldset" aria-describedby="wb-stack-hint">
<legend class="ggds-fieldset__legend">What your website is made with</legend>
<p class="ggds-hint" id="wb-stack-hint">The same pages in each. Plain HTML needs no tools. The others are projects for a developer who works with that framework: GGDS's own components make the parts around every page, so a newer GGDS updates them.</p>
<div class="ggds-choices">
${STACKS.map((s) => `<div class="ggds-choice">
<input class="ggds-choice__input" id="wb-stack-${s.id}" name="stack" type="radio" value="${s.id}"${s.id === 'html' ? ' checked' : ''} aria-describedby="wb-stack-${s.id}-hint">
<label class="ggds-choice__label" for="wb-stack-${s.id}">${esc(s.label)} <span class="ggds-choice__hint" id="wb-stack-${s.id}-hint">${esc(s.hint)}</span></label>
</div>`).join('\n')}
</div>
</fieldset>

<fieldset class="ggds-fieldset">
<legend class="ggds-fieldset__legend">Before you go live</legend>
${text('forms', 'Where your forms send their answers (optional)', { hint: 'The address of your server that receives applications, complaints and messages, starting https://. Leave it empty for now: the forms then show the next page of the example without sending anything.', width: 'long', type: 'url', inputmode: 'url', spellcheck: false, placeholder: 'https://forms.example.gov.gh/submit' })}
<div class="ggds-field" data-field="live">
<p class="ggds-error-message" id="wb-live-error" hidden><span class="ggds-visually-hidden">Error:</span> <span data-message></span></p>
<div class="ggds-choices">
${check('live', 'live', 'Ready to go live', 'Lets search engines find the website. Leave it until you have rewritten the example words.', false)}
</div>
</div>
</fieldset>

<div class="ggds-button-group">
<button class="ggds-button" type="submit">Download my website</button>
</div>
<p class="ggds-hint">A zip of 200 KB at most. To make the same website again later, keep the <code>ggds-site.json</code> inside it.</p>
</form>
</div>

<aside class="wb__aside" aria-labelledby="wb-preview-h">
<h2 id="wb-preview-h" class="ggds-visually-hidden">Preview</h2>
<p class="wb__caption" id="wb-preview-caption">Your homepage, as it will look</p>
<div class="wb__preview" id="wb-preview" inert></div>
</aside>
</div>`;
}
