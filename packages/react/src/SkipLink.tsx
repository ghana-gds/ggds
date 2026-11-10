export interface SkipLinkProps {
  /** Default: "#main". Put id="main" on your <main>. */
  href?: string;
  label?: string;
}

/** The first thing on every page: a link past the header, for keyboard users. */
export function SkipLink({ href = '#main', label = 'Skip to main content' }: SkipLinkProps) {
  return <a className="ggds-skip-link" href={href}>{label}</a>;
}
