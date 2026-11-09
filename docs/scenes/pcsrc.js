// ParcelRoutes, copied from the MoCDTI platform by scripts/sync-scenes.mjs. Do not edit.
"use strict";
// Light one route at a time and carry the parcel along it; a route's link being pointed at or focused holds it.
const still = matchMedia('(prefers-reduced-motion: reduce)');
for (const fig of document.querySelectorAll('[data-routes]')) {
    const paths = [...fig.querySelectorAll('[data-route-path]')];
    const parcel = fig.querySelector('[data-parcel]');
    const links = [...fig.querySelectorAll('a[data-route-link]')];
    let current = 0, held = false, started = 0;
    const place = (t) => {
        const p = paths[current], len = p.getTotalLength(), pt = p.getPointAtLength(len * t);
        parcel.setAttribute('transform', `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)})`);
    };
    const light = (i) => {
        current = i;
        started = performance.now();
        for (const el of fig.querySelectorAll('[data-route],[data-route-caption],a[data-route-link]')) {
            const { route, routeCaption, routeLink } = el.dataset;
            el.toggleAttribute('data-on', Number(route ?? routeCaption ?? routeLink) === i);
        }
        place(still.matches ? 1 : 0);
    };
    for (const a of links) {
        const hold = () => { held = true; light(Number(a.dataset.routeLink)); };
        const release = () => { held = false; };
        a.addEventListener('pointerenter', hold);
        a.addEventListener('focus', hold);
        a.addEventListener('pointerleave', release);
        a.addEventListener('blur', release);
    }
    if (still.matches) {
        place(1);
        continue;
    }
    // Travel for TRAVEL ms, wait at the destination for REST ms, then move on (unless held).
    const TRAVEL = 2800, REST = 1400;
    const tick = (now) => {
        const t = (now - started) / TRAVEL;
        // Ease in and out, so the parcel sets off and arrives gently.
        place(t >= 1 ? 1 : t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
        if (now - started > TRAVEL + REST) {
            if (held)
                started = now;
            else
                light((current + 1) % paths.length);
        }
        requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
}
