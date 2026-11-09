// SpectrumTuner, copied from the MoCDTI platform by scripts/sync-scenes.mjs. Do not edit.
"use strict";
// Tune from band to band; a band's link being pointed at or focused tunes to it and holds there.
const still = matchMedia('(prefers-reduced-motion: reduce)');
for (const fig of document.querySelectorAll('[data-spectrum]')) {
    const links = [...fig.querySelectorAll('a[data-band]')];
    const wave = fig.querySelector('[data-wave]');
    const glow = fig.querySelector('[data-wave-glow]');
    const needle = fig.querySelector('[data-needle]');
    const bands = JSON.parse(fig.dataset.bands ?? '[]');
    const geo = JSON.parse(fig.dataset.wave ?? '{}');
    if (!bands.length)
        continue;
    // The same sine wave the server drew, for the band's wavelength.
    const path = (lambda) => {
        const pts = [];
        for (let x = geo.from - lambda; x <= geo.to + 1; x += 2) {
            pts.push(`${x.toFixed(1)} ${(geo.y - geo.amp * Math.sin(((x - geo.from) / lambda) * 2 * Math.PI)).toFixed(1)}`);
        }
        return `M${pts.join('L')}`;
    };
    let current = 0, held = false;
    const tune = (i) => {
        current = i;
        const b = bands[i];
        fig.style.setProperty('--band', b.color);
        needle.style.transform = `translateX(${b.cx}px)`;
        const d = path(b.lambda);
        for (const p of [wave, glow]) {
            p.setAttribute('d', d);
            p.style.setProperty('--lambda', `${b.lambda}px`);
        }
        for (const el of fig.querySelectorAll('[data-band-label],[data-band-icon],[data-band-caption],a[data-band]')) {
            const { bandLabel, bandIcon, bandCaption, band } = el.dataset;
            el.toggleAttribute('data-on', Number(bandLabel ?? bandIcon ?? bandCaption ?? band) === i);
        }
    };
    for (const a of links) {
        const hold = () => { held = true; tune(Number(a.dataset.band)); };
        const release = () => { held = false; };
        a.addEventListener('pointerenter', hold);
        a.addEventListener('focus', hold);
        a.addEventListener('pointerleave', release);
        a.addEventListener('blur', release);
    }
    if (still.matches)
        continue;
    setInterval(() => { if (!held)
        tune((current + 1) % bands.length); }, 3200);
}
