/**
 * @ggds/js: optional progressive enhancement for GGDS components. Every component works without it.
 * Load as a module (`<script type="module" src="ggds.js">`): no inline script is needed, so it runs under a
 * strict Content Security Policy.
 */
import { initErrorSummary } from './error-summary.js';
import { initMenu } from './menu.js';

export { initErrorSummary, initMenu };

/** Enhance every GGDS component inside `root` (default: the whole document). Safe to call more than once. */
export function initAll(root: ParentNode = document): void {
  document.documentElement.classList.add('ggds-js-enabled');
  root.querySelectorAll<HTMLButtonElement>('.ggds-header__menu-button[aria-controls]').forEach(initMenu);
  root.querySelectorAll<HTMLElement>('[data-ggds-module="error-summary"]').forEach(initErrorSummary);
}
