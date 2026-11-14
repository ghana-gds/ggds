// @ggds/react renders the same HTML as the GGDS documentation: its page parts match docs/parts.mjs (as the Django and
// Astro parts do), and its form and content parts match the component examples, element by element, with the
// classes and the attributes that carry meaning. So a React page passes the same accessibility tests.
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import * as parts from '../../docs/parts.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const dist = join(root, 'packages', 'react', 'dist', 'index.js');
const built = { skip: !existsSync(dist) && 'run pnpm run build' };
const req = createRequire(join(root, 'packages', 'react', 'package.json'));

const KEEP = ['class', 'href', 'id', 'aria-label', 'aria-current', 'aria-hidden', 'aria-controls', 'aria-labelledby', 'aria-describedby', 'aria-invalid', 'aria-expanded', 'role', 'type', 'for', 'name', 'value', 'hidden', 'autocomplete', 'tabindex'];
/** Every start tag in order: its name and the attributes that carry meaning. */
function shape(html) {
  const out = [];
  for (const [, tag, attrs] of html.replace(/<!--[\s\S]*?-->/g, '').matchAll(/<([a-z][a-z0-9]*)\b([^>]*)>/gi)) {
    const a = Object.fromEntries([...attrs.matchAll(/([a-z-:]+)(?:="([^"]*)")?/gi)].map(([, k, v]) => [k.toLowerCase(), v ?? '']));
    out.push(`${tag.toLowerCase()} ${KEEP.filter((k) => k in a).map((k) => `${k}="${a[k]}"`).join(' ')}`.trim());
  }
  return out;
}
const example = (path) => readFileSync(join(root, 'packages', 'html', path), 'utf8');

async function load() {
  const React = req('react');
  const { renderToStaticMarkup } = req('react-dom/server');
  const g = await import(dist);
  return { h: React.createElement, html: (el) => renderToStaticMarkup(el), g };
}

test('the page parts match the documentation\'s canonical markup', built, async () => {
  const { h, html, g } = await load();
  const NAV = [{ label: 'Services', href: '/services/' }, { label: 'About', href: '/about/' }];
  assert.deepEqual(shape(html(h(g.Header, { name: 'Example Agency', initials: 'EA', nav: NAV, current: '/services/' }))),
    shape(parts.header({ name: 'Example Agency', logo: parts.mark({ initials: 'EA' }), nav: NAV, current: '/services/', search: '/search/' })), 'Header');
  assert.deepEqual(shape(html(h(g.Banner, { shortName: 'EA', host: 'example.gov.gh', register: { href: '/register/', label: 'the register' } }))),
    shape(parts.banner({ unofficial: true, shortName: 'EA', host: 'example.gov.gh', registerHref: '/register/' })), 'Banner');
  const TASKS = [{ label: 'Apply', href: '/apply/', tag: 'NCA' }];
  assert.deepEqual(shape(html(h(g.Hero, { title: 'What do you need?', purpose: 'We help.', lede: 'Find a service.', search: { action: '/search/', label: 'Search', placeholder: 'e.g. fees' }, tasks: TASKS }))),
    shape(parts.hero({ purpose: 'We help.', title: 'What do you need?', lede: 'Find a service.', search: { action: '/search/', label: 'Search', placeholder: 'e.g. fees' }, tasks: TASKS })), 'Hero');
  const SECTIONS = [{ label: 'Services', href: '/services/', links: [{ label: 'Fees', href: '/fees/' }] }];
  assert.deepEqual(shape(html(h(g.Footer, { name: 'Example Agency', logo: h('span', { className: 'ggds-header__monogram', 'aria-hidden': true }, 'EA'), purpose: 'We help.', contact: { address: 'Accra', email: 'a@b.c', phone: '0', moreHref: '/contact/' }, sections: SECTIONS, bar: [{ label: 'Privacy', href: '/privacy/' }] }))),
    shape(parts.footer({ name: 'Example Agency', logo: parts.mark({ initials: 'EA' }), purpose: 'We help.', contact: { address: 'Accra', email: 'a@b.c', phone: '0', moreHref: '/contact/' }, sections: SECTIONS, bar: [['Privacy', '/privacy/']] })), 'Footer');
  const TABS = [{ label: 'Home', href: '/', icon: 'home', current: true }, { label: 'Search', href: '/search/', icon: 'search' }];
  assert.deepEqual(shape(html(h(g.TabBar, { tabs: TABS }))), shape(parts.tabBar(TABS)), 'TabBar');
  assert.equal(html(h(g.SkipLink)), '<a class="ggds-skip-link" href="#main">Skip to main content</a>');
});

test('the form parts match the component examples, errors and all', built, async () => {
  const { h, html, g } = await load();
  assert.deepEqual(shape(html(h(g.TextInput, { id: 'full-name', name: 'fullName', label: 'Full name', hint: 'As shown on your Ghana Card', width: 'long', autoComplete: 'name', spellCheck: false }))),
    shape(example('components/field/examples/1-text-input.html')), 'TextInput with a hint');
  assert.deepEqual(shape(html(h(g.TextInput, { id: 'phone', name: 'phone', type: 'tel', label: 'Mobile phone number', hint: 'For example, 024 123 4567', error: 'Enter a mobile phone number with 10 digits, like 024 123 4567', width: 'medium', autoComplete: 'tel', inputMode: 'tel', defaultValue: '024 123' }))),
    shape(example('components/field/examples/2-error.html')), 'TextInput with an error');
  assert.deepEqual(shape(html(h(g.Radios, { name: 'contact', legend: 'How should we contact you?', hint: 'Choose one', items: [{ value: 'call', label: 'Phone call' }, { value: 'sms', label: 'SMS' }, { value: 'email', label: 'Email', hint: 'We reply within 5 working days' }] }))),
    shape(example('components/choices/examples/1-radios.html')), 'Radios');
  assert.deepEqual(shape(html(h(g.Radios, { name: 'contacted', legend: 'Have you contacted your provider about this problem?', error: 'Select yes if you have contacted your provider', inline: true, items: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }] }))),
    shape(example('components/choices/examples/3-error.html')), 'Radios with an error');
  const summary = example('components/error-summary/examples/1-form-with-errors.html').split('<h1>')[0];
  assert.deepEqual(shape(html(h(g.ErrorSummary, { errors: [{ href: '#name', text: 'Enter your full name' }, { href: '#reply-sms', text: 'Select how we should reply' }] }))), shape(summary), 'ErrorSummary');
  assert.equal(html(h(g.ErrorSummary, { errors: [] })), '', 'no errors, no summary');
});

