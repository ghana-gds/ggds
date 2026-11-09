// The inner pages of the example sites: one page for every link on an example homepage, so following a link
// always lands on a page. Each page uses the GGDS template that fits it (section, list, form, contact, search,
// sitemap or a content page). The words are placeholders: the example never invents facts about an agency.
import { esc } from './parts.mjs';

/** The kind of page an address gets. */
export function pageKind(path, sectionHrefs) {
  if (path === '/search/') return 'search';
  if (path === '/sitemap/') return 'sitemap';
  if (path === '/about/contact/') return 'contact';
  if (sectionHrefs.includes(path)) return 'section';
  if (/\/status\/?$/.test(path)) return 'status';
  if (/complaints\/?$|report-an-incident|grievances/.test(path)) return 'form';
  if (/faqs|questions/.test(path)) return 'faq';
  if (path.includes('?') || /(reports|consultations|news|notices|publications|datasets)\/?$/.test(path)) return 'list';
  return 'content';
}

/** A file name for an address: '/services/?service_type=licence' → 'services-service-type-licence.html'. */
export const fileFor = (path) => `${path.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'home'}.html`;

const breadcrumbs = (items) => `<nav class="ggds-breadcrumbs" aria-label="Breadcrumb">
  <ol class="ggds-breadcrumbs__list">
    ${items.map(([label, href]) => href
      ? `<li class="ggds-breadcrumbs__item"><a class="ggds-breadcrumbs__link" href="${esc(href)}">${esc(label)}</a></li>`
      : `<li class="ggds-breadcrumbs__item" aria-current="page">${esc(label)}</li>`).join('\n    ')}
  </ol>
</nav>`;

const tbc = (who) => `<p><span class="ggds-tag">To be written</span> The ${esc(who)} writes this part.</p>`;

/**
 * The <main> content of one inner page.
 * page: { path, label, kind, section, hashes: [{ id, label }] }; ctx: { short, link(href), pages, contact, unverified }
 */
