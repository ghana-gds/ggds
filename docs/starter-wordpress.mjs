// The website as a WordPress import (WXR), for the GGDS WordPress theme: the same pages, the news as posts, and the
// four menus the theme uses, named as the theme looks for them ("Main sections", "Common tasks", "Footer sections",
// "Footer links"), so they work without choosing them in Appearance > Menus. WordPress's own importer reads it
// (Tools > Import > WordPress). The forms are not in it: in WordPress they need a form plugin, and the README says
// which ones to make. Runs in the browser and in Node, so no Node imports.
import { esc } from './parts.mjs';
import { SITE_FILE } from './starter-site.mjs';

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
/** "10 November 2026" → "2026-11-10 09:00:00"; anything else → '' (WordPress then uses the time of the import). */
const wpDate = (text) => {
  const m = /^(\d{1,2})\s+([a-z]+)\s+(\d{4})$/i.exec(String(text).trim());
  const month = m ? MONTHS.indexOf(m[2].toLowerCase()) + 1 : 0;
  return month ? `${m[3]}-${String(month).padStart(2, '0')}-${m[1].padStart(2, '0')} 09:00:00` : '';
};
const cdata = (text) => `<![CDATA[${String(text).replaceAll(']]>', ']]]]><![CDATA[>')}]]>`;
const xml = (text) => String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const paras = (text) => esc(text).split('\n\n').filter(Boolean).map((t) => `<p>${t}</p>`).join('\n');
const list = (items) => `<ul>\n${items.map((x) => `<li>${esc(x)}</li>`).join('\n')}\n</ul>`;
const slug = (file) => file.replace(/\.html$/, '');

/**
 * The WordPress files: { 'wordpress-import.xml', 'README.md', 'ggds-site.json' }, from the starter's model
 * (docs/starter.mjs). The logo, if there is one, is added by the caller.
 */
