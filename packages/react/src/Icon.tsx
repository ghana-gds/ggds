import { ICONS, type IconName } from '@ggds/icons/all';

export type { IconName };

export interface IconProps {
  /** The name of any @ggds/icons icon, such as "download". */
  name: IconName;
  /** Default: "ggds-icon" (sized by @ggds/css). */
  className?: string;
  /** Only for an icon with no words beside it: what it means, read out by screen readers. */
  label?: string;
}

/** A GGDS icon. Hidden from screen readers unless it has a label: put words beside every icon. */
export function Icon({ name, className = 'ggds-icon', label }: IconProps) {
  const body = ICONS[name];
  if (body === undefined) throw new Error(`@ggds/react: there is no icon called "${String(name)}"`);
  const a11y = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true as const, focusable: 'false' as const };
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...a11y}
      dangerouslySetInnerHTML={{ __html: body }} />
  );
}
