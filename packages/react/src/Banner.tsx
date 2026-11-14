import type { HTMLAttributes } from 'react';
import { cx, fill, t, type StringsProp } from './util.js';

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
  register?: { href: string; label?: string } | null;
  /** GGDS's own text in another language: stringsFor('tw'). */
  strings?: StringsProp;
}

/** "An official website of the Government of Ghana", and how to tell. At the top of every page. */
export function Banner({ shortName, host, official = false, addressNote = '', register = null, strings, className, ...rest }: BannerProps) {
  const s = strings;
  const strong = <strong>{host}</strong>;
  const address = !host ? t(s, 'banner.noAddress', { shortName })
    : official ? fill(s, 'banner.officialAddress', { host: strong })
      : fill(s, 'banner.otherAddress', { shortName, host: strong, note: addressNote });
  return (
    <section className={cx('ggds-banner', !official && 'ggds-banner--unofficial', className)} aria-label={t(s, 'banner.label')} {...rest}>
      <details className="ggds-banner__details ggds-container">
        <summary className="ggds-banner__summary">
          <svg className="ggds-banner__flag" viewBox="0 0 30 20" aria-hidden="true" focusable="false"><rect className="ggds-banner__flag-red" width="30" height="6.67" /><rect className="ggds-banner__flag-gold" y="6.67" width="30" height="6.67" /><rect className="ggds-banner__flag-green" y="13.33" width="30" height="6.67" /><polygon className="ggds-banner__flag-star" points="15,6.8 15.73,8.99 18.04,9.01 16.19,10.39 16.88,12.59 15,11.25 13.12,12.59 13.81,10.39 11.96,9.01 14.27,8.99" /></svg>
          <span className="ggds-banner__text">{official ? t(s, 'banner.official') : t(s, 'banner.unofficial', { shortName })}</span>
          {' '}<span className="ggds-banner__toggle">{t(s, 'banner.howToTell')}</span>
        </summary>
        <div className="ggds-banner__content">
          <div className="ggds-banner__item">
            <p className="ggds-banner__heading">{t(s, 'banner.checkAddress')}</p>
            <p>
              {address}{' '}{fill(s, 'banner.domain', { domain: <strong>.gov.gh</strong> })}
              {register && <>{' '}{fill(s, 'banner.register', { register: <a href={register.href}>{register.label ?? t(s, 'banner.registerLabel')}</a> })}</>}
            </p>
          </div>
          <div className="ggds-banner__item">
            <p className="ggds-banner__heading">{t(s, 'banner.padlockHeading')}</p>
            <p>{fill(s, 'banner.padlock', { https: <strong>https://</strong> })}</p>
          </div>
          <div className="ggds-banner__item">
            <p className="ggds-banner__heading">{t(s, 'banner.pinHeading')}</p>
            <p>{t(s, 'banner.pin')}</p>
          </div>
        </div>
      </details>
    </section>
  );
}
