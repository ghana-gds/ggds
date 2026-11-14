'use client';
import { useEffect, useRef, useState, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { cx, describedBy, t, type StringsProp } from './util.js';

export interface CharacterCountProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id' | 'maxLength'> {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  /** The most characters the answer may have. Not set as maxlength: the count shows it and your server checks it. */
  max: number;
  strings?: StringsProp;
}

/** How long after the last key press screen readers hear the count. */
const PAUSE_MS = 1000;

/**
 * A textarea with a character limit. Before the page's JavaScript runs (and without it) the limit is a hint, as in the
 * HTML; then a count updates as people type, and screen readers hear it when they pause.
 */
export function CharacterCount({ id, label, hint, error, max, strings, className, rows = 5, value, defaultValue, onChange, ...textarea }: CharacterCountProps) {
  const [enhanced, setEnhanced] = useState(false);
  const [length, setLength] = useState(String(value ?? defaultValue ?? '').length);
  const [announced, setAnnounced] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => setEnhanced(true), []);
  useEffect(() => { if (value !== undefined) setLength(String(value).length); }, [value]);

  const left = max - length;
  const n = Math.abs(left);
  const words = left >= 0 ? (n === 1 ? t(strings, 'characterCount.remainingOne') : t(strings, 'characterCount.remainingOther', { count: n }))
    : (n === 1 ? t(strings, 'characterCount.overOne') : t(strings, 'characterCount.overOther', { count: n }));
  useEffect(() => {
    if (!enhanced) return undefined;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setAnnounced(words), PAUSE_MS);
    return () => clearTimeout(timer.current);
  }, [words, enhanced]);

  return (
    <div className={cx('ggds-field', error ? 'ggds-field--error' : undefined, 'ggds-character-count')} data-ggds-max={max}>
      <label className="ggds-label" htmlFor={id}>{label}</label>
      {hint && <p className="ggds-hint" id={`${id}-hint`}>{hint}</p>}
      {error && <p className="ggds-error-message" id={`${id}-error`}><span className="ggds-visually-hidden">{t(strings, 'field.errorPrefix').trimEnd()}</span> {error}</p>}
      <textarea
        className={cx('ggds-textarea', enhanced && left < 0 && 'ggds-character-count__textarea--over', className)}
        id={id}
        rows={rows}
        {...textarea}
        aria-describedby={[describedBy(id, hint, error, textarea['aria-describedby']), `${id}-info`].filter(Boolean).join(' ')}
        aria-invalid={error ? true : undefined}
        value={value}
        defaultValue={defaultValue}
        onChange={(event) => { setLength(event.target.value.length); onChange?.(event); }}
      />
      <p className={cx('ggds-hint ggds-character-count__message', enhanced && 'ggds-visually-hidden')} id={`${id}-info`}>{t(strings, 'characterCount.limit', { max })}</p>
      {enhanced && <>
        <p className={cx('ggds-hint ggds-character-count__message ggds-character-count__status', left < 0 && 'ggds-character-count__status--over')} aria-hidden="true">{words}</p>
        <p className="ggds-visually-hidden" aria-live="polite">{announced}</p>
      </>}
    </div>
  );
}
