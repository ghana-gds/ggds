// Documentation site only: a "Copy code" button above every code block. Without JavaScript the code is still
// there to select and copy. Loaded as a module file, so it runs under the strict Content Security Policy.
for (const pre of document.querySelectorAll('pre.docs-code')) {
  // The bar naming the language comes with the page (docs/highlight.mjs); the button goes in it.
  let bar = pre.previousElementSibling;
  if (!bar?.classList.contains('docs-codeblock__bar')) {
    bar = document.createElement('div');
    bar.className = 'docs-codeblock__bar';
    pre.before(bar);
  }
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'docs-copy';
  button.textContent = 'Copy code';
  const status = document.createElement('span');
  status.className = 'ggds-visually-hidden';
  status.setAttribute('role', 'status');
  let timer;
  button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(pre.textContent ?? '');
      button.textContent = 'Copied';
      status.textContent = 'Code copied';
    } catch {
      button.textContent = 'Could not copy: select the code instead';
    }
    clearTimeout(timer);
    timer = setTimeout(() => { button.textContent = 'Copy code'; status.textContent = ''; }, 2500);
  });
  bar.append(button, status);
}

// "On this page" is a disclosure, closed on phones so the page's content comes first. On wide screens it sits
// beside the content, so open it there. Without JavaScript it stays closed and opens with a tap or click.
const wide = matchMedia('(min-width: 80rem)');
const openContents = () => { for (const d of document.querySelectorAll('.docs-contents__details')) d.open = wide.matches; };
openContents();
wide.addEventListener('change', openContents);

// HTML / JSX: blocks that have both (docs/highlight.mjs) get a switch, and the reader's choice applies to every
// block and is remembered on the next page. Without JavaScript both versions are shown, one after the other.
const PREF = 'ggds-docs-code';
const switches = [...document.querySelectorAll('.docs-codeblock--switch')];
const readPref = () => { try { return localStorage.getItem(PREF) === 'jsx' ? 'jsx' : 'html'; } catch { return 'html'; } };
const show = (lang, focusIn) => {
  try { localStorage.setItem(PREF, lang); } catch { /* private browsing: the choice lasts for this page only */ }
  for (const block of switches) {
    for (const bar of block.querySelectorAll('.docs-codeblock__bar')) {
      const on = bar.dataset.lang === lang;
      bar.hidden = !on;
      bar.nextElementSibling.hidden = !on; // its <pre>
      for (const b of bar.querySelectorAll('.docs-switch__button')) b.setAttribute('aria-pressed', String(b.dataset.lang === lang));
    }
  }
  focusIn?.querySelector(`.docs-codeblock__bar[data-lang="${lang}"] .docs-switch__button[data-lang="${lang}"]`)?.focus();
};
for (const block of switches) {
  for (const bar of block.querySelectorAll('.docs-codeblock__bar')) {
    const group = document.createElement('div');
    group.className = 'docs-switch';
    group.setAttribute('role', 'group');
    group.setAttribute('aria-label', 'Show the code as');
    for (const [lang, label] of [['html', 'HTML'], ['jsx', 'JSX (React)']]) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'docs-switch__button';
      b.dataset.lang = lang;
      b.textContent = label;
      b.addEventListener('click', () => show(lang, block));
      group.append(b);
    }
    bar.querySelector('.docs-codeblock__lang')?.replaceWith(group);
  }
}
if (switches.length) show(readPref());
