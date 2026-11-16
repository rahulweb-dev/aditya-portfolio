/* eslint-disable @next/next/no-img-element -- small SVG icons */
import type { SkillKey } from '@/lib/content';

/**
 * The four craft symbols, cut from the logo: pen nib (design), shutter (photo), timeline (video), circuit (AI).
 * `auto` follows day and night; `night` is for dark sections in both modes.
 */
export default function RoleIcon({ craft, size = 32, tone = 'auto', className = '' }: { craft: SkillKey; size?: number; tone?: 'auto' | 'night'; className?: string }) {
  const src = (t: 'day' | 'night') => `/icons/icon-${craft}-${t}.svg`;
  if (tone === 'night') return <img src={src('night')} alt="" width={size} height={size} className={`shrink-0 ${className}`} />;
  return (
    <span className={`inline-block shrink-0 ${className}`} style={{ width: size, height: size }}>
      <img src={src('day')} alt="" width={size} height={size} className="block size-full dark:hidden" />
      <img src={src('night')} alt="" width={size} height={size} className="hidden size-full dark:block" />
    </span>
  );
}
