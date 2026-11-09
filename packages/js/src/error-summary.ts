/**
 * Error summary. On page load, moves focus to the summary so screen-reader and keyboard users hear the errors
 * first (WCAG 3.3.1). Its links point at the first input of each field (`href="#field-id"`), which works without
 * JavaScript; with it, following a link also scrolls the field's label or legend into view, not just the input.
 */
export function initErrorSummary(summary: HTMLElement): void {
  if (summary.dataset['ggdsReady']) return;
  summary.dataset['ggdsReady'] = 'true';
  if (!summary.hasAttribute('tabindex')) summary.setAttribute('tabindex', '-1');
  // Inside a frame (such as an example on the documentation site), take focus without scrolling the page
  // around the frame: the browser would otherwise scroll the outer page down to it.
  summary.focus({ preventScroll: window.self !== window.top });

  summary.addEventListener('click', (event) => {
    const link = (event.target as Element | null)?.closest<HTMLAnchorElement>('a[href^="#"]');
    if (!link) return;
    const input = document.getElementById(decodeURIComponent(link.hash.slice(1)));
    if (!input) return;
    event.preventDefault();
    const legend = input.closest('fieldset')?.querySelector('legend');
    const label = input.id ? document.querySelector(`label[for="${CSS.escape(input.id)}"]`) : null;
    (legend ?? label ?? input).scrollIntoView();
    input.focus({ preventScroll: true });
  });
}
