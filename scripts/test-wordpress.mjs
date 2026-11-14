// Tests the GGDS WordPress theme and GGDS Switch in a real WordPress (Docker). Skipped when Docker is not available.
//  1. The theme: a site with example content, then tests/wordpress/theme.spec.ts (axe on every template at desktop
//     and phone widths, no inline scripts or styles, and the same header, banner and footer markup as the
//     documentation).
//  2. The switch: a site with a heavy theme and page-builder content, switched from GGDS > Switch to GGDS, then
//     tests/wordpress/switch.spec.ts on the result; then undo, which must put every page back exactly as it was.
//  3. Tidy up content: a fresh site with sample text, example and demonstration pages (packages/wordpress/test/
//     tidy-tests.mjs and tests/wordpress/tidy.spec.ts); its changes, 410 Gone, and undo.
//   node scripts/test-wordpress.mjs          set up, test, tear down
//   node scripts/test-wordpress.mjs --keep   leave the site running at http://localhost:8089 afterwards
//   node scripts/test-wordpress.mjs --switch only the switch tests
//   node scripts/test-wordpress.mjs --tidy   only the Tidy up content tests
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { tidyTests } from '../packages/wordpress/test/tidy-tests.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const compose = ['compose', '-f', 'packages/wordpress/test/compose.yml'];
const keep = process.argv.includes('--keep');
const onlySwitch = process.argv.includes('--switch');
const onlyTidy = process.argv.includes('--tidy');
const URL_ = 'http://localhost:8089';

if (spawnSync('docker', ['info'], { stdio: 'ignore' }).status !== 0) {
  console.warn('wordpress: Docker is not running; WordPress theme tests skipped');
  process.exit(0);
}
const docker = (...args) => execFileSync('docker', [...compose, ...args], { cwd: root, stdio: ['ignore', 'pipe', 'inherit'], encoding: 'utf8' }).trim();
const wp = (...args) => docker('run', '--rm', 'cli', 'wp', ...args);

const playwright = (...args) => spawnSync('pnpm', ['exec', 'playwright', 'test', '--config', 'tests/wordpress/playwright.config.ts', ...args],
  { cwd: root, stdio: 'inherit', env: { ...process.env, WP_URL: URL_ } }).status ?? 1;
const install = (title) => wp('core', 'install', `--url=${URL_}`, `--title=${title}`, '--admin_user=admin', '--admin_password=admin-password-not-secret',
  '--admin_email=webmaster@example.gov.gh', '--skip-email');

let status = 1;
try {
  docker('down', '-v', '--remove-orphans');
  docker('up', '-d', '--wait', 'db', 'wordpress');
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(`${URL_}/wp-login.php`)).status < 500) break; } catch { /* starting */ }
    await new Promise((r) => setTimeout(r, 1000));
  }
  status = onlySwitch || onlyTidy ? 0 : themeTests();
  if (status === 0 && !onlyTidy) status = switchTests();
  if (status === 0 && !onlySwitch) status = await tidyTests({ wp, playwright, install, url: URL_ });
} finally {
  if (!keep) docker('down', '-v', '--remove-orphans');
  else console.log(`wordpress: still running at ${URL_} (admin / admin-password-not-secret). Stop it with: docker ${compose.join(' ')} down -v`);
}
process.exit(status);

