'use client';
import { useEffect, useRef } from 'react';

export interface ErrorSummaryProps {
  /** Each problem: what to do, linking to its field (`#<input id>`, or the first radio or checkbox). */
  errors: { href: string; text: string }[];
  /** Default: "There is a problem". */
  title?: string;
}

/**
 * The list of problems at the top of a form, after a failed submit. It takes the focus when it appears, so screen
 * readers read it first (WCAG 3.3.1), and each link moves to its field with the field's label in view.
 * Put it first in <main>, and start the page title with "Error: ". Renders nothing when there are no errors.
 */
export function ErrorSummary({ errors, title = 'There is a problem' }: ErrorSummaryProps) {
  const box = useRef<HTMLDivElement>(null);
  const shown = errors.length > 0;
  const key = errors.map((e) => `${e.href}|${e.text}`).join('\n');

  // Focus the summary each time a new set of errors appears.
  useEffect(() => {
    if (shown) box.current?.focus();
  }, [shown, key]);

  if (!shown) return null;

  const onClick = (event: React.MouseEvent) => {
    const link = (event.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
    const input = link ? document.getElementById(decodeURIComponent(link.hash.slice(1))) : null;
    if (!input) return;
    event.preventDefault();
    const legend = input.closest('fieldset')?.querySelector('legend');
    const label = input.id ? document.querySelector(`label[for="${CSS.escape(input.id)}"]`) : null;
    (legend ?? label ?? input).scrollIntoView();
    input.focus({ preventScroll: true });
  };

  return (
    <div ref={box} className="ggds-error-summary" role="alert" aria-labelledby="error-summary-title" tabIndex={-1} onClick={onClick}>
      <h2 className="ggds-error-summary__title" id="error-summary-title">{title}</h2>
      <ul className="ggds-error-summary__list">
        {errors.map((e) => <li key={e.href}><a href={e.href}>{e.text}</a></li>)}
      </ul>
    </div>
  );
}
