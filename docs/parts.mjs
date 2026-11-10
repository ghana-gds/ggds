// GGDS page parts as HTML strings: the canonical markup of the banner, header, hero, footer and tab bar, used by
// the documentation site and the agency evidence pages. The component examples in packages/html show the same
// markup.

export const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Icons come from @ggds/icons through @ggds/astro, so the documentation and the Astro components draw the same ones.
import { icon } from '../packages/astro/icons.mjs';
export { icon };

const FLAG = `<svg class="ggds-banner__flag" viewBox="0 0 30 20" aria-hidden="true" focusable="false"><rect class="ggds-banner__flag-red" width="30" height="6.67"/><rect class="ggds-banner__flag-gold" y="6.67" width="30" height="6.67"/><rect class="ggds-banner__flag-green" y="13.33" width="30" height="6.67"/><polygon class="ggds-banner__flag-star" points="15,6.8 15.73,8.99 18.04,9.01 16.19,10.39 16.88,12.59 15,11.25 13.12,12.59 13.81,10.39 11.96,9.01 14.27,8.99"/></svg>`;

export function banner({ unofficial, shortName, host, addressNote = '', registerHref }) {
  const text = unofficial ? `This copy is not the official ${esc(shortName)} website` : 'An official website of the Government of Ghana';
  const address = !host
    ? `The ${esc(shortName)} has not confirmed its official address yet.`
    : unofficial
      ? `The official ${esc(shortName)} website is <strong>${esc(host)}</strong>${esc(addressNote)}.`
      : `The official address of this website is <strong>${esc(host)}</strong>.`;
  return `<section class="ggds-banner${unofficial ? ' ggds-banner--unofficial' : ''}" aria-label="Official government website">
  <details class="ggds-banner__details ggds-container">
    <summary class="ggds-banner__summary">${FLAG}<span class="ggds-banner__text">${text}</span> <span class="ggds-banner__toggle">How to tell</span></summary>
    <div class="ggds-banner__content">
      <div class="ggds-banner__item"><p class="ggds-banner__heading">Check the address</p><p>${address} Most government websites end in <strong>.gov.gh</strong>, but some official websites do not. You can check it in the <a href="${registerHref}">register of official government websites</a>.</p></div>
      <div class="ggds-banner__item"><p class="ggds-banner__heading">A padlock is not proof</p><p>A padlock or <strong>https://</strong> before the address means your connection to the website is private. It does not show who runs the website.</p></div>
      <div class="ggds-banner__item"><p class="ggds-banner__heading">We will never ask for your PIN</p><p>Government officials will never ask for your PIN, password or mobile money code, by phone, by SMS or on a website.</p></div>
    </div>
  </details>
</section>`;
}

/** The institution's mark: its approved logo, or its initials in a round badge until one is supplied. */
export function mark({ logo, alt = '', initials, size = 44, cls = 'ggds-header__logo' }) {
  if (logo) return `<img class="${cls}" src="${esc(logo)}" alt="${esc(alt)}" width="${size}" height="${size}">`;
  return `<span class="ggds-header__monogram" aria-hidden="true">${esc(initials)}</span>`;
}

export function header({ name, country = 'Republic of Ghana', logo = '', nav, current, navId = 'ggds-header-nav', home = '/', search }) {
  const items = nav.map((n) => `<li><a class="ggds-header__link" href="${esc(n.href)}"${n.href === current ? ' aria-current="page"' : ''}>${esc(n.label)}</a></li>`).join('\n        ');
  return `<header class="ggds-header">
  <div class="ggds-container ggds-header__inner">
    <a class="ggds-header__identity" href="${esc(home)}">
      ${logo}
      <span class="ggds-header__text">
        <span class="ggds-header__name${name.length > 45 ? ' ggds-header__name--long' : ''}">${esc(name)}</span>
        ${country ? `<span class="ggds-header__country">${esc(country)}</span>` : ''}
        <span class="ggds-visually-hidden"> – home</span>
      </span>
    </a>
    <nav class="ggds-header__nav" id="${navId}" aria-label="Main">
      <ul class="ggds-header__list">
        ${items}
      </ul>
    </nav>
    ${search ? `<a class="ggds-header__search" href="${esc(search)}">${icon('search', 'ggds-header__icon')}<span class="ggds-header__search-label">Search</span></a>` : ''}
    <button type="button" class="ggds-header__menu-button" aria-controls="${navId}" aria-expanded="false" hidden>${icon('menu', 'ggds-header__icon ggds-header__icon--menu')}${icon('close', 'ggds-header__icon ggds-header__icon--close')}<span class="ggds-visually-hidden">Menu</span></button>
  </div>
</header>`;
}

export function hero({ hub = false, purpose, title, lede, search, tasksLabel = 'Common tasks:', tasks = [], art = '', artDecorative = true }) {
  const searchForm = search ? `
      <form class="ggds-hero__search" action="${esc(search.action)}" method="get" role="search">
        <label class="ggds-visually-hidden" for="hero-q">${esc(search.label)}</label>
        <input class="ggds-hero__input" id="hero-q" name="q" type="search" required minlength="2" enterkeyhint="search" autocomplete="off"${search.placeholder ? ` placeholder="${esc(search.placeholder)}"` : ''}>
        <button class="ggds-hero__button" type="submit">${icon('search', 'ggds-hero__button-icon')}<span class="ggds-hero__button-label">Search</span></button>
      </form>` : '';
  const taskList = tasks.length ? `
      <p class="ggds-hero__tasks-label" id="hero-tasks">${esc(tasksLabel)}</p>
      <ul class="ggds-hero__tasks" aria-labelledby="hero-tasks">
        ${tasks.map((t) => `<li><a class="ggds-hero__task" href="${esc(t.href)}">${esc(t.label)}${t.tag ? ` <span class="ggds-hero__task-tag">${esc(t.tag)}</span>` : ''}</a></li>`).join('\n        ')}
      </ul>` : '';
  return `<section class="ggds-hero${hub ? ' ggds-hero--hub' : ''}${art ? ' ggds-hero--art' : ''}" aria-labelledby="hero-title">
  <div class="ggds-hero__inner">
    <div class="ggds-hero__body">
      ${purpose ? `<p class="ggds-hero__purpose">${esc(purpose)}</p>` : ''}
      <h1 class="ggds-hero__title" id="hero-title">${esc(title)}</h1>
      ${lede ? `<p class="ggds-hero__lede">${esc(lede)}</p>` : ''}${searchForm}${taskList}
    </div>${art ? `\n    <div class="ggds-hero__art"${artDecorative ? ' aria-hidden="true"' : ''}>\n${art}\n    </div>` : ''}
  </div>
</section>`;
}

