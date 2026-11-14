// The agency website starter: a complete website for an institution, built only with GGDS, to download, copy onto a
// web server and make your own. Every page is plain HTML at the top of one folder, so the links work from any address
// (even opened from the disk); the GGDS files are in ggds/, the site's own small script and styles in assets/.
//
// starterFiles() makes it from an institution's settings (docs/starter-site.mjs): its name, address, contact
// details, colour and the parts it needs. With no settings it makes the made-up "Example Agency": the live preview
// and the release download, built by docs/build.mjs. The website builder (docs/builder.js) runs the same code in
// the browser, so this file and the ones it imports must not import anything from Node.
import { banner, esc, footer, header, hero, icon, mark, tabBar } from './parts.mjs';
import { checkInstitutionColour, institutionCss } from '../packages/tokens/institution.mjs';
import { hostingFiles, hostingGuide } from './starter-hosting.mjs';
import { DEFAULT_SITE, PARTS, SITE_FILE, normaliseSite, pagesFor, siteJson } from './starter-site.mjs';
import { stackFiles } from './starter-stacks.mjs';

/** The made-up institution of the published starter. */
export const STARTER = { name: DEFAULT_SITE.name, short: DEFAULT_SITE.short, purpose: DEFAULT_SITE.purpose, host: DEFAULT_SITE.host };

const ic = (name, cls = 'ggds-icon') => icon(name, cls);
const NAV = [
  { label: 'Services', href: 'services.html' },
  { label: 'News & notices', href: 'news.html' },
  { label: 'Publications', href: 'publications.html' },
  { label: 'About & contact', href: 'about.html' },
];
// Which main section each page belongs to, for the header's current link.
const SECTION = { services: 'services.html', news: 'news.html', publications: 'publications.html', about: 'about.html' };

const crumbs = (items, current) => `<nav class="ggds-breadcrumbs" aria-label="Breadcrumb">
  <ol class="ggds-breadcrumbs__list">
    <li class="ggds-breadcrumbs__item"><a class="ggds-breadcrumbs__link" href="index.html">Home</a></li>
    ${items.map(([l, h]) => `<li class="ggds-breadcrumbs__item"><a class="ggds-breadcrumbs__link" href="${h}">${l}</a></li>`).join('\n    ')}
    <li class="ggds-breadcrumbs__item" aria-current="page">${current}</li>
  </ol>
</nav>`;
const card = (iconName, href, title, text, level = 3) => `<li class="ggds-card ggds-card--icon"><span class="ggds-card__icon">${ic(iconName)}</span><h${level} class="ggds-card__title"><a class="ggds-card__link" href="${href}">${title}</a></h${level}><p class="ggds-card__body">${text}</p></li>`;
const summary = (rows, change) => `<dl class="ggds-summary-list">${rows.map(([k, v, href]) => `
  <div class="ggds-summary-list__row">
    <dt class="ggds-summary-list__key">${k}</dt>
    <dd class="ggds-summary-list__value">${v}</dd>${change ? `
    <dd class="ggds-summary-list__actions"><a href="${href ?? change}">Change<span class="ggds-visually-hidden"> ${k.toLowerCase()}</span></a></dd>` : ''}
  </div>`).join('')}
</dl>`;
const tag = (text, kind = '') => `<strong class="ggds-tag${kind ? ` ggds-tag--${kind}` : ''}">${text}</strong>`;
/** An empty error summary: assets/site.js fills it when a form has problems. */
const errorSummary = `<div class="ggds-error-summary" role="alert" aria-labelledby="error-summary-title" tabindex="-1" hidden>
  <h2 class="ggds-error-summary__title" id="error-summary-title">There is a problem</h2>
  <ul class="ggds-error-summary__list"></ul>
</div>`;
/** A text field that site.js checks: required says what to do when it is empty; pattern and patternMessage, when it is wrong. */
const field = (id, label, o = {}) => `<div class="ggds-field">
  <label class="ggds-label" for="${id}">${label}</label>${o.hint ? `
  <p class="ggds-hint" id="${id}-hint">${o.hint}</p>` : ''}
  ${o.textarea
    ? `<textarea class="ggds-textarea" id="${id}" name="${id}" rows="${o.rows ?? 5}"${o.hint ? ` aria-describedby="${id}-hint"` : ''}${o.required ? ` data-required="${o.required}"` : ''}></textarea>`
    : `<input class="ggds-input${o.width ? ` ggds-input--width-${o.width}` : ''}" id="${id}" name="${id}" type="${o.type ?? 'text'}"${o.autocomplete ? ` autocomplete="${o.autocomplete}"` : ''}${o.inputmode ? ` inputmode="${o.inputmode}"` : ''}${o.spellcheck === false ? ' spellcheck="false"' : ''}${o.hint ? ` aria-describedby="${id}-hint"` : ''}${o.required ? ` data-required="${o.required}"` : ''}${o.pattern ? ` data-pattern="${o.pattern}" data-pattern-message="${o.patternMessage}"` : ''}>`}
</div>`;
const radios = (name, legend, items, required, hint = '') => `<div class="ggds-field">
  <fieldset class="ggds-fieldset"${hint ? ` aria-describedby="${name}-hint"` : ''}${required ? ` data-required="${required}"` : ''}>
    <legend class="ggds-fieldset__legend">${legend}</legend>${hint ? `
    <p class="ggds-hint" id="${name}-hint">${hint}</p>` : ''}
    <div class="ggds-choices">
      ${items.map(([v, l, h]) => `<div class="ggds-choice">
        <input class="ggds-choice__input" id="${name}-${v}" name="${name}" type="radio" value="${v}"${h ? ` aria-describedby="${name}-${v}-hint"` : ''}>
        <label class="ggds-choice__label" for="${name}-${v}">${l}${h ? ` <span class="ggds-choice__hint" id="${name}-${v}-hint">${h}</span>` : ''}</label>
      </div>`).join('\n      ')}
    </div>
  </fieldset>
</div>`;
const timeline = (stages) => `<ol class="ggds-timeline">
  ${stages.map(([state, title, when]) => `<li class="ggds-timeline__item${state ? ` ggds-timeline__item--${state}` : ''}"><p class="ggds-timeline__title"><span class="ggds-visually-hidden">${state === 'done' ? 'Done' : state === 'current' ? 'Now' : 'Next'}: </span>${title}</p><p class="ggds-timeline__when">${when}</p></li>`).join('\n  ')}
</ol>`;
const progress = (label, current, total) => `<div class="ggds-progress">
  <label class="ggds-progress__label" for="progress">${label}</label>
  <progress class="ggds-progress__bar" id="progress" value="${current}" max="${total}">${label}</progress>
</div>`;
const back = (href) => `<p><a class="ggds-with-icon" href="${href}">${ic('arrow-left')}<span>Back</span></a></p>`;