export function wordpressFiles(model, { version }) {
  const { raw, has, content: c } = model;
  let id = 100;
  const posts = [];
  const page = (file, title, body, o = {}) => {
    const p = { id: id++, type: 'page', name: o.name ?? slug(file), file, title, body, excerpt: o.excerpt ?? '', parent: o.parent ?? 0, order: o.order ?? 0, date: '' };
    posts.push(p);
    return p;
  };
  const legal = (file) => {
    // The prose of a page the starter made: without its title and lead, which the theme shows from the page's own.
    const main = model.pages.find((p) => p.file === file)?.main ?? '';
    const prose = /<div class="ggds-prose">([\s\S]*?)<\/div>\s*<\/div>\s*$/.exec(main)?.[1] ?? '';
    const lead = /<p class="ggds-lead">([\s\S]*?)<\/p>/.exec(prose)?.[1] ?? '';
    return { body: prose.replace(/<h1>[\s\S]*?<\/h1>/, '').replace(/<p class="ggds-lead">[\s\S]*?<\/p>/, '').replace(/href="([a-z0-9-]+)\.html"/g, 'href="/$1/"').trim(), lead };
  };

  const home = page('index.html', 'Home', '', { name: 'home' });
  const servicesPage = page('services.html', 'Services', `<p>Everything you can do with ${esc(raw.name)}, online or at our offices.</p>`);
  const servicePages = c.services.map((x, i) => {
    const s = x.raw;
    const how = s.online ? `To apply, call ${raw.phone} or visit one of our offices.` : s.how;
    const body = [
      s.who.length ? `<h2>Who it is for</h2>\n${list(s.who)}` : '',
      s.need.length ? `<h2>What you need</h2>\n${list(s.need)}` : '',
      s.time ? `<h2>How long it takes</h2>\n${paras(s.time)}` : '',
      s.cost ? `<h2>What it costs</h2>\n${paras(s.cost)}` : '',
      how ? `<h2>What to do</h2>\n${paras(how)}` : '',
    ].filter(Boolean).join('\n\n');
    return page(x.file, s.title, body, { excerpt: s.summary, parent: servicesPage.id, order: i + 1 });
  });
  const fees = has('fees.html') ? page('fees.html', 'Fees and charges', `<figure class="wp-block-table"><table>
<caption>${esc(raw.fees.caption)}</caption>
<thead><tr>${raw.fees.columns.map((h) => `<th scope="col">${esc(h)}</th>`).join('')}</tr></thead>
<tbody>
${raw.fees.rows.map((r) => `<tr>${r.map((v, i) => (i ? `<td>${esc(v)}</td>` : `<th scope="row">${esc(v)}</th>`)).join('')}</tr>`).join('\n')}
</tbody>
</table></figure>`, { excerpt: raw.fees.lead, parent: servicesPage.id, order: 90 }) : null;
  const docs = has('publications.html') ? page('publications.html', c.docsLabel, raw.publications.length
    ? `<figure class="wp-block-table"><table>
<thead><tr><th scope="col">Title</th><th scope="col">Type</th><th scope="col">Published</th></tr></thead>
<tbody>
${raw.publications.map((d) => `<tr><th scope="row">${esc(d.title)}</th><td>${esc(d.type)}</td><td>${esc(d.date)}</td></tr>`).join('\n')}
</tbody>
</table></figure>` : '<p>There are no documents yet.</p>', { excerpt: c.kind.publications.lead }) : null;
  const news = has('news.html') ? page('news.html', 'News and notices', '', { excerpt: `News, notices and consultations from ${raw.name}.` }) : null;
  const about = page('about.html', 'About us', [
    raw.about.what.length ? `<h2>What we do</h2>\n${list(raw.about.what)}` : '',
    raw.about.who ? `<h2>Who runs us</h2>\n${paras(raw.about.who)}` : '',
    raw.about.funded ? `<h2>How we are funded</h2>\n${paras(raw.about.funded)}` : '',
  ].filter(Boolean).join('\n\n'), { excerpt: raw.purpose });
  const jobs = has('jobs.html') ? page('jobs.html', 'Jobs and tenders', `<p><strong>We never charge a fee to apply</strong>, not for a job and not for a tender. If anyone asks you for money, call ${esc(raw.phone)}.</p>
<h2>Jobs</h2>
${raw.jobs.length ? list(raw.jobs.map((j) => `${j.title}: ${[j.place, j.terms].filter(Boolean).join(', ')}. Closes ${j.closes}.`)) : '<p>There are no jobs open now.</p>'}
<h2>Tenders</h2>
<p>We publish every tender under the public procurement law. There are no tenders open now.</p>`, { parent: about.id, order: 2 }) : null;
  const contact = page('contact.html', 'Contact us', `<h2>Phone and email</h2>
<p>Phone: ${esc(raw.phone)}, ${esc(raw.hours)}</p>
<p>Email: <a href="mailto:${esc(raw.email)}">${esc(raw.email)}</a>. We reply within 5 working days.</p>
<h2>Offices</h2>
${raw.offices.map((o) => `<h3>${esc(o.name)}</h3>\n<p>${o.lines.map(esc).join('<br>')}</p>`).join('\n')}
<p>Open ${esc(raw.hours)}. Closed on public holidays.</p>`, { parent: about.id, order: 1 });
  const legalPages = [['accessibility.html', 'Accessibility statement'], ['privacy.html', 'Privacy'], ['disclaimer.html', 'Disclaimer']]
    .map(([file, title]) => { const l = legal(file); return page(file, title, l.body, { excerpt: l.lead.replace(/<[^>]+>/g, '') }); });

  // The news, as posts: each in a category named by its type.
  const categories = [...new Set(raw.news.map((n) => n.type || 'News'))];
  if (has('news.html')) {
    for (const n of raw.news) {
      posts.push({ id: id++, type: 'post', name: '', title: n.title, body: paras(n.body || n.summary), excerpt: n.summary, parent: 0, order: 0, date: wpDate(n.date), category: n.type || 'News' });
    }
  }

  // The four menus.
  const menus = [];
  const menu = (name, items) => menus.push({ name, slug: name.toLowerCase().replace(/\s+/g, '-'), items: items.filter(Boolean) });
  const item = (p, o = {}) => (p ? { page: p, title: o.title ?? p.title, description: o.description ?? '', children: o.children ?? [] } : null);
  menu('Main sections', [
    item(servicesPage, { description: 'Everything you can do with us, online or at our offices.' }),
    item(news, { description: 'What is new, and notices that affect you.' }),
    item(docs, { description: c.kind.publications.card }),
    item(about, { description: 'What we do, who runs us, and how to contact us.' }),
  ]);
  menu('Common tasks', [...c.services.map((x, i) => (x.raw.task ? item(servicePages[i]) : null)).filter(Boolean).slice(0, 5), item(contact)]);
  menu('Footer sections', [
    item(servicesPage, { children: [...servicePages.slice(0, 4), fees].filter(Boolean) }),
    docs || news ? item(docs ?? news, { title: 'Information', children: [docs && news, jobs].filter(Boolean) }) : null,
    item(about, { title: 'About & contact', children: [contact] }),
  ]);
  menu('Footer links', legalPages.map((p) => item(p)).concat(item(contact)));

  let menuId = 1000;
  const menuItems = [];
  for (const m of menus) {
    let order = 1;
    const add = (it, parent) => {
      const mid = menuId++;
      menuItems.push({ id: mid, menu: m, page: it.page, title: it.title, description: it.description, parent, order: order++ });
      for (const ch of it.children) add(item(ch), mid);
    };
    for (const it of m.items) add(it, 0);
  }

  const host = `https://${raw.host}`;
  const postXml = (p) => `  <item>
    <title>${xml(p.title)}</title>
    <dc:creator>${cdata('admin')}</dc:creator>
    <content:encoded>${cdata(p.body)}</content:encoded>
    <excerpt:encoded>${cdata(p.excerpt)}</excerpt:encoded>
    <wp:post_id>${p.id}</wp:post_id>
    <wp:post_date>${cdata(p.date)}</wp:post_date>
    <wp:post_name>${cdata(p.name)}</wp:post_name>
    <wp:status>${cdata('publish')}</wp:status>
    <wp:post_parent>${p.parent}</wp:post_parent>
    <wp:menu_order>${p.order}</wp:menu_order>
    <wp:post_type>${cdata(p.type)}</wp:post_type>
    <wp:comment_status>${cdata('closed')}</wp:comment_status>
    <wp:ping_status>${cdata('closed')}</wp:ping_status>${p.category ? `
    <category domain="category" nicename="${xml(p.category.toLowerCase().replace(/[^a-z0-9]+/g, '-'))}">${cdata(p.category)}</category>` : ''}
  </item>`;
  const meta = (key, value) => `
    <wp:postmeta><wp:meta_key>${cdata(key)}</wp:meta_key><wp:meta_value>${cdata(value)}</wp:meta_value></wp:postmeta>`;
  const menuItemXml = (mi) => `  <item>
    <title>${xml(mi.title === mi.page.title ? '' : mi.title)}</title>
    <content:encoded>${cdata(mi.description)}</content:encoded>
    <wp:post_id>${mi.id}</wp:post_id>
    <wp:post_name>${cdata(`menu-item-${mi.id}`)}</wp:post_name>
    <wp:status>${cdata('publish')}</wp:status>
    <wp:menu_order>${mi.order}</wp:menu_order>
    <wp:post_type>${cdata('nav_menu_item')}</wp:post_type>
    <category domain="nav_menu" nicename="${mi.menu.slug}">${cdata(mi.menu.name)}</category>${meta('_menu_item_type', 'post_type')}${meta('_menu_item_menu_item_parent', String(mi.parent))}${meta('_menu_item_object_id', String(mi.page.id))}${meta('_menu_item_object', 'page')}${meta('_menu_item_target', '')}${meta('_menu_item_classes', 'a:1:{i:0;s:0:"";}')}${meta('_menu_item_xfn', '')}${meta('_menu_item_url', '')}
  </item>`;

  const wxr = `<?xml version="1.0" encoding="UTF-8"?>
<!-- ${xml(raw.name)}: a GGDS website, made with the GGDS website builder (GGDS ${xml(version)}). Import it in WordPress: Tools > Import > WordPress. -->
<rss version="2.0" xmlns:excerpt="http://wordpress.org/export/1.2/excerpt/" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:wfw="http://wellformedweb.org/CommentAPI/" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:wp="http://wordpress.org/export/1.2/">
<channel>
  <title>${xml(raw.name)}</title>
  <link>${xml(host)}</link>
  <description>${xml(raw.purpose)}</description>
  <language>en-GB</language>
  <wp:wxr_version>1.2</wp:wxr_version>
  <wp:base_site_url>${xml(host)}</wp:base_site_url>
  <wp:base_blog_url>${xml(host)}</wp:base_blog_url>
${categories.map((cat, i) => `  <wp:category><wp:term_id>${i + 2}</wp:term_id><wp:category_nicename>${cdata(cat.toLowerCase().replace(/[^a-z0-9]+/g, '-'))}</wp:category_nicename><wp:category_parent>${cdata('')}</wp:category_parent><wp:cat_name>${cdata(cat)}</wp:cat_name></wp:category>`).join('\n')}
${menus.map((m, i) => `  <wp:term><wp:term_id>${i + 50}</wp:term_id><wp:term_taxonomy>${cdata('nav_menu')}</wp:term_taxonomy><wp:term_slug>${cdata(m.slug)}</wp:term_slug><wp:term_name>${cdata(m.name)}</wp:term_name></wp:term>`).join('\n')}
${posts.map(postXml).join('\n')}
${menuItems.map(menuItemXml).join('\n')}
</channel>
</rss>
`;

  const office = raw.offices[0];
  const forms = [
    ...(c.online ? [`**${c.online.raw.title}** (online): full name, Ghana Card number, mobile phone number${c.online.raw.options.length ? `, and which one they need (${c.online.raw.options.join(', ')})` : ''}, then a declaration that the answers are true. Until it is online, its page says to call or visit an office.`] : []),
    ...(has('complaint.html') ? [`**${c.kind.complaint.title}**: ${c.kind.complaint.about.toLowerCase()} what happened, what they would like to happen, and a mobile phone number.`] : []),
    '**Contact us**: name, email address and message.',
  ];
  const readme = `# ${raw.name}: a GGDS website for WordPress

Made with the [GGDS website builder](https://ghana-gds.github.io/ggds/builder.html), GGDS ${version}. This folder has
your website's pages, news and menus as a WordPress import, for the GGDS theme.

**Already have a WordPress website?** You may not need this: [GGDS Switch](https://ghana-gds.github.io/ggds/wordpress.html)
turns the website you have into a GGDS one, and keeps your pages.

## Put it in WordPress

1. **Install the GGDS theme.** Download \`ggds-wordpress-${version}.zip\` from
   [the GGDS releases](https://github.com/ghana-gds/ggds/releases). In WordPress: **Appearance > Themes > Add New Theme >
   Upload Theme**, then **Activate**.
2. **Import your pages.** **Tools > Import > WordPress** (choose **Install Now**, then **Run Importer**). Choose
   \`wordpress-import.xml\` from this folder. Assign the posts to your own user.
3. **Your homepage.** **Settings > Reading**: "Your homepage displays" is **A static page**. The homepage is **Home**,
   and the posts page is **News and notices**.
4. **Your name and purpose.** **Settings > General**: the site title is **${raw.name}**, and the tagline is
   **${raw.purpose}**
5. **Your details.** **Appearance > Customise > GGDS** (or, with GGDS Switch, import \`${SITE_FILE}\`):
   - Short name: **${raw.short}**
   - Institution theme: **${/^#/.test(raw.theme) ? `your own colour, ${raw.theme}: see "Your colour" below` : raw.theme}**
   - Official address: **${raw.host}**
   - Footer: what you do: **${raw.purpose}**
   - Footer: address: **${office.lines.join(', ')}**
   - Footer: email: **${raw.email}**
   - Footer: phone: **${raw.phone}**
6. **Your logo.** **Appearance > Customise > Site identity**${raw.logo ? `: choose \`${raw.logo.replace(/^assets\//, '')}\` from this folder` : ': your approved logo, when you have one'}.

