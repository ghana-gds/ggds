// What makes an agency website starter one institution's own: its name, address, contact details, colour, and which
// parts it needs. The starter (docs/starter.mjs) builds every page from these settings; the website builder
// (docs/builder.js) asks for them; ggds-site.json in every download keeps them, so the same website can be made
// again with a newer GGDS. Runs in the browser and in Node, so no Node imports.
//
// The words of the pages are settings too (services, fees, news, documents, jobs, about us), so a website made in
// the builder keeps what the institution wrote. Left out, they are the words for its kind of institution
// (docs/starter-kinds.mjs), so settings saved before they existed make the same website as before.
import { KINDS, KIND_IDS, kindOf } from './starter-kinds.mjs';

/** The made-up institution of the starter as published: the live preview and the release download. */
export const DEFAULT_SITE = {
  kind: 'agency',
  name: 'Example Agency',
  short: 'EA',
  purpose: 'We license communications services and protect the people who use them.',
  host: 'www.example.gov.gh',
  theme: 'mocdti',
  phone: '030 000 0000',
  hours: 'Monday to Friday, 8am to 5pm',
  email: 'info@example.gov.gh',
  offices: [
    { name: 'Head office', lines: ['1 Example Road', 'Accra', 'GA-000-0000'] },
    { name: 'Kumasi office', lines: ['2 Example Street', 'Kumasi', 'AK-000-0000'] },
  ],
  parts: { apply: true, fees: true, complaint: true, news: true, publications: true, jobs: true },
  forms: '',
  live: false,
  logo: '',
};

/** The parts a website can leave out. Their pages: partPages(). The other pages are on every website. */
export const PARTS = [
  { id: 'apply', label: 'Apply online', hint: 'For the service marked "online": a start page, a form, check your answers and a confirmation' },
  { id: 'fees', label: 'Fees and charges', hint: 'A table of what each service costs' },
  { id: 'complaint', label: 'Complaints and feedback', hint: 'A form and a confirmation' },
  { id: 'news', label: 'News and notices', hint: 'A list of news and an article' },
  { id: 'publications', label: 'Documents to download', hint: 'Rules, policies, plans and reports' },
  { id: 'jobs', label: 'Jobs and tenders', hint: 'Vacancies and tenders, with a warning about fees' },
];
const PART_PAGES = {
  apply: ['apply.html', 'apply-check.html', 'apply-done.html'],
  fees: ['fees.html'], complaint: ['complaint.html', 'complaint-done.html'], news: ['news.html', 'news-article.html'],
  publications: ['publications.html'], jobs: ['jobs.html'],
};

/** Pages every website has: the law and GGDS ask for some of them (accessibility, privacy, disclaimer). */
export const ALWAYS = ['index.html', 'services.html', 'about.html', 'contact.html', 'contact-done.html', 'search.html', '404.html', 'accessibility.html', 'privacy.html', 'disclaimer.html'];

export const SITE_FILE = 'ggds-site.json';
export { KINDS };

const str = (v, fallback) => (typeof v === 'string' && v.trim() ? v.trim().replace(/\s+/g, ' ') : fallback);
/** Paragraphs: blank lines between them are kept; other runs of spaces become one. */
const para = (v, fallback) => (typeof v === 'string' && v.trim()
  ? v.trim().split(/\n\s*\n/).map((x) => x.replace(/\s+/g, ' ').trim()).filter(Boolean).join('\n\n') : fallback);
/** A list, from an array or one item a line. */
const items = (v, fallback) => {
  if (v === undefined || v === null) return fallback;
  const raw = Array.isArray(v) ? v : String(v).split('\n');
  return raw.map((x) => str(typeof x === 'string' ? x : '', '')).filter(Boolean);
};
const bool = (v, fallback) => (typeof v === 'boolean' ? v : fallback);

/** A page's address from its title: "Apply for a licence" → apply-for-a-licence. */
export const slugify = (t) => t.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'service';

/** A kind's words, in the shape the settings keep them. */
function kindContent(kind) {
  const k = kindOf(kind);
  return {
    question: k.question,
    lede: k.lede,
    services: k.services.map((x) => ({ ...x, who: [...x.who], need: [...x.need], options: [...x.options], steps: x.steps.map((st) => [...st]) })),
    fees: { caption: k.fees.caption, lead: k.fees.lead, columns: [...k.fees.columns], rows: k.fees.rows.map((r) => [...r]) },
    news: k.news.map(([title, type, date, summary, body = '']) => ({ title, type, date, summary, body })),
    publications: k.publications.items.map(([title, type, date]) => ({ title, type, date })),
    jobs: k.jobs.map(([title, place, terms, closes]) => ({ title, place, terms, closes })),
    about: { what: [...k.about.what], who: k.about.who, funded: k.about.funded },
  };
}