const NEWS = [
  ['news-article.html', '10 November 2026', 'Notice', 'info', 'Offices close early on Friday 13 November', 'Our offices close at 1pm for staff training. Online services stay open.'],
  ['news-article.html', '3 November 2026', 'News', '', 'New rules for mobile money complaints', 'From 1 January, providers must answer a complaint within 10 working days.'],
  ['news-article.html', '27 October 2026', 'Consultation', 'warning', 'Have your say on licence fees for 2027', 'Tell us what you think by 30 November 2026.'],
];
const newsItem = ([href, date, kind, cls, title, text]) => `<li class="ggds-card"><p class="st-meta">${tag(kind, cls)} <time>${date}</time></p><h3 class="ggds-card__title"><a class="ggds-card__link" href="${href}">${title}</a></h3><p class="ggds-card__body">${text}</p></li>`;

const DOCS = [
  ['annual-report-2025.txt', 'Annual report 2025', 'Report', '12 June 2026'],
  ['licence-fees-2027-consultation.txt', 'Licence fees for 2027: consultation', 'Consultation', '27 October 2026'],
  ['consumer-complaints-rules.txt', 'Consumer complaints rules', 'Regulation', '3 November 2026'],
];

/** A list of cards, links or tasks with the ones whose page this website does not have left out. */
const only = (has, items, href = (x) => x[1]) => items.filter((x) => has(href(x)));
/** A link to a page this website has, or just its words. */
const linkIf = (has, href, text) => (has(href) ? `<a href="${href}">${text}</a>` : text);

