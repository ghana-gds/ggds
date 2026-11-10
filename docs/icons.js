// Documentation site only: the filter on the icons page. Without JavaScript the form stays hidden and every
// icon is listed. Loaded as a module file, so it runs under the strict Content Security Policy.
const form = document.querySelector('.docs-icons__filter');
if (form) {
  const input = form.querySelector('input');
  const count = form.querySelector('.docs-icons__count');
  const items = [...document.querySelectorAll('.docs-icons__item')];
  const groups = [...document.querySelectorAll('.docs-icons__group')];
  let timer;
  const filter = () => {
    const words = input.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
    let shown = 0;
    for (const item of items) {
      const keys = item.dataset.keywords.toLowerCase();
      item.hidden = !words.every((w) => keys.includes(w));
      if (!item.hidden) shown++;
    }
    for (const g of groups) g.hidden = !g.querySelector('.docs-icons__item:not([hidden])');
    // Announce the result once typing pauses, not on every key.
    clearTimeout(timer);
    timer = setTimeout(() => {
      count.textContent = words.length ? `${shown} ${shown === 1 ? 'icon' : 'icons'} found` : '';
    }, 400);
  };
  form.hidden = false;
  form.addEventListener('submit', (e) => e.preventDefault());
  input.addEventListener('input', filter);
}
