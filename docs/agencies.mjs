// Evidence that GGDS can run the 12 MoCDTI agency websites: reads each agency's real settings from the shared
// platform (agencies/<slug>/profile.json and site.json, packages/agency-schema/modules.json) and renders that
// agency's shared page parts with GGDS, in its own colour. It also computes every agency colour with both GGDS
// (packages/tokens/institution.mjs) and the platform (packages/design-tokens/agency-colour.mjs) and fails the
// build if they differ.
//
// The platform is found at GGDS_PLATFORM_DIR, default ../agencies/platform next to this repository.
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { getTheme } from '../packages/themes/index.mjs';
import { institutionPalette } from '../packages/tokens/institution.mjs';
import { contrast } from '../packages/tokens/lib.mjs';
import { HERO_ART, banner, esc, footer, header, hero, mark, tabBar } from './parts.mjs';
import { fileFor, innerMain, pageKind } from './example-pages.mjs';
import { UNVERIFIED, hideContacts, maskText } from './contacts.mjs';

export function platformDir(root) {
  return resolve(process.env.GGDS_PLATFORM_DIR ?? join(root, '..', 'agencies', 'platform'));
}

const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));

// The platform's main navigation sections (apps/web/src/lib/nav.ts ALL_SECTIONS): label, address, description,
// icon and default sub-menu. "Agencies" appears only with the hub module (its sub-menu is the other agencies);
// "About & contact" belongs to no module and always appears.
const SECTIONS = [
  { label: 'Agencies', href: '/our-agencies/', icon: 'building', description: 'Find the agency that handles what you need', children: [] },
  { label: 'Services', href: '/services/', icon: 'services', description: 'Licences, applications, approvals and fees', children: [
    { label: 'Find a service', href: '/services/' }, { label: 'Licences and authorisations', href: '/services/?service_type=licence' },
    { label: 'Get equipment approved', href: '/services/type-approval/' }, { label: 'Fees and charges', href: '/services/fees/' },
    { label: 'Application portals', href: '/services/portals/' }] },
  { label: 'Consumer help', href: '/consumer-help/', icon: 'help', description: 'Complaints, your rights and common problems', children: [
    { label: 'Make or escalate a complaint', href: '/consumer-help/complaints/' }, { label: 'Check a complaint', href: '/consumer-help/complaints/status/' },
    { label: 'Frequently asked questions', href: '/consumer-help/faqs/' }, { label: 'Check if a phone is approved', href: '/services/type-approval/equipment/' },
    { label: 'Contact us', href: '/about/contact/' }] },
  { label: 'Laws & regulations', href: '/regulation/', icon: 'scale', description: 'Find laws, official documents and consultations', children: [
    { label: 'Laws & regulations', href: '/regulation/?type=act' }, { label: 'Guidelines & codes', href: '/regulation/?type=guideline' },
    { label: 'Regulatory decisions', href: '/regulation/?type=decision' }, { label: 'Public consultations', href: '/regulation/consultations/' }] },
  { label: 'Data & reports', href: '/industry-data/', icon: 'chart', description: 'Statistics, research and reports', children: [
    { label: 'Reports', href: '/industry-data/reports/' }, { label: 'Datasets', href: '/industry-data/#datasets' }] },
  { label: 'News & notices', href: '/news-notices/', icon: 'megaphone', description: 'Official notices, news and events', children: [
    { label: 'Official notices', href: '/news-notices/?kind=notice' }, { label: 'News', href: '/news-notices/?kind=news' },
    { label: 'Events', href: '/news-notices/?kind=event' }, { label: 'Publications', href: '/news-notices/?kind=publication' }] },
  { label: 'About & contact', href: '/about/', icon: 'building', description: 'Contact details, offices, mandate, leadership and careers', children: [
    { label: 'Contact the {short}', href: '/about/contact/' }, { label: 'Offices', href: '/about/contact/#offices' }, { label: 'Mandate & values', href: '/about/' }] },
];

// The phone tab bar's middle tabs, in the platform's order (TabBar.astro); the first three the agency has switched on.
const TABS = [
  { label: 'Agencies', href: '/our-agencies/', icon: 'building' }, { label: 'Services', href: '/services/', icon: 'services' },
  { label: 'Complaints', href: '/consumer-help/complaints/', icon: 'help' }, { label: 'Laws', href: '/regulation/', icon: 'scale' },
  { label: 'Data', href: '/industry-data/', icon: 'chart' }, { label: 'News', href: '/news-notices/', icon: 'megaphone' },
  { label: 'About', href: '/about/', icon: 'building' },
];