// ---------------------------------------------------------------------------------------------------------------
// The pages: [file, title, section, body, extra scripts]. s: the settings, escaped for HTML; has(file): whether
// this website has that page.
const PAGES = (s, has) => [
  ['index.html', 'Home', '', () => `${hero({
    purpose: s.raw.purpose,
    title: 'What do you need to do?',
    lede: 'Apply for a licence, make a complaint about a provider, or find our rules and reports.',
    search: { action: 'search.html', label: `Search ${s.raw.name}`, placeholder: 'For example: licence fees' },
    tasksLabel: 'Most people come to:',
    tasks: only(has, [
      { label: 'Apply for a licence', href: 'apply-for-a-licence.html' },
      { label: 'Make a complaint', href: 'complaint.html' },
      { label: 'See our fees', href: 'fees.html' },
      { label: 'Contact us', href: 'contact.html' },
    ], (t) => t.href),
  })}
<div class="ggds-main ggds-container">
  <section class="st-section" aria-labelledby="services-h">
    <h2 id="services-h">Services</h2>
    <ul class="ggds-card-grid">
      ${only(has, [
        ['certificate', 'apply-for-a-licence.html', 'Apply for a licence', 'Who needs one, what it costs and how to apply online.'],
        ['comment', 'complaint.html', 'Make a complaint', 'When a provider has not solved your problem.'],
        ['cedi', 'fees.html', 'Fees and charges', 'What each licence costs, and how to pay.'],
        ['document', 'publications.html', 'Rules and reports', 'Regulations, consultations and our annual reports.'],
        ['briefcase', 'jobs.html', 'Jobs and tenders', 'Work for us, or bid to supply us.'],
        ['phone', 'contact.html', 'Contact us', 'Phone, email, offices and opening hours.'],
      ]).map((c) => card(...c)).join('\n      ')}
    </ul>
  </section>${has('news.html') ? `
  <section class="st-section" aria-labelledby="news-h">
    <div class="st-section-head"><h2 id="news-h">News and notices</h2><a class="ggds-with-icon" href="news.html"><span>All news and notices</span>${ic('arrow-right')}</a></div>
    <ul class="ggds-card-grid">${NEWS.map(newsItem).join('')}</ul>
  </section>` : ''}
</div>`],

  ['services.html', 'Services', 'services', () => `<div class="ggds-main ggds-container">
  ${crumbs([], 'Services')}
  <h1>Services</h1>
  <p class="ggds-lead ggds-measure">Everything you can do with ${s.name}, online or at our offices.</p>${[
    ['Licences', [['certificate', 'apply-for-a-licence.html', 'Apply for a licence', 'Who needs one, what it costs and how to apply online.'], ['cedi', 'fees.html', 'Fees and charges', 'What each licence costs, and how to pay.']]],
    ['Help for consumers', [['comment', 'complaint.html', 'Make a complaint', 'When a provider has not solved your problem.'], ['phone', 'contact.html', 'Contact us', 'Phone, email, offices and opening hours.']]],
    ['Information', [['document', 'publications.html', 'Rules and reports', 'Regulations, consultations and our annual reports.'], ['briefcase', 'jobs.html', 'Jobs and tenders', 'Work for us, or bid to supply us.'], ['news', 'news.html', 'News and notices', 'What is new, and notices that affect you.']]],
  ].map(([h, cards]) => [h, only(has, cards)]).filter(([, cards]) => cards.length).map(([h, cards]) => `
  <h2>${h}</h2>
  <ul class="ggds-card-grid">
    ${cards.map((c) => card(...c)).join('\n    ')}
  </ul>`).join('')}
</div>`],

  ['apply-for-a-licence.html', 'Apply for a licence', 'services', () => `<div class="ggds-main ggds-container">
  ${crumbs([['Services', 'services.html']], 'Apply for a licence')}
  <div class="st-layout">
    <div>
      <h1>Apply for a licence</h1>
      <p class="ggds-lead">Apply for a licence to run a communications service in Ghana. It takes about 15 minutes.</p>
      <h2>Who needs a licence</h2>
      <ul><li>internet service providers</li><li>radio and television stations</li><li>courier companies</li></ul>
      <h2>What you need</h2>
      <ul><li>your Ghana Card number</li><li>your business registration number</li><li>the fee${has('fees.html') ? ': see <a href="fees.html">fees and charges</a>' : ''}</li></ul>
      <h2>How long it takes</h2>
      <p>We decide within 20 working days. We will tell you by SMS and email.</p>
      <p><a class="ggds-button ggds-with-icon" href="apply.html"><span>Start now</span>${ic('arrow-right')}</a></p>
    </div>
    <aside class="st-aside" aria-labelledby="apply-help-h">
      <h2 id="apply-help-h" class="st-aside__title">${ic('help')} Need help?</h2>
      <p>Call <strong>${s.phone}</strong>, ${s.hours}, or <a href="contact.html">visit an office</a>.</p>
    </aside>
  </div>
</div>`],

  ['apply.html', 'Your details', 'services', () => `<div class="ggds-main ggds-container st-narrow">
  ${back('apply-for-a-licence.html')}
  ${errorSummary}
  ${progress('Step 1 of 3: your details', 1, 3)}
  <h1>Your details</h1>
  <form action="apply-check.html" method="get" novalidate data-validate>
    ${field('name', 'Full name', { hint: 'As shown on your Ghana Card', width: 'long', autocomplete: 'name', spellcheck: false, required: 'Enter your full name' })}
    ${field('card', 'Ghana Card number', { hint: 'For example, GHA-123456789-0', width: 'medium', spellcheck: false, required: 'Enter your Ghana Card number', pattern: '^GHA-?\\d{9}-?\\d$', patternMessage: 'Enter a Ghana Card number in the right format, like GHA-123456789-0' })}
    ${field('phone', 'Mobile phone number', { hint: 'We will text you about your application. For example, 024 123 4567', width: 'medium', type: 'tel', autocomplete: 'tel', inputmode: 'tel', required: 'Enter your mobile phone number', pattern: '^(\\+?233|0)\\s?\\d{2}\\s?\\d{3}\\s?\\d{4}$', patternMessage: 'Enter a mobile phone number with 10 digits, like 024 123 4567' })}
    ${radios('licence', 'Which licence do you need?', [['internet', 'Internet service provider'], ['broadcast', 'Radio or television'], ['courier', 'Courier service']], 'Select the licence you need')}
    <div class="ggds-button-group"><button class="ggds-button" type="submit">Continue</button></div>
  </form>
</div>`],

  ['apply-check.html', 'Check your answers', 'services', () => `<div class="ggds-main ggds-container st-narrow">
  ${back('apply.html')}
  ${progress('Step 2 of 3: check your answers', 2, 3)}
  <h1>Check your answers before you apply</h1>
  ${summary([['Full name', '<span data-answer="name">Ama Owusu</span>'], ['Ghana Card number', '<span data-answer="card">GHA-000000000-0</span>'], ['Mobile phone number', '<span data-answer="phone">024 000 0000</span>'], ['Licence', '<span data-answer="licence">Internet service provider</span>']], 'apply.html')}
  ${s.form('apply-done.html', 'application')}
    ${errorSummary}${s.raw.forms ? `
    ${['name', 'card', 'phone', 'licence'].map((n) => `<input type="hidden" name="${n}" value="" data-answer="${n}">`).join('\n    ')}` : ''}
    <div class="ggds-field">
      <fieldset class="ggds-fieldset" data-required="Confirm your answers are true">
        <legend class="ggds-fieldset__legend">Declaration</legend>
        <div class="ggds-choices">
          <div class="ggds-choice"><input class="ggds-choice__input" id="declare-yes" name="declare" type="checkbox" value="yes"><label class="ggds-choice__label" for="declare-yes">I confirm my answers are true and complete.</label></div>
        </div>
      </fieldset>
    </div>
    <div class="ggds-button-group"><button class="ggds-button" type="submit">Send application</button></div>
  </form>
</div>`],

  ['apply-done.html', 'Application sent', 'services', () => `<div class="ggds-main ggds-container st-narrow">
  <div class="ggds-panel">
    <h1 class="ggds-panel__title">Application sent</h1>
    <p class="ggds-panel__body">Your reference number <strong class="ggds-panel__reference">${s.short}-LIC-2026-00412</strong></p>
  </div>
  <p>We have sent the reference to your phone by SMS. You will need it if you contact us.</p>
  <h2>What happens next</h2>
  ${timeline([['done', 'Application received', 'Today'], ['current', 'We check your answers and documents', 'Within 10 working days'], ['', 'You pay the licence fee', 'We will text you how'], ['', 'Your licence arrives by email', 'Within 20 working days']])}
  <p><a href="index.html">Go to the homepage</a></p>
</div>`],

  ['fees.html', 'Fees and charges', 'services', () => `<div class="ggds-main ggds-container">
  ${crumbs([['Services', 'services.html']], 'Fees and charges')}
  <h1>Fees and charges</h1>
  <p class="ggds-lead ggds-measure">What each licence costs from 1 January 2027. Pay by mobile money, bank card or at an office.</p>
  <div class="ggds-table-wrap" role="region" aria-labelledby="fees-caption" tabindex="0">
    <table class="ggds-table">
      <caption class="ggds-table__caption" id="fees-caption">Licence fees, in Ghana cedis</caption>
      <thead><tr><th scope="col">Licence</th><th scope="col" class="ggds-table__numeric">To apply</th><th scope="col" class="ggds-table__numeric">Each year</th></tr></thead>
      <tbody>
        <tr><th scope="row">Internet service provider</th><td class="ggds-table__numeric">GH₵ 500</td><td class="ggds-table__numeric">GH₵ 2,000</td></tr>
        <tr><th scope="row">Radio or television</th><td class="ggds-table__numeric">GH₵ 750</td><td class="ggds-table__numeric">GH₵ 3,500</td></tr>
        <tr><th scope="row">Courier service</th><td class="ggds-table__numeric">GH₵ 250</td><td class="ggds-table__numeric">GH₵ 900</td></tr>
      </tbody>
    </table>
  </div>${has('news-article.html') ? `
  <div class="ggds-notice">
    <p class="ggds-notice__title"><span class="ggds-visually-hidden">Information:</span> Fees may change in 2027</p>
    <p><a href="news-article.html">Have your say on licence fees for 2027</a> by 30 November 2026.</p>
  </div>` : ''}
</div>`],

  ['complaint.html', 'Make a complaint', 'services', () => `<div class="ggds-main ggds-container st-narrow">
  ${crumbs([['Services', 'services.html']], 'Make a complaint')}
  ${errorSummary}
  <h1>Make a complaint about a provider</h1>
  <p>Complain to the company first. If it has not solved the problem within 10 working days, tell us.</p>
  ${s.form('complaint-done.html', 'complaint')}
    ${field('company', 'Which company is it about?', { width: 'long', required: 'Enter the name of the company' })}
    ${field('problem', 'What happened?', { textarea: true, hint: 'Include dates and what the company told you. Do not include your PIN or passwords.', required: 'Tell us what happened' })}
    ${radios('outcome', 'What would you like to happen?', [['fix', 'The problem is fixed'], ['refund', 'I get my money back'], ['other', 'Something else']], 'Select what you would like to happen')}
    ${field('contact-phone', 'Mobile phone number', { hint: 'So we can tell you what happens next', width: 'medium', type: 'tel', autocomplete: 'tel', inputmode: 'tel', required: 'Enter your mobile phone number', pattern: '^(\\+?233|0)\\s?\\d{2}\\s?\\d{3}\\s?\\d{4}$', patternMessage: 'Enter a mobile phone number with 10 digits, like 024 123 4567' })}
    <div class="ggds-button-group"><button class="ggds-button" type="submit">Send complaint</button></div>
  </form>
</div>`],

  ['complaint-done.html', 'Complaint sent', 'services', () => `<div class="ggds-main ggds-container st-narrow">
  <div class="ggds-panel">
    <h1 class="ggds-panel__title">Complaint sent</h1>
    <p class="ggds-panel__body">Your reference number <strong class="ggds-panel__reference">${s.short}-CMP-2026-01187</strong></p>
  </div>
  <h2>What happens next</h2>
  ${timeline([['done', 'Complaint received', 'Today'], ['current', 'We contact the company', 'Within 5 working days'], ['', 'We tell you what the company will do', 'Within 10 working days']])}
  <p><a href="index.html">Go to the homepage</a></p>
</div>`],

  ['news.html', 'News and notices', 'news', () => `<div class="ggds-main ggds-container">
  ${crumbs([], 'News and notices')}
  <h1>News and notices</h1>
  <p class="ggds-lead ggds-measure">News, notices and consultations from ${s.name}.</p>
  <ul class="ggds-card-grid">${NEWS.map(newsItem).join('')}</ul>
  <nav class="ggds-pagination" aria-label="Pages of news">
    <ul class="ggds-pagination__list">
      <li><a class="ggds-pagination__link" href="news.html" aria-label="Page 1" aria-current="page">1</a></li>
      <li><a class="ggds-pagination__link" href="news.html" aria-label="Page 2">2</a></li>
      <li><a class="ggds-pagination__link" href="news.html" rel="next">Next<span class="ggds-visually-hidden"> page</span></a></li>
    </ul>
  </nav>
</div>`],

  ['news-article.html', 'Have your say on licence fees for 2027', 'news', () => `<div class="ggds-main ggds-container">
  ${crumbs([['News and notices', 'news.html']], 'Have your say on licence fees for 2027')}
  <p class="st-meta">${tag('Consultation', 'warning')} <time>27 October 2026</time></p>
  <h1>Have your say on licence fees for 2027</h1>
  <div class="ggds-prose">
    <p class="ggds-lead">We plan to change some licence fees from 1 January 2027. Tell us what you think by 30 November 2026.</p>
    <h2>What we plan to change</h2>
    <ul><li>Courier licences would cost GH₵ 900 a year, up from GH₵ 800.</li><li>Small internet providers, with fewer than 1,000 customers, would pay half the yearly fee.</li></ul>
    <h2>How to respond</h2>
    <p>Read the consultation, then email <a href="mailto:${s.mail('consultations')}">${s.mail('consultations')}</a> or write to us at our head office.</p>
    <p><a class="ggds-with-icon" href="assets/files/licence-fees-2027-consultation.txt" download>${ic('download')}<span>Licence fees for 2027: consultation (TXT, 1 KB)</span></a></p>
  </div>
</div>`],

  ['publications.html', 'Rules and reports', 'publications', () => `<div class="ggds-main ggds-container">
  ${crumbs([], 'Rules and reports')}
  <h1>Rules and reports</h1>
  <p class="ggds-lead ggds-measure">Our regulations, consultations and reports. Each one is also a web page you can read on a phone.</p>
  <div class="ggds-table-wrap" role="region" aria-labelledby="docs-caption" tabindex="0">
    <table class="ggds-table">
      <caption class="ggds-table__caption" id="docs-caption">Publications, newest first</caption>
      <thead><tr><th scope="col">Title</th><th scope="col">Type</th><th scope="col">Published</th></tr></thead>
      <tbody>
        ${DOCS.slice().reverse().map(([file, title, kind, date]) => `<tr><th scope="row"><a class="ggds-with-icon" href="assets/files/${file}" download>${ic('download', 'ggds-icon ggds-icon--sm')}<span>${title} <span class="st-muted">(TXT, 1 KB)</span></span></a></th><td>${kind}</td><td>${date}</td></tr>`).join('\n        ')}
      </tbody>
    </table>
  </div>
</div>`],

  ['jobs.html', 'Jobs and tenders', 'about', () => `<div class="ggds-main ggds-container">
  ${crumbs([['About us', 'about.html']], 'Jobs and tenders')}
  <h1>Jobs and tenders</h1>
  <div class="ggds-notice ggds-notice--danger">
    <p class="ggds-notice__title"><span class="ggds-visually-hidden">Important:</span> We never charge a fee to apply</p>
    <p>Not for a job and not for a tender. If anyone asks you for money, call ${s.phone}.</p>
  </div>
  <h2 id="jobs">Jobs</h2>
  <ul class="ggds-card-grid">
    <li class="ggds-card"><p class="st-meta">${tag('Closes 20 November', 'warning')}</p><h3 class="ggds-card__title"><a class="ggds-card__link" href="assets/files/job-licensing-officer.txt" download>Licensing officer</a></h3><p class="ggds-card__body">Accra · Grade 4 · Full time. Job description (TXT).</p></li>
    <li class="ggds-card"><p class="st-meta">${tag('Closes 4 December', 'info')}</p><h3 class="ggds-card__title"><a class="ggds-card__link" href="assets/files/job-consumer-advisor.txt" download>Consumer advisor</a></h3><p class="ggds-card__body">Kumasi · Grade 3 · Full time. Job description (TXT).</p></li>
  </ul>
  <h2 id="tenders">Tenders</h2>
  <p>We publish every tender under the public procurement law. There are no tenders open now.${has('news.html') ? ' <a href="news.html">See news and notices</a> for new ones.' : ''}</p>
</div>`],

  ['about.html', 'About us', 'about', () => `<div class="ggds-main ggds-container">
  ${crumbs([], 'About us')}
  <div class="st-layout">
    <div class="ggds-prose">
      <h1>About us</h1>
      <p class="ggds-lead">${s.purpose}</p>
      <h2>What we do</h2>
      <ul><li>We license internet, broadcasting and courier services.</li><li>We set the rules they must follow, and check they do.</li><li>We help people whose provider has not solved a problem.</li></ul>
      <h2>Who runs us</h2>
      <p>A board of 7 members leads ${s.name}. A director-general runs it day to day.</p>
      <h2>How we are funded</h2>
      <p>By licence fees. We publish what we spend in our ${linkIf(has, 'publications.html', 'annual report')}.</p>
    </div>
    <aside class="st-aside" aria-labelledby="about-more-h">
      <h2 id="about-more-h" class="st-aside__title">${ic('building')} More about us</h2>
      <ul class="st-links">${only(has, [['Contact us', 'contact.html'], ['Jobs and tenders', 'jobs.html'], ['Annual reports', 'publications.html']]).map(([l, h]) => `<li><a href="${h}">${l}</a></li>`).join('')}</ul>
    </aside>
  </div>
</div>`],

  ['contact.html', 'Contact us', 'about', () => `<div class="ggds-main ggds-container">
  ${crumbs([['About us', 'about.html']], 'Contact us')}
  <h1>Contact us</h1>${(() => {
    const online = only(has, [['apply for a licence', 'apply-for-a-licence.html'], ['make a complaint', 'complaint.html']]);
    if (!online.length) return '';
    const ask = online.length === 2 ? 'Want to apply or complain?' : online[0][1] === 'complaint.html' ? 'Want to complain?' : 'Want to apply?';
    return `\n  <p class="ggds-lead ggds-measure">${ask} It is quickest online: ${online.map(([l, h]) => `<a href="${h}">${l}</a>`).join(' or ')}.</p>`;
  })()}
  <div class="st-layout">
    <div>
      <h2>Phone and email</h2>
      ${summary([['Phone', `${s.phone}, ${s.hours}`], ['Email', `<a href="mailto:${s.email}">${s.email}</a>. We reply within 5 working days.`], ['WhatsApp', 'Not available']])}
      <h2>Send us a message</h2>
      ${errorSummary}
      ${s.form('contact-done.html', 'message', '      ')}
        ${field('your-name', 'Your name', { width: 'long', autocomplete: 'name', required: 'Enter your name' })}
        ${field('your-email', 'Email address', { hint: 'So we can reply', width: 'long', type: 'email', autocomplete: 'email', spellcheck: false, required: 'Enter your email address', pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$', patternMessage: 'Enter an email address in the right format, like name@example.com' })}
        ${field('message', 'Your message', { textarea: true, required: 'Enter your message' })}
        <div class="ggds-button-group"><button class="ggds-button" type="submit">Send message</button></div>
      </form>
    </div>
    <aside class="st-aside" aria-labelledby="offices-h">
      <h2 id="offices-h" class="st-aside__title">${ic('location')} Offices</h2>${s.offices.map((o) => `
      <h3>${o.name}</h3>
      <address>${o.lines.join('<br>')}</address>`).join('')}
      <p>Open ${s.hours}. Closed on public holidays.</p>
    </aside>
  </div>
</div>`],

  ['contact-done.html', 'Message sent', 'about', () => `<div class="ggds-main ggds-container st-narrow">
  <div class="ggds-panel">
    <h1 class="ggds-panel__title">Message sent</h1>
    <p class="ggds-panel__body">We will reply within 5 working days.</p>
  </div>
  <p><a href="index.html">Go to the homepage</a></p>
</div>`],

  ['search.html', 'Search', '', () => `<div class="ggds-main ggds-container">
  ${crumbs([], 'Search')}
  <h1>Search</h1>
  <form class="st-search" action="search.html" method="get" role="search">
    <div class="ggds-field">
      <label class="ggds-label" for="q">Search ${s.name}</label>
      <input class="ggds-input ggds-input--width-long" id="q" name="q" type="search" enterkeyhint="search" autocomplete="off">
    </div>
    <div class="ggds-button-group"><button class="ggds-button" type="submit">Search</button></div>
  </form>
  <p class="st-search__status" id="search-status" role="status"></p>
  <ol class="st-results" id="search-results"></ol>
  <section id="all-pages" aria-labelledby="all-pages-h">
    <h2 id="all-pages-h">Every page, A to Z</h2>
    <ul class="st-links">{{A_TO_Z}}</ul>
  </section>
</div>`, ['assets/search.js']],

  ['404.html', 'Page not found', '', () => `<div class="ggds-main ggds-container ggds-measure">
  <h1>Page not found</h1>
  <p>If you typed the web address, check it is correct.</p>
  <p>If you pasted the web address, check you copied the entire address.</p>
  <p>You can <a href="search.html">search the website</a> or <a href="index.html">go to the homepage</a>.</p>
</div>`],

  ['accessibility.html', 'Accessibility statement', '', () => `<div class="ggds-main ggds-container">
  ${crumbs([], 'Accessibility statement')}
  <div class="ggds-prose">
    <h1>Accessibility statement</h1>
    <p class="ggds-lead">We want everyone to be able to use this website, whatever their abilities and whatever phone or computer they use.</p>
    <h2>How accessible this website is</h2>
    <p>It is built with the Ghana Government Design System (GGDS), which is tested against the WCAG 2.2 AA standard. You can zoom to 400%, use a keyboard alone, and use a screen reader.</p>
    <h2>If something does not work for you</h2>
    <p>Call ${s.phone} or email <a href="mailto:${s.mail('accessibility')}">${s.mail('accessibility')}</a>. We will reply within 5 working days.</p>
    <p>This statement was last checked on 10 November 2026.</p>
  </div>
</div>`],

  ['privacy.html', 'Privacy', '', () => `<div class="ggds-main ggds-container">
  ${crumbs([], 'Privacy')}
  <div class="ggds-prose">
    <h1>Privacy</h1>
    <p class="ggds-lead">How we use the information you give us, under the Data Protection Act.</p>
    <h2>What we collect</h2>
    <p>Only what each service needs: for example, your name, Ghana Card number and phone number when you apply for a licence.</p>
    <h2>How long we keep it</h2>
    <p>For as long as the law says, then we delete it.</p>
    <h2>Your rights</h2>
    <p>You can ask to see or correct what we hold about you. Email <a href="mailto:${s.mail('privacy')}">${s.mail('privacy')}</a>.</p>
  </div>
</div>`],

  ['disclaimer.html', 'Disclaimer', '', () => `<div class="ggds-main ggds-container">
  ${crumbs([], 'Disclaimer')}
  <div class="ggds-prose">
    <h1>Disclaimer</h1>
    <p class="ggds-lead">What you can rely on from this website, and what you cannot.</p>
    <h2>The information on this website</h2>
    <p>We check what we publish and keep it up to date, but it is guidance, not a statement of the law. The laws and regulations themselves are ${has('publications.html') ? 'on <a href="publications.html">Publications</a>' : 'published by Parliament and in the Gazette'}. If something here differs from them, they apply.</p>
    <h2>Links to other websites</h2>
    <p>We link to other websites when they help. We are not responsible for what they say or how they work.</p>
    <h2>If something is wrong</h2>
    <p>Tell us at <a href="mailto:${s.email}">${s.email}</a> and we will correct it.</p>
  </div>
</div>`],
];

