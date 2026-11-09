// Runs before `pnpm pack` and `pnpm publish` in each package (its "prepack" script): copies the repository's
// LICENSE (Apache-2.0) and LICENSE.md (what the licence does not cover: the flag, the coat of arms and
// institutions' logos) into the package, so every npm package carries both. The copies are git-ignored.
import { copyFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('../', import.meta.url);
for (const f of ['LICENSE', 'LICENSE.md']) copyFileSync(new URL(f, root), join(process.cwd(), f));