/**
 * contact: { address, email, phone, moreHref }; sections: [{ label, href, links: [{ label, href }] }];
 * bar: [[label, href]] after the copyright line.
 */
export function footer({ name, logo = '', purpose, contact, sections = [], bar = [], year = 2026 }) {
  const contactHtml = contact ? `
      <address class="ggds-footer__contact">
        ${contact.address ? `<span>${esc(contact.address)}</span>` : ''}
        ${contact.email ? `<a href="mailto:${esc(contact.email)}">${esc(contact.email)}</a>` : ''}
        ${contact.phone ? `<span>General enquiries: ${esc(contact.phone)}</span>` : ''}
      </address>
      ${contact.moreHref ? `<p class="ggds-footer__more"><a href="${esc(contact.moreHref)}">All contact details and offices</a></p>` : ''}` : '';
  const sectionHtml = sections.map((s) => `
      <nav class="ggds-footer__section" aria-label="${esc(s.label)}">
        <p class="ggds-footer__heading"><a href="${esc(s.href)}">${esc(s.label)}</a></p>
        <ul class="ggds-footer__list">
          ${s.links.slice(0, 5).map((l) => `<li><a href="${esc(l.href)}">${esc(l.label)}</a></li>`).join('\n          ')}
        </ul>
      </nav>`).join('');
  return `<footer class="ggds-footer">
  <div class="ggds-container ggds-footer__main">
    <div>
      <p class="ggds-footer__identity">${logo}<span>${esc(name)}</span></p>
      ${purpose ? `<p class="ggds-footer__purpose">${esc(purpose)}</p>` : ''}${contactHtml}
    </div>
    <div class="ggds-footer__sections">${sectionHtml}
    </div>
  </div>
  <div class="ggds-footer__bottom">
    <ul class="ggds-container ggds-footer__bar">
      <li>© ${year} ${esc(name)}</li>
      ${bar.map(([l, h]) => `<li><a href="${esc(h)}">${esc(l)}</a></li>`).join('\n      ')}
    </ul>
  </div>
</footer>`;
}

/** tabs: [{ label, href, icon, current }]; Home first and Search last, as on the platform. */
export function tabBar(tabs) {
  return `<nav class="ggds-tab-bar" aria-label="Quick links">
  <ul class="ggds-tab-bar__list">
    ${tabs.map((t) => `<li><a class="ggds-tab-bar__link" href="${esc(t.href)}"${t.current ? ' aria-current="page"' : ''}>${icon(t.icon, 'ggds-tab-bar__icon')}<span>${esc(t.label)}</span></a></li>`).join('\n    ')}
  </ul>
</nav>`;
}

/** The shared animated hero drawing (ggds-hero-art in @ggds/css). Decorative; put it in hero({ art }). */
export const HERO_ART = `<svg class="ggds-hero-art" viewBox="0 0 560 480" focusable="false" role="presentation">
  <ellipse class="ggds-hero-art__shadow" cx="280" cy="405" rx="190" ry="28"/>
  <path class="ggds-hero-art__orbit" d="M86 278C104 142 227 66 356 89s153 127 91 232"/>
  <path class="ggds-hero-art__orbit ggds-hero-art__orbit--reverse" d="M100 337C173 407 323 421 444 326"/>
  <g class="ggds-hero-art__plane">
    <path class="ggds-hero-art__surface" d="M126 156 316 80l121 61-190 78z"/>
    <path class="ggds-hero-art__side" d="m247 219 190-78v42l-190 78z"/>
  </g>
  <g class="ggds-hero-art__plane ggds-hero-art__plane--front">
    <path class="ggds-hero-art__surface" d="M112 190 302 114l146 73-190 78z"/>
    <path class="ggds-hero-art__side" d="m258 265 190-78v95l-190 78z"/>
    <path class="ggds-hero-art__side" d="m112 190 146 75v95l-146-74z"/>
    <path class="ggds-hero-art__edge" d="m258 265 190-78"/>
  </g>
  <path class="ggds-hero-art__links" d="m172 205 72-30 82 40 58-24m-212 14 86 60 68-50"/>
  <circle class="ggds-hero-art__node" cx="172" cy="205" r="9"/><circle class="ggds-hero-art__node" cx="244" cy="175" r="9"/>
  <circle class="ggds-hero-art__node" cx="326" cy="215" r="9"/><circle class="ggds-hero-art__node" cx="384" cy="191" r="9"/>
  <g><circle class="ggds-hero-art__pulse" cx="326" cy="215" r="24"/><circle class="ggds-hero-art__pulse" cx="326" cy="215" r="43"/><circle class="ggds-hero-art__pulse" cx="326" cy="215" r="63"/></g>
</svg>`;
