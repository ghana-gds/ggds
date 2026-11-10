// Tests the GGDS WordPress theme in a real WordPress (Docker): sets up a site with example content, then runs
// tests/wordpress (axe on every template at desktop and phone widths, no inline scripts or styles, and the same
// header, banner and footer markup as the documentation). Skipped when Docker is not available.
//   node scripts/test-wordpress.mjs          set up, test, tear down
//   node scripts/test-wordpress.mjs --keep   leave the site running at http://localhost:8089 afterwards
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const compose = ['compose', '-f', 'packages/wordpress/test/compose.yml'];
const keep = process.argv.includes('--keep');
const URL_ = 'http://localhost:8089';

if (spawnSync('docker', ['info'], { stdio: 'ignore' }).status !== 0) {
  console.warn('wordpress: Docker is not running; WordPress theme tests skipped');
  process.exit(0);
}
const docker = (...args) => execFileSync('docker', [...compose, ...args], { cwd: root, stdio: ['ignore', 'pipe', 'inherit'], encoding: 'utf8' }).trim();
const wp = (...args) => docker('run', '--rm', 'cli', 'wp', ...args);

let status = 1;
try {
  docker('down', '-v', '--remove-orphans');
  docker('up', '-d', '--wait', 'db', 'wordpress');
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(`${URL_}/wp-login.php`)).status < 500) break; } catch { /* starting */ }
    await new Promise((r) => setTimeout(r, 1000));
  }
  wp('core', 'install', `--url=${URL_}`, '--title=Example Agency', '--admin_user=admin', '--admin_password=admin-password-not-secret',
    '--admin_email=webmaster@example.gov.gh', '--skip-email');
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

  const run = spawnSync('pnpm', ['exec', 'playwright', 'test', '--config', 'tests/wordpress/playwright.config.ts'], { cwd: root, stdio: 'inherit', env: { ...process.env, WP_URL: URL_ } });
  status = run.status ?? 1;
} finally {
  if (!keep) docker('down', '-v', '--remove-orphans');
  else console.log(`wordpress: still running at ${URL_} (admin / admin-password-not-secret). Stop it with: docker ${compose.join(' ')} down -v`);
}
process.exit(status);
