'use client';
import { useEffect, useRef, useState, type InputHTMLAttributes, type ReactNode } from 'react';
import { cx, describedBy, t, type StringsProp } from './util.js';

export interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'type'> {
  id: string;
  /** Usually "Password", or "Create a password". */
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  /** "current-password" to sign in (default), "new-password" to create one. */
  autoComplete?: 'current-password' | 'new-password';
  strings?: StringsProp;
}

/**
 * A password field with a Show button. The button appears once the page's JavaScript runs; it switches the field
 * between hidden and visible and tells screen readers which it is. The password is hidden again when its form is
 * sent, so the browser never keeps it as text.
 */
export function PasswordInput({ id, label, hint, error, strings, className, autoComplete = 'current-password', ...input }: PasswordInputProps) {
  const [enhanced, setEnhanced] = useState(false);
  const [visible, setVisible] = useState(false);
  const [said, setSaid] = useState('');
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    setEnhanced(true);
    const hide = (event: Event) => {
      if (event.target instanceof HTMLFormElement && ref.current && event.target.contains(ref.current)) {
        ref.current.type = 'password';
        setVisible(false);
      }
    };
    // And when people come back to the page with the back button.
    const onShow = () => { if (ref.current) ref.current.type = 'password'; setVisible(false); };
    document.addEventListener('submit', hide, true);
    window.addEventListener('pageshow', onShow);
    return () => {
      document.removeEventListener('submit', hide, true);
      window.removeEventListener('pageshow', onShow);
    };
  }, []);
  const toggle = () => {
    const next = !visible;
    setVisible(next);
    setSaid(t(strings, next ? 'passwordInput.shown' : 'passwordInput.hidden'));
  };
  return (
    <div className={cx('ggds-field', error ? 'ggds-field--error' : undefined, 'ggds-password-input')}>
      <label className="ggds-label" htmlFor={id}>{label}</label>
      {hint && <p className="ggds-hint" id={`${id}-hint`}>{hint}</p>}
      {error && <p className="ggds-error-message" id={`${id}-error`}><span className="ggds-visually-hidden">{t(strings, 'field.errorPrefix').trimEnd()}</span> {error}</p>}
      <div className="ggds-password-input__wrapper">
        <input ref={ref} className={cx('ggds-input ggds-password-input__input', className)} id={id} type={visible ? 'text' : 'password'}
          autoComplete={autoComplete} spellCheck={false} autoCapitalize="none"
          {...input} aria-describedby={describedBy(id, hint, error, input['aria-describedby'])} aria-invalid={error ? true : undefined} />
        <button className="ggds-button ggds-button--secondary ggds-password-input__toggle" type="button" aria-controls={id}
          aria-label={t(strings, visible ? 'passwordInput.hideLabel' : 'passwordInput.showLabel')} hidden={!enhanced} onClick={toggle}>
          {t(strings, visible ? 'passwordInput.hide' : 'passwordInput.show')}
        </button>
      </div>
      {enhanced && <p className="ggds-visually-hidden" aria-live="polite">{said}</p>}
    </div>
  );
}
