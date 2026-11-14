'use client';
import { useEffect, useRef, type ReactNode } from 'react';
import { cx, t, type StringsProp } from './util.js';

export interface DialogProps {
  id: string;
  /** Show it as a modal. The browser keeps focus inside it and closes it with Escape. */
  open: boolean;
  /** Called when it closes: Escape, a close button, or the form inside it. Set open to false. */
  onClose: () => void;
  /** A question: "Delete this draft?" */
  title: ReactNode;
  /** What will happen. */
  children: ReactNode;
  /** The action's button, such as <Button variant="warning" type="submit">Delete draft</Button>. Cancel comes first. */
  actions: ReactNode;
  /** The Cancel button's words. Default: GGDS's, in the page's language. */
  cancel?: ReactNode;
  strings?: StringsProp;
  /** Put the buttons in a form that posts here, so the server does the action. */
  action?: string;
  /** For an action that cannot be undone. */
  warning?: boolean;
}

/**
 * A box over the page to confirm something before it happens. For confirmations only: anything people need to read
 * or fill in belongs on a page. Open it from a link to a confirmation page, so it works before the page's JavaScript.
 */
export function Dialog({ id, open, onClose, title, children, actions, action, warning, cancel, strings }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      dialog.querySelector<HTMLElement>('button, [href], input, select, textarea')?.focus();
    } else if (!open && dialog.open) dialog.close();
  }, [open]);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return undefined;
    dialog.addEventListener('close', onClose);
    return () => dialog.removeEventListener('close', onClose);
  }, [onClose]);
  // The safe choice first, so it gets focus.
  const buttons = <>
    <button className="ggds-button ggds-button--secondary" type="button" onClick={() => ref.current?.close()}>{cancel ?? t(strings, 'dialog.cancel')}</button>
    {actions}
  </>;
  return (
    <dialog ref={ref} className={cx('ggds-dialog', warning && 'ggds-dialog--warning')} id={id} aria-labelledby={`${id}-title`}>
      <h2 className="ggds-dialog__title" id={`${id}-title`}>{title}</h2>
      <div className="ggds-dialog__body">{children}</div>
      {action ? <form className="ggds-dialog__actions" action={action} method="post">{buttons}</form>
        : <div className="ggds-dialog__actions">{buttons}</div>}
    </dialog>
  );
}
