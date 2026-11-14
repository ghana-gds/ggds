// 3. Tidy up content (GGDS Switch), on its own fresh website: the Ministry of Communication's old problems
// (tidy-fixture.mjs), then the screen (tests/wordpress/tidy.spec.ts), with the database checked between its steps:
// the changes change statuses and nothing else, removed pages answer 410 Gone, and undo puts everything back. Then
// the same from WP-CLI. Run by scripts/test-wordpress.mjs.
import assert from 'node:assert/strict';
import { seedTidy } from './tidy-fixture.mjs';

export async function tidyTests({ wp, playwright, install, url }) {
  wp('db', 'reset', '--yes');
  install('Ministry of Example');
  wp('rewrite', 'structure', '/%postname%/');
  wp('theme', 'activate', 'ggds');
  wp('plugin', 'activate', 'ggds-switch');
  const { ids, content } = seedTidy(wp);
  const statusOf = (id) => wp('post', 'get', id, '--field=post_status');
  // Apache closes a kept-open connection after a few seconds; WP-CLI between requests takes longer, so a request on
  // a connection it has closed is tried again once.
  const get = async (path, init = {}) => {
    try { return await fetch(new URL(path, url), init); } catch { return fetch(new URL(path, url), init); }
  };
  const answers = async (path) => (await get(path, { redirect: 'manual' })).status;
  const sameContent = (when) => {
    for (const [id, text] of Object.entries(content)) assert.equal(wp('post', 'get', id, '--field=post_content'), text, `post ${id}: content ${when}`);
  };
  const seededStatus = Object.fromEntries(Object.keys(content).map((id) => [id, statusOf(id)]));
  const backAsSeeded = async (when) => {
    sameContent(when);
    for (const [id, s] of Object.entries(seededStatus)) assert.equal(statusOf(id), s, `post ${id}: status ${when}`);
    assert.equal(wp('option', 'get', 'blogdescription'), 'Just another WordPress site', `tagline ${when}`);
    assert.equal(wp('comment', 'get', '1', '--field=comment_approved'), '1', `the example comment ${when}`);
    assert.equal(await answers('/services/'), 200, `/services/ ${when}`);
  };

  let status = playwright('tidy.spec.ts', '--workers=1', '--grep', '@look');
  if (status === 0) status = playwright('tidy.spec.ts', '--project=desktop', '--grep', '@apply');
  if (status !== 0) return status;

  // What the button did: each to the Bin or unpublished, as chosen, and nothing else changed.
  for (const k of ['sample', 'hello', 'homeVersion', 'blogGrid']) assert.equal(statusOf(ids[k]), 'trash', `${k} is in the Bin`);
  for (const k of ['services', 'security', 'dtt', 'servicesItem']) assert.equal(statusOf(ids[k]), 'draft', `${k} is unpublished`);
  for (const k of ['home', 'projects', 'gdap', 'about', 'payments', 'untitled']) assert.equal(statusOf(ids[k]), seededStatus[ids[k]], `${k} is left`);
  for (const k of ['projectsItem', 'gdapItem']) assert.equal(statusOf(ids[k]), 'publish', `${k} (a menu item) is left`);
  assert.equal(wp('option', 'get', 'blogdescription'), '', 'the tagline is cleared');
  assert.equal(wp('comment', 'get', '1', '--field=comment_approved'), 'post-trashed', 'the example comment went with its post');
  sameContent('after tidying');
  // Search engines are told the pages are gone; real pages still answer.
  assert.equal(await answers('/home-version-4/'), 410);
  assert.equal(await answers('/services/'), 410);
  assert.equal(await answers('/about-the-ministry/'), 200);
  assert.doesNotMatch(await (await get('/')).text(), /href="[^"]*\/services\/"/, 'the unpublished page is out of the menu');
  // WordPress's own Bin can restore what was binned here (it reads the same records).
  assert.equal(wp('post', 'meta', 'get', ids.sample, '_wp_trash_meta_status'), 'publish');

  status = playwright('tidy.spec.ts', '--project=desktop', '--grep', '@undo');
  if (status !== 0) return status;
  await backAsSeeded('after undo');
  assert.equal(statusOf(ids.servicesItem), 'publish', 'the menu item is back');

  // The same from WP-CLI: a dry run changes nothing; apply and undo round trip.
  assert.match(wp('ggds-switch', 'tidy', 'apply', '--dry-run'), /Nothing was changed \(dry run\)/);
  sameContent('after a dry run');
  const applied = wp('ggds-switch', 'tidy', 'apply');
  assert.match(applied, /Undo with: wp ggds-switch tidy undo \S+/);
  assert.equal(statusOf(ids.sample), 'trash');
  // A page restored by hand since is left as it is, and undo says so.
  wp('post', 'update', ids.dtt, '--post_status=publish');
  const undone = wp('ggds-switch', 'tidy', 'undo');
  assert.match(undone, /Undone: \d+ put back/);
  assert.equal(statusOf(ids.sample), 'publish');
  assert.equal(statusOf(ids.dtt), 'publish');
  const scan = JSON.parse(wp('ggds-switch', 'tidy', 'scan', '--format=json'));
  assert.ok(scan.items.some((i) => i.key === `post:${ids.sample}`), 'after undo, the scan finds the Sample Page again');
  console.log('wordpress: Tidy up content changed only statuses, answered 410 for removed pages, and undo put everything back');
  return 0;
}
