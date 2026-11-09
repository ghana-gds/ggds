// DataShield, copied from the MoCDTI platform by scripts/sync-scenes.mjs. Do not edit.
"use strict";
// Act out each right in turn; choosing one with its button shows it and stops the rotation.
const still = matchMedia('(prefers-reduced-motion: reduce)');
for (const fig of document.querySelectorAll('[data-shield]')) {
    const buttons = [...fig.querySelectorAll('button[data-action]')];
    const label = fig.querySelector('[data-now-label]');
    const note = fig.querySelector('[data-now-note]');
    let current = 0, chosen = false;
    const show = (i) => {
        current = i;
        const b = buttons[i];
        fig.dataset.right = b.dataset.action;
        label.textContent = b.dataset.label ?? '';
        note.textContent = b.dataset.note ?? '';
        buttons.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    };
    buttons.forEach((b, i) => b.addEventListener('click', () => { chosen = true; show(i); }));
    if (still.matches || buttons.length < 2)
        continue;
    setInterval(() => { if (!chosen && !fig.matches(':hover'))
        show((current + 1) % buttons.length); }, 3400);
}
