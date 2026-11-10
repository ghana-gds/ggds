import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cx, describedBy } from './util.js';

interface FieldBase {
  /** The input's id; the hint and error use it too (`<id>-hint`, `<id>-error`). */
  id: string;
  /** What to enter. Say it plainly: "Full name", not "Name of applicant". */
  label: ReactNode;
  /** Help that most people need, under the label. */
  hint?: ReactNode;
  /** What to do to fix the answer, such as "Enter your full name". Shows the field in its error state. */
  error?: ReactNode;
  /** The question is also the page's heading: the label goes in an <h1>. */
  labelIsPageHeading?: boolean;
}

/** The parts every field shares: the wrapper, label, hint and error message, in the GGDS order. */
function Field({ id, label, hint, error, labelIsPageHeading, children }: FieldBase & { children: ReactNode }) {
  const labelEl = <label className={cx('ggds-label', labelIsPageHeading && 'ggds-label--page')} htmlFor={id}>{label}</label>;
  return (
    <div className={cx('ggds-field', error ? 'ggds-field--error' : undefined)}>
      {labelIsPageHeading ? <h1>{labelEl}</h1> : labelEl}
      {hint && <p className="ggds-hint" id={`${id}-hint`}>{hint}</p>}
      {error && <p className="ggds-error-message" id={`${id}-error`}><span className="ggds-visually-hidden">Error:</span> {error}</p>}
      {children}
    </div>
  );
}

const WIDTH = { short: 'ggds-input--width-short', medium: 'ggds-input--width-medium', long: 'ggds-input--width-long' } as const;

export interface TextInputProps extends FieldBase, Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  /** Fit the box to the answer: short (a few characters), medium (a phone number), long (a name or email). */
  width?: keyof typeof WIDTH;
}

/** A text box with its label, hint and error message, wired up for screen readers. */
export function TextInput({ id, label, hint, error, labelIsPageHeading, width, className, type = 'text', ...input }: TextInputProps) {
  return (
    <Field id={id} label={label} hint={hint} error={error} labelIsPageHeading={labelIsPageHeading}>
      <input className={cx('ggds-input', width && WIDTH[width], className)} id={id} type={type}
        aria-invalid={error ? true : undefined} aria-describedby={describedBy(id, hint, error, input['aria-describedby'])} {...input} />
    </Field>
  );
}

export interface TextareaProps extends FieldBase, Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> {}

/** A box for a longer answer, with its label, hint and error message. */
export function Textarea({ id, label, hint, error, labelIsPageHeading, className, rows = 5, ...textarea }: TextareaProps) {
  return (
    <Field id={id} label={label} hint={hint} error={error} labelIsPageHeading={labelIsPageHeading}>
      <textarea className={cx('ggds-textarea', className)} id={id} rows={rows}
        aria-invalid={error ? true : undefined} aria-describedby={describedBy(id, hint, error, textarea['aria-describedby'])} {...textarea} />
    </Field>
  );
}

export interface SelectProps extends FieldBase, Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> {
  options: { value: string; label: string }[];
}

/** A list to choose one answer from, with its label, hint and error message. Prefer radios for up to 7 answers. */
export function Select({ id, label, hint, error, labelIsPageHeading, className, options, ...select }: SelectProps) {
  return (
    <Field id={id} label={label} hint={hint} error={error} labelIsPageHeading={labelIsPageHeading}>
      <select className={cx('ggds-select', className)} id={id}
        aria-invalid={error ? true : undefined} aria-describedby={describedBy(id, hint, error, select['aria-describedby'])} {...select}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </Field>
  );
}

export interface Choice {
  value: string;
  label: ReactNode;
  /** A short note under this choice. */
  hint?: ReactNode;
  /** Default: `<name>-<value>`. */
  id?: string;
}

export interface ChoicesProps {
  /** The inputs' name; each input's id is `<name>-<value>` unless the choice gives one. */
  name: string;
  /** The question. */
  legend: ReactNode;
  items: Choice[];
  hint?: ReactNode;
  /** What to do to fix the answer, such as "Select how we should reply". */
  error?: ReactNode;
  /** Side by side, for two short answers such as Yes and No. */
  inline?: boolean;
  /** The selected value(s), for a controlled form. */
  value?: string | string[];
  /** The value(s) selected at first, for an uncontrolled form. */
  defaultValue?: string | string[];
  onChange?: InputHTMLAttributes<HTMLInputElement>['onChange'];
  /** The question is also the page's heading. */
  legendIsPageHeading?: boolean;
}

function Choices({ type, name, legend, items, hint, error, inline, value, defaultValue, onChange, legendIsPageHeading }: ChoicesProps & { type: 'radio' | 'checkbox' }) {
  const has = (v: string | string[] | undefined, x: string) => (Array.isArray(v) ? v.includes(x) : v === x);
  const fid = name; // the fieldset's hint and error ids start with the name
  return (
    <div className={cx('ggds-field', error ? 'ggds-field--error' : undefined)}>
      <fieldset className="ggds-fieldset" aria-describedby={describedBy(fid, hint, error)}>
        <legend className={cx('ggds-fieldset__legend', legendIsPageHeading && 'ggds-fieldset__legend--page')}>{legendIsPageHeading ? <h1>{legend}</h1> : legend}</legend>
        {hint && <p className="ggds-hint" id={`${fid}-hint`}>{hint}</p>}
        {error && <p className="ggds-error-message" id={`${fid}-error`}><span className="ggds-visually-hidden">Error:</span> {error}</p>}
        <div className={cx('ggds-choices', inline && 'ggds-choices--inline')}>
          {items.map((c) => {
            const id = c.id ?? `${name}-${c.value}`;
            return (
              <div className="ggds-choice" key={c.value}>
                <input className="ggds-choice__input" id={id} name={name} type={type} value={c.value}
                  aria-describedby={c.hint ? `${id}-hint` : undefined}
                  {...(value !== undefined ? { checked: has(value, c.value), onChange } : { defaultChecked: has(defaultValue, c.value), onChange })} />
                <label className="ggds-choice__label" htmlFor={id}>{c.label}{c.hint && <> <span className="ggds-choice__hint" id={`${id}-hint`}>{c.hint}</span></>}</label>
              </div>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}

/** One answer from a short list. The error summary should link to the first radio: `#<name>-<first value>`. */
export function Radios(props: ChoicesProps) {
  return <Choices type="radio" {...props} />;
}

/** Any number of answers from a short list. */
export function Checkboxes(props: ChoicesProps) {
  return <Choices type="checkbox" {...props} />;
}
