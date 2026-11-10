// Copies what the example sites need from the MoCDTI platform into docs/example-sites.json, cleaned for publishing:
// names, colours, sections, common tasks and descriptions only, never logos, contact details or web addresses (see
// cleanForPublishing in docs/agencies.mjs). The documentation build reads this copy, so the example sites build
// without the platform, on GitHub too. Run it after an agency's settings change on the platform:
//
//   pnpm run sync:examples          (needs the platform at GGDS_PLATFORM_DIR, default ../agencies/platform)
//   pnpm run sync:examples --check  (fails if the copy is out of date)
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { SNAPSHOT, cleanForPublishing, platformDir, readPlatform } from '../docs/agencies.mjs';

if (process.env.GGDS_EXAMPLE_UNVERIFIED === '1') throw new Error('Unset GGDS_EXAMPLE_UNVERIFIED: the copy must never hold unconfirmed details.');
const root = fileURLToPath(new URL('../', import.meta.url));
const platform = await readPlatform(platformDir(root));
if (!platform) throw new Error(`No platform at ${platformDir(root)}: set GGDS_PLATFORM_DIR.`);
const next = `${JSON.stringify(cleanForPublishing(platform), null, 2)}\n`;
if (process.argv.includes('--check')) {
  if (readFileSync(SNAPSHOT, 'utf8') !== next) { console.error('docs/example-sites.json is out of date: run pnpm run sync:examples'); process.exit(1); }
  console.log('docs/example-sites.json matches the platform');
} else {
  writeFileSync(SNAPSHOT, next);
  console.log(`docs/example-sites.json: ${platform.agencies.length} example sites`);
}