/** 1. The theme, on a site set up for GGDS from the start. */
function themeTests() {
  install('Example Agency');
  wp('option', 'update', 'blogdescription', 'We help people and businesses with an example government service.');
  wp('rewrite', 'structure', '/%postname%/');
  wp('theme', 'activate', 'ggds');
  for (const [k, v] of Object.entries({ short_name: 'EA', initials: 'EA', theme: 'nca', official_host: 'example.gov.gh',
    register_url: '/register/', purpose: 'We help people and businesses.', address: 'Example Road, Accra',
    email: 'info@example.gov.gh', phone: '030 000 0000', contact_url: '/contact/', search_placeholder: 'Search, for example: licence' })) {
    wp('theme', 'mod', 'set', `ggds_${k}`, v);
  }
  const page = (title, content, parent = 0, excerpt = '') => wp('post', 'create', '--post_type=page', '--post_status=publish', `--post_title=${title}`,
    `--post_content=${content}`, `--post_parent=${parent}`, `--post_excerpt=${excerpt}`, '--porcelain');
  const home = page('Home', '');
  const news = page('News', '');
  const services = page('Services', '<p>Everything you can do with us.</p>', 0, 'Licences, complaints and registration.');
  const apply = page('Apply for a licence', '<h2>Who needs a licence</h2><p>Any company that offers the service.</p><ul><li>A business registration certificate</li><li>A Ghana Card</li></ul><h2>Fees</h2><figure class="wp-block-table"><table><thead><tr><th>Licence</th><th>Fee</th></tr></thead><tbody><tr><td>Class A</td><td>GH₵ 1,000</td></tr></tbody></table></figure>', services, 'Who needs a licence, what you need and the fee.');
  const about = page('About us', '<p>What we do and who we are.</p>', 0, 'Our role, our board and our reports.');
  const contact = page('Contact us', '<p>Call 030 000 0000.</p>');
  const accessibility = page('Accessibility', '<p>How accessible this website is.</p>');
  wp('option', 'update', 'show_on_front', 'page');
  wp('option', 'update', 'page_on_front', home);
  wp('option', 'update', 'page_for_posts', news);
  wp('term', 'create', 'category', 'Press release');
  for (let i = 1; i <= 12; i++) {
    wp('post', 'create', '--post_status=publish', `--post_title=Example notice ${i}`, `--post_content=<p>What changed, and what it means for you. Notice ${i}.</p>`,
      '--post_category=Press release', `--post_date=2026-10-${String(i).padStart(2, '0')} 09:00:00`);
  }
  const menu = (name, location, items) => {
    wp('menu', 'create', name);
    for (const [title, id, parent, description] of items) {
      const args = ['menu', 'item', 'add-post', name, String(id), `--title=${title}`, '--porcelain'];
      if (parent) args.push(`--parent-id=${parent}`);
      if (description) args.push(`--description=${description}`);
      items.ids = { ...items.ids, [title]: wp(...args) };
    }
    wp('menu', 'location', 'assign', name, location);
    return items.ids;
  };
  menu('Main', 'primary', [['Services', services, 0, 'Licences, complaints and registration.'], ['News', news, 0, 'Notices and press releases.'], ['About us', about, 0, 'Our role and our reports.']]);
  menu('Common tasks', 'tasks', [['Apply for a licence', apply], ['Contact us', contact]]);
  const footerIds = menu('Footer', 'footer', [['Services', services]]);
  wp('menu', 'item', 'add-post', 'Footer', String(apply), '--title=Apply for a licence', `--parent-id=${footerIds.Services}`);
  menu('Footer links', 'legal', [['Accessibility', accessibility], ['Contact us', contact]]);
  wp('rewrite', 'flush');
  return playwright('theme.spec.ts');
}

/**
 * 2. GGDS Switch, on a site like many government websites today: a heavy theme, a page builder (and leftovers of
 * another one), inline styles, a slider, a lazy-loaded image, a form, and blocks with their own colours.
 */
