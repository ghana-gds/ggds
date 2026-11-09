// DigitalCentres, copied from the MoCDTI platform by scripts/sync-scenes.mjs. Do not edit.
"use strict";
// Light one space at a time; a space's link being pointed at or focused holds it.
const still = matchMedia('(prefers-reduced-motion: reduce)');
for (const fig of document.querySelectorAll('[data-centres]')) {
    const links = [...fig.querySelectorAll('a[data-space-link]')];
    let current = 0, held = false;
    const light = (i) => {
        current = i;
        for (const el of fig.querySelectorAll('[data-space-art],[data-space-caption],a[data-space-link]')) {
            el.toggleAttribute('data-on', Number(el.dataset.spaceArt ?? el.dataset.spaceCaption ?? el.dataset.spaceLink) === i);
        }
    };
    for (const a of links) {
        const hold = () => { held = true; light(Number(a.dataset.spaceLink)); };
        const release = () => { held = false; };
        a.addEventListener('pointerenter', hold);
        a.addEventListener('focus', hold);
        a.addEventListener('pointerleave', release);
        a.addEventListener('blur', release);
    }
    if (still.matches || links.length < 2)
        continue;
    setInterval(() => { if (!held)
        light((current + 1) % links.length); }, 4200);
}