/** The theme stylesheet a page loads: a ready-made theme in ggds/themes/, or the website's own colour in assets/. */
const themeHref = (theme) => (/^#[0-9a-f]{6}$/i.test(theme) ? 'assets/theme.css' : `ggds/themes/${theme}.css`);

/**
 * Everything a starter is made from, whatever it is written in (docs/starter-stacks.mjs writes it in a framework):
 * the settings, the pages, the parts around every page (frame) and the website's other files (assets).
 * site: the institution's settings (docs/starter-site.mjs); left out, the made-up Example Agency. theme: the
 * ready-made theme when site does not give one.
 */
export function starterModel({ version, theme, site } = {}) {
  const raw = normaliseSite({ ...(theme && !site?.theme ? { theme } : {}), ...site });
  const present = pagesFor(raw);
  const has = (file) => present.has(file);
  const mailDomain = raw.email.split('@')[1] ?? raw.host.replace(/^www\./, '');
  const s = {
    raw,
    name: esc(raw.name), short: esc(raw.short), purpose: esc(raw.purpose), phone: esc(raw.phone), hours: esc(raw.hours), email: esc(raw.email),
    offices: raw.offices.map((o) => ({ name: esc(o.name), lines: o.lines.map(esc) })),
    mail: (who) => esc(`${who}@${mailDomain}`),
    // A form's opening tag: to the next page of the example, or, when the website has a server for its forms, to it.
    form: (next, kind, indent = '  ') => (raw.forms
      ? `<form action="${esc(raw.forms)}" method="post" novalidate data-validate>\n${indent}  <input type="hidden" name="form" value="${kind}">`
      : `<form action="${next}" method="get" novalidate data-validate>`),
  };
  const pages = PAGES(s, has).filter(([file]) => has(file)).map(([file, title, section, body, scripts = []]) => ({ file, title, section, body: body(), scripts }));
  const aToZ = pages.filter((p) => p.file !== '404.html').slice().sort((a, b) => a.title.localeCompare(b.title))
    .map((p) => `<li><a href="${p.file}">${esc(p.title)}</a></li>`).join('');
  // main: what goes inside <main>.
  for (const p of pages) p.main = p.body.replace('{{A_TO_Z}}', aToZ);
  const text = (h) => h.replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/g, ' ').replace(/\s+/g, ' ').trim();
  const logo = mark({ logo: raw.logo, alt: '', initials: raw.short });
  const footerLogo = mark({ logo: raw.logo, alt: '', initials: raw.short, cls: 'ggds-footer__logo', size: 48 });
  const footerAddress = (lines) => (lines.length > 2 ? `${lines.slice(0, -1).join(', ')} · ${lines.at(-1)}` : lines.join(', '));
  const frame = {
    banner: { unofficial: false, shortName: raw.short, host: raw.host, registerHref: 'https://ghana-gds.github.io/ggds/register.html' },
    header: { name: raw.name, logo, nav: only(has, NAV, (n) => n.href), navId: 'site-nav', home: 'index.html', search: 'search.html' },
    /** The header link a page marks as current. */
    current: (p) => SECTION[p.section],
    footer: {
      name: raw.name,
      logo: footerLogo,
      purpose: raw.purpose,
      contact: { address: footerAddress(raw.offices[0].lines), email: raw.email, phone: raw.phone, moreHref: 'contact.html' },
      sections: [
        { label: 'Services', href: 'services.html', links: only(has, [{ label: 'Apply for a licence', href: 'apply-for-a-licence.html' }, { label: 'Make a complaint', href: 'complaint.html' }, { label: 'Fees and charges', href: 'fees.html' }], (l) => l.href) },
        { label: 'Information', href: has('publications.html') ? 'publications.html' : 'search.html', links: only(has, [{ label: 'Rules and reports', href: 'publications.html' }, { label: 'News and notices', href: 'news.html' }, { label: 'Jobs and tenders', href: 'jobs.html' }], (l) => l.href) },
        { label: 'About & contact', href: 'about.html', links: [{ label: 'About us', href: 'about.html' }, { label: 'Contact us', href: 'contact.html' }] },
      ].filter((sec) => sec.links.length),
      bar: [['Accessibility', 'accessibility.html'], ['Privacy', 'privacy.html'], ['Disclaimer', 'disclaimer.html'], ['Search', 'search.html']],
    },
    /** The tab bar on a page, with its current tab. */
    tabs: (p) => [
      { label: 'Home', href: 'index.html', icon: 'home', current: p.file === 'index.html' },
      { label: 'Services', href: 'services.html', icon: 'services', current: p.section === 'services' },
      { label: 'Contact', href: 'contact.html', icon: 'phone', current: p.file === 'contact.html' },
      { label: 'Search', href: 'search.html', icon: 'search', current: p.file === 'search.html' },
    ],
  };
  const doc = (title) => `${title}\n${raw.name} (an example organisation: this is not a real document)\n\nReplace this file with your own.\n`;
  const documents = {};
  if (has('publications.html') || has('news-article.html')) for (const [file, title] of DOCS) documents[`assets/files/${file}`] = doc(title);
  if (has('jobs.html')) {
    documents['assets/files/job-licensing-officer.txt'] = doc('Licensing officer, grade 4: job description');
    documents['assets/files/job-consumer-advisor.txt'] = doc('Consumer advisor, grade 3: job description');
  }
  const colour = themeHref(raw.theme) === 'assets/theme.css' ? checkInstitutionColour(raw.theme) : null;
  const assets = {
    searchIndex: `${JSON.stringify(pages.filter((p) => !['404.html', 'search.html'].includes(p.file) && !/-done\.html$|apply(-check)?\.html$/.test(p.file))
      .map((p) => ({ url: p.file, title: p.title, text: text(p.body).slice(0, 600) })))}\n`,
    documents,
    themeCss: colour ? `/* ${raw.name.replace(/\*\//g, '')}: the institution's colour${colour.ok ? '' : ` (${raw.theme} is too light to read on white, so this is the nearest shade that passes)`}. Made with the GGDS website builder. */\n${institutionCss(colour.ok ? raw.theme : colour.suggestion)}` : '',
    siteCss: siteCss(raw.name),
    siteJs: SITE_JS,
    searchJs: has('search.html') ? SEARCH_JS : '',
    hosting: hostingFiles({ host: raw.host, formsOrigin: raw.forms ? new URL(raw.forms).origin : '' }),
    siteJson: siteJson(raw, version),
  };
  return { raw, s, has, pages, frame, assets };
}