The menus are already there: the GGDS theme uses the ones called "Main sections", "Common tasks", "Footer sections"
and "Footer links". Change them in **Appearance > Menus**.
${/^#/.test(raw.theme) ? `
## Your colour

Your colour, ${raw.theme}, is not one of the ready-made institution themes. Ask your developer to add it in a child
theme: \`--ggds-color-institution: ${raw.theme};\` on \`:root\`. Until then, choose the theme nearest to it.
` : ''}
## Forms

The forms need a form plugin in WordPress. Choose one that works under a strict security policy (no inline scripts):
check its pages before you use it. The forms ask:

${forms.map((f) => `- ${f}`).join('\n')}

## Before it goes live

${model.examples.length ? `- Rewrite the example words that are still there:\n${model.examples.map((x) => `  - ${x.where}: ${x.what}`).join('\n')}\n` : ''}- Upload your documents in **Media**, and link them from **${c.docsLabel}**.
- Serve the public pages with a strict Content Security Policy:
  [GGDS for WordPress](https://ghana-gds.github.io/ggds/wordpress.html#safe) has the line to use.
- When it is online, check it: \`npx @ggds/check https://${raw.host}\`
`;
  return { 'wordpress-import.xml': wxr, 'README.md': readme, [SITE_FILE]: model.assets.siteJson };
}
