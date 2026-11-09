// Unconfirmed contact details stay out of the example sites and out of this repository: no agency has confirmed
// its phone numbers, email addresses or reporting channels yet. Used by the example-site build (docs/agencies.mjs)
// and the scene sync (scripts/sync-scenes.mjs). Set GGDS_EXAMPLE_UNVERIFIED=1 to keep them, for agency reviews only.

export const UNVERIFIED = process.env.GGDS_EXAMPLE_UNVERIFIED === '1';
const HIDDEN = 'to be confirmed';
const escHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Email addresses and full phone numbers in text (short codes such as 292 stay). */
export function maskText(text) {
  if (UNVERIFIED) return String(text ?? '');
  return String(text ?? '')
    .replace(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, HIDDEN)
    .replace(/(\+?\d[\d ()-]{6,}\d)/g, (m) => (m.replace(/\D/g, '').length >= 7 ? HIDDEN : m));
}

/**
 * Contact channels in a drawing's markup: each channel the agency's settings list (phone, email, SMS, WhatsApp,
 * web form: { value, href }) is hidden from the text, and its link points at the contact page instead. Only
 * visible text changes, never attributes: SVG coordinates are numbers too.
 */
export function hideContacts(html, settings) {
  if (UNVERIFIED || !html) return html;
  const channels = [];
  const walk = (o) => {
    if (Array.isArray(o)) o.forEach(walk);
    else if (o && typeof o === 'object') {
      if (typeof o.value === 'string' && /^(tel:|mailto:|sms:|https?:)/.test(o.href ?? '')) channels.push(o.value);
      Object.values(o).forEach(walk);
    }
  };
  walk(settings);
  const text = (t) => maskText(channels.reduce((s, v) => s.split(escHtml(v)).join(HIDDEN).split(v).join(HIDDEN), t));
  return html
    .replace(/>([^<]+)</g, (m, t) => `>${text(t)}<`)
    .replace(/\shref="(?:tel:|mailto:|sms:|https?:)[^"]*"/g, ' href="/about/contact/"');
}