/**
 * Every file in the plain HTML starter, as { path: text }, except the GGDS files (ggds/), which the build copies in.
 * With stack (next, astro, django), the same website as a framework project: see starterProject.
 */
export function starterFiles({ version, theme, site, stack = 'html' } = {}) {
  return starterProject({ version, theme, site, stack }).files;
}

/**
 * The starter as { files: { path: text }, assetDir, ggds }: assetDir is where the website's own files (its logo)
 * go; ggds is true when the GGDS files must be copied into ggds/ (plain HTML). stack: html (default), next, astro or
 * django.
 */
export function starterProject({ version, theme, site, stack = 'html' } = {}) {
  const model = starterModel({ version, theme, site });
  if (stack !== 'html') return { ...stackFiles(model, stack, { version }), ggds: false };
  const { raw, s, pages, frame, assets } = model;
  const files = {};
  for (const p of pages) {
    const isHome = p.file === 'index.html';
    files[p.file] = `<!doctype html>
<html lang="en-GB">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${isHome ? s.name : `${esc(p.title)} | ${s.name}`}</title>
  <meta name="description" content="${s.purpose}">${raw.live ? '' : `
  <!-- Remove this line when your website goes live, so search engines can find it. -->
  <meta name="robots" content="noindex, nofollow">`}
  <link rel="stylesheet" href="ggds/ggds.min.css">
  <link rel="stylesheet" href="${themeHref(raw.theme)}">
  <link rel="stylesheet" href="assets/site.css">
  <script type="module" src="ggds/auto.js"></script>
  <script type="module" src="assets/site.js"></script>${p.scripts.map((x) => `\n  <script type="module" src="${x}"></script>`).join('')}
</head>
<body>
<a class="ggds-skip-link" href="#main">Skip to main content</a>
${banner(frame.banner)}
${header({ ...frame.header, current: frame.current(p) })}
<main id="main" tabindex="-1">
${p.main}
</main>
${footer(frame.footer)}
${tabBar(frame.tabs(p))}
</body>
</html>
`;
  }
  files['search-index.json'] = assets.searchIndex;
  Object.assign(files, assets.documents);
  if (assets.themeCss) files['assets/theme.css'] = assets.themeCss;
  files['assets/site.css'] = assets.siteCss;
  files['assets/site.js'] = assets.siteJs;
  if (assets.searchJs) files['assets/search.js'] = assets.searchJs;
  Object.assign(files, assets.hosting);
  files[SITE_FILE] = assets.siteJson;
  files['README.md'] = readme(version, raw, pages.length);
  return { files, assetDir: 'assets/', ggds: true };
}

