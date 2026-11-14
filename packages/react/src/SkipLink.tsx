import { t, type StringsProp } from './util.js';

export interface SkipLinkProps {
  /** Default: "#main". Put id="main" on your <main>. */
  href?: string;
  label?: string;
  /** GGDS's own text in another language: stringsFor('tw'). */
  strings?: StringsProp;
}

/** The first thing on every page: a link past the header, for keyboard users. */
export function SkipLink({ href = '#main', label, strings }: SkipLinkProps) {
  return <a className="ggds-skip-link" href={href}>{label ?? t(strings, 'skipLink.label')}</a>;
}
