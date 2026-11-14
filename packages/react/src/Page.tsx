import type { ReactNode } from 'react';
import { SkipLink, type SkipLinkProps } from './SkipLink.js';
import { Banner, type BannerProps } from './Banner.js';
import { Header, type HeaderProps } from './Header.js';
import { Footer, type FooterProps } from './Footer.js';
import { TabBar, type Tab } from './TabBar.js';
import type { StringsProp } from './util.js';

export interface PageProps {
  /** The government website banner: Banner's props. */
  banner: BannerProps;
  /** The header: Header's props. Set current to the section the page belongs to. */
  header: HeaderProps;
  /** The footer: Footer's props. Give your logo as footer.logo (class ggds-footer__logo); without one, the header's initials badge shows. */
  footer: FooterProps;
  /** The phone-only tab bar (Home first, Search last). Left out when empty. */
  tabs?: Tab[];
  skipLink?: SkipLinkProps;
  /** Classes on <main>. Default: "ggds-container ggds-main". Pass "" for full-width parts such as a hero. */
  mainClassName?: string;
  /** GGDS's own text in another language, for every part: stringsFor('tw'). */
  strings?: StringsProp;
  children?: ReactNode;
}

/**
 * A whole GGDS page, everything inside <body>: the skip link, banner, header, <main id="main">, footer and tab bar,
 * in GGDS's order. A newer @ggds/react updates every part. A server component: only the header runs in the browser.
 */
export function Page({ banner, header, footer, tabs = [], skipLink, mainClassName = 'ggds-container ggds-main', strings, children }: PageProps) {
  const logo = footer.logo ?? (header.initials ? <span className="ggds-header__monogram" aria-hidden="true">{header.initials}</span> : undefined);
  return (
    <>
      <SkipLink strings={strings} {...skipLink} />
      <Banner strings={strings} {...banner} />
      <Header strings={strings} {...header} />
      <main id="main" tabIndex={-1} className={mainClassName || undefined}>{children}</main>
      <Footer strings={strings} {...footer} logo={logo} />
      {tabs.length > 0 && <TabBar strings={strings} tabs={tabs} />}
    </>
  );
}