// The site's own layout, on top of GGDS: only GGDS tokens.
const siteCss = (name) => `/* ${name.replace(/\*\//g, '')}: the layout this website adds to GGDS. Only GGDS tokens: change the theme, not these. */
.st-section { margin-bottom: var(--ggds-space-12); }
.st-section-head { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: var(--ggds-space-2) var(--ggds-space-6); }
.st-layout { display: grid; gap: var(--ggds-space-8); align-items: start; }
.st-layout > * { min-width: 0; }
@media (min-width: 64rem) { .st-layout { grid-template-columns: minmax(0, 2fr) minmax(0, 1fr); } }
.st-narrow { max-width: 40rem; }
.st-aside { padding: var(--ggds-space-6); border-top: 4px solid var(--ggds-color-institution); border-radius: var(--ggds-radius-lg); background: var(--ggds-color-surface-sunken); }
.st-aside > :last-child { margin-bottom: 0; }
.st-aside__title { display: flex; align-items: center; gap: var(--ggds-space-2); margin-top: 0; font-size: var(--ggds-font-size-xl); }
.st-meta { display: flex; flex-wrap: wrap; align-items: center; gap: var(--ggds-space-2); margin: 0 0 var(--ggds-space-2); color: var(--ggds-color-text-muted); font-size: var(--ggds-font-size-sm); }
.st-muted { color: var(--ggds-color-text-muted); font-weight: 400; }
.st-links { padding-left: var(--ggds-space-6); }
.st-links li { margin-bottom: var(--ggds-space-2); }
.st-search { max-width: 40rem; }
.st-results { padding-left: var(--ggds-space-6); }
.st-results li { margin-bottom: var(--ggds-space-4); }
.st-results p { margin: var(--ggds-space-1) 0 0; color: var(--ggds-color-text-muted); }
`;

