/** Joins class names, leaving out empty ones. */
export const cx = (...names: (string | false | null | undefined)[]): string => names.filter(Boolean).join(' ');

/** Ids for a field's hint and error, and the aria-describedby that names them. */
export function describedBy(id: string, hint?: unknown, error?: unknown, extra?: string): string | undefined {
  const ids = [extra, hint ? `${id}-hint` : '', error ? `${id}-error` : ''].filter(Boolean);
  return ids.length ? ids.join(' ') : undefined;
}
