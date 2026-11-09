// Documentation site only: a "Copy code" button above every code block. Without JavaScript the code is still
// there to select and copy. Loaded as a module file, so it runs under the strict Content Security Policy.
for (const pre of document.querySelectorAll('pre.docs-code')) {
  const bar = document.createElement('div');
  bar.className = 'docs-copy-bar';
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
  pre.before(bar);
}