// Checks forms marked data-validate before they are sent, the GGDS way: the error summary, a message on each field,
// "Error:" in the page title. A field says what it needs with data-required ("Enter your full name") and, for a
// format, data-pattern and data-pattern-message. Your server must check everything again.
const SITE_JS = `import { initErrorSummary } from '../ggds/index.js';

const pageTitle = document.title;

function setError(field, target, message) {
  const id = \`\${target.id || target.querySelector('input')?.name}-error\`;
  document.getElementById(id)?.remove();
  field.classList.toggle('ggds-field--error', Boolean(message));
  const inputs = target.matches('fieldset') ? [] : [target];
  const describedBy = (target.getAttribute('aria-describedby') ?? '').split(' ').filter((x) => x && x !== id);
  if (!message) {
    inputs.forEach((i) => i.removeAttribute('aria-invalid'));
    if (describedBy.length) target.setAttribute('aria-describedby', describedBy.join(' ')); else target.removeAttribute('aria-describedby');
    return;
  }
  const p = document.createElement('p');
  p.className = 'ggds-error-message';
  p.id = id;
  const hidden = document.createElement('span');
  hidden.className = 'ggds-visually-hidden';
  hidden.textContent = 'Error:';
  p.append(hidden, \` \${message}\`);
  if (target.matches('fieldset')) target.querySelector('legend').after(...[target.querySelector('.ggds-hint')].filter(Boolean), p);
  else target.before(p);
  inputs.forEach((i) => i.setAttribute('aria-invalid', 'true'));
  target.setAttribute('aria-describedby', [...describedBy, id].join(' '));
}

function check(target) {
  if (target.matches('fieldset')) return target.querySelector('input:checked') ? '' : target.dataset.required;
  const value = target.value.trim();
  if (!value) return target.dataset.required ?? '';
  if (target.dataset.pattern && !new RegExp(target.dataset.pattern, 'i').test(value)) return target.dataset.patternMessage;
  return '';
}

for (const form of document.querySelectorAll('form[data-validate]')) {
  const summary = form.querySelector('.ggds-error-summary') ?? document.querySelector('.ggds-error-summary');
  form.addEventListener('submit', (event) => {
    const errors = [];
    for (const target of form.querySelectorAll('[data-required]')) {
      const message = check(target);
      setError(target.closest('.ggds-field'), target, message);
      const first = target.matches('fieldset') ? target.querySelector('input') : target;
      if (message) errors.push({ id: first.id, message });
    }
    if (!errors.length) {
      // Remember the answers for the next page (only in this browser tab). Your server would do this instead.
      try { for (const [k, v] of new FormData(form)) sessionStorage.setItem(\`answer-\${k}\`, form.querySelector(\`[name="\${k}"]:checked + label\`)?.textContent ?? v); } catch { /* private browsing */ }
      return;
    }
    event.preventDefault();
    summary.querySelector('.ggds-error-summary__list').replaceChildren(...errors.map(({ id, message }) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = \`#\${id}\`;
      a.textContent = message;
      li.append(a);
      return li;
    }));
    summary.hidden = false;
    document.title = \`Error: \${pageTitle}\`;
    if (summary.dataset.ggdsReady) summary.focus(); else initErrorSummary(summary);
  });
}

// "Check your answers" shows what was entered on the page before, in this browser tab, and, when the forms send to a
// server, puts it in the hidden fields that go with the declaration.
for (const el of document.querySelectorAll('[data-answer]')) {
  try { const v = sessionStorage.getItem(\`answer-\${el.dataset.answer}\`); if (v && el.matches('input')) el.value = v; else if (v) el.textContent = v; } catch { /* private browsing */ }
}
`;