/** The platform's rule (lib/agency-profile.ts pathEnabled): a path is on unless it is inside a module that is off. */
function pathEnabled(registry, modules, href) {
  const owner = registry
    .filter((m) => m.paths.some((p) => href.startsWith(p)))
    .sort((a, b) => Math.max(...b.paths.map((p) => p.length)) - Math.max(...a.paths.map((p) => p.length)))[0];
  if (!owner) return true;
  return modules[owner.key] === true;
}

/** The agency's main navigation, as the platform builds it (lib/nav.ts navFor) from its modules and site.json. */
export function navFor(registry, profile, site) {
  const own = new Map((site?.nav ?? []).map((o) => [o.section, o]));
  return SECTIONS.filter((s) => pathEnabled(registry, profile.modules, s.href)).map((s) => {
    const o = own.get(s.href);
    const children = (o?.children ?? s.children).filter((c) => pathEnabled(registry, profile.modules, c.href))
      .map((c) => ({ ...c, label: c.label.replace('{short}', profile.identity.shortName) }));
    return { label: o?.label ?? s.label, href: s.href, icon: s.icon, tabLabel: o?.tabLabel, description: o?.description ?? s.description, children };
  });
}

const bareHost = (url) => new URL(url).host.replace(/^www\./, '');

/** The sub-menu links in the platform's nav.ts, so a hand copy here cannot silently fall behind. */
function checkSections(dir) {
  const navTs = join(dir, 'apps', 'web', 'src', 'lib', 'nav.ts');
  if (!existsSync(navTs)) return;
  const src = readFileSync(navTs, 'utf8');
  const block = src.slice(src.indexOf('const ALL_SECTIONS'), src.indexOf('];', src.indexOf('const ALL_SECTIONS')));
  const theirs = [...block.matchAll(/\{ label: (['`])(.*?)\1, href: '([^']+)' \}/g)].map((m) => `${m[2].replace('${AGENCY.shortName}', '{short}')} ${m[3]}`);
  const ours = SECTIONS.flatMap((s) => s.children.map((c) => `${c.label} ${c.href}`));
  const missing = theirs.filter((x) => !ours.includes(x));
  const extra = ours.filter((x) => !theirs.includes(x));
  if (missing.length || extra.length) throw new Error(`docs/agencies.mjs SECTIONS differ from the platform's nav.ts.\n  missing: ${missing.join('; ')}\n  extra: ${extra.join('; ')}`);
}

/**
 * GGDS_EXAMPLE_UNVERIFIED=1 adds the agencies' logos and contact details. Leave it off for any build that is
 * published: no logo is approved for use, and no contact detail has been confirmed by its agency.
 */
const SCENES = fileURLToPath(new URL('./scenes/', import.meta.url));
/** Email addresses and full phone numbers in agency-written text, hidden unless GGDS_EXAMPLE_UNVERIFIED=1. */
const mask = maskText;

export async function loadAgencies(root) {
  const dir = platformDir(root);
  const agenciesDir = join(dir, 'agencies');
  if (!existsSync(agenciesDir)) return { dir, agencies: [], platformPalette: null };
  checkSections(dir);
  const registry = readJson(join(dir, 'packages', 'agency-schema', 'modules.json')).modules;
  const { agencyPalette } = await import(pathToFileURL(join(dir, 'packages', 'design-tokens', 'agency-colour.mjs')).href);
  const agencies = readdirSync(agenciesDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(join(agenciesDir, d.name, 'profile.json')))
    .map((d) => {
      const profile = readJson(join(agenciesDir, d.name, 'profile.json'));
      const sitePath = join(agenciesDir, d.name, 'site.json');
      const site = existsSync(sitePath) ? readJson(sitePath) : null;
      return { slug: d.name, profile, site };
    })
    .filter((a) => a.profile.status !== 'fixture')
    .sort((a, b) => a.profile.identity.legalName.localeCompare(b.profile.identity.legalName))
    .map((a) => {
      const ggds = institutionPalette(a.profile.identity.themeColor);
      const platform = agencyPalette(a.profile.identity.themeColor);
      // The agency's GGDS theme must give the same colours as its profile does today.
      const theme = getTheme(a.slug);
      const themeMatch = theme.accent === ggds.accent && theme.deep === ggds.deep;
      const tabs = TABS.filter((t) => pathEnabled(registry, a.profile.modules, t.href)).slice(0, 3);
      return { ...a, ggds, platform, tabs, nav: navFor(registry, a.profile, a.site), match: themeMatch && ggds.accent === platform.accent && ggds.deep === platform.deep };
    });
  const mismatches = agencies.filter((a) => !a.match);
  if (mismatches.length) throw new Error(`Institution colours differ from the platform for: ${mismatches.map((a) => a.slug).join(', ')}`);
  return { dir, agencies };
}

/** The platform's hero line when site.json gives none (AgencyHome.astro heroLine). */
function defaultLede(modules) {
  const offers = [modules.services && 'find a service', modules.complaints && 'make a complaint',
    modules.regulation && 'look up a regulation', modules['industry-data'] && 'find data and reports'].filter(Boolean).slice(0, 3);
  if (!offers.length) return 'Find information and services.';
  const text = offers.length > 1 ? `${offers.slice(0, -1).join(', ')} or ${offers.at(-1)}.` : `${offers[0]}.`;
  return text[0].toUpperCase() + text.slice(1);
}

/** Writes site/agencies/: one evidence page per agency, shaped like that agency's homepage, and an index. */
export function writeAgencyPages({ siteDir, agencies, platformDirectory, shell }) {
  const out = join(siteDir, 'agencies');
  mkdirSync(out, { recursive: true });
  if (existsSync(SCENES)) {
    mkdirSync(join(siteDir, 'assets', 'scenes'), { recursive: true });
    for (const f of readdirSync(SCENES).filter((f) => f.endsWith('.js'))) copyFileSync(join(SCENES, f), join(siteDir, 'assets', 'scenes', f));
    for (const f of readdirSync(SCENES).filter((f) => f.endsWith('.css'))) {
      // The scenes use two of the platform's Tailwind utilities; nothing else of Tailwind.
      writeFileSync(join(siteDir, 'assets', 'scenes', f), `.ggds-hero__art .m-0 { margin: 0; }\n.ggds-hero__art .shrink-0 { flex-shrink: 0; }\n${readFileSync(join(SCENES, f), 'utf8')}`);
    }
  }

  // Logos: each profile's logo, copied from the agency's assets (also used on the ministry hub's cards).
  const logos = new Map();
  for (const a of agencies) {
    const { identity } = a.profile;
    const src = identity.logo?.small ?? identity.logo?.src;
    const file = src?.match(/^\/agencies\/([a-z0-9-]+)\/(.+)$/);
    const from = file && join(platformDirectory, 'agencies', file[1], 'assets', file[2]);
    if (UNVERIFIED && from && existsSync(from)) {
      const name = `${a.slug}-${file[2].split('/').pop()}`;
      copyFileSync(from, join(out, name));
      logos.set(a.slug, { src: name, alt: identity.logo.alt ?? '' });
    }
  }
  const markFor = (a, cls, size) => mark({ logo: logos.get(a.slug)?.src, alt: logos.get(a.slug)?.alt, initials: a.profile.identity.shortName.replace(/[^A-Za-z0-9]/g, '').slice(0, 4).toUpperCase(), cls, size });
  // The agencies a ministry hub lists (the platform's HubHome.astro): its chosen order (site.json hub.featured), then by name.
  const members = (hubAgency) => {
    const featured = hubAgency.site?.hub?.featured ?? [];
    const rank = (x) => { const i = featured.indexOf(x.slug); return i === -1 ? featured.length : i; };
    return agencies.filter((x) => x.slug !== hubAgency.slug && !x.profile.modules.hub)
      .sort((x, y) => rank(x) - rank(y) || x.profile.identity.legalName.localeCompare(y.profile.identity.legalName))
      .map((x) => ({ ...x, featured: featured.includes(x.slug) }));
  };
  const agencyCard = (x, titleHref, headingLevel = 3) => {
    const { identity, remit } = x.profile;
    return `
      <li class="ggds-card ggds-card--institution" data-ggds-theme="${x.slug}">
        <div class="ggds-card__head">${markFor(x, 'ggds-card__logo', 44)}<div>
          <h${headingLevel} class="ggds-card__title"><a class="ggds-card__link" href="${esc(titleHref)}">${esc(identity.shortName)}</a></h${headingLevel}>
          <p class="ggds-card__subtitle">${esc(identity.legalName)}</p></div></div>
        ${remit?.summary ? `<p class="ggds-card__body">${esc(remit.summary)}</p>` : ''}
        ${remit?.topics?.length ? `<ul class="ggds-card__actions">${remit.topics.slice(0, 2).map((t) => `<li><a class="ggds-card__action" href="${esc(titleHref)}">${esc(t.label)}</a></li>`).join('')}</ul>` : ''}
      </li>`;
  };

  for (const a of agencies) {
    const { identity, domains, contact } = a.profile;
    const short = identity.shortName;
    const hub = a.profile.modules.hub === true;
    // A compromised website is never named, as on the platform (profile.schema.json: nothing links to it).
    const officialUrl = domains.public || (domains.legacyCompromised ? '' : domains.legacy);
    const host = officialUrl ? bareHost(officialUrl) : '';
    const addressNote = domains.public ? '' : ' (the agency has not yet confirmed its public address; this is its current site)';
    const ratio = (x, y) => contrast(x, y).toFixed(2);
    const home = a.site?.home ?? {};
    const others = hub ? members(a) : [];
    // On a hub, "Agencies" lists the other agencies, linked to their example homepages.
    const byName = [...others].sort((x, y) => x.profile.identity.legalName.localeCompare(y.profile.identity.legalName));
    const nav = a.nav.map((s) => (s.href === '/our-agencies/' ? { ...s, children: byName.map((x) => ({ label: x.profile.identity.legalName, href: `${x.slug}.html` })) } : s));
    const tasks = hub
      ? others.filter((x) => x.featured && x.profile.remit?.topics?.[0]).map((x) => ({ label: x.profile.remit.topics[0].label, href: `${x.slug}.html`, tag: x.profile.identity.shortName }))
      : (home.shortcuts ?? []).map((t) => ({ label: t.label, href: t.href }));
    const services = (home.tasks ?? nav.filter((s) => s.href !== '/about/').map((s) => ({ title: s.label, body: s.description, href: s.href }))).slice(0, 6);
    const bar = [['Accessibility', '/accessibility/'], ['Privacy', '/privacy/'], ['Disclaimer', '/disclaimer/'], ['Sitemap', '/sitemap/']];

    // Every address the site links to gets an example page: the first label it is linked with names the page.
    const sectionHrefs = nav.map((s) => s.href);
    const pages = new Map();
    const register = (href, label) => {
      if (!href.startsWith('/') || href === '/') return;
      const [path, hash] = href.split('#');
      const section = [...nav].sort((x, y) => y.href.length - x.href.length).find((s) => path.startsWith(s.href)) ?? null;
      if (!pages.has(path)) pages.set(path, { path, label: section?.href === path ? section.label : label, kind: pageKind(path, sectionHrefs), section, hashes: [] });
      if (hash && !pages.get(path).hashes.some((h) => h.id === hash)) pages.get(path).hashes.push({ id: hash, label });
    };
    for (const s of nav) { register(s.href, s.label); for (const c of s.children) register(c.href, c.label); }
    for (const t of tasks) register(t.href, t.label);
    for (const t of services) register(t.href, t.title);
    for (const [l, h] of bar) register(h, l);
    // The drawing beside the hero, as the live site shows it (docs/scenes/, from pnpm run sync:scenes). Its links
    // become example pages too. A ministry hub has none; an agency without a saved scene gets the shared drawing.
    const sceneFile = join(SCENES, `${a.slug}.html`);
    let scene = !hub && existsSync(sceneFile) ? readFileSync(sceneFile, 'utf8').replace(/\bsr-only\b/g, 'ggds-visually-hidden') : null;
    // Contact channels in a drawing are unconfirmed, like the footer's (docs/contacts.mjs).
    scene = hideContacts(scene, home);
    if (scene) for (const [, href, text] of scene.matchAll(/<a\b[^>]*\shref="(\/[^"]*)"[^>]*>([\s\S]*?)<\/a>/g)) register(href, text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
    register('/about/contact/', `Contact the ${short}`);
    register('/search/', 'Search');
    for (const t of a.tabs) register(t.href, t.label);

    const dir = join(out, a.slug);
    mkdirSync(dir, { recursive: true });
    // Links from the homepage (agencies/<slug>.html) or from an inner page (agencies/<slug>/<file>.html).
    const linker = (inner) => (href) => {
      if (/^[a-z0-9-]+\.html$/.test(href) || href === 'index.html') return inner ? `../${href}` : href; // other example sites
      if (href === '/') return inner ? `../${a.slug}.html` : `${a.slug}.html`;
      if (href.startsWith('#')) return href;
      const [path, hash] = href.split('#');
      if (!pages.has(path)) throw new Error(`${a.slug}: no example page for ${href}`);
      const file = fileFor(path);
      return `${inner ? '' : `${a.slug}/`}${file}${hash ? `#${hash}` : ''}`;
    };

    // The parts every page of the site shares.
    const frame = ({ inner, current, main }) => {
      const link = linker(inner);
      const up = inner ? '../../' : '../';
      const exit = (where) => `<nav class="docs-exit docs-exit--${where}" aria-label="${where === 'top' ? 'Example site' : 'Leave the example'}">
  <div class="ggds-container docs-exit__inner">
    <p class="docs-exit__text"><strong>Example site</strong> built with GGDS. Not the real ${esc(short)} website.</p>
    <ul class="docs-exit__links">
      <li><a href="${up}index.html">Back to GGDS documentation</a></li>
      <li><a href="${up}agencies/index.html">All example sites</a></li>
    </ul>
  </div>
</nav>`;
      return `
<a class="ggds-skip-link" href="#main">Skip to main content</a>
${exit('top')}
${banner({ unofficial: true, shortName: short, host, addressNote, registerHref: `${up}register.html` })}
${header({ name: identity.legalName, country: identity.countryLabel ?? 'Republic of Ghana', logo: markFor(a, 'ggds-header__logo', 44), nav: nav.map((s) => ({ ...s, href: link(s.href) })), current: current ? link(current) : undefined, navId: 'agency-nav', home: link('/'), search: link('/search/') })}
<main id="main" tabindex="-1">
${main}
</main>
${footer({
  name: identity.legalName,
  logo: markFor(a, 'ggds-footer__logo', 48),
  purpose: identity.purposeStatement,
  contact: UNVERIFIED ? { address: contact?.address, email: contact?.email, phone: contact?.phone, moreHref: link('/about/contact/') }
    : { address: 'Address, email and phone appear here once the agency confirms them.', moreHref: link('/about/contact/') },
  sections: nav.filter((s) => s.children.length).map((s) => ({ label: s.label, href: link(s.href), links: s.children.map((c) => ({ ...c, href: link(c.href) })) })),
  bar: bar.map(([l, h]) => [l, link(h)]),
})}
${exit('bottom')}
${tabBar([
  { label: 'Home', href: link('/'), icon: 'home', current: !current },
  ...a.tabs.map((t) => ({ ...t, href: link(t.href), current: current === t.href, label: nav.find((s) => s.href === t.href)?.tabLabel ?? t.label })),
  { label: 'Search', href: link('/search/'), icon: 'search', current: current === '/search/' },
])}`;
    };

    // Homepage
    const link = linker(false);
    const below = hub ? `
  <section class="docs-home-section" aria-labelledby="agencies-h">
    <div class="docs-section-head"><h2 id="agencies-h">Which agency do you need?</h2><a href="index.html">All agencies</a></div>
    <ul class="ggds-card-grid">${others.map((x) => agencyCard(x, `${x.slug}.html`)).join('')}
    </ul>
  </section>` : `
  <section class="docs-home-section" aria-labelledby="tasks-h">
    <h2 id="tasks-h">${esc(home.tasksHeading ?? 'Most-used services')}</h2>
    <ul class="ggds-card-grid${services.length % 4 === 0 ? ' ggds-card-grid--4' : ''}">${services.map((t) => `
      <li class="ggds-card">
        <h3 class="ggds-card__title"><a class="ggds-card__link" href="${esc(link(t.href))}">${esc(t.title)}</a></h3>
        <p class="ggds-card__body">${esc(mask(t.body))}</p>
      </li>`).join('')}
    </ul>
  </section>`;
    const homeMain = `${hero({
  hub,
  purpose: identity.purposeStatement,
  title: home.heading ?? 'What do you need help with?',
  lede: home.lede ?? defaultLede(a.profile.modules),
  search: { action: link('/search/'), label: home.heading ?? `Search the ${short} website`, placeholder: a.site?.search?.example ? `e.g. ${a.site.search.example}` : `Search the ${short} website` },
  tasksLabel: hub ? 'Most asked for:' : 'Common tasks:',
  tasks: tasks.map((t) => ({ ...t, href: link(t.href) })),
  art: hub ? '' : scene ? scene.replace(/\shref="(\/[^"]*)"/g, (m, h) => ` href="${esc(link(h))}"`) : HERO_ART,
  artDecorative: !scene,
})}
<div class="ggds-container">
  ${below}
  <section class="docs-home-section docs-evidence" aria-labelledby="evidence-h">
    <nav class="ggds-breadcrumbs" aria-label="Breadcrumb">
      <ol class="ggds-breadcrumbs__list">
        <li class="ggds-breadcrumbs__item"><a class="ggds-breadcrumbs__link" href="../index.html">GGDS</a></li>
        <li class="ggds-breadcrumbs__item"><a class="ggds-breadcrumbs__link" href="index.html">Example sites</a></li>
        <li class="ggds-breadcrumbs__item" aria-current="page">${esc(short)}</li>
      </ol>
    </nav>
    <h2 id="evidence-h">About this example</h2>
    <div class="ggds-notice ggds-notice--warning">
      <p class="ggds-notice__title"><span class="ggds-visually-hidden">Warning:</span> Example only. This is not the ${esc(short)} website.</p>
      <p>A website built with GGDS from the ${esc(short)}'s name, colour, sections and common tasks${UNVERIFIED ? ', logo and contact details' : ''}. The ${esc(short)} has not yet confirmed these details${UNVERIFIED ? '' : ', so its logo and contact details are left out'}. Every link opens an example page with placeholder words.</p>
    </div>
    <p>Theme: <code>themes/${a.slug}.css</code>. Name on white: ${ratio(a.ggds.accent, '#ffffff')}:1. White on the hero and footer: ${ratio('#ffffff', a.ggds.deep)}:1.</p>
  </section>
</div>`;
    writeFileSync(join(out, `${a.slug}.html`), shell({ title: `${short} with GGDS (example)`, depth: 1, scripts: scene && existsSync(join(SCENES, `${a.slug}.js`)) ? [`assets/scenes/${a.slug}.js`] : [], body: frame({ inner: false, main: homeMain }), extraCss: [`../assets/themes/${a.slug}.css`, '../assets/themes/themes.css', ...(scene ? [`../assets/scenes/${a.slug}.css`] : [])], bare: true, noindex: true }));

    // Inner pages
    const list = [...pages.values()];
    for (const pg of list) {
      const main = `<div class="ggds-main ggds-container">\n${innerMain(pg, { short, link: linker(true), pages: list, contact, unverified: UNVERIFIED, nav })}\n</div>`;
      writeFileSync(join(dir, fileFor(pg.path)), shell({ title: `${pg.label} | ${short} (example)`, depth: 2, body: frame({ inner: true, current: pg.section?.href ?? pg.path, main }), extraCss: [`../../assets/themes/${a.slug}.css`], bare: true, noindex: true }));
    }
    a.innerPages = list.length;
  }

  // Index: every example as an institution card in its own colour.
  const cards = agencies.map((a) => agencyCard(a, `${a.slug}.html`)).join('');
  return {
    title: 'Example sites',
    body: `
<h1>Example sites</h1>
<p class="ggds-lead ggds-measure">Twelve government homepages built with GGDS: a ministry and its agencies. Each uses its own <a href="../themes.html">theme</a>, logo, contact details and common tasks, and shares everything else.</p>
<div class="ggds-notice ggds-notice--warning">
  <p class="ggds-notice__title"><span class="ggds-visually-hidden">Warning:</span> Examples only</p>
  <p>None of these is a live website. No institution has confirmed its details yet, so logos and contact details are left out.</p>
</div>
<ul class="ggds-card-grid docs-home-section">${cards}
</ul>`,
    extraCss: ['../assets/themes/themes.css'],
  };
}