function switchTests() {
  wp('db', 'reset', '--yes');
  install('National Example Authority (NEA)');
  wp('option', 'update', 'blogdescription', 'We license and regulate example services.');
  wp('rewrite', 'structure', '/%postname%/');
  wp('theme', 'activate', 'bloated');
  wp('plugin', 'activate', 'fake-builder', 'ggds-switch');
  const page = (title, content, meta = {}) => {
    const id = wp('post', 'create', '--post_type=page', '--post_status=publish', `--post_title=${title}`, `--post_content=${content}`, '--porcelain');
    for (const [k, v] of Object.entries(meta)) wp('post', 'meta', 'update', id, k, v);
    return id;
  };
  const ids = {
    home: page('Home', '[vc_row][vc_column][vc_slider][vc_column_text]<h2>Welcome</h2><p>We license example services.</p>[/vc_column_text][/vc_column][/vc_row]', { _wpb_vc_js_status: 'true' }),
    about: page('About us', '[vc_row][vc_column][vc_column_text]<h1 style="color:red">About the Authority</h1><p><span style="font-size:18px"><font color="#333">We regulate <b>example</b> communications.</font></span></p><p>&nbsp;</p>[vc_icon][/vc_column_text][/vc_column][/vc_row]', { _wpb_vc_js_status: 'true' }),
    services: page('Services', '[et_pb_section][et_pb_row][et_pb_column type="4_4"][et_pb_text]<h4>Licences</h4><p>Apply for a licence online.</p><h5>Fees</h5><p>See the fees.</p>[/et_pb_text][et_pb_button button_url="/apply/" button_text="Apply now"][/et_pb_button][/et_pb_column][/et_pb_row][/et_pb_section]', { _et_pb_use_builder: 'on' }),
    contact: page('Contact us', '<div class="elementor-section" style="margin:0"><div class="elementor-widget"><h2 class="elementor-heading-title">Talk to us</h2><div class="elementor-text">Email info@example.gov.gh or call 030 000 0000.</div><img class="lazy" src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" data-src="/wp-includes/images/w-logo-blue.png" alt="WordPress logo"></div><form class="elementor-form"><input name="email"><button>Send</button></form></div>', { _elementor_edit_mode: 'builder' }),
    news: page('News', ''),
    privacy: page('Privacy', '<p>How we use your information.</p>'),
    accessibility: page('Accessibility', '<p>How accessible this website is.</p>'),
  };
  ids.post = wp('post', 'create', '--post_status=publish', '--post_title=New licence fees', '--porcelain',
    '--post_content=<!-- wp:paragraph {"style":{"color":{"text":"#ff0000"}}} -->\n<p class="has-text-color" style="color:#ff0000">The fees change in January.</p>\n<!-- /wp:paragraph -->\n\n<!-- wp:kadence/rowlayout -->\n<div class="kt-row" style="padding:20px"><h3>What changes</h3><p>Class A licences cost less.</p></div>\n<!-- /wp:kadence/rowlayout -->');
  wp('option', 'update', 'show_on_front', 'page');
  wp('option', 'update', 'page_on_front', ids.home);
  wp('option', 'update', 'page_for_posts', ids.news);
  wp('menu', 'create', 'Main menu');
  const services = wp('menu', 'item', 'add-post', 'Main menu', ids.services, '--porcelain');
  for (const id of [ids.about, ids.news, ids.contact]) wp('menu', 'item', 'add-post', 'Main menu', id);
  wp('menu', 'item', 'add-custom', 'Main menu', 'Apply for a licence', '/apply/', `--parent-id=${services}`);
  wp('menu', 'location', 'assign', 'Main menu', 'main-menu');
  wp('menu', 'create', 'Footer menu');
  for (const id of [ids.privacy, ids.accessibility, ids.contact]) wp('menu', 'item', 'add-post', 'Footer menu', id);
  wp('menu', 'location', 'assign', 'Footer menu', 'footer-menu');
  const logo = wp('media', 'import', '/var/www/html/wp-admin/images/wordpress-logo.png', '--title=NEA logo', '--porcelain');
  wp('theme', 'mod', 'set', 'custom_logo', logo);
  wp('widget', 'add', 'search', 'sidebar-1');
  wp('rewrite', 'flush');

  const content = (id) => wp('post', 'get', id, '--field=post_content');
  const metaOf = (id) => wp('post', 'meta', 'list', id, '--format=json', '--orderby=meta_key');
  const before = Object.fromEntries(Object.values(ids).map((id) => [id, [content(id), metaOf(id)]]));

  // The admin screen: what it found, its proposals, then the switch itself (desktop only: it switches once).
  let status = playwright('switch.spec.ts', '--project=desktop', '--grep', '@before');
  // The switched website, at desktop and phone widths.
  if (status === 0) status = playwright('switch.spec.ts', '--grep', '@after');
  if (status !== 0) return status;

  // Undo puts everything back exactly as it was.
  wp('ggds-switch', 'undo');
  assert.equal(wp('option', 'get', 'stylesheet'), 'bloated');
  for (const [id, [text, meta]] of Object.entries(before)) {
    assert.equal(content(id), text, `post ${id}: content after undo`);
    assert.equal(metaOf(id), meta, `post ${id}: page-builder settings after undo`);
  }
  assert.doesNotMatch(wp('post', 'list', '--post_type=page', '--post_status=any', '--field=post_title'), /Old homepage/, 'the "Old homepage" draft is removed on undo');
  console.log('wordpress: undo put back the old theme and every page exactly as it was');
  return 0;
}