// Search: finds pages in search-index.json as the visitor types, and keeps the search in the address. Without
// JavaScript (or opened from the disk, where the index cannot be read) the A to Z list of pages is there instead.
const SEARCH_JS = `const form = document.querySelector('.st-search');
const input = document.getElementById('q');
const status = document.getElementById('search-status');
const list = document.getElementById('search-results');
const all = document.getElementById('all-pages');

let pages = [];
try { pages = await (await fetch('search-index.json')).json(); } catch { pages = []; }

function show(q) {
  const words = q.toLowerCase().split(/\\s+/).filter(Boolean);
  if (!words.length || !pages.length) { list.replaceChildren(); status.textContent = ''; all.hidden = false; return; }
  const found = pages.map((p) => {
    const hay = \`\${p.title} \${p.text}\`.toLowerCase();
    const score = words.reduce((n, w) => n + (hay.includes(w) ? 1 : 0) + (p.title.toLowerCase().includes(w) ? 2 : 0), 0);
    return { ...p, score, every: words.every((w) => hay.includes(w)) };
  }).filter((p) => p.every).sort((a, b) => b.score - a.score);
  status.textContent = \`\${found.length} \${found.length === 1 ? 'result' : 'results'} for “\${q}”\`;
  list.replaceChildren(...found.map((p) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = p.url;
    a.textContent = p.title;
    const text = document.createElement('p');
    text.textContent = \`\${p.text.slice(0, 160)}…\`;
    li.append(a, text);
    return li;
  }));
  all.hidden = found.length > 0;
}

const q = new URLSearchParams(location.search).get('q') ?? '';
input.value = q;
show(q);
input.addEventListener('input', () => {
  show(input.value);
  const url = new URL(location.href);
  if (input.value) url.searchParams.set('q', input.value); else url.searchParams.delete('q');
  history.replaceState(null, '', url);
});
form.addEventListener('submit', (e) => { e.preventDefault(); show(input.value); });
`;

const readme = (version, site, count) => {
  const example = site.name === DEFAULT_SITE.name;
  const parts = PARTS.filter((p) => site.parts[p.id]).map((p) => p.label.toLowerCase());
  return `# ${site.name}: a GGDS website

A complete government website, built with GGDS ${version}, the Ghana Government Design System.${example ? ` ${site.name} is made
up: make it yours with the website builder (https://ghana-gds.github.io/ggds/builder.html), or by hand.` : ''}

## What is in it

- ${count} pages: a homepage, services, about us, contact us with a message form, search, page not found, an
  accessibility statement, a privacy page and a disclaimer${parts.length ? `, with ${parts.join(', ')}` : ''}.
- \`ggds/\`: GGDS itself, with every institution theme in \`ggds/themes/\`.
- \`assets/site.css\`: the little layout this website adds, with GGDS tokens only.
- \`assets/site.js\`: checks forms before they are sent and shows errors the GGDS way.
- \`assets/search.js\` and \`search-index.json\`: search, as you type.
- \`.htaccess\`, \`_headers\` and \`hosting/\`: the server settings for security and speed, for each kind of hosting.
- \`${SITE_FILE}\`: your settings. Keep it: it makes this website again with a newer GGDS.

Everything works without a server, without JavaScript, and under a strict Content Security Policy.

## Make it yours

1. **Your name, address, contact details and colour.** These are already in every page${example ? ' (as the made-up example)' : ''}. To change
   them, open https://ghana-gds.github.io/ggds/builder.html, choose "Start from my settings file", pick
   \`${SITE_FILE}\`, change what you need, and download the website again. Or, with Node.js:
   \`npx @ggds/create --from ${SITE_FILE}\`.
2. **Your logo.** Until your logo is approved, your initials (${site.short}) are shown in a round badge.
3. **Your content.** The words on each page are an example: rewrite each page in plain words for your own
   services. Keep the parts in the same order. https://ghana-gds.github.io/ggds/get-started/content.html helps.
4. **Your documents.** Put them in \`assets/files/\` and link to them from the page they belong to.
5. **Search.** \`search-index.json\` lists every page, its title and a little of its text. Update it when you add
   or change a page.

When you have changed the words, keep your own copy of the pages: making the website again from \`${SITE_FILE}\`
makes the example pages again. To move to a newer GGDS without losing your words, replace only the \`ggds/\` folder.

## Before you go live

- **Forms.** ${site.forms ? `Every form sends to ${site.forms}. Your server must check every answer again, keep what people send, and
  give them a reference number. The form's hidden \`form\` field says which form it is.` : `Each form's \`action\` is the next page of this example, so nothing is sent anywhere yet. Give the
  builder the address of the server that receives your forms, or set each form's \`action\` yourself. Your server
  must check every answer again, keep what people send, and give them a reference number.`}
- **Search engines.** ${site.live ? 'The pages let search engines find them.' : `Remove \`<meta name="robots" content="noindex, nofollow">\` from every page (or tick "Ready to go live" in
  the builder), so search engines can find the website.`}
- Test it with a keyboard only, with a screen reader, at 200% zoom and on a low-cost phone.
- Ask for your address to be added to the register of official government websites.

${hostingGuide(site.host)}
## Help

The GGDS documentation: https://ghana-gds.github.io/ggds/ · Questions and problems: https://github.com/ghana-gds/ggds/issues

Licence: Apache-2.0 (LICENSE). The flag, the coat of arms and institutions' logos are not covered (LICENSE.md).
`;
};
