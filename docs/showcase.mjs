// The showcase (site/showcase/): what GGDS can build beyond an institution's website, starting with what
// institutions build most often (an online service, paying a fee, tracking an application, booking an appointment,
// checking a licence, a personal account, a staff tool, jobs and tenders), then more examples (open data, an
// emergency warning). Each lists the GGDS parts it uses and what a team still builds behind it. Made from GGDS
// components and tokens, plus a few layout rules in showcaseCss below.
// Every organisation, person, number and figure is made up, and every page says it is an example.
import { esc, footer, header, icon, tabBar } from './parts.mjs';
import { institutionCss } from '../packages/tokens/institution.mjs';

const ic = (name, cls = 'ggds-icon') => icon(name, cls);
const table = (id, caption, head, rows, cls = '') => `<div class="ggds-table-wrap" role="region" aria-labelledby="${id}" tabindex="0">
  <table class="ggds-table${cls ? ` ${cls}` : ''}">
    <caption class="ggds-table__caption" id="${id}">${caption}</caption>
    <thead><tr>${head.map(([t, num]) => `<th scope="col"${num ? ' class="ggds-table__numeric"' : ''}>${t}</th>`).join('')}</tr></thead>
    <tbody>
      ${rows.join('\n      ')}
    </tbody>
  </table>
</div>`;
const summary = (rows, change) => `<dl class="ggds-summary-list">${rows.map(([k, v, slug]) => `
  <div class="ggds-summary-list__row">
    <dt class="ggds-summary-list__key">${k}</dt>
    <dd class="ggds-summary-list__value">${v}</dd>${change ? `
    <dd class="ggds-summary-list__actions"><a href="${change}${slug ? `#${slug}` : ''}">Change<span class="ggds-visually-hidden"> ${k.toLowerCase()}</span></a></dd>` : ''}
  </div>`).join('')}
</dl>`;
/** GGDS progress: "Step 2 of 4" in words and as a native <progress>. id: unique on the page. */
const progress = (label, current, total, id = 'progress') => `<div class="ggds-progress">
  <label class="ggds-progress__label" for="${id}">${label}</label>
  <progress class="ggds-progress__bar" id="${id}" value="${current}" max="${total}">${label}</progress>
</div>`;
const tag = (text, kind = '') => `<strong class="ggds-tag${kind ? ` ggds-tag--${kind}` : ''}">${text}</strong>`;
/** A GGDS text field: label, optional hint, input. opts: { hint, width, type, autocomplete, inputmode, value, spellcheck } */
const field = (id, label, opts = {}) => `<div class="ggds-field">
  <label class="ggds-label" for="${id}">${label}</label>${opts.hint ? `
  <p class="ggds-hint" id="${id}-hint">${opts.hint}</p>` : ''}
  <input class="ggds-input${opts.width ? ` ggds-input--width-${opts.width}` : ''}" id="${id}" name="${opts.name ?? id}" type="${opts.type ?? 'text'}"${opts.autocomplete ? ` autocomplete="${opts.autocomplete}"` : ''}${opts.inputmode ? ` inputmode="${opts.inputmode}"` : ''}${opts.spellcheck === false ? ' spellcheck="false"' : ''}${opts.value ? ` value="${opts.value}"` : ''}${opts.hint ? ` aria-describedby="${id}-hint"` : ''}>
</div>`;
/** GGDS radios: name, legend, [[value, label, hint?]], the checked value, and a hint for the question. */
const radios = (name, legend, items, checked, hint = '') => `<div class="ggds-field">
  <fieldset class="ggds-fieldset"${hint ? ` aria-describedby="${name}-hint"` : ''}>
    <legend class="ggds-fieldset__legend">${legend}</legend>${hint ? `
    <p class="ggds-hint" id="${name}-hint">${hint}</p>` : ''}
    <div class="ggds-choices">
      ${items.map(([v, l, h]) => `<div class="ggds-choice">
        <input class="ggds-choice__input" id="${name}-${v}" name="${name}" type="radio" value="${v}"${v === checked ? ' checked' : ''}${h ? ` aria-describedby="${name}-${v}-hint"` : ''}>
        <label class="ggds-choice__label" for="${name}-${v}">${l}${h ? ` <span class="ggds-choice__hint" id="${name}-${v}-hint">${h}</span>` : ''}</label>
      </div>`).join('\n      ')}
    </div>
  </fieldset>
</div>`;
const startButton = (href, text) => `<p><a class="ggds-button ggds-with-icon" href="${href}"><span>${text}</span>${ic('arrow-right')}</a></p>`;
const crumbs = (items, current) => `<nav class="ggds-breadcrumbs" aria-label="Breadcrumb">
    <ol class="ggds-breadcrumbs__list">
      ${items.map(([l, h]) => `<li class="ggds-breadcrumbs__item"><a class="ggds-breadcrumbs__link" href="${h}">${l}</a></li>`).join('\n      ')}
      <li class="ggds-breadcrumbs__item" aria-current="page">${current}</li>
    </ol>
  </nav>`;

// ---------------------------------------------------------------------------------------------------------------
// 1. An online service: check your answers, then the confirmation with what happens next.
const apply = {
  slug: 'apply',
  name: 'An online service',
  title: 'Apply for a fishing licence',
  org: 'Example Fisheries Service',
  colour: '#0b5f5f',
  icon: 'fish',
  summary: 'The thing every institution builds: a start page, the questions, check your answers, pay, and what happens next.',
  common: true,
  uses: [['field', 'Text input'], ['choices', 'Radios and checkboxes'], ['summary-list', 'Summary list'], ['button', 'Button'], ['panel', 'Confirmation panel'], ['notice', 'Notice']],
  patterns: [['ask-for-information', 'Ask for information'], ['ghana-card-number', 'Ghana Card number'], ['phone-numbers', 'Phone numbers']],
  behind: ['Somewhere to receive and keep applications (a case system)', 'A Ghana Card check with NIA, if you need one', 'A payment service (see “Pay a fee”), and SMS for the reference'],
  nav: [['Your application', '#main'], ['Help', '#help']],
  pages: [
    { file: 'apply-start.html', title: 'Apply for a fishing licence', body: `
<div class="ggds-container ggds-main">
  <div class="sc-layout">
    <div>
      <h1>Apply for a fishing licence</h1>
      <p class="ggds-lead">Apply for a licence to fish from a canoe. It takes about 10 minutes, and we decide within 5 working days.</p>
      <h2>Who can apply</h2>
      <ul>
        <li>Canoe owners registered at a landing beach</li>
        <li>People aged 18 or over</li>
      </ul>
      <h2>What you need</h2>
      <ul>
        <li>your Ghana Card number</li>
        <li>your canoe’s number, painted on its side</li>
        <li>GH₵ 250, by mobile money, bank card or cash</li>
      </ul>
      ${startButton('apply-details.html', 'Start now')}
      <div class="ggds-notice ggds-notice--warning">
        <p class="ggds-notice__title"><span class="ggds-visually-hidden">Warning:</span> No fishing in the closed season</p>
        <p>A licence does not cover 1 to 31 July. Officers check at every landing beach.</p>
      </div>
    </div>
    <aside class="sc-aside" id="help" aria-labelledby="start-help-h">
      <h2 id="start-help-h" class="sc-aside__title">${ic('location')} Other ways to apply</h2>
      <p>At the fisheries office at your landing beach, Monday to Friday, 8am to 4pm. Bring your Ghana Card.</p>
      <p>Already applied? We text you at every step. Call 030 000 0000 with your reference to ask.</p>
    </aside>
  </div>
</div>` },
    { file: 'apply-details.html', title: 'About your canoe', body: `
<div class="ggds-container ggds-main sc-narrow">
  <p><a class="ggds-with-icon" href="apply-start.html">${ic('arrow-left')}<span>Back</span></a></p>
  ${progress('Step 2 of 4: your canoe', 2, 4)}
  <h1>About your canoe</h1>
  <form action="apply.html" method="get" novalidate>
    ${field('canoe', 'Canoe name', { width: 'long', spellcheck: false })}
    ${field('number', 'Canoe number', { hint: 'Painted on its side, like EX-CN-0412', width: 'medium', spellcheck: false })}
    ${field('length', 'Length, in metres', { width: 'short', inputmode: 'decimal' })}
    ${radios('engine', 'Does it have an outboard engine?', [['yes', 'Yes'], ['no', 'No']], 'yes')}
    <div class="ggds-button-group"><button class="ggds-button" type="submit">Continue</button></div>
  </form>
</div>` },
    { file: 'apply.html', title: 'Check your answers before you apply', body: `
<div class="ggds-container ggds-main">
  <div class="sc-layout">
    <div>
      ${progress('Step 4 of 4: check your answers', 4, 4)}
      <h1>Check your answers before you apply</h1>
      <p class="ggds-lead">Make sure everything is right. You can change any answer.</p>
      <h2 id="you">Your details</h2>
      ${summary([['Full name', 'Ama Owusu'], ['Ghana Card number', 'GHA-000000000-0'], ['Phone number', '024 000 0000']], 'apply-details.html')}
      <h2 id="boat">Your canoe</h2>
      ${summary([['Canoe name', 'Nyame Adom', 'canoe'], ['Canoe number', 'EX-CN-0412', 'number'], ['Length', '12 metres', 'length'], ['Outboard engine', '40 horsepower', 'engine-yes']], 'apply-details.html')}
      <h2 id="licence">Your licence</h2>
      ${summary([['Licence', 'Canoe fishing, 1 year'], ['Landing beach', 'Example landing beach'], ['Starts', '1 January 2027'], ['Fee', 'GH₵ 250']], 'apply-details.html')}
      <form action="apply-done.html" method="get" novalidate>
        <h2 id="declaration">Declaration</h2>
        <div class="ggds-field">
          <div class="ggds-choices">
            <div class="ggds-choice">
              <input class="ggds-choice__input" id="declare" name="declare" type="checkbox" value="yes">
              <label class="ggds-choice__label" for="declare">I confirm my answers are true, and that I will follow the closed season and the rules for nets.</label>
            </div>
          </div>
        </div>
        <div class="ggds-button-group">
          <button class="ggds-button" type="submit">Apply and pay GH₵ 250</button>
        </div>
      </form>
    </div>
    <aside class="sc-aside" id="help" aria-labelledby="help-h">
      <h2 id="help-h" class="sc-aside__title">${ic('help')} Need help?</h2>
      <p>Call <strong>030 000 0000</strong>, Monday to Friday, 8am to 5pm.</p>
      <p>Or visit the fisheries office at your landing beach.</p>
      <h3>You can pay with</h3>
      <ul class="sc-ticks">
        <li>${ic('mobile', 'ggds-icon ggds-icon--sm')} Mobile money</li>
        <li>${ic('payment', 'ggds-icon ggds-icon--sm')} Bank card</li>
        <li>${ic('cash', 'ggds-icon ggds-icon--sm')} Cash at a fisheries office</li>
      </ul>
    </aside>
  </div>
</div>` },
    { file: 'apply-done.html', title: 'Application sent', body: `
<div class="ggds-container ggds-main">
  <div class="ggds-panel">
    <h1 class="ggds-panel__title">Application sent</h1>
    <p class="ggds-panel__body">Your reference number <strong class="ggds-panel__reference">EX-FL-2026-01842</strong></p>
  </div>
  <div class="sc-layout">
    <div>
      <p class="ggds-lead">We have sent your reference to 024 000 0000 by SMS. You will need it if you contact us.</p>
      <h2>What happens next</h2>
      <ol class="ggds-timeline">
        <li class="ggds-timeline__item ggds-timeline__item--done"><p class="ggds-timeline__title"><span class="ggds-visually-hidden">Done: </span>Application and payment received</p><p class="ggds-timeline__when">Today</p></li>
        <li class="ggds-timeline__item ggds-timeline__item--current"><p class="ggds-timeline__title"><span class="ggds-visually-hidden">Next: </span>A fisheries officer checks your answers</p><p class="ggds-timeline__when">Within 5 working days</p></li>
        <li class="ggds-timeline__item"><p class="ggds-timeline__title"><span class="ggds-visually-hidden">Next: </span>We check your canoe at the landing beach</p><p class="ggds-timeline__when">We will text you a date</p></li>
        <li class="ggds-timeline__item"><p class="ggds-timeline__title"><span class="ggds-visually-hidden">Next: </span>Your licence arrives by SMS, with a code to show officers</p><p class="ggds-timeline__when">By 31 December 2026</p></li>
      </ol>
      <div class="ggds-notice">
        <p class="ggds-notice__title"><span class="ggds-visually-hidden">Information:</span> Keep fishing with your current licence</p>
        <p>It stays valid until 31 December 2026.</p>
      </div>
    </div>
    <aside class="sc-aside" aria-labelledby="done-help-h">
      <h2 id="done-help-h" class="sc-aside__title">${ic('receipt')} Your payment</h2>
      ${summary([['Paid', 'GH₵ 250'], ['By', 'Mobile money'], ['On', '10 November 2026']])}
      <p><a href="apply.html">See your answers again</a></p>
    </aside>
  </div>
</div>` },
  ],
};

// ---------------------------------------------------------------------------------------------------------------
// 2. A personal account: what needs doing, applications, payments and messages.
const account = {
  slug: 'account',
  name: 'A personal account',
  title: 'Your business account',
  org: 'Example Business Registry',
  colour: '#4b2a7a',
  icon: 'user',
  summary: 'Everything someone has with an institution in one place: what needs doing, applications, payments and messages.',
  common: true,
  uses: [['notice', 'Notice'], ['tab-links', 'Tab links'], ['card', 'Card'], ['tag', 'Tag'], ['table', 'Table']],
  files: { 'name-reservation-EX-BN-2024-0081.txt': 'Example Business Registry: name reservation (example: not a real letter)\nName: Owusu Trading\nReserved until: 1 May 2027\nReference: EX-BN-2024-0081\n' },
  behind: ['Sign-in, with the Ghana Card where you can', 'Each person’s applications, payments and messages, from your systems', 'Secure messages between people and your staff'],
  nav: [['Overview', '#main'], ['Applications', '#applications'], ['Payments', '#payments'], ['Messages', '#messages']],
  pages: [
    { file: 'account.html', title: 'Your business account', band: `
<div class="ggds-page-heading">
  <div class="ggds-container">
    <p class="ggds-page-heading__eyebrow">Owusu Trading Enterprise · EX-BN-2024-0081</p>
    <h1 class="ggds-page-heading__title">Welcome back, Ama</h1>
    <ul class="ggds-key-figures ggds-key-figures--inverse">
      <li class="ggds-key-figure"><p class="ggds-key-figure__value">3</p><p class="ggds-key-figure__label">applications in progress</p></li>
      <li class="ggds-key-figure"><p class="ggds-key-figure__value">GH₵ 1,250</p><p class="ggds-key-figure__label">paid this year</p></li>
      <li class="ggds-key-figure"><p class="ggds-key-figure__value">2</p><p class="ggds-key-figure__label">new messages</p></li>
    </ul>
  </div>
</div>`, body: `
<div class="ggds-container ggds-main">
  <div class="ggds-notice ggds-notice--warning">
    <p class="ggds-notice__title"><span class="ggds-visually-hidden">Warning:</span> Your annual return is due in 12 days</p>
    <p>Send it by 22 November 2026 to avoid a GH₵ 100 late fee. <a href="account-renewal.html">See what you need to do</a></p>
  </div>
  <nav class="ggds-tab-links" aria-label="Your account">
    <ul class="ggds-tab-links__list">
      <li><a class="ggds-tab-links__link" href="#main" aria-current="page">Overview</a></li>
      <li><a class="ggds-tab-links__link" href="#applications">Applications</a></li>
      <li><a class="ggds-tab-links__link" href="#payments">Payments</a></li>
      <li><a class="ggds-tab-links__link" href="#messages">Messages (2)</a></li>
    </ul>
  </nav>
  <h2 id="applications">Your applications</h2>
  <ul class="ggds-card-grid sc-grid-3">
    <li class="ggds-card">
      <p class="sc-card-tag">${tag('Action needed', 'danger')}</p>
      <h3 class="ggds-card__title"><a class="ggds-card__link" href="account-renewal.html">Trade licence renewal</a></h3>
      <p class="ggds-card__body">Upload your tax clearance certificate.</p>
      ${progress('Step 2 of 4', 2, 4, 'progress-renewal')}
    </li>
    <li class="ggds-card">
      <p class="sc-card-tag">${tag('In review', 'info')}</p>
      <h3 class="ggds-card__title"><a class="ggds-card__link" href="account-address.html">Change of business address</a></h3>
      <p class="ggds-card__body">An officer is checking it. Decision by 18 November.</p>
      ${progress('Step 3 of 4', 3, 4, 'progress-address')}
    </li>
    <li class="ggds-card">
      <p class="sc-card-tag">${tag('Approved', 'success')}</p>
      <h3 class="ggds-card__title"><a class="ggds-card__link" href="account-name.html">Business name reservation</a></h3>
      <p class="ggds-card__body">“Owusu Trading” is yours until 1 May 2027.</p>
      ${progress('Done', 4, 4, 'progress-name')}
    </li>
  </ul>
  <div class="sc-layout">
    <div>
      <h2 id="payments">Payments</h2>
      ${table('payments-caption', 'Payments in 2026', [['Date'], ['What for'], ['Reference'], ['Amount', true], ['Status']], [
        `<tr><td>3 Nov</td><th scope="row">Change of address fee</th><td>EX-PAY-88213</td><td class="ggds-table__numeric">GH₵ 150</td><td>${tag('Paid', 'success')}</td></tr>`,
        `<tr><td>14 Aug</td><th scope="row">Trade licence renewal</th><td>EX-PAY-71460</td><td class="ggds-table__numeric">GH₵ 900</td><td>${tag('Paid', 'success')}</td></tr>`,
        `<tr><td>2 Feb</td><th scope="row">Name reservation</th><td>EX-PAY-50122</td><td class="ggds-table__numeric">GH₵ 200</td><td>${tag('Paid', 'success')}</td></tr>`,
      ])}
    </div>
    <aside class="sc-aside" aria-labelledby="messages">
      <h2 id="messages" class="sc-aside__title">${ic('mail')} Messages</h2>
      <ul class="sc-messages">
        <li class="sc-messages__item sc-messages__item--new"><p class="sc-messages__title"><a href="#messages"><span class="ggds-visually-hidden">New: </span>We need one more document</a></p><p class="sc-messages__meta">Today, 9:12am</p></li>
        <li class="sc-messages__item sc-messages__item--new"><p class="sc-messages__title"><a href="#messages"><span class="ggds-visually-hidden">New: </span>Your address change is with an officer</a></p><p class="sc-messages__meta">Yesterday</p></li>
        <li class="sc-messages__item"><p class="sc-messages__title"><a href="#messages">Payment received: GH₵ 150</a></p><p class="sc-messages__meta">3 November</p></li>
      </ul>
    </aside>
  </div>
</div>` },
    { file: 'account-renewal.html', title: 'Trade licence renewal', body: `
<div class="ggds-container ggds-main sc-narrow">
  ${crumbs([['Your account', 'account.html']], 'Trade licence renewal')}
  <p class="sc-card-tag">${tag('Action needed', 'danger')}</p>
  <h1>Trade licence renewal</h1>
  ${progress('Step 2 of 4: documents', 2, 4)}
  <p class="ggds-lead">We need your tax clearance certificate before we can renew your licence.</p>
  <form action="account.html" method="get" novalidate>
    <div class="ggds-field">
      <label class="ggds-label" for="tcc">Tax clearance certificate</label>
      <p class="ggds-hint" id="tcc-hint">A PDF or a photo, up to 5 MB. It must show your business name and a date this year.</p>
      <input class="ggds-file-upload" id="tcc" name="tcc" type="file" accept=".pdf,image/*" aria-describedby="tcc-hint">
    </div>
    <div class="ggds-button-group">
      <button class="ggds-button" type="submit">Upload and continue</button>
      <a href="account.html">Do this later</a>
    </div>
  </form>
</div>` },
    { file: 'account-address.html', title: 'Change of business address', body: `
<div class="ggds-container ggds-main sc-narrow">
  ${crumbs([['Your account', 'account.html']], 'Change of business address')}
  <p class="sc-card-tag">${tag('In review', 'info')}</p>
  <h1>Change of business address</h1>
  <p class="ggds-lead">An officer is checking it. We will decide by 18 November.</p>
  ${summary([['New address', 'Shop 12, Example Market, GA-000-0000'], ['Sent', '3 November 2026'], ['Fee', 'GH₵ 150, paid']])}
  <ol class="ggds-timeline">
    <li class="ggds-timeline__item ggds-timeline__item--done"><p class="ggds-timeline__title"><span class="ggds-visually-hidden">Done: </span>Sent and paid</p><p class="ggds-timeline__when">3 November</p></li>
    <li class="ggds-timeline__item ggds-timeline__item--current"><p class="ggds-timeline__title"><span class="ggds-visually-hidden">Now: </span>An officer checks it</p><p class="ggds-timeline__when">By 18 November</p></li>
    <li class="ggds-timeline__item"><p class="ggds-timeline__title"><span class="ggds-visually-hidden">Next: </span>Your certificate shows the new address</p><p class="ggds-timeline__when">We will send it to your account</p></li>
  </ol>
  <p><a href="account.html">Back to your account</a></p>
</div>` },
    { file: 'account-name.html', title: 'Business name reservation', body: `
<div class="ggds-container ggds-main sc-narrow">
  ${crumbs([['Your account', 'account.html']], 'Business name reservation')}
  <p class="sc-card-tag">${tag('Approved', 'success')}</p>
  <h1>Business name reservation</h1>
  <div class="ggds-notice ggds-notice--success">
    <p class="ggds-notice__title"><span class="ggds-visually-hidden">Success:</span> “Owusu Trading” is reserved for you</p>
    <p>Until 1 May 2027. Register the business before then to keep the name.</p>
  </div>
  ${summary([['Name', 'Owusu Trading'], ['Reserved', '2 February 2026'], ['Until', '1 May 2027'], ['Reference', 'EX-BN-2024-0081']])}
  <p><a class="ggds-with-icon" href="name-reservation-EX-BN-2024-0081.txt" download>${ic('download')}<span>Download the reservation letter (TXT, 1 KB)</span></a></p>
  <p><a href="account.html">Back to your account</a></p>
</div>` },
  ],
};

// ---------------------------------------------------------------------------------------------------------------
// 3. Open data: key figures, a chart anyone can read (it is a table), a forecast and the data to download.
const REGIONS = [
  // [region, rainfall mm, normal mm]
  ['Western', 1020, 880], ['Central', 860, 790], ['Volta', 812, 700], ['Eastern', 790, 760],
  ['Ashanti', 744, 770], ['Greater Accra', 512, 430], ['Bono', 690, 720], ['Northern', 610, 650],
];
const MAX = 1100;
const rainCsv = `region,rainfall_mm,normal_mm\n${REGIONS.map((r) => r.join(',')).join('\n')}\n`;
const data = {
  slug: 'data',
  name: 'Open data',
  title: 'Rainfall this season',
  org: 'Example Weather Service',
  colour: '#0a4f86',
  icon: 'chart',
  summary: 'Live figures people can read and reuse: key numbers, a chart that is also a table, a forecast, and the data to download.',
  common: false,
  uses: [['table', 'Table'], ['tag', 'Tag'], ['icon', 'Icons'], ['notice', 'Notice']],
  patterns: [['publish-a-document', 'Publish documents']],
  behind: ['The data, collected and checked', 'An open licence, and a download address that does not change'],
  nav: [['Summary', '#main'], ['By region', '#regions'], ['Forecast', '#forecast'], ['Download', '#download']],
  files: { 'rainfall-2026.csv': rainCsv },
  pages: [
    { file: 'data.html', title: 'Rainfall this season', body: `
<div class="ggds-container ggds-main">
  <p class="sc-eyebrow">${ic('cloud', 'ggds-icon ggds-icon--sm')} Main rainy season, April to July 2026</p>
  <h1>Rainfall this season</h1>
  <p class="ggds-lead">Most of the south had more rain than normal. Updated 10 November 2026 at 6am.</p>
  <ul class="ggds-key-figures">
    <li class="ggds-key-figure"><p class="ggds-key-figure__value">755 mm</p><p class="ggds-key-figure__label">average rainfall</p><p class="ggds-key-figure__change">${ic('arrow-up', 'ggds-icon ggds-icon--sm')} 7% above normal</p></li>
    <li class="ggds-key-figure"><p class="ggds-key-figure__value">18</p><p class="ggds-key-figure__label">days of heavy rain</p><p class="ggds-key-figure__change">${ic('arrow-up', 'ggds-icon ggds-icon--sm')} 5 more than last year</p></li>
    <li class="ggds-key-figure"><p class="ggds-key-figure__value">3</p><p class="ggds-key-figure__label">regions with a flood warning</p><p class="ggds-key-figure__change"><a href="#forecast">See the forecast</a></p></li>
  </ul>
  <h2 id="regions">Rainfall by region</h2>
  <p>Each bar is the rain that fell; the normal for the region is in the last column.</p>
  ${table('regions-caption', 'Rainfall by region, April to July 2026, in millimetres', [['Region'], ['Rainfall', true], ['Compared with normal'], ['Normal', true]], REGIONS.map(([r, mm, normal]) => {
    const diff = Math.round(((mm - normal) / normal) * 100);
    const kind = diff >= 10 ? ['Well above', 'warning'] : diff > 0 ? ['Above', 'info'] : ['Below', ''];
    return `<tr><th scope="row">${r}</th><td class="ggds-table__numeric">${mm}</td><td><meter class="ggds-meter" min="0" max="${MAX}" value="${mm}" aria-hidden="true">${mm} mm</meter> ${tag(`${kind[0]}: ${diff > 0 ? '+' : ''}${diff}%`, kind[1])}</td><td class="ggds-table__numeric">${normal}</td></tr>`;
  }), 'sc-chart')}
  <p class="ggds-hint">Example figures only.</p>
  <h2 id="forecast">The next 5 days</h2>
  <ul class="sc-forecast">
    ${[['Tue', 'water', 'Heavy rain', 42], ['Wed', 'water', 'Rain', 18], ['Thu', 'cloud', 'Cloudy', 4], ['Fri', 'sun', 'Sunny spells', 0], ['Sat', 'sun', 'Sunny', 0]].map(([d, i, t, mm]) => `<li class="sc-forecast__day"><p class="sc-forecast__name">${d}</p>${ic(i, 'ggds-icon ggds-icon--xl')}<p class="sc-forecast__text">${t}</p><p class="sc-forecast__mm">${mm} mm</p></li>`).join('\n    ')}
  </ul>
  <h2 id="download">Download the data</h2>
  <ul class="sc-downloads">
    <li><a class="ggds-with-icon" href="rainfall-2026.csv" download>${ic('download')}<span>Rainfall by region, 2026 (CSV, 1 KB)</span></a></li>
  </ul>
  <p>Free to use under an open licence. Say where it came from.</p>
</div>` },
  ],
};

// ---------------------------------------------------------------------------------------------------------------
// 4. An emergency warning: what is happening, what to do now, where, and how to get help.
const alert = {
  slug: 'alert',
  name: 'An emergency warning',
  title: 'Flood warning',
  org: 'Example Emergency Service',
  colour: '#8a1c1c',
  icon: 'warning',
  summary: 'Information people need in a hurry: the warning, what to do now, the areas affected and who to call.',
  common: false,
  uses: [['notice', 'Urgent notice'], ['tag', 'Tag'], ['table', 'Table'], ['disclosure', 'Disclosure'], ['field', 'Text input']],
  patterns: [['phone-numbers', 'Phone numbers']],
  behind: ['A way to publish a warning in minutes, from a phone', 'SMS and radio partners, and translations into local languages'],
  nav: [['What to do', '#do'], ['Areas', '#areas'], ['Get help', '#help'], ['SMS alerts', '#sms']],
  pages: [
    { file: 'alert.html', title: 'Flood warning', urgent: '<div class="ggds-notice ggds-notice--urgent" role="region" aria-label="Urgent notice"><div class="ggds-container"><p class="ggds-notice__title">Flood warning in force until 6pm today. <a href="#do">What to do now</a></p></div></div>', band: `
<div class="ggds-page-heading ggds-page-heading--danger">
  <div class="ggds-container">
    <p class="ggds-page-heading__eyebrow">${ic('warning', 'ggds-icon ggds-icon--sm')} Warning in force · Updated 10 November 2026, 11:40am</p>
    <h1 class="ggds-page-heading__title">Flood warning: low-lying areas near rivers</h1>
    <p class="ggds-page-heading__lede">Heavy rain is expected until 6pm. Rivers may rise quickly. If you live near a river or a drain, act now.</p>
  </div>
</div>`, body: `
<div class="ggds-container ggds-main">
  <h2 id="do">What to do now</h2>
  <ol class="ggds-steps ggds-steps--urgent">
    <li class="ggds-steps__item"><span class="ggds-steps__icon">${ic('arrow-up', 'ggds-icon ggds-icon--lg')}</span><h3 class="ggds-steps__title">Move to higher ground</h3><p>Take your family, your Ghana Card and your medicines.</p></li>
    <li class="ggds-steps__item"><span class="ggds-steps__icon">${ic('energy', 'ggds-icon ggds-icon--lg')}</span><h3 class="ggds-steps__title">Switch off the electricity</h3><p>At the main switch, if it is safe to reach.</p></li>
    <li class="ggds-steps__item"><span class="ggds-steps__icon">${ic('blocked', 'ggds-icon ggds-icon--lg')}</span><h3 class="ggds-steps__title">Do not cross flood water</h3><p>Not on foot and not by car. 30 cm of moving water can carry a car away.</p></li>
    <li class="ggds-steps__item"><span class="ggds-steps__icon">${ic('mobile', 'ggds-icon ggds-icon--lg')}</span><h3 class="ggds-steps__title">Keep your phone charged</h3><p>We will send updates by SMS and on radio.</p></li>
  </ol>
  <div class="sc-layout">
    <div>
      <h2 id="areas">Areas affected</h2>
      ${table('areas-caption', 'Flood warning levels by area', [['Area'], ['Level'], ['Until']], [
        `<tr><th scope="row">Example river valley</th><td>${tag('Severe: act now', 'danger')}</td><td>6pm today</td></tr>`,
        `<tr><th scope="row">Example lagoon district</th><td>${tag('Warning: be ready', 'warning')}</td><td>6pm today</td></tr>`,
        `<tr><th scope="row">Example hill district</th><td>${tag('Watch: stay alert', 'info')}</td><td>Midnight</td></tr>`,
      ])}
      <details class="ggds-disclosure">
        <summary class="ggds-disclosure__summary">How we decide the level</summary>
        <div class="ggds-disclosure__content"><p>We use river levels, rain forecasts and reports from district officers. “Severe” means flooding is expected and lives may be at risk.</p></div>
      </details>
      <h2 id="sms">Get warnings by SMS</h2>
      <form action="alert.html" method="get" novalidate>
        <div class="ggds-field">
          <label class="ggds-label" for="sms-phone">Mobile number</label>
          <p class="ggds-hint" id="sms-phone-hint">Free. We only send warnings for your area.</p>
          <input class="ggds-input ggds-input--width-medium" id="sms-phone" name="phone" type="tel" autocomplete="tel" inputmode="tel" aria-describedby="sms-phone-hint">
        </div>
        <div class="ggds-button-group"><button class="ggds-button" type="submit">Send me warnings</button></div>
      </form>
    </div>
    <aside class="sc-aside sc-aside--alert" id="help" aria-labelledby="help-h">
      <h2 id="help-h" class="sc-aside__title">${ic('phone')} Get help</h2>
      <p class="sc-call"><span class="sc-call__number">112</span> <span>Emergency: police, fire and ambulance</span></p>
      <p class="sc-call"><span class="sc-call__number">030 000 0000</span> <span>Example Emergency Service, day and night</span></p>
      <p>Safe places are open at schools in every district. Ask a district officer or call us.</p>
    </aside>
  </div>
</div>` },
  ],
};

// ---------------------------------------------------------------------------------------------------------------
// 5. A staff tool: the queue of applications to review, with filters.
const QUEUE = [
  ['EX-LT-2026-07731', 'Kwame Asante', 'Land title', '10 Nov', ['New', 'info'], 'Unassigned'],
  ['EX-LT-2026-07729', 'Abena Boateng', 'Search report', '9 Nov', ['In progress', 'warning'], 'Efua M.'],
  ['EX-LT-2026-07714', 'Kofi Mensah', 'Transfer of title', '6 Nov', ['Overdue', 'danger'], 'Yaw D.'],
  ['EX-LT-2026-07708', 'Akosua Addo', 'Land title', '5 Nov', ['Overdue', 'danger'], 'Efua M.'],
  ['EX-LT-2026-07702', 'Yaw Ofori', 'Search report', '4 Nov', ['Waiting for applicant', ''], 'Yaw D.'],
  ['EX-LT-2026-07695', 'Esi Amoah', 'Transfer of title', '4 Nov', ['In progress', 'warning'], 'Esi A.'],
];
const staff = {
  slug: 'staff',
  name: 'A staff tool',
  title: 'Applications to review',
  org: 'Example Lands Office',
  tagline: 'Staff tool · Example built with GGDS',
  colour: '#1f3a5f',
  icon: 'clipboard',
  summary: 'The other side of every service: the queue staff work through, and the page where an officer decides on one application.',
  common: true,
  uses: [['tab-links', 'Tab links'], ['choices', 'Checkboxes and radios'], ['table', 'Table'], ['tag', 'Tag'], ['pagination', 'Pagination'], ['breadcrumbs', 'Breadcrumbs'], ['summary-list', 'Summary list'], ['field', 'Textarea']],
  behind: ['Staff sign-in, with roles for who can decide', 'The case system behind the queue', 'A record of every decision and who made it'],
  nav: [['Applications', '#main'], ['Filters', '#filters']],
  pages: [
    { file: 'staff.html', title: 'Applications to review', body: `
<div class="ggds-container ggds-main">
  <nav class="ggds-breadcrumbs" aria-label="Breadcrumb">
    <ol class="ggds-breadcrumbs__list">
      <li class="ggds-breadcrumbs__item"><a class="ggds-breadcrumbs__link" href="staff.html">Staff home</a></li>
      <li class="ggds-breadcrumbs__item" aria-current="page">Applications to review</li>
    </ol>
  </nav>
  <h1>Applications to review</h1>
  <ul class="ggds-key-figures">
    <li class="ggds-key-figure"><p class="ggds-key-figure__value">24</p><p class="ggds-key-figure__label">to review</p></li>
    <li class="ggds-key-figure ggds-key-figure--danger"><p class="ggds-key-figure__value">5</p><p class="ggds-key-figure__label">overdue (over 5 working days)</p></li>
    <li class="ggds-key-figure"><p class="ggds-key-figure__value">3.2 days</p><p class="ggds-key-figure__label">average time to decide</p></li>
  </ul>
  <nav class="ggds-tab-links" aria-label="Applications by stage">
    <ul class="ggds-tab-links__list">
      <li><a class="ggds-tab-links__link" href="staff.html" aria-current="page">To review (24)</a></li>
      <li><a class="ggds-tab-links__link" href="staff.html#waiting">Waiting for the applicant (8)</a></li>
      <li><a class="ggds-tab-links__link" href="staff.html#done">Done this week (31)</a></li>
    </ul>
  </nav>
  <div class="sc-layout sc-layout--filters">
    <form class="sc-aside" id="filters" action="staff.html" method="get" aria-labelledby="filters-h">
      <h2 id="filters-h" class="sc-aside__title">${ic('filter')} Filters</h2>
      <div class="ggds-field">
        <fieldset class="ggds-fieldset">
          <legend class="ggds-fieldset__legend">Application</legend>
          <div class="ggds-choices">
            ${['Land title', 'Transfer of title', 'Search report', 'Site plan approval'].map((l, i) => `<div class="ggds-choice"><input class="ggds-choice__input" id="f-l${i}" name="licence" type="checkbox" value="${i}"${i === 0 ? ' checked' : ''}><label class="ggds-choice__label" for="f-l${i}">${l}</label></div>`).join('\n            ')}
          </div>
        </fieldset>
      </div>
      <div class="ggds-field">
        <fieldset class="ggds-fieldset">
          <legend class="ggds-fieldset__legend">Assigned to</legend>
          <div class="ggds-choices">
            ${['Me', 'Anyone', 'No one yet'].map((l, i) => `<div class="ggds-choice"><input class="ggds-choice__input" id="f-a${i}" name="assigned" type="radio" value="${i}"${i === 1 ? ' checked' : ''}><label class="ggds-choice__label" for="f-a${i}">${l}</label></div>`).join('\n            ')}
          </div>
        </fieldset>
      </div>
      <button class="ggds-button ggds-button--secondary" type="submit">Apply filters</button>
    </form>
    <div>
      ${table('queue-caption', 'Applications to review, oldest overdue first', [['Reference'], ['Applicant'], ['Application'], ['Received'], ['Status'], ['Officer']], QUEUE.map(([ref, who, lic, when, [st, kind], officer]) =>
        `<tr><th scope="row"><a href="staff-case.html">${ref}</a></th><td>${who}</td><td>${lic}</td><td>${when}</td><td>${tag(st, kind)}</td><td>${officer}</td></tr>`))}
      <nav class="ggds-pagination" aria-label="Pages of applications">
        <ul class="ggds-pagination__list">
          <li><a class="ggds-pagination__link" href="staff.html" aria-label="Page 1" aria-current="page">1</a></li>
          <li><a class="ggds-pagination__link" href="staff.html" aria-label="Page 2">2</a></li>
          <li><a class="ggds-pagination__link" href="staff.html" aria-label="Page 3">3</a></li>
          <li><a class="ggds-pagination__link" href="staff.html" aria-label="Page 4">4</a></li>
          <li><a class="ggds-pagination__link" href="staff.html" rel="next">Next<span class="ggds-visually-hidden"> page</span></a></li>
        </ul>
      </nav>
      <h2 id="waiting">Waiting for the applicant (8)</h2>
      <p>We asked these applicants for more information. They come back to the queue when they reply, or close after 30 days.</p>
      ${table('waiting-caption', 'Waiting for the applicant, longest first', [['Reference'], ['Applicant'], ['Asked for'], ['Since']], [
        `<tr><th scope="row"><a href="staff-case.html">EX-LT-2026-07702</a></th><td>Yaw Ofori</td><td>A clearer site plan</td><td>4 Nov</td></tr>`,
        `<tr><th scope="row"><a href="staff-case.html">EX-LT-2026-07688</a></th><td>Efua Mensah</td><td>Proof of payment for the land</td><td>2 Nov</td></tr>`,
      ])}
      <h2 id="done">Done this week (31)</h2>
      <p>Approved 27, refused 4. Every decision and who made it is kept in the application’s history.</p>
    </div>
  </div>
</div>` },
    { file: 'staff-case.html', title: 'Review an application', body: `
<div class="ggds-container ggds-main">
  ${crumbs([['Staff home', 'staff.html'], ['Applications to review', 'staff.html']], 'EX-LT-2026-07731')}
  <p class="sc-card-tag">${tag('New', 'info')} ${tag('Fee paid', 'success')}</p>
  <h1>Kwame Asante: land title</h1>
  <div class="sc-layout">
    <div>
      <h2 id="applicant">Applicant</h2>
      ${summary([['Name', 'Kwame Asante'], ['Ghana Card number', 'GHA-000000000-0 ' + tag('Checked with NIA', 'success')], ['Phone', '024 000 0000']])}
      <h2 id="land">The land</h2>
      ${summary([['Digital address', 'GA-000-0000'], ['Plot', 'Plot 14, Example Estate'], ['Size', '0.16 hectares'], ['Site plan', '<a href="staff-case.html#land">site-plan.pdf</a> ' + tag('Checked by survey', 'success')]])}
      <h2 id="decide">Your decision</h2>
      <form action="staff.html" method="get" novalidate>
        ${radios('decision', 'What do you decide?', [['approve', 'Approve'], ['more', 'Ask the applicant for more information', 'They get an SMS and the application waits for them'], ['refuse', 'Refuse', 'Give the reason: the applicant can appeal']], '')}
        <div class="ggds-field">
          <label class="ggds-label" for="note">Message to the applicant</label>
          <p class="ggds-hint" id="note-hint">They see this in their account and by SMS. Write in plain words.</p>
          <textarea class="ggds-textarea" id="note" name="note" rows="4" aria-describedby="note-hint"></textarea>
        </div>
        <div class="ggds-button-group">
          <button class="ggds-button" type="submit">Save decision</button>
          <a href="staff.html">Back to the queue</a>
        </div>
      </form>
    </div>
    <aside class="sc-aside" aria-labelledby="history-h">
      <h2 id="history-h" class="sc-aside__title">${ic('history')} History</h2>
      <ol class="ggds-timeline">
        <li class="ggds-timeline__item ggds-timeline__item--done"><p class="ggds-timeline__title"><span class="ggds-visually-hidden">Done: </span>Application received</p><p class="ggds-timeline__when">10 Nov, 9:02am</p></li>
        <li class="ggds-timeline__item ggds-timeline__item--done"><p class="ggds-timeline__title"><span class="ggds-visually-hidden">Done: </span>GH₵ 600 fee paid</p><p class="ggds-timeline__when">10 Nov, 9:05am</p></li>
        <li class="ggds-timeline__item ggds-timeline__item--current"><p class="ggds-timeline__title"><span class="ggds-visually-hidden">Now: </span>Assigned to you</p><p class="ggds-timeline__when">Today</p></li>
      </ol>
    </aside>
  </div>
</div>` },
  ],
};

// ---------------------------------------------------------------------------------------------------------------
// 6. Book an appointment, made for the phone: a centre, a time, then the booking.
const slot = (id, time, left) => `<div class="ggds-choice"><input class="ggds-choice__input" id="${id}" name="time" type="radio" value="${id}"${left ? '' : ' disabled'}><label class="ggds-choice__label" for="${id}">${time} <span class="sc-slot${left ? '' : ' sc-slot--full'}">${left ? `${left} places left` : 'Full'}</span></label></div>`;
const bookFooter = `<p id="records" class="ggds-hint">No data bundle? Dial *000*00# to book by USSD.</p>
  <p id="help" class="ggds-hint">Help: call 030 000 0000.</p>`;
const book = {
  slug: 'book',
  name: 'Book an appointment',
  title: 'Book a vaccination',
  org: 'Example Health Service',
  colour: '#0b5d34',
  icon: 'calendar',
  phone: true,
  common: true,
  summary: 'Choose a place and a time, then a booking people can show at the door. Made for a low-cost phone: one question a page, big targets.',
  uses: [['choices', 'Radios'], ['button', 'Button'], ['panel', 'Confirmation panel'], ['summary-list', 'Summary list'], ['tab-bar', 'Tab bar'], ['notice', 'Notice']],
  patterns: [['ask-for-information', 'Ask for information'], ['addresses', 'Addresses']],
  behind: ['Each centre’s opening times and how many people it can see', 'SMS reminders the day before', 'A list for staff of who is coming, and USSD for people without data'],
  nav: [['Book', '#main'], ['Your bookings', '#bookings']],
  tabs: [{ label: 'Home', href: 'book.html', icon: 'home', current: true }, { label: 'Bookings', href: 'book-done.html', icon: 'calendar' }, { label: 'Records', href: '#records', icon: 'document' }, { label: 'Help', href: '#help', icon: 'help' }],
  pages: [
    { file: 'book.html', title: 'Where do you want to go?', body: `
<div class="ggds-container ggds-main sc-narrow">
  ${progress('Question 2 of 4', 2, 4)}
  <form action="book-time.html" method="get" novalidate>
    <div class="ggds-field">
      <fieldset class="ggds-fieldset" aria-describedby="centre-hint">
        <legend class="ggds-fieldset__legend ggds-fieldset__legend--page"><h1>Where do you want to go?</h1></legend>
        <p class="ggds-hint" id="centre-hint">Health centres near Example Town</p>
        <div class="ggds-choices">
          ${[['east', 'Example Health Centre', 'Market Road · Open Monday to Saturday'], ['west', 'Example Polyclinic', 'Station Road · Open every day'], ['north', 'Example Community Clinic', 'School Lane · Tuesdays and Thursdays']].map(([v, l, h]) => `<div class="ggds-choice"><input class="ggds-choice__input" id="centre-${v}" name="centre" type="radio" value="${v}" aria-describedby="centre-${v}-hint"><label class="ggds-choice__label" for="centre-${v}">${l} <span class="ggds-choice__hint" id="centre-${v}-hint">${h}</span></label></div>`).join('\n          ')}
        </div>
      </fieldset>
    </div>
    <div class="ggds-button-group"><button class="ggds-button sc-wide" type="submit">Continue</button></div>
  </form>
  ${bookFooter}
</div>` },
    { file: 'book-time.html', title: 'Choose a time', body: `
<div class="ggds-container ggds-main sc-narrow">
  <p><a class="ggds-with-icon" href="book.html">${ic('arrow-left')}<span>Back</span></a></p>
  ${progress('Question 3 of 4', 3, 4)}
  <h1>Choose a time</h1>
  <p class="sc-place">${ic('location', 'ggds-icon ggds-icon--sm')} Example Health Centre</p>
  <form action="book-done.html" method="get" novalidate>
    <div class="ggds-field">
      <fieldset class="ggds-fieldset">
        <legend class="ggds-fieldset__legend">Tuesday 17 November</legend>
        <div class="ggds-choices">
          ${slot('t1', '8:30am', 4)}
          ${slot('t2', '10:00am', 0)}
          ${slot('t3', '1:30pm', 9)}
        </div>
      </fieldset>
    </div>
    <div class="ggds-field">
      <fieldset class="ggds-fieldset">
        <legend class="ggds-fieldset__legend">Wednesday 18 November</legend>
        <div class="ggds-choices">
          ${slot('w1', '8:30am', 12)}
          ${slot('w2', '11:00am', 2)}
        </div>
      </fieldset>
    </div>
    <div class="ggds-button-group"><button class="ggds-button sc-wide" type="submit">Continue</button></div>
  </form>
  ${bookFooter}
</div>` },
    { file: 'book-done.html', title: 'Vaccination booked', body: `
<div class="ggds-container ggds-main sc-narrow">
  <div class="ggds-panel">
    <h1 class="ggds-panel__title">Vaccination booked</h1>
    <p class="ggds-panel__body">Show this code at the door <strong class="ggds-panel__reference">VX-4821</strong></p>
  </div>
  <h2 id="bookings">Your booking</h2>
  ${summary([['When', 'Tuesday 17 November, 8:30am'], ['Where', 'Example Health Centre, Market Road'], ['For', 'Kofi, aged 2']])}
  <h2>Bring with you</h2>
  <ul>
    <li>your Ghana Card or NHIS card</li>
    <li>your child’s health record book, if you have it</li>
  </ul>
  <div class="ggds-notice">
    <p class="ggds-notice__title"><span class="ggds-visually-hidden">Information:</span> We will remind you by SMS the day before</p>
    <p>Can’t come? <a href="book-time.html">Change the time</a> or <a href="book.html">cancel</a>, so someone else can have it.</p>
  </div>
  ${bookFooter}
</div>` },
  ],
};

// ---------------------------------------------------------------------------------------------------------------
// 7. Pay a fee: what you owe, how to pay, mobile money, the receipt.
const receipt = `Example Revenue Office: payment receipt (example: not a real payment)
Receipt: EX-RCT-90417
For: Business operating permit 2027, Owusu Trading Enterprise (EX-BOP-0081)
Amount: GH₵ 450
Paid by: Mobile money, 024 000 0000
Date: 10 November 2026, 9:05am
`;
const pay = {
  slug: 'pay',
  name: 'Pay a fee',
  title: 'Pay your business operating permit',
  org: 'Example Revenue Office',
  colour: '#9a3412',
  icon: 'cedi',
  common: true,
  summary: 'Almost every service ends in a payment: what you owe, how to pay, mobile money that never asks for the PIN here, and a receipt to keep.',
  uses: [['choices', 'Radios'], ['field', 'Text input'], ['notice', 'Notice'], ['panel', 'Confirmation panel'], ['summary-list', 'Summary list'], ['button', 'Button']],
  patterns: [['phone-numbers', 'Phone numbers']],
  behind: ['A licensed payment service for mobile money and cards', 'Each payment saved against what it was for, and refunds', 'Receipts by SMS and email'],
  nav: [['Pay', '#main'], ['Help', '#help']],
  files: { 'receipt-EX-RCT-90417.txt': receipt },
  pages: [
    { file: 'pay.html', title: 'Pay your business operating permit', body: `
<div class="ggds-container ggds-main">
  <div class="sc-layout">
    <div>
      <h1>Pay your business operating permit</h1>
      <p class="ggds-lead">Your permit for 2027 is ready to pay. Pay by 31 December to keep trading.</p>
      ${summary([['Business', 'Owusu Trading Enterprise'], ['Permit number', 'EX-BOP-0081'], ['For', 'January to December 2027'], ['Amount', '<strong>GH₵ 450</strong>']])}
      <form action="pay-momo.html" method="get" novalidate>
        ${radios('method', 'How do you want to pay?', [['momo', 'Mobile money', 'MTN MoMo, Telecel Cash or AT Money'], ['card', 'Bank card', 'Visa or Mastercard'], ['office', 'Cash at a revenue office', 'Bring this permit number']], 'momo')}
        <div class="ggds-button-group"><button class="ggds-button" type="submit">Continue</button></div>
      </form>
    </div>
    <aside class="sc-aside" id="help" aria-labelledby="pay-help-h">
      <h2 id="pay-help-h" class="sc-aside__title">${ic('help')} Not your business?</h2>
      <p>If these details are wrong, do not pay. Call 030 000 0000, Monday to Friday, 8am to 5pm.</p>
    </aside>
  </div>
</div>` },
    { file: 'pay-momo.html', title: 'Pay with mobile money', body: `
<div class="ggds-container ggds-main sc-narrow">
  <p><a class="ggds-with-icon" href="pay.html">${ic('arrow-left')}<span>Back</span></a></p>
  <h1>Pay GH₵ 450 with mobile money</h1>
  <form action="pay-done.html" method="get" novalidate>
    ${radios('network', 'Which network is your wallet on?', [['mtn', 'MTN MoMo'], ['telecel', 'Telecel Cash'], ['at', 'AT Money']], 'mtn')}
    ${field('wallet', 'Mobile money number', { hint: 'The number your wallet is on, like 024 000 0000', width: 'medium', type: 'tel', autocomplete: 'tel', inputmode: 'tel' })}
    <div class="ggds-notice">
      <p class="ggds-notice__title"><span class="ggds-visually-hidden">Information:</span> Approve the payment on your phone</p>
      <p>We will send a payment request to your phone. Approve it there with your PIN. <strong>We will never ask for your PIN on this website.</strong></p>
    </div>
    <div class="ggds-button-group"><button class="ggds-button" type="submit">Send payment request</button></div>
  </form>
</div>` },
    { file: 'pay-done.html', title: 'Payment received', body: `
<div class="ggds-container ggds-main sc-narrow">
  <div class="ggds-panel">
    <h1 class="ggds-panel__title">Payment received</h1>
    <p class="ggds-panel__body">Your receipt number <strong class="ggds-panel__reference">EX-RCT-90417</strong></p>
  </div>
  <p class="ggds-lead">Your business operating permit for 2027 is paid. You do not need to do anything else.</p>
  <h2>Your receipt</h2>
  ${summary([['Amount', 'GH₵ 450'], ['For', 'Business operating permit 2027, EX-BOP-0081'], ['Paid by', 'Mobile money, 024 000 0000'], ['Date', '10 November 2026, 9:05am']])}
  <p><a class="ggds-with-icon" href="receipt-EX-RCT-90417.txt" download>${ic('download')}<span>Download your receipt (TXT, 1 KB)</span></a></p>
  <p>We have also sent it to 024 000 0000 by SMS. <a href="pay.html">Make another payment</a></p>
</div>` },
  ],
};

// ---------------------------------------------------------------------------------------------------------------
// 8. Track an application: the reference, then where it is and what happens next.
const track = {
  slug: 'track',
  name: 'Track an application',
  title: 'Track your passport application',
  org: 'Example Passport Office',
  colour: '#6b1d5c',
  icon: 'search',
  common: true,
  summary: 'Where is my application? Enter the reference, see each step and what happens next: fewer calls and visits to your office.',
  uses: [['field', 'Text input'], ['tag', 'Tag'], ['summary-list', 'Summary list'], ['notice', 'Notice'], ['breadcrumbs', 'Breadcrumbs'], ['button', 'Button']],
  behind: ['A look-up by reference in your case system', 'Limits on how many references one person can try, so they cannot be guessed', 'An SMS each time the status changes'],
  nav: [['Track', '#main'], ['Help', '#help']],
  pages: [
    { file: 'track.html', title: 'Track your passport application', body: `
<div class="ggds-container ggds-main">
  <div class="sc-layout">
    <div>
      <h1>Track your passport application</h1>
      <p class="ggds-lead">See where your application is and when your passport will be ready.</p>
      <form action="track-result.html" method="get" novalidate>
        ${field('ref', 'Application number', { hint: 'It is on your receipt and in our SMS, like EX-PP-2026-55120', width: 'medium', spellcheck: false, value: 'EX-PP-2026-55120' })}
        ${field('dob', 'Date of birth', { hint: 'For example, 27 3 1990', width: 'medium', autocomplete: 'bday' })}
        <div class="ggds-button-group"><button class="ggds-button" type="submit">Track</button></div>
      </form>
    </div>
    <aside class="sc-aside" id="help" aria-labelledby="track-help-h">
      <h2 id="track-help-h" class="sc-aside__title">${ic('help')} Lost your application number?</h2>
      <p>Call 030 000 0000 with your Ghana Card number, Monday to Friday, 8am to 5pm.</p>
    </aside>
  </div>
</div>` },
    { file: 'track-result.html', title: 'Your passport application', body: `
<div class="ggds-container ggds-main">
  ${crumbs([['Track an application', 'track.html']], 'EX-PP-2026-55120')}
  <p class="sc-card-tag">${tag('Being printed', 'info')}</p>
  <h1>Your passport application</h1>
  <p class="ggds-lead">Your passport is being printed. It will be ready to collect from 24 November.</p>
  <div class="sc-layout">
    <div>
      <ol class="ggds-timeline">
        <li class="ggds-timeline__item ggds-timeline__item--done"><p class="ggds-timeline__title"><span class="ggds-visually-hidden">Done: </span>Application and fee received</p><p class="ggds-timeline__when">3 November</p></li>
        <li class="ggds-timeline__item ggds-timeline__item--done"><p class="ggds-timeline__title"><span class="ggds-visually-hidden">Done: </span>Photo and fingerprints taken</p><p class="ggds-timeline__when">5 November</p></li>
        <li class="ggds-timeline__item ggds-timeline__item--done"><p class="ggds-timeline__title"><span class="ggds-visually-hidden">Done: </span>Checks finished</p><p class="ggds-timeline__when">9 November</p></li>
        <li class="ggds-timeline__item ggds-timeline__item--current"><p class="ggds-timeline__title"><span class="ggds-visually-hidden">Now: </span>Passport being printed</p><p class="ggds-timeline__when">Now</p></li>
        <li class="ggds-timeline__item"><p class="ggds-timeline__title"><span class="ggds-visually-hidden">Next: </span>Ready to collect</p><p class="ggds-timeline__when">From 24 November, we will text you</p></li>
      </ol>
      <div class="ggds-notice ggds-notice--success">
        <p class="ggds-notice__title"><span class="ggds-visually-hidden">Success:</span> You do not need to do anything now</p>
        <p>We will text 024 *** **00 when it is ready. Bring your Ghana Card and your receipt to collect it.</p>
      </div>
    </div>
    <aside class="sc-aside" aria-labelledby="result-help-h">
      <h2 id="result-help-h" class="sc-aside__title">${ic('passport')} Your application</h2>
      ${summary([['Application', 'EX-PP-2026-55120'], ['Type', 'Standard passport, 32 pages'], ['Collect from', 'Example Passport Office, Main Street']])}
      <p><a href="track.html">Track another application</a></p>
    </aside>
  </div>
</div>` },
  ],
};

// ---------------------------------------------------------------------------------------------------------------
// 9. Check a licence: search a public register, then one record.
const REGISTER = [
  ['EX-LA-2024-0318', 'Asante Builders Limited', 'Building contractor, class A', ['Valid', 'success'], '31 March 2027'],
  ['EX-LA-2022-1150', 'Asante and Sons Electrical', 'Electrical contractor', ['Suspended', 'danger'], 'Suspended 2 October 2026'],
  ['EX-LA-2019-0047', 'Asante Road Works', 'Civil works contractor, class B', ['Expired', ''], 'Ended 30 June 2025'],
];
const check = {
  slug: 'check',
  name: 'Check a licence',
  title: 'Check a contractor’s licence',
  org: 'Example Licensing Authority',
  colour: '#7a4b00',
  icon: 'shield-check',
  common: true,
  summary: 'A public register anyone can search before they pay: is this company licensed, for what, and until when? With a way to report a fake.',
  uses: [['field', 'Text input'], ['table', 'Table'], ['tag', 'Tag'], ['summary-list', 'Summary list'], ['notice', 'Notice'], ['breadcrumbs', 'Breadcrumbs']],
  patterns: [['search-results', 'Search results']],
  behind: ['The register, kept up to date by your staff', 'A download or API so banks and other agencies can check it too', 'A way for people to report a fake licence'],
  nav: [['Check a licence', '#main'], ['Report a fake', '#report']],
  pages: [
    { file: 'check.html', title: 'Check a contractor’s licence', body: `
<div class="ggds-container ggds-main">
  <h1>Check a contractor’s licence</h1>
  <p class="ggds-lead">Before you pay a contractor, check they are licensed for the work.</p>
  <form class="sc-search" action="check.html" method="get" role="search">
    ${field('q', 'Licence number or company name', { width: 'long', value: 'Asante', spellcheck: false })}
    <div class="ggds-button-group"><button class="ggds-button" type="submit">Search</button></div>
  </form>
  <h2 id="results">3 licences found for “Asante”</h2>
  ${table('register-caption', 'Licences matching “Asante”', [['Company'], ['Licence'], ['Status'], ['Until']], REGISTER.map(([num, co, kind, [st, cls], until], i) =>
    `<tr><th scope="row"><a href="check-result.html">${co}</a><br><span class="sc-muted">${num}</span></th><td>${kind}</td><td>${tag(st, cls)}</td><td>${until}</td></tr>`))}
</div>` },
    { file: 'check-result.html', title: 'Asante Builders Limited', body: `
<div class="ggds-container ggds-main">
  ${crumbs([['Check a licence', 'check.html']], 'Asante Builders Limited')}
  <h1>Asante Builders Limited</h1>
  <div class="sc-verdict">
    <p class="sc-verdict__title">${ic('shield-check', 'ggds-icon ggds-icon--lg')} Licensed: valid until 31 March 2027</p>
    <p class="sc-verdict__text">Checked against our register today, 10 November 2026, at 6am.</p>
  </div>
  <div class="sc-layout">
    <div>
      ${summary([['Licence number', 'EX-LA-2024-0318'], ['Licensed for', 'Building contractor, class A: buildings of any size'], ['Region', 'Example Region'], ['First licensed', '1 April 2024'], ['Conditions', 'None']])}
      <div class="ggds-notice ggds-notice--warning" id="report">
        <p class="ggds-notice__title"><span class="ggds-visually-hidden">Warning:</span> Do the details match what you were shown?</p>
        <p>If the company name or number on their certificate is different, it may be a fake. Report it: call 030 000 0000 or email <a href="mailto:report@example.gov.gh">report@example.gov.gh</a>.</p>
      </div>
    </div>
    <aside class="sc-aside" aria-labelledby="check-help-h">
      <h2 id="check-help-h" class="sc-aside__title">${ic('info')} What the statuses mean</h2>
      <p>${tag('Valid', 'success')} They can do this work.</p>
      <p>${tag('Suspended', 'danger')} They must stop work until we lift it.</p>
      <p>${tag('Expired')} They must renew before they work again.</p>
    </aside>
  </div>
</div>` },
  ],
};

// ---------------------------------------------------------------------------------------------------------------
// 10. Jobs and tenders: vacancies and procurement notices, then one vacancy.
const jobDescription = `Procurement officer, grade 4 (example: not a real job)
Example Ports Authority, Example Town
Closing date: 20 November 2026, 5pm

What you will do: plan and run tenders under the public procurement law, keep records, and advise departments.
What you need: a degree in procurement, supply chain or a related subject, and 2 years' experience in the public sector.
`;
const tenderNotice = (ref, what) => `${ref}: ${what} (example: not a real tender)\nExample Ports Authority\n`;
const jobs = {
  slug: 'jobs',
  name: 'Jobs and tenders',
  title: 'Jobs and tenders',
  org: 'Example Ports Authority',
  colour: '#3f5f00',
  icon: 'briefcase',
  common: true,
  summary: 'What nearly every institution publishes: vacancies and tender notices with closing dates, documents to download, and a warning about fake adverts.',
  uses: [['notice', 'Notice'], ['tab-links', 'Tab links'], ['card', 'Card'], ['tag', 'Tag'], ['table', 'Table'], ['summary-list', 'Summary list']],
  patterns: [['publish-a-document', 'Publish documents']],
  behind: ['A way to publish and close adverts on time', 'An application form, or an email address that is read', 'For tenders, the steps the public procurement law sets'],
  nav: [['Jobs', '#jobs'], ['Tenders', '#tenders']],
  files: {
    'job-procurement-officer.txt': jobDescription,
    'tender-EX-PA-T-2026-031.txt': tenderNotice('EX-PA-T-2026-031', 'Supply of security services at Example Port'),
    'tender-EX-PA-T-2026-029.txt': tenderNotice('EX-PA-T-2026-029', 'Dredging of the inner harbour'),
  },
  pages: [
    { file: 'jobs.html', title: 'Jobs and tenders', body: `
<div class="ggds-container ggds-main">
  <h1>Jobs and tenders</h1>
  <div class="ggds-notice ggds-notice--danger">
    <p class="ggds-notice__title"><span class="ggds-visually-hidden">Important:</span> We never charge a fee to apply</p>
    <p>Not for a job and not for a tender. If anyone asks you for money, report it: call 030 000 0000.</p>
  </div>
  <nav class="ggds-tab-links" aria-label="Jobs and tenders">
    <ul class="ggds-tab-links__list">
      <li><a class="ggds-tab-links__link" href="#jobs" aria-current="page">Jobs (3)</a></li>
      <li><a class="ggds-tab-links__link" href="#tenders">Tenders (2)</a></li>
    </ul>
  </nav>
  <h2 id="jobs">Jobs</h2>
  <ul class="ggds-card-grid sc-grid-3">
    ${[['Closes in 10 days', 'warning', 'Procurement officer', 'Example Town · Grade 4 · Full time'], ['Closes 30 November', 'info', 'Marine engineer', 'Example Port · Grade 5 · Full time'], ['Closes 4 December', 'info', 'Customer service officer', 'Example Town · Grade 2 · Full time']].map(([when, cls, title, meta]) => `<li class="ggds-card">
      <p class="sc-card-tag">${tag(when, cls)}</p>
      <h3 class="ggds-card__title"><a class="ggds-card__link" href="job.html">${title}</a></h3>
      <p class="ggds-card__body">${meta}</p>
    </li>`).join('\n    ')}
  </ul>
  <h2 id="tenders">Tenders</h2>
  ${table('tenders-caption', 'Tenders open now', [['Reference'], ['What for'], ['Closes'], ['Documents']], [
    `<tr><td>EX-PA-T-2026-031</td><th scope="row">Supply of security services at Example Port</th><td>${tag('25 November', 'warning')}</td><td><a class="ggds-with-icon" href="tender-EX-PA-T-2026-031.txt" download>${ic('download', 'ggds-icon ggds-icon--sm')}<span>Notice<span class="ggds-visually-hidden">, EX-PA-T-2026-031</span> (TXT)</span></a></td></tr>`,
    `<tr><td>EX-PA-T-2026-029</td><th scope="row">Dredging of the inner harbour</th><td>${tag('12 December', 'info')}</td><td><a class="ggds-with-icon" href="tender-EX-PA-T-2026-029.txt" download>${ic('download', 'ggds-icon ggds-icon--sm')}<span>Notice<span class="ggds-visually-hidden">, EX-PA-T-2026-029</span> (TXT)</span></a></td></tr>`,
  ])}
</div>` },
    { file: 'job.html', title: 'Procurement officer', body: `
<div class="ggds-container ggds-main">
  ${crumbs([['Jobs and tenders', 'jobs.html']], 'Procurement officer')}
  <p class="sc-card-tag">${tag('Closes in 10 days', 'warning')}</p>
  <h1>Procurement officer</h1>
  <div class="sc-layout">
    <div>
      ${summary([['Where', 'Example Town'], ['Grade', 'Grade 4, on the public service salary scale'], ['Contract', 'Full time, permanent'], ['Closing date', '<strong>20 November 2026, 5pm</strong>']])}
      <h2>What you will do</h2>
      <ul>
        <li>plan and run tenders under the public procurement law</li>
        <li>keep complete records of every purchase</li>
        <li>advise departments on how to buy what they need</li>
      </ul>
      <h2>What you need</h2>
      <ul>
        <li>a degree in procurement, supply chain or a related subject</li>
        <li>2 years’ experience in the public sector</li>
      </ul>
      <h2 id="how-to-apply">How to apply</h2>
      <ol>
        <li>Read the full job description.</li>
        <li>Email your CV and a one-page letter to <a href="mailto:jobs@example.gov.gh">jobs@example.gov.gh</a> by 20 November at 5pm.</li>
        <li>We will contact people we shortlist by 4 December.</li>
      </ol>
    </div>
    <aside class="sc-aside" aria-labelledby="job-docs-h">
      <h2 id="job-docs-h" class="sc-aside__title">${ic('document')} Documents</h2>
      <p><a class="ggds-with-icon" href="job-procurement-officer.txt" download>${ic('download')}<span>Job description (TXT, 1 KB)</span></a></p>
      <p>We never charge a fee to apply.</p>
    </aside>
  </div>
</div>` },
  ],
};

/** Built most often first (common), then more examples. */
export const SHOWCASES = [apply, pay, track, book, check, account, staff, jobs, data, alert];

/** Every showcase page, wrapped: a bar saying it is an example, the header, the page, the footer. depth: 1. */
export function showcasePages(themes = []) {
  // Any template in any institution's theme: the picker loads the theme's stylesheet (showcase.js). Hidden without
  // JavaScript, when the page keeps its own colour.
  const picker = themes.length ? `<div class="sc-themebar" data-sc-theme hidden>
  <div class="ggds-container sc-themebar__inner">
    <label class="sc-themebar__label" for="sc-theme">See it in a theme</label>
    <select class="ggds-select sc-themebar__select" id="sc-theme" name="theme">
      <option value="">Its own colour</option>
      ${themes.map((t) => `<option value="${esc(t.slug)}">${esc(t.shortName)}: ${esc(t.name)}</option>`).join('\n      ')}
    </select>
  </div>
</div>` : '';
  const out = [];
  for (const sc of SHOWCASES) {
    for (const p of sc.pages) {
      const exit = (where) => `<nav class="docs-exit docs-exit--${where}" aria-label="${where === 'top' ? 'Showcase' : 'Leave the showcase'}">
  <div class="ggds-container docs-exit__inner">
    <p class="docs-exit__text"><strong>Showcase</strong> built with GGDS. ${esc(sc.org)} is made up: this is not a real service.</p>
    <ul class="docs-exit__links">
      <li><a href="../index.html">Back to GGDS documentation</a></li>
      <li><a href="index.html">All showcases</a></li>
    </ul>
  </div>
</nav>`;
      const body = `<a class="ggds-skip-link" href="#main">Skip to main content</a>
${exit('top')}
${picker}
${p.urgent ?? ''}
${header({ name: sc.org, country: sc.tagline ?? 'Example built with GGDS', logo: `<span class="ggds-header__monogram" aria-hidden="true">${esc(sc.org.replace(/^Example /, '').split(/[\s:]+/).filter(Boolean).slice(0, 2).map((x) => x[0]).join(''))}</span>`, nav: sc.nav.map(([label, href]) => ({ label, href })), current: sc.nav[0][1], navId: 'sc-nav', home: sc.pages[0].file })}
<main id="main" tabindex="-1">
${p.band ?? ''}${p.body}
</main>
${footer({ name: sc.org, purpose: 'A made-up organisation, to show what GGDS can build.', bar: [['About this showcase', 'index.html']] })}
${exit('bottom')}${sc.tabs ? `\n${tabBar(sc.tabs)}` : ''}`;
      out.push({ sc, file: p.file, title: `${p.title}: ${sc.name}`, body });
    }
  }
  return out;
}

/** Each showcase's own colour: a one-line theme, the same as an institution's (institutionCss). */
export const showcaseThemes = () => Object.fromEntries(SHOWCASES.map((sc) => [sc.slug, institutionCss(sc.colour)]));
export const showcaseFiles = () => Object.assign({}, ...SHOWCASES.map((sc) => sc.files ?? {}));

/** The layout the showcases add to GGDS: all from GGDS tokens. Everything else is a GGDS component. */
export function showcaseCss() {
  return `/* Showcase pages (docs/showcase.mjs): layout on top of GGDS components, from GGDS tokens only. */
.sc-layout { display: grid; gap: var(--ggds-space-8); align-items: start; }
.sc-layout > * { min-width: 0; }

/* The theme picker. */
.sc-themebar { background: var(--ggds-color-surface-sunken); border-bottom: 1px solid var(--ggds-color-border-subtle); }
.sc-themebar__inner { display: flex; flex-wrap: wrap; align-items: center; gap: var(--ggds-space-2) var(--ggds-space-3); padding-block: var(--ggds-space-2); }
.sc-themebar__label { font-weight: 700; font-size: var(--ggds-font-size-sm); }
.sc-themebar__select { width: auto; max-width: 100%; margin: 0; }
@media (min-width: 64rem) {
  .sc-layout { grid-template-columns: minmax(0, 2fr) minmax(0, 1fr); }
  .sc-layout--filters { grid-template-columns: 16rem minmax(0, 1fr); }
}
.sc-narrow { max-width: 34rem; }
.sc-aside { background: var(--ggds-color-surface-sunken); border-radius: var(--ggds-radius-lg); padding: var(--ggds-space-6); border-top: 4px solid var(--ggds-color-institution); }
.sc-aside > :last-child { margin-bottom: 0; }
.sc-layout .ggds-disclosure { margin-bottom: var(--ggds-space-8); }
.sc-aside--alert { border-top-color: var(--ggds-color-status-danger-strong); }
.sc-aside__title { display: flex; align-items: center; gap: var(--ggds-space-2); margin-top: 0; font-size: var(--ggds-font-size-xl); }
.sc-ticks, .sc-downloads, .sc-messages { list-style: none; padding: 0; margin: 0 0 var(--ggds-space-6); }
.sc-ticks li { display: flex; align-items: center; gap: var(--ggds-space-2); margin-bottom: var(--ggds-space-2); }
.sc-eyebrow, .sc-place { display: flex; align-items: center; gap: var(--ggds-space-2); color: var(--ggds-color-text-muted); font-weight: 700; margin-bottom: var(--ggds-space-2); }

/* A chart that is a table: GGDS meters, with the normal in its own column. */
.sc-chart td:nth-child(3) { min-width: 14rem; }

.sc-card-tag { margin: 0 0 var(--ggds-space-2); }
.ggds-card .ggds-progress { margin: var(--ggds-space-3) 0 0; }
@media (min-width: 48rem) { .sc-grid-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); } }

/* The forecast. */
.sc-forecast { display: grid; grid-template-columns: repeat(auto-fit, minmax(7rem, 1fr)); gap: var(--ggds-space-3); list-style: none; padding: 0; margin: 0 0 var(--ggds-space-8); }
.sc-forecast__day { text-align: center; padding: var(--ggds-space-4); border-radius: var(--ggds-radius-md); background: var(--ggds-color-surface-sunken); color: var(--ggds-color-institution); }
.sc-forecast__day p { margin: 0; color: var(--ggds-color-text); }
.sc-forecast__day .sc-forecast__name { font-weight: 700; margin-bottom: var(--ggds-space-2); }
.sc-forecast__mm { font-weight: 700; font-size: var(--ggds-font-size-lg); }

.sc-call { display: flex; flex-direction: column; margin-bottom: var(--ggds-space-4); }
.sc-call__number { font-size: var(--ggds-font-size-2xl); font-weight: 700; }

/* Messages. */
.sc-messages__item { padding: var(--ggds-space-3) 0 var(--ggds-space-3) var(--ggds-space-4); border-bottom: 1px solid var(--ggds-color-border-subtle); border-left: 4px solid transparent; }
.sc-messages__item--new { border-left-color: var(--ggds-color-institution); }
.sc-messages__item--new .sc-messages__title { font-weight: 700; }
.sc-messages__title, .sc-messages__meta { margin: 0; }
.sc-messages__meta { color: var(--ggds-color-text-muted); font-size: var(--ggds-font-size-sm); }

/* Book an appointment. */
.sc-slot { display: inline-block; margin-left: var(--ggds-space-2); font-size: var(--ggds-font-size-sm); color: var(--ggds-color-status-success-strong); font-weight: 700; }
.sc-slot--full { color: var(--ggds-color-text-muted); }
.sc-wide { width: 100%; }
.sc-muted { color: var(--ggds-color-text-muted); font-size: var(--ggds-font-size-sm); font-weight: 400; }
.sc-search { max-width: 40rem; }

/* A register's answer: one line people can trust at a glance. */
.sc-verdict { margin: 0 0 var(--ggds-space-8); padding: var(--ggds-space-6); border-radius: var(--ggds-radius-lg); background: var(--ggds-color-status-success-subtle); border-left: 6px solid var(--ggds-color-status-success-strong); }
.sc-verdict__title { display: flex; align-items: center; gap: var(--ggds-space-2); margin: 0 0 var(--ggds-space-1); color: var(--ggds-color-status-success-strong); font-size: var(--ggds-font-size-xl); font-weight: 700; }
.sc-verdict__text { margin: 0; }
@media (min-width: 48rem) { .sc-wide { width: auto; } }

`;
}
