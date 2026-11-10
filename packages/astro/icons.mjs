// GGDS icons for the Astro components and the documentation site. The drawings live in @ggds/icons
// (packages/icons/src): edit them there. Kept here so `@ggds/astro/icons.mjs` goes on working.
export { ICONS, NAMES } from '@ggds/icons/all';
import { icon as named } from '@ggds/icons/all';

/** An icon by name, as SVG markup hidden from screen readers. cls: its class. An unknown name throws. */
export const icon = (name, cls) => named(name, cls);
