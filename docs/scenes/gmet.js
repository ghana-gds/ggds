// WeatherMap, copied from the MoCDTI platform by scripts/sync-scenes.mjs. Do not edit.
"use strict";
// Light one service at a time; a service's link being pointed at or focused holds it.
const still = matchMedia('(prefers-reduced-motion: reduce)');
for (const fig of document.querySelectorAll('[data-weather-map]')) {
    const links = [...fig.querySelectorAll('a[data-kind-link]')];
    let current = 0, held = false;
    const light = (i) => {
        current = i;
        fig.dataset.kind = links[i].dataset.kind;
        for (const el of fig.querySelectorAll('[data-kind-caption],a[data-kind-link]')) {
            el.toggleAttribute('data-on', Number(el.dataset.kindCaption ?? el.dataset.kindLink) === i);
        }
    };
    for (const a of links) {
        const hold = () => { held = true; light(Number(a.dataset.kindLink)); };
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
