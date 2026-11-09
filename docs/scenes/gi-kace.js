// SkillsPath, copied from the MoCDTI platform by scripts/sync-scenes.mjs. Do not edit.
"use strict";
// Show one item at a time; an item's link being pointed at or focused holds it.
const still = matchMedia('(prefers-reduced-motion: reduce)');
for (const fig of document.querySelectorAll('[data-courses]')) {
    const links = [...fig.querySelectorAll('a[data-item-link]')];
    let current = 0, held = false;
    const light = (i) => {
        current = i;
        fig.dataset.kind = links[i].dataset.kind;
        for (const el of fig.querySelectorAll('[data-item-caption],a[data-item-link]')) {
            el.toggleAttribute('data-on', Number(el.dataset.itemCaption ?? el.dataset.itemLink) === i);
        }
    };
    for (const a of links) {
        const hold = () => { held = true; light(Number(a.dataset.itemLink)); };
        const release = () => { held = false; };
        a.addEventListener('pointerenter', hold);
        a.addEventListener('focus', hold);
        a.addEventListener('pointerleave', release);
        a.addEventListener('blur', release);
    }
    if (still.matches)
        continue;
    setInterval(() => { if (!held)
        light((current + 1) % links.length); }, 4200);
}