export function innerMain(page, ctx) {
  const { short, link } = ctx;
  const crumbs = [['Home', link('/')]];
  if (page.section && page.section.href !== page.path) crumbs.push([page.section.label, link(page.section.href)]);
  crumbs.push([page.label]);
  const note = `<div class="ggds-notice docs-example-note"><p class="ggds-notice__title"><span class="ggds-visually-hidden">Information:</span> Example page</p><p>This shows how a ${esc(kindName(page.kind))} looks with GGDS. The words are placeholders: the real ${esc(short)} website has its own content.</p></div>`;
  const siblings = (page.section?.children ?? []).filter((c) => c.href.split('#')[0] !== page.path && c.href.split('#')[0] !== page.section.href);
  const related = siblings.length ? `<h2>Related pages</h2>\n<ul>${siblings.slice(0, 5).map((c) => `<li><a href="${esc(link(c.href))}">${esc(c.label)}</a></li>`).join('')}</ul>` : '';
  const anchors = (page.hashes ?? []).map((h) => `<h2 id="${esc(h.id)}">${esc(h.label)}</h2>\n${tbc(short)}`).join('\n');
  const head = `${breadcrumbs(crumbs)}\n<h1>${esc(page.label)}</h1>`;
  let body;

  switch (page.kind) {
    case 'section': {
      const cards = (page.section?.children ?? []).filter((c) => c.href.split('#')[0] !== page.path);
      body = `${head}
<p class="ggds-lead ggds-measure">${esc(page.section?.description ?? '')}</p>
${note}
${cards.length ? `<ul class="ggds-card-grid docs-home-section">${cards.map((c) => `
  <li class="ggds-card"><h2 class="ggds-card__title"><a class="ggds-card__link" href="${esc(link(c.href))}">${esc(c.label)}</a></h2></li>`).join('')}
</ul>` : ''}
<div class="ggds-prose docs-home-section">${anchors}</div>`;
      break;
    }
    case 'list': {
      const base = page.path.split('?')[0];
      const tabs = (page.section?.children ?? []).filter((c) => c.href.includes('?') && c.href.split('?')[0] === base);
      const items = [1, 2, 3, 4, 5].map((n) => `
  <li class="docs-example-item">
    <p class="docs-example-item__meta"><strong class="ggds-tag ggds-tag--info">Example</strong> <span>Item ${n}</span></p>
    <h2 class="docs-example-item__title">Example ${esc(page.label.toLowerCase())} ${n}</h2>
    <p>A one-sentence summary appears here.</p>
  </li>`).join('');
      body = `${head}
${note}
${tabs.length > 1 ? `<nav class="ggds-tab-links" aria-label="Kinds of ${esc((page.section?.label ?? page.label).toLowerCase())}">
  <ul class="ggds-tab-links__list">
    ${tabs.map((t) => `<li><a class="ggds-tab-links__link" href="${esc(link(t.href))}"${t.href === page.path ? ' aria-current="page"' : ''}>${esc(t.label)}</a></li>`).join('\n    ')}
  </ul>
</nav>` : ''}
<ul class="docs-example-list">${items}
</ul>
${pagination(fileFor(page.path))}`;
      break;
    }
    case 'faq':
      body = `${head}
${note}
${[1, 2, 3, 4].map((n) => `<details class="ggds-disclosure">
  <summary class="ggds-disclosure__summary">Example question ${n}</summary>
  <div class="ggds-disclosure__content"><p>The answer to the question appears here.</p></div>
</details>`).join('\n')}
<div class="ggds-prose docs-home-section">${related}</div>`;
      break;
    case 'form':
      body = `${head}
<p class="ggds-lead ggds-measure">Tell us what happened. It takes about 5 minutes.</p>
${note}
<form class="docs-example-form" action="${esc(fileFor(page.path))}" method="get" novalidate>
  <div class="ggds-field">
    <label class="ggds-label" for="full-name">Full name</label>
    <input class="ggds-input ggds-input--width-long" id="full-name" name="name" type="text" autocomplete="name" spellcheck="false">
  </div>
  <div class="ggds-field">
    <label class="ggds-label" for="phone">Phone number</label>
    <p class="ggds-hint" id="phone-hint">We call or text you about this only</p>
    <input class="ggds-input ggds-input--width-medium" id="phone" name="phone" type="tel" autocomplete="tel" aria-describedby="phone-hint">
  </div>
  <div class="ggds-field">
    <fieldset class="ggds-fieldset">
      <legend class="ggds-fieldset__legend">How should we contact you?</legend>
      <div class="ggds-choices">
        <div class="ggds-choice"><input class="ggds-choice__input" id="contact-call" name="contact" type="radio" value="call"><label class="ggds-choice__label" for="contact-call">Phone call</label></div>
        <div class="ggds-choice"><input class="ggds-choice__input" id="contact-sms" name="contact" type="radio" value="sms"><label class="ggds-choice__label" for="contact-sms">SMS</label></div>
        <div class="ggds-choice"><input class="ggds-choice__input" id="contact-email" name="contact" type="radio" value="email"><label class="ggds-choice__label" for="contact-email">Email</label></div>
      </div>
    </fieldset>
  </div>
  <div class="ggds-field">
    <label class="ggds-label" for="details">What happened?</label>
    <p class="ggds-hint" id="details-hint">Include dates and any reference numbers. Do not include your PIN or passwords.</p>
    <textarea class="ggds-textarea" id="details" name="details" rows="5" aria-describedby="details-hint"></textarea>
  </div>
  <button class="ggds-button" type="submit">Continue</button>
</form>`;
      break;
    case 'status':
      body = `${head}
${note}
<form class="docs-example-form" action="${esc(fileFor(page.path))}" method="get">
  <div class="ggds-field">
    <label class="ggds-label" for="reference">Reference number</label>
    <p class="ggds-hint" id="reference-hint">It is in the message we sent you</p>
    <input class="ggds-input ggds-input--width-medium" id="reference" name="reference" type="text" spellcheck="false" aria-describedby="reference-hint">
  </div>
  <button class="ggds-button" type="submit">Check</button>
</form>`;
      break;
    case 'contact': {
      const c = ctx.contact;
      const fact = (label, value) => `<h2>${label}</h2>\n${ctx.unverified && value ? `<p>${esc(value)}</p>` : `<p><span class="ggds-tag">To be confirmed</span> Shown once the ${esc(short)} confirms it.</p>`}`;
      const complaint = ctx.pages.find((p) => p.kind === 'form');
      body = `${head}
${note}
<div class="ggds-prose">
${fact('Address', c?.address)}
${fact('Email', c?.email)}
${fact('Phone', c?.phone)}
${complaint ? `<h2>Make a complaint</h2>\n<p><a href="${esc(link(complaint.path))}">${esc(complaint.label)}</a></p>` : ''}
${anchors}
</div>`;
      break;
    }
    case 'search': {
      const results = ctx.pages.filter((p) => !['search', 'sitemap'].includes(p.kind)).slice(0, 6);
      body = `${head}
${note}
<form class="docs-example-search" action="${esc(fileFor('/search/'))}" method="get" role="search">
  <label class="ggds-label" for="search-q">Search the ${esc(short)} website</label>
  <div class="docs-example-search__row">
    <input class="ggds-input" id="search-q" name="q" type="search" enterkeyhint="search">
    <button class="ggds-button" type="submit">Search</button>
  </div>
</form>
<h2>Example results</h2>
<ul class="docs-example-list">${results.map((p) => `
  <li class="docs-example-item"><h3 class="docs-example-item__title"><a href="${esc(link(p.path))}">${esc(p.label)}</a></h3><p>${esc(p.section?.label ?? short)}</p></li>`).join('')}
</ul>
${pagination(fileFor('/search/'))}`;
      break;
    }
    case 'sitemap':
      body = `${head}
${note}
<div class="ggds-prose">
${ctx.nav.map((s) => `<h2><a href="${esc(link(s.href))}">${esc(s.label)}</a></h2>
<ul>${s.children.map((c) => `<li><a href="${esc(link(c.href))}">${esc(c.label)}</a></li>`).join('')}</ul>`).join('\n')}
</div>`;
      break;
    default:
      body = `${head}
<p class="ggds-lead ggds-measure">A short summary of ${esc(page.label.toLowerCase())} appears here.</p>
${note}
<div class="ggds-prose">
<h2>Who this is for</h2>
${tbc(short)}
<h2>What you need</h2>
${tbc(short)}
<h2>How long it takes and what it costs</h2>
${tbc(short)}
${anchors}
${related}
</div>`;
  }
  return body;
}

function kindName(kind) {
  return { section: 'section page', list: 'list page', faq: 'questions page', form: 'form', status: 'form', contact: 'contact page', search: 'search results page', sitemap: 'sitemap' }[kind] ?? 'content page';
}

const pagination = (file) => `<nav class="ggds-pagination" aria-label="Pages">
  <ul class="ggds-pagination__list">
    <li><a class="ggds-pagination__link" href="${file}?page=1" aria-label="Page 1" aria-current="page">1</a></li>
    <li><a class="ggds-pagination__link" href="${file}?page=2" aria-label="Page 2">2</a></li>
    <li><a class="ggds-pagination__link" href="${file}?page=3" aria-label="Page 3">3</a></li>
    <li><a class="ggds-pagination__link" href="${file}?page=2" rel="next">Next<span class="ggds-visually-hidden"> page</span></a></li>
  </ul>
</nav>`;
