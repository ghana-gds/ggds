// What ggds-check checks, and where each rule comes from. Every rule names its published sources, so a report can
// be traced and argued with. `nita` is the clause of NITA's standards that the rule maps to: null until the standard
// is mapped, clause by clause. Until then, a report is a readiness check against these sources, not a statement of
// NITA compliance.
const DOCS = 'https://ghana-gds.github.io/ggds';

export const SOURCES = {
  wcag: { name: 'WCAG 2.2', url: 'https://www.w3.org/TR/WCAG22/' },
  ggdsPage: { name: 'GGDS page template', url: `${DOCS}/components/page.html` },
  ggdsBanner: { name: 'GGDS government website banner', url: `${DOCS}/components/banner.html` },
  ggdsFooter: { name: 'GGDS footer guidance (the links NITA’s standards ask for)', url: `${DOCS}/components/footer.html` },
  ggdsFast: { name: 'GGDS Fast pages', url: `${DOCS}/performance.html` },
  ggdsVersions: { name: 'GGDS versions and support', url: `${DOCS}/versions.html` },
  owasp: { name: 'OWASP Secure Headers Project', url: 'https://owasp.org/www-project-secure-headers/' },
  audit: { name: 'MoCDTI website audits (October 2026)' }, // the checks every MoCDTI agency website was audited against
  spf: { name: 'RFC 7208 (SPF)', url: 'https://www.rfc-editor.org/rfc/rfc7208' },
  dmarc: { name: 'RFC 7489 (DMARC)', url: 'https://www.rfc-editor.org/rfc/rfc7489' },
  caa: { name: 'RFC 8659 (CAA)', url: 'https://www.rfc-editor.org/rfc/rfc8659' },
  axe: { name: 'axe-core WCAG 2.2 A and AA rules', url: 'https://github.com/dequelabs/axe-core' },
  ggdsNoJs: { name: 'GGDS: every part works without JavaScript', url: `${DOCS}/contribute.html` },
  ggdsCookies: { name: 'GGDS cookie banner guidance (nothing the website does not need before people agree)', url: `${DOCS}/components/cookie-banner.html` },
};

