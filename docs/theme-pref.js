// Every documentation page: the institution chosen on the homepage ("One design system, every institution") or in
// the showcase, applied to the whole site. A classic script in <head>, before the stylesheets, so the page is drawn in
// the chosen colour from the start. The colours come from themes.css ([data-ggds-theme] on <html>). Without
// JavaScript, or with storage blocked, pages keep the default theme.
try {
  const slug = localStorage.getItem('ggds-docs-theme');
  if (slug && /^[a-z0-9-]+$/.test(slug)) document.documentElement.setAttribute('data-ggds-theme', slug);
} catch { /* storage blocked */ }