/** A service as typed or saved, with what is missing filled in. Null when it has no title. */
function service(x, i) {
  if (!x || typeof x !== 'object') return null;
  const title = str(x.title, '');
  if (!title) return null;
  const steps = Array.isArray(x.steps) ? x.steps.map((st) => (Array.isArray(st) ? [str(st[0], ''), str(st[1], '')] : [str(st?.title, ''), str(st?.when, '')])).filter(([t]) => t) : [];
  return {
    title, summary: str(x.summary, ''), group: str(x.group, 'Services'), task: bool(x.task, i < 3), online: bool(x.online, false),
    who: items(x.who, []), need: items(x.need, []), time: para(x.time, ''), cost: para(x.cost, ''), how: para(x.how, ''),
    options: items(x.options, []), steps,
  };
}

/** Fills in what is missing from saved or typed settings with the defaults. Never throws: check() says what is wrong. */
export function normaliseSite(input = {}) {
  const d = DEFAULT_SITE;
  const site = input && typeof input === 'object' ? input : {};
  const offices = Array.isArray(site.offices)
    ? site.offices.map((o) => ({ name: str(o?.name, 'Office'), lines: (Array.isArray(o?.lines) ? o.lines : String(o?.lines ?? '').split('\n')).map((l) => str(l, '')).filter(Boolean) })).filter((o) => o.lines.length)
    : d.offices;
  const parts = {};
  for (const p of PARTS) parts[p.id] = site.parts && typeof site.parts[p.id] === 'boolean' ? site.parts[p.id] : d.parts[p.id];
  const kind = KIND_IDS.includes(site.kind) ? site.kind : d.kind;
  const k = kindContent(kind);
  let services = Array.isArray(site.services) ? site.services.map(service).filter(Boolean) : k.services;
  if (!services.length) services = k.services;
  // One online service at most: the first one marked.
  let online = false;
  services = services.map((x) => { const on = x.online && !online; online ||= on; return { ...x, online: on }; });
  const fees = site.fees && typeof site.fees === 'object' ? {
    caption: str(site.fees.caption, k.fees.caption), lead: para(site.fees.lead, k.fees.lead),
    columns: items(site.fees.columns, k.fees.columns).slice(0, 4),
    rows: Array.isArray(site.fees.rows) ? site.fees.rows.map((r) => (Array.isArray(r) ? r : String(r ?? '').split('|')).map((c) => str(String(c ?? ''), ''))).filter((r) => r[0]) : k.fees.rows,
  } : k.fees;
  fees.rows = fees.rows.map((r) => fees.columns.map((_, i) => r[i] ?? ''));
  const list = (v, fallback, keys, need = 'title') => (Array.isArray(v)
    ? v.map((x) => (x && typeof x === 'object' ? Object.fromEntries(keys.map((key) => [key, key === 'body' ? para(x[key], '') : str(x[key], '')])) : null)).filter((x) => x && x[need])
    : fallback);
  const about = site.about && typeof site.about === 'object'
    ? { what: items(site.about.what, k.about.what), who: para(site.about.who, ''), funded: para(site.about.funded, '') }
    : k.about;
  return {
    kind,
    name: str(site.name, d.name),
    short: str(site.short, d.short).toUpperCase(),
    purpose: str(site.purpose, d.purpose),
    host: str(site.host, d.host).toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, ''),
    theme: str(site.theme, d.theme),
    phone: str(site.phone, d.phone),
    hours: str(site.hours, d.hours),
    email: str(site.email, d.email).toLowerCase(),
    offices: offices.length ? offices : d.offices,
    parts,
    forms: str(site.forms, ''),
    live: site.live === true,
    logo: /^assets\/[\w.-]+\.(svg|png|jpe?g|webp)$/i.test(site.logo ?? '') ? site.logo : '',
    question: str(site.question, k.question),
    lede: str(site.lede, k.lede),
    services,
    fees,
    news: list(site.news, k.news, ['title', 'type', 'date', 'summary', 'body']),
    publications: list(site.publications, k.publications, ['title', 'type', 'date']),
    jobs: list(site.jobs, k.jobs, ['title', 'place', 'terms', 'closes']),
    about,
  };
}

