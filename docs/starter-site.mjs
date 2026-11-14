// What makes an agency website starter one institution's own: its name, address, contact details, colour, and which
// parts it needs. The starter (docs/starter.mjs) builds every page from these settings; the website builder
// (docs/builder.js) asks for them; ggds-site.json in every download keeps them, so the same website can be made
// again with a newer GGDS. Runs in the browser and in Node, so no Node imports.

/** The made-up institution of the starter as published: the live preview and the release download. */
export const DEFAULT_SITE = {
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

/** The parts a website can leave out, with the pages each one brings. The other pages are on every website. */
export const PARTS = [
  { id: 'apply', label: 'Apply online', hint: 'A start page, a form, check your answers and a confirmation', pages: ['apply-for-a-licence.html', 'apply.html', 'apply-check.html', 'apply-done.html'] },
  { id: 'fees', label: 'Fees and charges', hint: 'A table of what each service costs', pages: ['fees.html'] },
  { id: 'complaint', label: 'Make a complaint', hint: 'A complaint form and a confirmation', pages: ['complaint.html', 'complaint-done.html'] },
  { id: 'news', label: 'News and notices', hint: 'A list of news and an article', pages: ['news.html', 'news-article.html'] },
  { id: 'publications', label: 'Rules and reports', hint: 'Documents people can download', pages: ['publications.html'] },
  { id: 'jobs', label: 'Jobs and tenders', hint: 'Vacancies and tenders, with a warning about fees', pages: ['jobs.html'] },
];

/** Pages every website has: the law and GGDS ask for some of them (accessibility, privacy, disclaimer). */
export const ALWAYS = ['index.html', 'services.html', 'about.html', 'contact.html', 'contact-done.html', 'search.html', '404.html', 'accessibility.html', 'privacy.html', 'disclaimer.html'];

export const SITE_FILE = 'ggds-site.json';

const str = (v, fallback) => (typeof v === 'string' && v.trim() ? v.trim().replace(/\s+/g, ' ') : fallback);

/** Fills in what is missing from saved or typed settings with the defaults. Never throws: check() says what is wrong. */
export function normaliseSite(input = {}) {
  const d = DEFAULT_SITE;
  const site = input && typeof input === 'object' ? input : {};
  const offices = Array.isArray(site.offices)
    ? site.offices.map((o) => ({ name: str(o?.name, 'Office'), lines: (Array.isArray(o?.lines) ? o.lines : String(o?.lines ?? '').split('\n')).map((l) => str(l, '')).filter(Boolean) })).filter((o) => o.lines.length)
    : d.offices;
  const parts = {};
  for (const p of PARTS) parts[p.id] = site.parts && typeof site.parts[p.id] === 'boolean' ? site.parts[p.id] : d.parts[p.id];
  return {
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
  };
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
  return new Set([...ALWAYS, ...PARTS.filter((p) => s.parts[p.id]).flatMap((p) => p.pages)]);
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
  },
};
