// @ggds/astro renders the same HTML as the GGDS documentation's canonical parts (docs/parts.mjs), as @ggds/react and
// ggds-django do, and its strings prop translates GGDS's own text. Builds a small Astro site with the real components
// in packages/astro/.render-test/ (Astro resolves from packages/astro/node_modules) and reads its HTML.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import * as parts from '../../docs/parts.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const pkg = join(root, 'packages', 'astro');
const astroBin = join(pkg, 'node_modules', 'astro', 'bin', 'astro.mjs');
const ready = { skip: (!existsSync(astroBin) && 'Astro is not installed') || (!existsSync(join(pkg, 'src', 'strings.mjs')) && 'run pnpm run build') };

const KEEP = ['class', 'href', 'id', 'aria-label', 'aria-current', 'aria-hidden', 'aria-controls', 'aria-labelledby', 'role', 'type', 'for', 'name', 'value', 'method', 'action', 'lang', 'hreflang'];
function shape(html) {
  const out = [];
  for (const [, tag, attrs] of html.replace(/<!--[\s\S]*?-->/g, '').matchAll(/<([a-z][a-z0-9]*)\b([^>]*)>/gi)) {
    const a = Object.fromEntries([...attrs.matchAll(/([a-z-:]+)(?:="([^"]*)")?/gi)].map(([, k, v]) => [k.toLowerCase(), v ?? '']));
    out.push(`${tag.toLowerCase()} ${KEEP.filter((k) => k in a).map((k) => `${k}="${a[k]}"`).join(' ')}`.trim());
  }
  return out;
}

const NAV = [{ label: 'Services', href: '/services/' }, { label: 'About', href: '/about/' }];
const SECTIONS = [{ label: 'Services', href: '/services/', links: [{ label: 'Fees', href: '/fees/' }] }];
const TASKS = [{ label: 'Apply', href: '/apply/', tag: 'NCA' }];
const TABS = [{ label: 'Home', href: '/', icon: 'home', current: true }, { label: 'Search', href: '/search/', icon: 'search' }];
const SIDE = [{ label: 'Licences', href: '/services/licences/' }, { label: 'Fees and charges', href: '/services/fees/', links: [{ label: 'Broadcasting fees', href: '/services/fees/broadcasting/' }, { label: 'Telecoms fees', href: '/services/fees/telecoms/' }] }, { label: 'Equipment approval', href: '/services/type-approval/' }];
const CONTENTS = [{ label: 'Who needs a licence', href: '#who-needs-a-licence' }, { label: 'What it costs', href: '#what-it-costs' }, { label: 'How to apply', href: '#how-to-apply' }];
const LANGS = ['en', 'tw', 'ee', 'gaa', 'ha', 'dag'].map((code) => ({ code, href: code === 'en' ? '/' : `/${code}/` }));
const example = (path) => readFileSync(join(root, 'packages', 'html', 'components', path), 'utf8').split('-->').slice(1).join('-->');
const TASK_LIST = [
  { id: 'details', label: 'Your details', href: '#details', status: 'completed' },
  { id: 'canoe', label: 'About your canoe', href: '#canoe', status: 'completed' },
  { id: 'documents', label: 'Upload your documents', href: '#documents', status: 'inProgress', hint: 'Your Ghana Card and a photo of the canoe' },
  { id: 'landing', label: 'Your landing beach', href: '#landing', status: 'notStarted' },
  { id: 'pay', label: 'Pay the fee', status: 'cannotStart', hint: 'You can pay once the other sections are complete' },
];
const MARKED = { 'header.menu': '[x] Menu', 'banner.officialAddress': '[x] {host} is ours.', 'tabBar.label': '[x] Quick links' };

const PAGE = `---
import SkipLink from '../../../src/SkipLink.astro';
import Banner from '../../../src/Banner.astro';
import Header from '../../../src/Header.astro';
import Hero from '../../../src/Hero.astro';
import Footer from '../../../src/Footer.astro';
import TabBar from '../../../src/TabBar.astro';
import BackLink from '../../../src/BackLink.astro';
import PhaseBanner from '../../../src/PhaseBanner.astro';
import SideNav from '../../../src/SideNav.astro';
import Contents from '../../../src/Contents.astro';
import LanguageSwitcher from '../../../src/LanguageSwitcher.astro';
import CookieBanner from '../../../src/CookieBanner.astro';
import TaskList from '../../../src/TaskList.astro';
import PasswordInput from '../../../src/PasswordInput.astro';
import CodeInput from '../../../src/CodeInput.astro';
import Dialog from '../../../src/Dialog.astro';
import TimeoutWarning from '../../../src/TimeoutWarning.astro';
import Page from '../../../src/Page.astro';
import Feedback from '../../../src/Feedback.astro';
const TASK_LIST = ${JSON.stringify(TASK_LIST)};
const NAV = ${JSON.stringify(NAV)}, SECTIONS = ${JSON.stringify(SECTIONS)}, TASKS = ${JSON.stringify(TASKS)}, TABS = ${JSON.stringify(TABS)};
const MARKED = ${JSON.stringify(MARKED)}, SIDE = ${JSON.stringify(SIDE)}, CONTENTS = ${JSON.stringify(CONTENTS)}, LANGS = ${JSON.stringify(LANGS)};
---
<div id="part-skip"><SkipLink /></div>
<div id="part-banner"><Banner shortName="EA" host="example.gov.gh" register={{ href: '/register/', label: 'register' }} /></div>
<div id="part-header"><Header name="Example Agency" initials="EA" nav={NAV} current="/services/" /></div>
<div id="part-hero"><Hero title="What do you need?" purpose="We help." lede="Find a service." search={{ action: '/search/', label: 'Search', placeholder: 'e.g. fees' }} tasks={TASKS} /></div>
<div id="part-footer"><Footer name="Example Agency" purpose="We help." contact={{ address: 'Accra', email: 'a@b.c', phone: '0', moreHref: '/contact/' }} sections={SECTIONS} bar={[{ label: 'Privacy', href: '/privacy/' }]} year={2026}><span slot="logo" class="ggds-header__monogram" aria-hidden="true">EA</span></Footer></div>
<div id="part-tabbar"><TabBar tabs={TABS} /></div>
<div id="part-marked"><Header name="A" nav={NAV} strings={MARKED} /><Banner shortName="EA" host="<b>x</b>" official strings={MARKED} /><TabBar tabs={TABS} strings={MARKED} /></div>
<div id="part-back"><BackLink href="/services/licence/apply/contact/" /></div>
<div id="part-phase"><PhaseBanner feedbackHref="/feedback/" /></div>
<div id="part-side"><SideNav items={SIDE} current="/services/fees/" /></div>
<div id="part-contents"><Contents items={CONTENTS} /></div>
<div id="part-languages"><LanguageSwitcher languages={LANGS} current="en" /></div>
<div id="part-cookies"><CookieBanner service="Example Agency" /></div>
<div id="part-cookies-accepted"><CookieBanner service="Example Agency" choice="accept" /></div>
<div id="part-tasks"><TaskList tasks={TASK_LIST} /></div>
<div id="part-password"><PasswordInput id="password" name="password" label="Password" /></div>
<div id="part-password-error"><PasswordInput id="new-password" name="newPassword" label="Create a password" hint="At least 8 characters" error="Your password must have at least 8 characters" autocomplete="new-password" /></div>
<div id="part-code"><CodeInput id="code" name="code" label="Enter the code we sent you" hint="We sent a 6-digit code to 024 *** 4567. It expires in 10 minutes." /></div>
<div id="part-dialog"><Dialog id="delete-draft" title="Delete this draft?" warning action="#delete-draft-page"><p>Your answers will be deleted. You cannot get them back.</p><button slot="actions" class="ggds-button ggds-button--warning" type="submit">Delete draft</button></Dialog></div>
<div id="part-timeout"><TimeoutWarning timeout={123} keepAlive="#keep-alive" signOut="#signed-out" /></div>
<div id="part-page"><Page banner={{ shortName: 'EA', host: 'example.gov.gh', official: true, register: { href: '/register/' } }} header={{ name: 'Example Agency', initials: 'EA', nav: NAV, current: '/services/' }} footer={{ name: 'Example Agency', purpose: 'We help.', contact: { address: 'Accra', email: 'a@b.c', phone: '0', moreHref: '/contact/' }, sections: SECTIONS, bar: [{ label: 'Privacy', href: '/privacy/' }], year: 2026 }} tabs={TABS}><h1>Services</h1></Page></div>
<div id="part-page-logo"><Page banner={{ shortName: 'EA', host: 'example.gov.gh' }} header={{ name: 'Example Agency', initials: 'EA', nav: NAV }} footer={{ name: 'Example Agency' }} mainClass=""><img slot="logo" class="ggds-header__logo" src="/logo.svg" alt="" width="44" height="44"><img slot="footer-logo" class="ggds-footer__logo" src="/logo.svg" alt="" width="48" height="48">x</Page></div>
<div id="part-feedback"><Feedback action="/feedback/" page="/services/apply-for-a-licence/" reportHref="/report-a-problem/" /></div>
<div id="part-feedback-thanks"><Feedback action="/feedback/" page="/services/apply-for-a-licence/" reportHref="/report-a-problem/" answered /></div>
<div id="end"></div>
`;

let html = '';
const part = (id) => html.slice(html.indexOf(`<div id="part-${id}">`) + `<div id="part-${id}">`.length, html.indexOf('<div id="', html.indexOf(`<div id="part-${id}">`) + 1)).replace(/<\/div>\s*$/, '');

test('the Astro page parts match the documentation\'s canonical markup', ready, () => {
  const dir = join(pkg, '.render-test');
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(join(dir, 'src', 'pages'), { recursive: true });
  writeFileSync(join(dir, 'astro.config.mjs'), "export default { output: 'static', compressHTML: false, devToolbar: { enabled: false } };\n");
  writeFileSync(join(dir, 'src', 'pages', 'index.astro'), PAGE);
  try {
    execFileSync(process.execPath, [astroBin, 'build', '--root', dir, '--silent'], { cwd: pkg, stdio: 'pipe', env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' } });
    html = readFileSync(join(dir, 'dist', 'index.html'), 'utf8');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
  assert.equal(part('skip').trim(), '<a class="ggds-skip-link" href="#main">Skip to main content</a>');
  assert.deepEqual(shape(part('banner')), shape(parts.banner({ unofficial: true, shortName: 'EA', host: 'example.gov.gh', registerHref: '/register/' })), 'Banner');
  assert.deepEqual(shape(part('header')), shape(parts.header({ name: 'Example Agency', logo: parts.mark({ initials: 'EA' }), nav: NAV, current: '/services/', search: '/search/' })), 'Header');
  assert.deepEqual(shape(part('hero')), shape(parts.hero({ purpose: 'We help.', title: 'What do you need?', lede: 'Find a service.', search: { action: '/search/', label: 'Search', placeholder: 'e.g. fees' }, tasks: TASKS })), 'Hero');
  assert.deepEqual(shape(part('footer')), shape(parts.footer({ name: 'Example Agency', logo: parts.mark({ initials: 'EA' }), purpose: 'We help.', contact: { address: 'Accra', email: 'a@b.c', phone: '0', moreHref: '/contact/' }, sections: SECTIONS, bar: [['Privacy', '/privacy/']] })), 'Footer');
  assert.deepEqual(shape(part('tabbar')), shape(parts.tabBar(TABS)), 'TabBar');
});

test('the Astro strings prop translates GGDS\'s own text and keeps its HTML safe', ready, () => {
  const marked = part('marked');
  assert.match(marked, /<span class="ggds-visually-hidden">\[x\] Menu<\/span>/);
  assert.match(marked, /\[x\] <strong>&lt;b&gt;x&lt;\/b&gt;<\/strong> is ours\./, 'the address is escaped, the <strong> kept');
  assert.match(marked, /aria-label="\[x\] Quick links"/);
  assert.match(marked, /<span class="ggds-header__search-label">Search<\/span>/, 'English where the strings do not say');
  assert.match(part('banner'), /Most government websites end in <strong>\.gov\.gh<\/strong>/);
});

test('the new Astro parts match their component examples', ready, () => {
  assert.deepEqual(shape(part('back')), shape(example('back-link/examples/1-default.html')), 'BackLink');
  assert.deepEqual(shape(part('phase')), shape(example('phase-banner/examples/1-beta.html')), 'PhaseBanner');
  assert.match(part('phase'), /Your <a href="\/feedback\/">feedback<\/a> will help/);
  assert.deepEqual(shape(part('side')), shape(example('side-navigation/examples/1-default.html')), 'SideNav');
  assert.deepEqual(shape(part('contents')), shape(example('contents-list/examples/1-default.html')), 'Contents');
  assert.deepEqual(shape(part('languages')), shape(example('language-switcher/examples/1-default.html')), 'LanguageSwitcher');
  assert.deepEqual(shape(part('cookies')), shape(example('cookie-banner/examples/1-question.html')), 'CookieBanner');
  assert.deepEqual(shape(part('cookies-accepted')), shape(example('cookie-banner/examples/2-accepted.html')), 'CookieBanner, accepted');
});

test('the Astro task list, password input, code input, dialog and timeout warning match their examples', ready, () => {
  assert.deepEqual(shape(part('tasks')), shape(example('task-list/examples/1-application.html')).slice(1), 'TaskList');
  assert.match(part('tasks'), />You have completed 2 of 5 sections\.</);
  assert.deepEqual(shape(part('password')), shape(example('password-input/examples/1-sign-in.html')), 'PasswordInput');
  assert.match(part('password'), /data-ggds-module="password-input"[^>]*data-ggds-show="Show"/);
  assert.deepEqual(shape(part('password-error')), shape(example('password-input/examples/2-new-password.html')), 'PasswordInput, with an error');
  assert.deepEqual(shape(part('code')), shape(example('code-input/examples/1-sms-code.html')).slice(0, 4), 'CodeInput');
  assert.match(part('code'), /autocomplete="one-time-code"/);
  assert.deepEqual(shape(part('dialog')), shape(example('dialog/examples/1-confirm.html')).slice(2), 'Dialog');
  assert.deepEqual(shape(part('timeout')), shape(example('timeout-warning/examples/1-default.html')).slice(1), 'TimeoutWarning');
  assert.match(part('timeout'), /data-ggds-timeout="123"[^>]*data-ggds-warn="120"/);
  assert.match(part('timeout'), /we will sign you out in <span[^>]*>2 minutes<\/span>/);
});

test('the Astro Page puts the page parts around <main> in GGDS order, and Feedback matches its examples', ready, () => {
  const contact = { address: 'Accra', email: 'a@b.c', phone: '0', moreHref: '/contact/' };
  const want = '<a class="ggds-skip-link" href="#main">Skip to main content</a>'
    + parts.banner({ unofficial: false, shortName: 'EA', host: 'example.gov.gh', registerHref: '/register/' })
    + parts.header({ name: 'Example Agency', logo: parts.mark({ initials: 'EA' }), nav: NAV, current: '/services/', search: '/search/' })
    + '<main id="main" tabindex="-1" class="ggds-container ggds-main"><h1>Services</h1></main>'
    + parts.footer({ name: 'Example Agency', logo: parts.mark({ initials: 'EA' }), purpose: 'We help.', contact, sections: SECTIONS, bar: [['Privacy', '/privacy/']] })
    + parts.tabBar(TABS);
  assert.deepEqual(shape(part('page')), shape(want), 'Page');
  const logo = part('page-logo');
  assert.match(logo, /<a class="ggds-header__identity" href="\/">\s*<img class="ggds-header__logo" src="\/logo.svg"/, 'the logo slot is the header\'s logo');
  assert.match(logo, /<p class="ggds-footer__identity">\s*<img class="ggds-footer__logo" src="\/logo.svg"/, 'the footer-logo slot is the footer\'s');
  assert.doesNotMatch(logo, /ggds-header__monogram/, 'no initials badge beside a logo');
  assert.match(logo, /<main id="main" tabindex="-1">\s*x\s*<\/main>/, 'mainClass="" leaves <main> without a class');
  assert.doesNotMatch(logo, /ggds-tab-bar/, 'no tabs, no tab bar');
  assert.deepEqual(shape(part('feedback')), shape(example('feedback/examples/1-default.html')), 'Feedback');
  assert.deepEqual(shape(part('feedback-thanks')), shape(example('feedback/examples/2-thanks.html')), 'Feedback, answered');
});