/** Each rule: its group, what it asks, and its sources (keys of SOURCES). */
export const RULES = {
  // Every page
  'page.lang': { group: 'Every page', title: 'The page says its language (<html lang>)', sources: ['wcag'], ref: '3.1.1', nita: null },
  'page.title': { group: 'Every page', title: 'The page has a title', sources: ['wcag'], ref: '2.4.2', nita: null },
  'page.zoom': { group: 'Every page', title: 'People can zoom: a phone viewport that does not stop zooming', sources: ['wcag'], ref: '1.4.4', nita: null },
  'page.alt': { group: 'Every page', title: 'Every image has alternative text (alt, empty for decoration)', sources: ['wcag'], ref: '1.1.1', nita: null },
  'page.skip-link': { group: 'Every page', title: 'A skip link to the main content comes first', sources: ['wcag', 'ggdsPage'], ref: '2.4.1', nita: null },
  'page.banner': { group: 'Every page', title: 'The government website banner', sources: ['ggdsBanner', 'ggdsPage'], nita: null },
  'page.header': { group: 'Every page', title: 'The GGDS header', sources: ['ggdsPage'], nita: null },
  'page.main': { group: 'Every page', title: 'One main landmark (<main>)', sources: ['wcag', 'ggdsPage'], ref: '1.3.1', nita: null },
  'page.footer': { group: 'Every page', title: 'The GGDS footer', sources: ['ggdsPage'], nita: null },
  'page.footer-links': { group: 'Every page', title: 'The footer links Accessibility, Privacy and Disclaimer', sources: ['ggdsFooter'], nita: null },
  'page.tab-bar': { group: 'Every page', title: 'The phone tab bar', sources: ['ggdsPage'], nita: null },
  'page.image-size': { group: 'Every page', title: 'Images have width and height, so the page does not move as it loads', sources: ['ggdsFast'], nita: null },

  // GGDS
  'ggds.css': { group: 'GGDS', title: 'The site uses GGDS', sources: ['ggdsPage'], nita: null },
  'ggds.version': { group: 'GGDS', title: 'GGDS is up to date', sources: ['ggdsVersions'], nita: null },

  // Accessibility
  'a11y.axe': { group: 'Accessibility', title: 'No WCAG 2.2 A or AA failures found by automated testing', sources: ['wcag', 'axe'], nita: null },
  'a11y.axe-phone': { group: 'Accessibility', title: 'No WCAG 2.2 A or AA failures on a phone-sized screen', sources: ['wcag', 'axe'], nita: null },
  'a11y.reflow': { group: 'Accessibility', title: 'Nothing scrolls sideways on a 320px screen', sources: ['wcag'], ref: '1.4.10', nita: null },
  'a11y.focus-start': { group: 'Accessibility', title: 'The first Tab goes to a skip link whose target is on the page', sources: ['wcag', 'ggdsPage'], ref: '2.4.1', nita: null },
  'a11y.no-javascript': { group: 'Accessibility', title: 'The main content shows without JavaScript', sources: ['ggdsNoJs'], nita: null },

  // Address and server
  'web.domain': { group: 'Address and server', title: 'The address ends in .gov.gh', sources: ['ggdsBanner'], nita: null },
  'web.https': { group: 'Address and server', title: 'HTTPS only: the http:// address moves to https://', sources: ['owasp', 'audit'], nita: null },
  'web.hsts': { group: 'Address and server', title: 'Strict-Transport-Security, for at least a year', sources: ['owasp', 'audit'], nita: null },
  'web.csp': { group: 'Address and server', title: 'Content-Security-Policy, without unsafe-inline scripts', sources: ['owasp', 'audit'], nita: null },
  'web.frames': { group: 'Address and server', title: 'Other sites cannot frame it (frame-ancestors or X-Frame-Options)', sources: ['owasp', 'audit'], nita: null },
  'web.nosniff': { group: 'Address and server', title: 'X-Content-Type-Options: nosniff', sources: ['owasp', 'audit'], nita: null },
  'web.referrer': { group: 'Address and server', title: 'Referrer-Policy', sources: ['owasp', 'audit'], nita: null },
  'web.permissions': { group: 'Address and server', title: 'Permissions-Policy', sources: ['owasp', 'audit'], nita: null },
  'web.server-version': { group: 'Address and server', title: 'The server does not announce its software version', sources: ['owasp'], nita: null },
  'web.wp-users': { group: 'Address and server', title: 'No public list of the site’s user accounts (WordPress)', sources: ['audit'], nita: null },

  // Email domain
  'dns.spf': { group: 'Email domain', title: 'SPF: which servers may send the domain’s email', sources: ['spf', 'audit'], nita: null },
  'dns.dmarc': { group: 'Email domain', title: 'DMARC, at quarantine or reject: forged email from the domain is stopped', sources: ['dmarc', 'audit'], nita: null },
  'dns.caa': { group: 'Email domain', title: 'CAA: which authorities may issue the domain’s certificates', sources: ['caa', 'audit'], nita: null },

  // Privacy (a live site only)
  'privacy.third-parties': { group: 'Privacy', title: 'Nothing is loaded from other websites before people agree', sources: ['ggdsCookies'], nita: null },
  'privacy.cookies': { group: 'Privacy', title: 'No cookies are set on the first visit, before people agree', sources: ['ggdsCookies'], nita: null },

  // Speed
  'fast.compression': { group: 'Speed', title: 'Text files are sent compressed', sources: ['ggdsFast'], nita: null },
  'fast.cache': { group: 'Speed', title: 'Browsers may keep CSS, scripts and images', sources: ['ggdsFast'], nita: null },
  'fast.weight': { group: 'Speed', title: 'What the homepage downloads', sources: ['ggdsFast'], nita: null },
};

export const GROUPS = ['Every page', 'GGDS', 'Accessibility', 'Address and server', 'Email domain', 'Privacy', 'Speed'];
