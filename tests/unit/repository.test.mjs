// What this repository may not contain: agencies' unconfirmed contact details in the drawings copied from the
// platform (docs/scenes/, written by pnpm run sync:scenes, which hides them; see docs/contacts.mjs).
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { test } from 'node:test';

const scenes = new URL('../../docs/scenes/', import.meta.url);

test('the saved platform drawings hold no unconfirmed contact details', { skip: !existsSync(scenes) }, () => {
  for (const f of readdirSync(scenes).filter((f) => f.endsWith('.html'))) {
    const html = readFileSync(new URL(f, scenes), 'utf8');
    assert.doesNotMatch(html, /href="(?:tel:|mailto:|sms:)|wa\.me\//, `${f}: contact links`);
    const text = html.replace(/<[^>]+>/g, ' ');
    assert.doesNotMatch(text, /[\w.+-]+@[\w-]+\.[\w.]+/, `${f}: email addresses`);
    assert.doesNotMatch(text, /\+?\d[\d ()-]{7,}\d/, `${f}: phone numbers`);
  }
});
