// HTML → JSX, for the documentation's "JSX (React)" code: the same markup GGDS tests, written so it pastes into a
// React component as it is. Only what JSX needs changes: attribute names, self-closing void elements, comments,
// form values that React would otherwise freeze, braces in text, and a fragment around several top-level elements.

const RENAME = {
  class: 'className', for: 'htmlFor', tabindex: 'tabIndex', autocomplete: 'autoComplete', novalidate: 'noValidate',
  spellcheck: 'spellCheck', inputmode: 'inputMode', enterkeyhint: 'enterKeyHint', minlength: 'minLength',
  maxlength: 'maxLength', readonly: 'readOnly', colspan: 'colSpan', rowspan: 'rowSpan', srcset: 'srcSet',
  crossorigin: 'crossOrigin', datetime: 'dateTime', 'http-equiv': 'httpEquiv', 'accept-charset': 'acceptCharset',
  autofocus: 'autoFocus', formaction: 'formAction', formnovalidate: 'formNoValidate', 'xlink:href': 'xlinkHref',
  'stroke-width': 'strokeWidth', 'stroke-linecap': 'strokeLinecap', 'stroke-linejoin': 'strokeLinejoin',
  'stroke-dasharray': 'strokeDasharray', 'fill-rule': 'fillRule', 'clip-rule': 'clipRule', 'clip-path': 'clipPath',
  'stop-color': 'stopColor', 'font-size': 'fontSize', 'text-anchor': 'textAnchor', 'xml:lang': 'xmlLang',
};
const NUMERIC = new Set(['tabIndex', 'minLength', 'maxLength', 'colSpan', 'rowSpan', 'rows', 'cols', 'size']);
const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);

/** Can this HTML become a JSX snippet? Not a whole document, and not a template with {% %} or {{ }}. */
export const convertible = (html) => !/<!doctype|<html\b|<head\b|<body\b|\{%|\{\{/i.test(html)
  // and not tags that load files (React apps import CSS and scripts instead), nor HTML mixed with CSS or commands
  && !/<(?:link|script|meta|style)\b/i.test(html)
  && !/(?:^|\n)\s*(?:\/\*|@import|@layer|npm |pnpm |import |[.#][\w-]+\s*\{)/.test(html);

function attrs(tag, raw) {
  const out = [];
  for (const [, name, , dq, sq, bare] of raw.matchAll(/([^\s=/>]+)(\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) {
    const value = dq ?? sq ?? bare;
    let key = RENAME[name.toLowerCase()] ?? name;
    // React freezes an input given value or checked without an onChange: start the form with them instead.
    if (['input', 'textarea', 'select'].includes(tag) && key === 'value' && !/^(?:radio|checkbox|submit|button|hidden)$/i.test(raw.match(/type="([^"]*)"/)?.[1] ?? '')) key = 'defaultValue';
    if (key === 'checked') key = 'defaultChecked';
    if (key === 'selected') key = 'defaultSelected';
    if (value === undefined) out.push(key);
    else if (NUMERIC.has(key) && /^-?\d+$/.test(value)) out.push(`${key}={${value}}`);
    else out.push(`${key}="${value.replace(/\{/g, '&#123;').replace(/\}/g, '&#125;')}"`);
  }
  return out.length ? ` ${out.join(' ')}` : '';
}

/** The JSX for a piece of GGDS HTML. */
export function toJsx(html) {
  let jsx = html.trim()
    .replace(/<!--([\s\S]*?)-->/g, (_, c) => `{/*${c.replace(/\*\//g, '* /')}*/}`)
    .replace(/<([a-zA-Z][\w:-]*)((?:\s+[^\s=/>]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*)\s*(\/?)>/g, (_, tag, raw, slash) => {
      const t = tag.toLowerCase();
      return `<${tag}${attrs(t, raw)}${slash || VOID.has(t) ? ' />' : '>'}`;
    });
  // Braces in text are JSX expressions: write them as text.
  jsx = jsx.replace(/>([^<]*)</g, (m, text) => `>${text.split(/(\{\/\*[\s\S]*?\*\/\})/).map((part, i) => (i % 2 ? part : part.replace(/[{}]/g, (c) => `{'${c}'}`))).join('')}<`);
  // Several top-level elements: wrap them in a fragment.
  let depth = 0;
  let roots = 0;
  for (const [, close, , selfClose] of jsx.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').matchAll(/<(\/?)([a-zA-Z][\w:-]*)[^>]*?(\/?)>/g)) {
    if (close) depth--;
    else { if (depth === 0) roots++; if (!selfClose) depth++; }
  }
  return roots > 1 ? `<>\n${jsx.replace(/^/gm, '  ')}\n</>` : jsx;
}