test('the content parts match the component examples', built, async () => {
  const { h, html, g } = await load();
  assert.deepEqual(shape(html(h(g.Breadcrumbs, { items: [{ label: 'Home', href: '/' }, { label: 'Services', href: '/services/' }], current: 'Apply for a licence' }))),
    shape(example('components/breadcrumbs/examples/1-default.html')), 'Breadcrumbs');
  const notices = [['info', 'Offices close at 3pm on Friday'], ['success', 'Application sent'], ['warning', 'This fee has not been confirmed'], ['danger', 'Beware of fake recruitment adverts']];
  assert.deepEqual(shape(notices.map(([type, title]) => html(h(g.Notice, { type, title }, h('p', null, '…')))).join('')),
    shape(example('components/notice/examples/1-types.html').replace(/<strong>[^<]*<\/strong>/g, '')), 'Notice');
  assert.equal(html(h(g.Button, { href: '/services/licence/apply/' }, 'Start now')), '<a class="ggds-button" href="/services/licence/apply/">Start now</a>');
  assert.equal(html(h(g.Button, { variant: 'secondary' }, 'Save as draft')), '<button class="ggds-button ggds-button--secondary" type="button">Save as draft</button>');
  assert.equal(html(h(g.Tag, { type: 'success' }, 'In force')), '<strong class="ggds-tag ggds-tag--success">In force</strong>');
  const cards = example('components/card/examples/3-icons.html');
  const first = cards.match(/<li[\s\S]*?<\/li>/)[0];
  assert.deepEqual(shape(html(h(g.Card, { icon: 'store', href: '/services/permits/', title: 'Apply for a business permit' }, 'Who needs one, what it costs and how to apply online.'))), shape(first), 'Card with an icon');
  assert.match(html(h(g.Icon, { name: 'download' })), /^<svg class="ggds-icon" viewBox="0 0 24 24" [^>]*aria-hidden="true" focusable="false">/);
  assert.match(html(h(g.Icon, { name: 'download', label: 'Download' })), /role="img" aria-label="Download"/);
});

