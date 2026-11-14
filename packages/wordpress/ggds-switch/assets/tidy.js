// Tools > Tidy up content: the button says what it will do ("Unpublish 2 and move 1 to the Bin"), and is off when
// everything is set to "Leave it". Without this script the form works the same, with a general button.
(() => {
  const form = document.getElementById('ggds-tidy-form');
  const button = document.getElementById('ggds-tidy-apply');
  if (!form || !button) return;
  const selects = [...form.querySelectorAll('select[name^="tidy["]')];
  const words = (n, one, many) => `${n} ${n === 1 ? one : many}`;
  const update = () => {
    const n = { unpublish: 0, bin: 0, clear: 0 };
    for (const s of selects) if (s.value in n) n[s.value] += 1;
    const parts = [];
    if (n.unpublish) parts.push(`unpublish ${words(n.unpublish, 'item', 'items')}`);
    if (n.bin) parts.push(`move ${words(n.bin, 'item', 'items')} to the Bin`);
    if (n.clear) parts.push('clear the tagline');
    const text = parts.length ? parts.join(', ').replace(/, ([^,]*)$/, ' and $1') : '';
    button.textContent = text ? text[0].toUpperCase() + text.slice(1) : 'Nothing to change';
    button.disabled = !text;
  };
  form.addEventListener('change', update);
  update();
})();
