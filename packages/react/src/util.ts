import { createElement, Fragment, type ReactNode } from 'react';
import { STRINGS, type GGDSStringKey, type GGDSStrings } from './strings.js';

/** A component's strings prop: GGDS's own text in another language (stringsFor('tw')) or other words, by key. */
export type StringsProp = Partial<GGDSStrings>;

/** GGDS's text for key: from strings if given, otherwise the English, with each {name} filled in. */
export function t(strings: StringsProp | undefined, key: GGDSStringKey, values: Record<string, string | number> = {}): string {
  return (strings?.[key] ?? STRINGS[key]).replace(/\{(\w+)\}/g, (m, k: string) => (k in values ? String(values[k]) : m));
}

/** GGDS's text for key with each {name} replaced by a React node, such as a link or <strong>. */
export function fill(strings: StringsProp | undefined, key: GGDSStringKey, parts: Record<string, ReactNode>): ReactNode {
  const pieces = (strings?.[key] ?? STRINGS[key]).split(/\{(\w+)\}/);
  return createElement(Fragment, null, ...pieces.map((p, i) => (i % 2 ? (p in parts ? parts[p] : `{${p}}`) : p)));
}

/** Joins class names, leaving out empty ones. */
export const cx = (...names: (string | false | null | undefined)[]): string => names.filter(Boolean).join(' ');

/** Ids for a field's hint and error, and the aria-describedby that names them. */
export function describedBy(id: string, hint?: unknown, error?: unknown, extra?: string): string | undefined {
  const ids = [extra, hint ? `${id}-hint` : '', error ? `${id}-error` : ''].filter(Boolean);
  return ids.length ? ids.join(' ') : undefined;
}

/** The page's <title> while a form has errors: "Error: Apply for a licence", in the page's language. */
export function errorTitle(title: string, hasErrors: boolean, strings?: StringsProp): string {
  return hasErrors ? t(strings, 'page.errorTitle', { title }) : title;
}