test('the page heading, key figures, progress, timeline, meter and steps match their component examples', built, async () => {
  const { h, html, g } = await load();
  const page = example('components/page-heading/examples/1-account.html');
  const figures = [{ value: '3', label: 'applications in progress' }, { value: 'GH₵ 1,250', label: 'paid this year' }, { value: '2', label: 'new messages' }];
  assert.deepEqual(shape(html(h(g.PageHeading, { eyebrow: 'Owusu Trading Enterprise · EX-BN-2024-0081', title: 'Welcome back, Ama' }, h(g.KeyFigures, { figures, inverse: true })))), shape(page), 'PageHeading with KeyFigures');
  assert.deepEqual(shape(html(h(g.PageHeading, { danger: true, eyebrow: h(g.Icon, { name: 'warning', className: 'ggds-icon ggds-icon--sm' }), title: 'Flood warning', lede: h('span', null, 'Act ', h('a', { href: '/warnings/flood/' }, 'now')) }))).filter((t) => !t.startsWith('span')),
    shape(example('components/page-heading/examples/2-warning.html')), 'PageHeading, danger');
  assert.deepEqual(shape(html(h(g.KeyFigures, { figures: [{ value: '755 mm', label: 'average rainfall', change: '7% above normal' }, { value: '18', label: 'days of heavy rain', change: '5 more than last year' }, { value: '3', label: 'regions with a flood warning', danger: true, change: h('a', { href: '/warnings/' }, 'See the warnings') }] })) + '<p class="ggds-hint">x</p>'),
    shape(example('components/key-figures/examples/1-default.html')), 'KeyFigures');
  assert.deepEqual(shape(html(h(g.Progress, { current: 3, total: 4, id: 'form-progress' })) + '<h1>x</h1>'), shape(example('components/progress/examples/1-default.html')), 'Progress');
  assert.match(html(h(g.Progress, { current: 3, total: 4 })), /<progress class="ggds-progress__bar" id="ggds-progress" value="3" max="4">Question 3 of 4<\/progress>/);
  assert.deepEqual(shape('<h2>x</h2>' + html(h(g.Timeline, { stages: [{ title: 'Application and payment received', when: '10 November 2026', state: 'done' }, { title: 'A fisheries officer checks your answers', when: 'Within 5 working days', state: 'current' }, { title: 'We check your canoe', when: 'We will text you a date' }, { title: 'Your licence arrives by SMS', when: 'By 31 December 2026' }] }))),
    shape(example('components/timeline/examples/1-what-happens-next.html')), 'Timeline');
  assert.match(html(h(g.Timeline, { stages: [{ title: 'Paid', state: 'done' }] })), /<span class="ggds-visually-hidden">Done: <\/span>Paid/);
  assert.equal(html(h(g.Meter, { value: 812, max: 1100 })), '<meter class="ggds-meter" min="0" max="1100" value="812" aria-hidden="true">812</meter>');
  const steps = example('components/steps/examples/1-urgent.html');
  const n = (steps.match(/ggds-steps__item/g) ?? []).length;
  const icons = [...steps.matchAll(/<h3 class="ggds-steps__title">([^<]*)<\/h3>/g)].map((m) => m[1]);
  const noDrawing = (x) => x.replace(/(<svg[^>]*>)[\s\S]*?<\/svg>/g, '$1</svg>'); // which icon is drawn does not matter here
  assert.deepEqual(shape(noDrawing('<h2>x</h2>' + html(h(g.Steps, { urgent: true, steps: icons.map((title) => ({ icon: 'arrow-up', title, text: 'x' })) })))), shape(noDrawing(steps)), `Steps (${n})`);
});

