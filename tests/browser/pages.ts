// Every page of the built site, relative to site/.
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const site = fileURLToPath(new URL('../../site/', import.meta.url));
const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? walk(join(dir, f)) : [join(dir, f)]));

// Every example site uses the same inner-page templates, so the inner pages of one agency (NCA) and the ministry
// (MoCDTI) stand for all twelve; the unit tests check every page's links and markup.
const SAMPLE = /^\/agencies\/(nca|mocdti)\//;
export const PAGES = walk(site).filter((f) => f.endsWith('.html')).map((f) => `/${relative(site, f)}`)
  .filter((p) => !/^\/agencies\/[a-z0-9-]+\//.test(p) || SAMPLE.test(p)).sort();

// The example sites are built from docs/example-sites.json. Without it the build skips them, and so do these tests.
export const EXAMPLE_SITES = existsSync(join(site, 'agencies'));
export const NO_EXAMPLE_SITES = 'example sites not built: no docs/example-sites.json';
