// Showcase pages (docs/showcase.mjs): see the template in any institution's theme. The choice loads that theme's
// stylesheet (assets/themes/<slug>.css) after the page's own colour, is kept in the address (?theme=<slug>) so it can
// be shared, and follows links to the showcase's other pages. Without JavaScript the picker stays hidden.
const bar = document.querySelector('[data-sc-theme]');
const select = bar?.querySelector('select');
if (bar && select) {
  const valid = new Set([...select.options].map((o) => o.value));
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  document.head.append(link);

  const apply = (slug) => {
    if (slug) link.href = `../assets/themes/${slug}.css`;
    else link.removeAttribute('href');
    // Keep the theme on links to the showcase's own pages.
    for (const a of document.querySelectorAll('a[href]')) {
      const href = a.getAttribute('href');
      if (!/^[a-z0-9-]+\.html(?:[?#].*)?$/.test(href ?? '') || href.startsWith('index.html')) continue;
      const url = new URL(href, location.href);
      if (slug) url.searchParams.set('theme', slug);
      else url.searchParams.delete('theme');
      a.setAttribute('href', `${url.pathname.split('/').pop()}${url.search}${url.hash}`);
    }
  };

  const start = new URLSearchParams(location.search).get('theme') ?? '';
  select.value = valid.has(start) ? start : '';
  apply(select.value);
  bar.hidden = false;

  select.addEventListener('change', () => {
    apply(select.value);
    const url = new URL(location.href);
    if (select.value) url.searchParams.set('theme', select.value);
    else url.searchParams.delete('theme');
    history.replaceState(null, '', url);
  });
}