test('Header, ErrorSummary, CharacterCount, PasswordInput, Dialog and TimeoutWarning are client components; the rest work in Next.js server components', built, () => {
  const d = join(root, 'packages', 'react', 'dist');
  for (const f of ['Header.js', 'ErrorSummary.js', 'CharacterCount.js', 'PasswordInput.js', 'Dialog.js', 'TimeoutWarning.js']) assert.match(readFileSync(join(d, f), 'utf8'), /^'use client';/, f);
  for (const f of ['Banner.js', 'Hero.js', 'Footer.js', 'TabBar.js', 'fields.js', 'content.js', 'data.js', 'Icon.js', 'SkipLink.js', 'navigation.js', 'util.js']) {
    const js = readFileSync(join(d, f), 'utf8');
    assert.doesNotMatch(js, /use client|useState|useEffect/, `${f} must stay a server component`);
  }
});

test('every React example in the documentation parses, and imports only what @ggds/react exports', built, async () => {
  const { default: ts } = await import('typescript');
  const g = await import(dist);
  const site = join(root, 'site');
  if (!existsSync(site)) return;
  const unesc = (t) => t.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
  let count = 0;
  const { readdirSync } = await import('node:fs');
  for (const f of readdirSync(join(site, 'components')).filter((n) => n.endsWith('.html'))) {
    const html = readFileSync(join(site, 'components', f), 'utf8');
    for (const [, inner] of html.matchAll(/aria-label="React for [^"]*"><code>([\s\S]*?)<\/code><\/pre>/g)) {
      count++;
      const code = unesc(inner);
      const [, names] = code.match(/^import \{ ([^}]+) \} from '@ggds\/react';/);
      for (const n of names.split(',').map((x) => x.trim())) assert.ok(n in g, `${f}: @ggds/react has no ${n}`);
      const body = code.replace(/^import[^\n]*\n/, '');
      const file = ts.createSourceFile('x.tsx', `const errors: any = {};\nconst open = false;\nconst setOpen = (o: boolean) => o;\nconst x = (<>${body}</>);`, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
      assert.deepEqual(file.parseDiagnostics.map((d) => ts.flattenDiagnosticMessageText(d.messageText, ' ')), [], `${f}:\n${body}`);
    }
  }
  assert.ok(count >= 15, `${count} React examples`);
});