/** The address of each service's page: from its title, never the same as another page's. */
export function servicePages(site) {
  const s = normaliseSite(site);
  const taken = new Set([...ALWAYS, ...Object.values(PART_PAGES).flat()]);
  return s.services.map((x) => {
    let file = `${slugify(x.title)}.html`;
    for (let n = 2; taken.has(file); n++) file = `${slugify(x.title)}-${n}.html`;
    taken.add(file);
    return file;
  });
}

/** Whether the website has the online application: the part is on, and a service is marked online. */
export const hasOnline = (site) => { const s = normaliseSite(site); return s.parts.apply && s.services.some((x) => x.online); };

/**
 * The words that are still the example's for this kind of institution, as plain labels for the builder and the
 * README: [{ where, what }]. Each one should be rewritten before the website goes live.
 */
export function exampleWords(site) {
  const s = normaliseSite(site);
  const k = kindContent(s.kind);
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const out = [];
  if (s.question === k.question && s.lede === k.lede) out.push({ where: 'Homepage', what: 'the question and the line under it' });
  for (const x of s.services) {
    const ex = k.services.find((y) => y.title === x.title);
    if (ex && same({ ...ex, task: 0, online: 0, group: 0 }, { ...x, task: 0, online: 0, group: 0 })) out.push({ where: x.title, what: 'the whole page' });
  }
  if (same(s.about, k.about)) out.push({ where: 'About us', what: 'what you do, who runs you and how you are funded' });
  if (s.parts.fees && same(s.fees, k.fees)) out.push({ where: 'Fees and charges', what: 'the fees' });
  if (s.parts.news && s.news.some((n) => k.news.some((m) => m.title === n.title))) out.push({ where: 'News and notices', what: 'the example news' });
  if (s.parts.publications && s.publications.some((n) => k.publications.some((m) => m.title === n.title))) out.push({ where: kindOf(s.kind).publications.label, what: 'the example documents' });
  if (s.parts.jobs && s.jobs.some((n) => k.jobs.some((m) => m.title === n.title))) out.push({ where: 'Jobs and tenders', what: 'the example jobs' });
  return out;
}

