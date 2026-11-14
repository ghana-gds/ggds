// Content for the Tidy up content tests: what the Ministry of Communication's old website had (docs/architecture/
// gap-analysis.md in the agencies platform), on top of what WordPress installs (Hello world!, Sample Page, the draft
// Privacy Policy and its example comment).
//
// seedTidy(wp) takes a function that runs WP-CLI and returns its output, and gives back the IDs, and the content of
// every post as it was, so a test can check that tidying and undoing change statuses and nothing else.

export function seedTidy(wp) {
  const page = (title, content, { status = 'publish', parent = 0, slug = '', meta = {} } = {}) => {
    const args = ['post', 'create', '--post_type=page', `--post_status=${status}`, `--post_title=${title}`, `--post_content=${content}`, `--post_parent=${parent}`, '--porcelain'];
    if (slug) args.push(`--post_name=${slug}`);
    const id = wp(...args);
    for (const [k, v] of Object.entries(meta)) wp('post', 'meta', 'update', id, k, v);
    return id;
  };
  const LOREM = '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore.</p>';
  const ids = {
    // The theme's demonstration pages: some with lorem ipsum, some with only the theme's marketing words.
    homeVersion: page('Home Version 4', '<h2>We provide the best IT solutions</h2><p>Trusted by 500 companies worldwide.</p>'),
    blogGrid: page('Blog Grid Two Column', '<p>Our latest articles.</p>'),
    security: page('Analysis Of Security', '', { meta: { _elementor_edit_mode: 'builder', _elementor_data: '[{"elType":"widget","settings":{"editor":"<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.<\\/p>"}}]' } }),
    // A programme page that was started and never written: headings only.
    dtt: page('Digital Terrestrial TV', '<!-- wp:heading -->\n<h2>About the project</h2>\n<!-- /wp:heading -->\n\n<!-- wp:heading -->\n<h2>Objectives</h2>\n<!-- /wp:heading -->'),
    // A published page with no title (the old site's /2077-2/), with real words: a person should look.
    untitled: page('', '<p>The Ministry met the sector agencies on 12 May.</p>', { slug: '2077-2' }),
    // Sample text in a page that is in the main menu, and in one that has real pages under it in the menu.
    services: page('Services', LOREM),
    projects: page('Projects', LOREM),
    // A real page that links to the Sample Page, and real words that share a few of the phrases' words.
    about: page('About the Ministry', '<p>Roads under construction in Accra. A sample of our policies. See <a href="/sample-page/">this page</a>.</p>'),
    // "Coming soon" can be real: a person checks it.
    payments: page('Pay online', '<p>Paying fees online is coming soon.</p>'),
    // A draft with sample text: nobody else sees it.
    draft: page('Draft press release', LOREM, { status: 'draft' }),
    // The homepage, with sample text: it stays, and the person is told to rewrite it.
    home: page('Home', LOREM),
  };
  ids.gdap = page('GDAP', '<p>The Ghana Digital Acceleration Project.</p>', { parent: ids.projects });
  ids.sample = wp('post', 'list', '--post_type=page', '--name=sample-page', '--field=ID');
  ids.hello = wp('post', 'list', '--post_type=post', '--name=hello-world', '--field=ID');
  ids.privacy = wp('option', 'get', 'wp_page_for_privacy_policy');
  wp('option', 'update', 'show_on_front', 'page');
  wp('option', 'update', 'page_on_front', ids.home);

  wp('menu', 'create', 'Main sections');
  ids.servicesItem = wp('menu', 'item', 'add-post', 'Main sections', ids.services, '--porcelain');
  ids.projectsItem = wp('menu', 'item', 'add-post', 'Main sections', ids.projects, '--porcelain');
  ids.gdapItem = wp('menu', 'item', 'add-post', 'Main sections', ids.gdap, `--parent-id=${ids.projectsItem}`, '--porcelain');
  wp('menu', 'item', 'add-post', 'Main sections', ids.about);
  wp('menu', 'location', 'assign', 'Main sections', 'primary');

  // The theme's sidebar: a lorem ipsum news box over a made-up phone number, as on the old programme pages.
  wp('option', 'update', 'widget_text', JSON.stringify({ 2: { title: 'Project Related news', text: '<p>Lorem ipsum dolor sit amet. Call +233-247-666465.</p>', filter: true, visual: true }, _multiwidget: 1 }), '--format=json');
  wp('option', 'update', 'sidebars_widgets', JSON.stringify({ wp_inactive_widgets: [], 'sidebar-1': ['text-2'], array_version: 3 }), '--format=json');
  wp('option', 'update', 'blogdescription', 'Just another WordPress site');
  wp('rewrite', 'flush');

  const all = wp('post', 'list', '--post_type=any', '--post_status=any', '--field=ID', '--format=csv').split('\n').filter(Boolean);
  const content = Object.fromEntries(all.map((id) => [id, wp('post', 'get', id, '--field=post_content')]));
  return { ids, content };
}