test('every React example in the documentation type-checks against @ggds/react\'s props', built, async () => {
  const site = join(root, 'site');
  if (!existsSync(site)) return;
  const { mkdirSync, readdirSync, rmSync, writeFileSync } = await import('node:fs');
  const { execFileSync } = await import('node:child_process');
  const dir = join(root, 'packages', 'react', '.typecheck');
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir);
  const unesc = (t) => t.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
  let i = 0;
  for (const f of readdirSync(join(site, 'components')).filter((n) => n.endsWith('.html'))) {
    for (const [, inner] of readFileSync(join(site, 'components', f), 'utf8').matchAll(/aria-label="React for [^"]*"><code>([\s\S]*?)<\/code><\/pre>/g)) {
      const [imp, ...rest] = unesc(inner).replace("from '@ggds/react'", "from '../src/index.js'").split('\n');
      writeFileSync(join(dir, `${f.replace('.html', '')}-${i++}.tsx`), `${imp}\ndeclare const errors: Record<string, string | undefined>;\ndeclare const open: boolean;\ndeclare const setOpen: (open: boolean) => void;\nexport const x = (<>${rest.join('\n')}</>);\n`);
    }
  }
  writeFileSync(join(dir, 'tsconfig.json'), JSON.stringify({ extends: '../tsconfig.json', compilerOptions: { noEmit: true, rootDir: '..', declaration: false }, include: ['*.tsx', '../src'] }));
  try {
    execFileSync(join(root, 'node_modules', '.bin', 'tsc'), ['-p', dir], { encoding: 'utf8' });
  } catch (e) {
    assert.fail(`a React example does not type-check:\n${e.stdout}`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('the back link, phase banner, side navigation, contents list, language switcher, cookie banner and character count match their examples', built, async () => {
  const { h, html, g } = await load();
  assert.deepEqual(shape(html(h(g.BackLink, { href: '/services/licence/apply/contact/' }))), shape(example('components/back-link/examples/1-default.html')), 'BackLink');
  assert.deepEqual(shape(html(h(g.PhaseBanner, { feedbackHref: '/feedback/' }))), shape(example('components/phase-banner/examples/1-beta.html')), 'PhaseBanner');
  const side = [{ label: 'Licences', href: '/services/licences/' }, { label: 'Fees and charges', href: '/services/fees/', links: [{ label: 'Broadcasting fees', href: '/services/fees/broadcasting/' }, { label: 'Telecoms fees', href: '/services/fees/telecoms/' }] }, { label: 'Equipment approval', href: '/services/type-approval/' }];
  assert.deepEqual(shape(html(h(g.SideNav, { items: side, current: '/services/fees/' }))), shape(example('components/side-navigation/examples/1-default.html')), 'SideNav');
  assert.deepEqual(shape(html(h(g.Contents, { items: [{ label: 'Who needs a licence', href: '#who-needs-a-licence' }, { label: 'What it costs', href: '#what-it-costs' }, { label: 'How to apply', href: '#how-to-apply' }] }))), shape(example('components/contents-list/examples/1-default.html')), 'Contents');
  const langs = ['en', 'tw', 'ee', 'gaa', 'ha', 'dag'].map((code) => ({ code, href: code === 'en' ? '/' : `/${code}/` }));
  const switcher = html(h(g.LanguageSwitcher, { languages: langs, current: 'en' }));
  assert.deepEqual(shape(switcher), shape(example('components/language-switcher/examples/1-default.html')), 'LanguageSwitcher');
  assert.match(switcher, /lang="ee" hrefLang="ee">Eʋegbe<|lang="ee" hreflang="ee">Eʋegbe</i);
  assert.equal(html(h(g.LanguageSwitcher, { languages: [langs[0]], current: 'en' })), '', 'one language, no switcher');
  const cookies = example('components/cookie-banner/examples/1-question.html');
  assert.deepEqual(shape(html(h(g.CookieBanner, { service: 'Example Agency' }))), shape(cookies), 'CookieBanner');
  assert.deepEqual(shape(html(h(g.CookieBanner, { service: 'Example Agency', choice: 'accept' }))), shape(example('components/cookie-banner/examples/2-accepted.html')), 'CookieBanner, accepted');
  assert.equal(html(h(g.CookieBanner, { service: 'A', choice: 'hidden' })), '');
  const count = html(h(g.CharacterCount, { id: 'details', name: 'details', label: 'Describe the problem', hint: 'Include dates, amounts and any reference numbers', max: 500 }));
  assert.deepEqual(shape(count), shape(example('components/character-count/examples/1-default.html')), 'CharacterCount');
  assert.match(count, />You can enter up to 500 characters</);
  assert.doesNotMatch(count, /maxlength/i);
});

test('the task list, password input, code input, prefix and suffix, dialog and timeout warning match their examples', built, async () => {
  const { h, html, g } = await load();
  const tasks = [
    { id: 'details', label: 'Your details', href: '#details', status: 'completed' },
    { id: 'canoe', label: 'About your canoe', href: '#canoe', status: 'completed' },
    { id: 'documents', label: 'Upload your documents', href: '#documents', status: 'inProgress', hint: 'Your Ghana Card and a photo of the canoe' },
    { id: 'landing', label: 'Your landing beach', href: '#landing', status: 'notStarted' },
    { id: 'pay', label: 'Pay the fee', status: 'cannotStart', hint: 'You can pay once the other sections are complete' },
  ];
  const list = html(h(g.TaskList, { tasks }));
  assert.deepEqual(shape(list), shape(example('components/task-list/examples/1-application.html')).slice(1), 'TaskList');
  assert.match(list, />You have completed 2 of 5 sections\.</);

  assert.deepEqual(shape(html(h(g.PasswordInput, { id: 'password', name: 'password', label: 'Password' }))),
    shape(example('components/password-input/examples/1-sign-in.html')), 'PasswordInput');
  assert.deepEqual(shape(html(h(g.PasswordInput, { id: 'new-password', name: 'newPassword', label: 'Create a password', hint: 'At least 8 characters', error: 'Your password must have at least 8 characters', autoComplete: 'new-password' }))),
    shape(example('components/password-input/examples/2-new-password.html')), 'PasswordInput, new, with an error');

  assert.deepEqual(shape(html(h(g.CodeInput, { id: 'code', name: 'code', label: 'Enter the code we sent you', hint: 'We sent a 6-digit code to 024 *** 4567. It expires in 10 minutes.' }))),
    shape(example('components/code-input/examples/1-sms-code.html')).slice(0, 4), 'CodeInput');

  const affixes = html(h('div', null,
    h(g.TextInput, { id: 'amount', name: 'amount', label: 'How much do you want to pay, in Ghana cedis?', hint: 'For example, 150.00', width: 'short', prefix: 'GH₵', inputMode: 'decimal', spellCheck: false }),
    h(g.TextInput, { id: 'catch', name: 'catch', label: 'Weight of the catch, in kilograms', width: 'short', suffix: 'kg', inputMode: 'decimal', spellCheck: false })));
  assert.deepEqual(shape(affixes).slice(1), shape(example('components/field/examples/7-prefix-suffix.html')), 'TextInput prefix and suffix');

  const dialog = html(h(g.Dialog, { id: 'delete-draft', open: false, onClose: () => {}, title: 'Delete this draft?', warning: true, action: '#delete-draft-page',
    actions: h(g.Button, { variant: 'warning', type: 'submit' }, 'Delete draft') },
  h('p', null, 'Your answers will be deleted. You cannot get them back.')));
  assert.deepEqual(shape(dialog), shape(example('components/dialog/examples/1-confirm.html')).slice(2), 'Dialog');
  assert.match(dialog, /<form[^>]*><button[^>]*>Cancel<\/button>/, 'Cancel first');

  // Two task lists on a page: idPrefix keeps their ids apart.
  assert.match(html(h(g.TaskList, { tasks: tasks.slice(0, 1), idPrefix: 'renewal' })), /id="renewal-details-status"/);
  // Your own aria-describedby is added to the hint and error, never instead of them.
  for (const [C, extra] of [[g.TextInput, {}], [g.PasswordInput, {}], [g.Textarea, {}], [g.CharacterCount, { max: 10 }]]) {
    const out = html(h(C, { id: 'q', name: 'q', label: 'Q', hint: 'H', error: 'E', 'aria-describedby': 'mine', ...extra }));
    assert.match(out, /aria-describedby="mine q-hint q-error/, `${C.name}: ${out}`);
  }
  const timeout = html(h(g.TimeoutWarning, { timeout: 123, keepAlive: '#keep-alive', signOut: '#signed-out' }));
  assert.deepEqual(shape(timeout), shape(example('components/timeout-warning/examples/1-default.html')).slice(1), 'TimeoutWarning');
  assert.match(timeout, /we will sign you out in <span[^>]*>2 minutes<\/span>/);
});

test('the strings prop translates GGDS\'s own text, and stringsFor falls back to English', built, async () => {
  const { h, html, g } = await load();
  const marked = { 'header.menu': '[x] Menu', 'banner.officialAddress': '[x] {host} is ours.' };
  assert.match(html(h(g.Header, { name: 'A', nav: [], strings: marked })), /<span class="ggds-visually-hidden">\[x\] Menu<\/span>/);
  assert.match(html(h(g.Banner, { shortName: 'A', host: '<b>x</b>', official: true, strings: marked })), /\[x\] <strong>&lt;b&gt;x&lt;\/b&gt;<\/strong> is ours\./);
  assert.deepEqual(g.stringsFor('tw'), g.STRINGS, 'no Twi yet: all English');
  assert.deepEqual(g.LANGUAGES.map((l) => l.code), ['en', 'tw', 'ee', 'gaa', 'ha', 'dag']);
});

test('Page puts the page parts around <main> in GGDS order, and Feedback matches its examples', built, async () => {
  const { h, html, g } = await load();
  const NAV = [{ label: 'Services', href: '/services/' }, { label: 'About', href: '/about/' }];
  const SECTIONS = [{ label: 'Services', href: '/services/', links: [{ label: 'Fees', href: '/fees/' }] }];
  const TABS = [{ label: 'Home', href: '/', icon: 'home', current: true }, { label: 'Search', href: '/search/', icon: 'search' }];
  const contact = { address: 'Accra', email: 'a@b.c', phone: '0', moreHref: '/contact/' };
  const page = html(h(g.Page, {
    banner: { shortName: 'EA', host: 'example.gov.gh', official: true, register: { href: '/register/' } },
    header: { name: 'Example Agency', initials: 'EA', nav: NAV, current: '/services/' },
    footer: { name: 'Example Agency', purpose: 'We help.', contact, sections: SECTIONS, bar: [{ label: 'Privacy', href: '/privacy/' }] },
    tabs: TABS,
  }, h('h1', null, 'Services')));
  const want = '<a class="ggds-skip-link" href="#main">Skip to main content</a>'
    + parts.banner({ unofficial: false, shortName: 'EA', host: 'example.gov.gh', registerHref: '/register/' })
    + parts.header({ name: 'Example Agency', logo: parts.mark({ initials: 'EA' }), nav: NAV, current: '/services/', search: '/search/' })
    + '<main id="main" tabindex="-1" class="ggds-container ggds-main"><h1>Services</h1></main>'
    + parts.footer({ name: 'Example Agency', logo: parts.mark({ initials: 'EA' }), purpose: 'We help.', contact, sections: SECTIONS, bar: [['Privacy', '/privacy/']] })
    + parts.tabBar(TABS);
  assert.deepEqual(shape(page), shape(want), 'Page');
  const bare = html(h(g.Page, { banner: { shortName: 'EA', host: 'example.gov.gh' }, header: { name: 'Example Agency', nav: NAV }, footer: { name: 'Example Agency' }, mainClassName: '' }, 'x'));
  assert.match(bare, /<main id="main" tabindex="-1">x<\/main>/, 'mainClassName="" leaves <main> without a class');
  assert.doesNotMatch(bare, /ggds-tab-bar/, 'no tabs, no tab bar');

  const fb = { action: '/feedback/', page: '/services/apply-for-a-licence/', reportHref: '/report-a-problem/' };
  assert.deepEqual(shape(html(h(g.Feedback, fb))), shape(example('components/feedback/examples/1-default.html')), 'Feedback');
  assert.deepEqual(shape(html(h(g.Feedback, { ...fb, answered: true }))), shape(example('components/feedback/examples/2-thanks.html')), 'Feedback, answered');
  assert.match(html(h(g.Feedback, fb)), /href="\/report-a-problem\/\?page=\/services\/apply-for-a-licence\/"/);
});
