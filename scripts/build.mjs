// Builds everything (pnpm run build), each step as soon as the steps it reads from are done, so independent steps
// run at the same time. The commands are package.json's build:<step> scripts, run directly (no pnpm start-up per
// step); change a step there, and its inputs here. Stops at the first failure, with that step's output.
//
//   pnpm run build                 every step
//   pnpm run build -- css docs     those steps and the steps they need
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { delimiter, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const { scripts } = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));

// What each step reads from other steps' output (see each build script).
export const NEEDS = {
  strings: [], // writes GGDS's own text into react/src, astro/src and the Django app
  tokens: [],
  icons: [],
  themes: [],
  js: [],
  css: ['tokens'], // tokens/dist/tokens.css
  react: ['icons', 'strings'], // @ggds/icons types; src/strings.ts
  django: ['strings', 'tokens', 'icons', 'themes', 'js', 'css'], // copies their dist; strings.json and locale/
  wordpress: ['icons', 'themes', 'js', 'css'],
  create: ['icons', 'themes', 'js', 'css'], // copies their dist and the starter's code (docs/starter-bundle.mjs)
  docs: ['strings', 'tokens', 'icons', 'themes', 'js', 'css', 'react'], // copies their dist and the React demo
};

for (const s of Object.keys(NEEDS)) if (!scripts[`build:${s}`]) throw new Error(`package.json has no build:${s} script`);

/** The asked-for steps and everything they need. */
function closure(asked) {
  const out = new Set();
  const add = (s) => {
    if (!NEEDS[s]) throw new Error(`no build step "${s}"; the steps: ${Object.keys(NEEDS).join(', ')}`);
    if (out.has(s)) return;
    NEEDS[s].forEach(add);
    out.add(s);
  };
  asked.forEach(add);
  return out;
}

const env = { ...process.env, PATH: [join(root, 'node_modules', '.bin'), process.env.PATH].join(delimiter) };

function run(step) {
  return new Promise((resolve, reject) => {
    const started = performance.now();
    const child = spawn(scripts[`build:${step}`], { cwd: root, env, shell: true, stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '';
    child.stdout.on('data', (d) => { output += d; });
    child.stderr.on('data', (d) => { output += d; });
    child.on('error', reject);
    child.on('close', (code) => {
      const secs = ((performance.now() - started) / 1000).toFixed(1);
      if (code === 0) {
        process.stdout.write(output.split('\n').filter(Boolean).map((l) => `${l}\n`).join('') || `${step}: done\n`);
        resolve(secs);
      } else reject(Object.assign(new Error(`build:${step} failed (exit ${code}) after ${secs}s`), { output }));
    });
  });
}

const asked = process.argv.slice(2).filter((a) => a !== '--');
const steps = closure(asked.length ? asked : Object.keys(NEEDS));
const started = performance.now();
const done = new Map(); // step → promise
const timings = {};
const start = (s) => {
  if (!done.has(s)) {
    done.set(s, Promise.all(NEEDS[s].filter((n) => steps.has(n)).map(start)).then(() => run(s)).then((t) => { timings[s] = t; }));
  }
  return done.get(s);
};

try {
  await Promise.all([...steps].map(start));
  const total = ((performance.now() - started) / 1000).toFixed(1);
  console.log(`build: ${steps.size} steps in ${total}s (${Object.entries(timings).map(([s, t]) => `${s} ${t}s`).join(', ')})`);
} catch (e) {
  if (e.output) process.stderr.write(e.output);
  console.error(`build: ${e.message}`);
  process.exit(1);
}
