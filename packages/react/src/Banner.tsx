import type { HTMLAttributes } from 'react';
import { cx } from './util.js';

export interface BannerProps extends HTMLAttributes<HTMLElement> {
  /** The institution's short name. */
  shortName: string;
  /** The official address, such as "example.gov.gh"; "" if none is confirmed yet. */
  host: string;
  /** This page is served from the official address. If false, the banner says this copy is not the official website. */
  official?: boolean;
  /** Text after the address, when the page is not official. */
  addressNote?: string;
  /** A link to the list of official government websites. */
  register?: { href: string; label: string } | null;
}

/** "An official website of the Government of Ghana", and how to tell. At the top of every page. */
export function Banner({ shortName, host, official = false, addressNote = '', register = null, className, ...rest }: BannerProps) {
  return (
    <section className={cx('ggds-banner', !official && 'ggds-banner--unofficial', className)} aria-label="Official government website" {...rest}>
      <details className="ggds-banner__details ggds-container">
        <summary className="ggds-banner__summary">
          <svg className="ggds-banner__flag" viewBox="0 0 30 20" aria-hidden="true" focusable="false"><rect className="ggds-banner__flag-red" width="30" height="6.67" /><rect className="ggds-banner__flag-gold" y="6.67" width="30" height="6.67" /><rect className="ggds-banner__flag-green" y="13.33" width="30" height="6.67" /><polygon className="ggds-banner__flag-star" points="15,6.8 15.73,8.99 18.04,9.01 16.19,10.39 16.88,12.59 15,11.25 13.12,12.59 13.81,10.39 11.96,9.01 14.27,8.99" /></svg>
          <span className="ggds-banner__text">{official ? 'An official website of the Government of Ghana' : `This copy is not the official ${shortName} website`}</span>
          {' '}<span className="ggds-banner__toggle">How to tell</span>
        </summary>
        <div className="ggds-banner__content">
          <div className="ggds-banner__item">
            <p className="ggds-banner__heading">Check the address</p>
            <p>
              {!host ? <>The {shortName} has not confirmed its official address yet.</>
                : official ? <>The official address of this website is <strong>{host}</strong>.</>
                  : <>The official {shortName} website is <strong>{host}</strong>{addressNote}.</>}
              {' '}Most government websites end in <strong>.gov.gh</strong>, but some official websites do not.
              {register && <> You can check it on <a href={register.href}>{register.label}</a>.</>}
            </p>
          </div>
          <div className="ggds-banner__item">
            <p className="ggds-banner__heading">A padlock is not proof</p>
            <p>A padlock or <strong>https://</strong> before the address means your connection to the website is private. It does not show who runs the website.</p>
          </div>
          <div className="ggds-banner__item">
            <p className="ggds-banner__heading">We will never ask for your PIN</p>
            <p>Government officials will never ask for your PIN, password or mobile money code, by phone, by SMS or on a website.</p>
          </div>
        </div>
      </details>
    </section>
  );
}
