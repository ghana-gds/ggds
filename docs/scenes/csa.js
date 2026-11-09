// CyberWatch, copied from the MoCDTI platform by scripts/sync-scenes.mjs. Do not edit.
"use strict";
// Light one item at a time; an item's link being pointed at or focused holds it.
const still = matchMedia('(prefers-reduced-motion: reduce)');
for (const fig of document.querySelectorAll('[data-watch]')) {
    const links = [...fig.querySelectorAll('a[data-threat-link]')];
    const count = links.length;
    let current = 0, held = false;
    const light = (i) => {
        current = i;
        for (const el of fig.querySelectorAll('[data-threat],[data-threat-line],[data-threat-caption],a[data-threat-link]')) {
            const { threat, threatLine, threatCaption, threatLink } = el.dataset;
            el.toggleAttribute('data-on', Number(threat ?? threatLine ?? threatCaption ?? threatLink) === i);
        }
    };
    for (const a of links) {
        const hold = () => { held = true; light(Number(a.dataset.threatLink)); };
        const release = () => { held = false; };
        a.addEventListener('pointerenter', hold);
        a.addEventListener('focus', hold);
        a.addEventListener('pointerleave', release);
        a.addEventListener('blur', release);
    }
    if (still.matches || count < 2)
        continue;
    setInterval(() => { if (!held)
        light((current + 1) % count); }, 4200);
}
