// NameTree, copied from the MoCDTI platform by scripts/sync-scenes.mjs. Do not edit.
"use strict";
// Types each example into the address bar, lighting the ending it uses once it is complete, then deletes it and
// moves on. Pointing at an ending lights it and pauses the typing. Off when the visitor asks for reduced motion.
const still = matchMedia('(prefers-reduced-motion: reduce)');
for (const fig of document.querySelectorAll('[data-name-tree]')) {
    const examples = JSON.parse(fig.dataset.examples ?? '[]');
    const nodes = [...fig.querySelectorAll('[data-ending]')];
    const endings = nodes.map((g) => g.dataset.ending ?? '').sort((a, b) => b.length - a.length);
    const text = fig.querySelector('[data-bar-text]');
    const name = fig.querySelector('[data-bar-name]');
    const end = fig.querySelector('[data-bar-end]');
    const caret = fig.querySelector('[data-bar-caret]');
    const endingOf = (s) => endings.find((e) => s.endsWith(e)) ?? '';
    const light = (ending) => nodes.forEach((g) => g.toggleAttribute('data-lit', g.dataset.ending === ending));
    // The ending is coloured as soon as the typed text reaches it.
    const show = (full, typed) => {
        const cut = full.length - endingOf(full).length;
        name.textContent = full.slice(0, Math.min(typed, cut));
        end.textContent = typed > cut ? full.slice(cut, typed) : '';
        caret.setAttribute('x', String(text.getBBox().x + text.getComputedTextLength() + 3));
    };
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    let paused = false;
    for (const g of nodes) {
        g.addEventListener('pointerenter', () => { paused = true; light(g.dataset.ending ?? null); });
        g.addEventListener('pointerleave', () => { paused = false; });
    }
    show(examples[0] ?? '', (examples[0] ?? '').length);
    if (still.matches || examples.length < 2)
        continue;
    (async () => {
        for (let i = 0;; i = (i + 1) % examples.length) {
            const full = examples[i];
            if (i > 0 || name.textContent === '') {
                light(null);
                for (let k = 0; k <= full.length; k++) {
                    show(full, k);
                    await wait(75);
                }
            }
            light(endingOf(full));
            await wait(2400);
            while (paused)
                await wait(300);
            light(null);
            for (let k = full.length; k >= 0; k--) {
                show(full, k);
                await wait(28);
            }
            await wait(350);
        }
    })();
}
