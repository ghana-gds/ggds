// Every documentation page: the institution chosen on the homepage ("One design system, every institution") or in
// the showcase, applied to the whole site. A classic script in <head>, before the stylesheets, so the page is drawn in
// the chosen colour from the start. The colours come from themes.css ([data-ggds-theme] on <html>). Without
// JavaScript, or with storage blocked, pages keep the default theme.
try {
  const slug = localStorage.getItem('ggds-docs-theme');
  if (slug && /^[a-z0-9-]+$/.test(slug)) document.documentElement.setAttribute('data-ggds-theme', slug);
} catch { /* storage blocked */ }

// The kente edge on the documentation's cards (docs/woven.mjs) shows until someone chooses an institution; from then
// on, page after page, the edge is in that institution's colour ([data-docs-theme-chosen] on <html>). A reload starts
// the visit afresh, with the kente again. Remembered for this browser tab only (sessionStorage).
try {
  const CHOSEN = 'ggds-docs-theme-chosen';
  const nav = performance.getEntriesByType('navigation')[0];
  if (nav && nav.type === 'reload') sessionStorage.removeItem(CHOSEN);
  else if (sessionStorage.getItem(CHOSEN)) document.documentElement.setAttribute('data-docs-theme-chosen', '');
} catch { /* storage blocked: the kente edge stays */ }