const HOST = /^(?=.{4,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/;
const EMAIL = /^[^\s@<>"]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
const HEX = /^#[0-9a-f]{6}$/i;

/**
 * What is wrong with the settings, for the builder's error summary and the command line: [{ field, message, warning }].
 * themes: the ready-made theme slugs. A warning does not stop the website being made.
 */
export function checkSite(site, { themes = [] } = {}) {
  const s = normaliseSite(site);
  const raw = site ?? {};
  const out = [];
  const need = (field, message) => { if (!str(raw[field], '')) out.push({ field, message }); };
  need('name', "Enter your institution's name");
  need('short', "Enter your institution's initials");
  need('host', "Enter your website's address");
  need('email', 'Enter the email address people should use');
  need('phone', 'Enter the phone number people should call');
  if (str(raw.short, '') && !/^[A-Z][A-Z0-9&]{0,5}$/.test(s.short)) out.push({ field: 'short', message: 'Initials must be 1 to 6 letters, such as NCA' });
  if (str(raw.host, '') && !HOST.test(s.host)) out.push({ field: 'host', message: 'Enter an address like www.example.gov.gh' });
  else if (str(raw.host, '') && !/\.gov\.gh$/.test(s.host)) out.push({ field: 'host', message: 'Most government websites end in .gov.gh. Check the address before you go live.', warning: true });
  if (str(raw.email, '') && !EMAIL.test(s.email)) out.push({ field: 'email', message: 'Enter an email address like info@example.gov.gh' });
  if (str(raw.phone, '') && !/^[+\d][\d\s()-]{6,}$/.test(s.phone)) out.push({ field: 'phone', message: 'Enter a phone number like 030 000 0000' });
  if (!HEX.test(s.theme) && themes.length && !themes.includes(s.theme)) out.push({ field: 'theme', message: 'Choose a theme from the list, or enter a colour like #006e35' });
  if (s.forms && !/^https:\/\/[^\s/]+(\/\S*)?$/.test(s.forms)) out.push({ field: 'forms', message: 'Enter the address your forms send to, starting https://' });
  if (s.live && s.host.endsWith('example.gov.gh')) out.push({ field: 'live', message: 'Change the address from example.gov.gh before the website goes live' });
  return out;
}

/** The pages this website has. */
export const pagesFor = (site) => {
  const s = normaliseSite(site);
  const parts = PARTS.filter((p) => s.parts[p.id] && (p.id !== 'apply' || hasOnline(s))).flatMap((p) => PART_PAGES[p.id]);
  return new Set([...ALWAYS, ...servicePages(s), ...parts]);
};

/** The settings as they are saved in ggds-site.json. */
export const siteJson = (site, version) => `${JSON.stringify({ $schema: 'https://ghana-gds.github.io/ggds/ggds-site.schema.json', ggds: version, ...normaliseSite(site) }, null, 2)}\n`;

/** ggds-site.json as a JSON Schema, published beside the documentation, so editors can check the file by hand. */
export const SITE_SCHEMA = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'https://ghana-gds.github.io/ggds/ggds-site.schema.json',
  title: 'GGDS website settings (ggds-site.json)',
  description: 'An institution\'s settings for the GGDS agency website starter: made by the website builder and npx @ggds/create, which make the same website again from it.',
  type: 'object',
  required: ['name', 'short', 'host', 'email', 'phone'],
  properties: {
    $schema: { type: 'string' },
    ggds: { type: 'string', description: 'The GGDS version the website was made with' },
    name: { type: 'string', minLength: 1, description: "The institution's full name" },
    short: { type: 'string', pattern: '^[A-Za-z][A-Za-z0-9&]{0,5}$', description: 'Its initials, in the badge and in reference numbers' },
    purpose: { type: 'string', description: 'What it does, in one sentence' },
    host: { type: 'string', description: "The website's address, such as www.example.gov.gh" },
    theme: { type: 'string', description: 'A ready-made theme, such as nca, or the institution\'s colour as #rrggbb' },
    phone: { type: 'string' },
    hours: { type: 'string', description: 'Opening hours, such as Monday to Friday, 8am to 5pm' },
    email: { type: 'string', format: 'email' },
    offices: { type: 'array', items: { type: 'object', required: ['lines'], properties: { name: { type: 'string' }, lines: { type: 'array', items: { type: 'string' }, minItems: 1 } } } },
    parts: { type: 'object', properties: Object.fromEntries(PARTS.map((p) => [p.id, { type: 'boolean', description: `${p.label}: ${p.hint}` }])), additionalProperties: false },
    forms: { type: 'string', description: 'Where the forms send their answers, starting https://; empty: nowhere yet' },
    live: { type: 'boolean', description: 'Whether search engines may find the website' },
    logo: { type: 'string', pattern: '^(assets/[\\w.-]+\\.(svg|png|jpe?g|webp))?$', description: 'The logo file in the website, such as assets/logo.svg' },
    kind: { enum: KIND_IDS, description: 'The kind of institution: the words the website starts from' },
    question: { type: 'string', description: 'The question at the top of the homepage' },
    lede: { type: 'string', description: 'The line under it' },
    services: { type: 'array', description: 'What people come to do: each service has its own page', items: { type: 'object', required: ['title'], properties: {
      title: { type: 'string' }, summary: { type: 'string' }, group: { type: 'string', description: 'Its heading on the Services page' },
      task: { type: 'boolean', description: 'On the homepage as a common task' }, online: { type: 'boolean', description: 'Has the online application (one service at most)' },
      who: { type: 'array', items: { type: 'string' } }, need: { type: 'array', items: { type: 'string' } }, time: { type: 'string' }, cost: { type: 'string' }, how: { type: 'string' },
      options: { type: 'array', items: { type: 'string' }, description: 'What people choose on the online form' },
      steps: { type: 'array', items: { type: 'array', items: { type: 'string' }, minItems: 2, maxItems: 2 }, description: 'What happens after they apply: [what, when]' } } } },
    fees: { type: 'object', properties: { caption: { type: 'string' }, lead: { type: 'string' }, columns: { type: 'array', items: { type: 'string' }, maxItems: 4 }, rows: { type: 'array', items: { type: 'array', items: { type: 'string' } } } } },
    news: { type: 'array', items: { type: 'object', required: ['title'], properties: { title: { type: 'string' }, type: { type: 'string' }, date: { type: 'string' }, summary: { type: 'string' }, body: { type: 'string', description: 'The first item\'s article: paragraphs separated by a blank line' } } } },
    publications: { type: 'array', items: { type: 'object', required: ['title'], properties: { title: { type: 'string' }, type: { type: 'string' }, date: { type: 'string' } } } },
    jobs: { type: 'array', items: { type: 'object', required: ['title'], properties: { title: { type: 'string' }, place: { type: 'string' }, terms: { type: 'string' }, closes: { type: 'string' } } } },
    about: { type: 'object', properties: { what: { type: 'array', items: { type: 'string' } }, who: { type: 'string' }, funded: { type: 'string' } } },
  },
};
