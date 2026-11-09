// NetworkHub, copied from the MoCDTI platform by scripts/sync-scenes.mjs. Do not edit.
"use strict";
// Act out one role at a time; a role's link being pointed at or focused holds it.
const still = matchMedia('(prefers-reduced-motion: reduce)');
for (const fig of document.querySelectorAll('[data-network]')) {
    const links = [...fig.querySelectorAll('a[data-role-link]')];
    let current = 0, held = false;
    const light = (i) => {
        current = i;
        fig.dataset.role = links[i].dataset.action;
        for (const el of fig.querySelectorAll('[data-role-caption],a[data-role-link]')) {
            el.toggleAttribute('data-on', Number(el.dataset.roleCaption ?? el.dataset.roleLink) === i);
        }
    };
    for (const a of links) {
        const hold = () => { held = true; light(Number(a.dataset.roleLink)); };
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
