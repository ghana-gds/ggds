// The starter's code as one folder of browser-ready modules, for the website builder (site/assets/builder/) and
// for `npx @ggds/create` (packages/create/lib/). The same files make the website everywhere: docs/starter.mjs and
// what it imports, with their imports pointed at each other in the folder. Node only (the build uses it).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));

// [file in the folder, source, [import as written, import in the folder]]
// Every file is .js in the folder: web servers that do not know .mjs send it with a type browsers refuse to run.
const MODULES = [
  ['starter.js', 'docs/starter.mjs', [['./parts.mjs', './parts.js'], ['../packages/tokens/institution.mjs', './institution.js'], ['./starter-hosting.mjs', './starter-hosting.js'], ['./starter-site.mjs', './starter-site.js'], ['./starter-stacks.mjs', './starter-stacks.js'], ['./starter-wordpress.mjs', './starter-wordpress.js'], ['./starter-kinds.mjs', './starter-kinds.js']]],
  ['starter-wordpress.js', 'docs/starter-wordpress.mjs', [['./parts.mjs', './parts.js'], ['./starter-site.mjs', './starter-site.js']]],
  ['starter-stacks.js', 'docs/starter-stacks.mjs', [['./parts.mjs', './parts.js'], ['./jsx.mjs', './jsx.js']]],
  ['jsx.js', 'docs/jsx.mjs', []],
  ['starter-site.js', 'docs/starter-site.mjs', [['./starter-kinds.mjs', './starter-kinds.js']]],
  ['starter-kinds.js', 'docs/starter-kinds.mjs', []],
  ['starter-hosting.js', 'docs/starter-hosting.mjs', []],
  ['parts.js', 'docs/parts.mjs', [['../packages/astro/icons.mjs', './icons.js']]],
  ['icons.js', 'packages/astro/icons.mjs', [['@ggds/icons/all', './icons/all.js']]],
  ['icons/all.js', 'packages/icons/dist/all.js', []],
  ['icons/index.js', 'packages/icons/dist/index.js', []],
  ['institution.js', 'packages/tokens/institution.mjs', [['./color.mjs', './color.js']]],
  ['color.js', 'packages/tokens/color.mjs', []],
  ['zip.js', 'docs/zip.mjs', []],
];

/** { 'file in the folder': source text }. Throws if an import it should rewrite is not there, or one is left. */
export function starterModules() {
  const out = {};
  for (const [file, source, rewrites] of MODULES) {
    let text = readFileSync(join(root, source), 'utf8');
    for (const [from, to] of rewrites) {
      const quoted = new RegExp(`(from\\s+|import\\s*\\(\\s*)(['"])${from.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}\\2`, 'g');
      if (!quoted.test(text)) throw new Error(`starter-bundle: ${source} no longer imports ${from}`);
      text = text.replace(quoted, `$1$2${to}$2`);
    }
    // The module's own imports: statements at the start of a line (not code inside the strings it writes out).
    for (const [, spec] of text.matchAll(/^(?:import|export)\s[^`\n]*?from\s+['"]([^'"]+)['"]/gm)) {
      if (!spec.startsWith('./') || spec.endsWith('.mjs')) throw new Error(`starter-bundle: ${source} imports ${spec}, which the folder does not have`);
    }
    out[file] = text;
  }
  return out;
}
