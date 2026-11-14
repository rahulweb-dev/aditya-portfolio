/* eslint-disable @next/next/no-img-element -- SVG logos don't need Next's image resizing */

// Adyssey logo from the brand kit. Per the guide: the light (Pearl) version on dark backgrounds,
// the dark (Ink) version on light backgrounds, and never smaller than the minimum widths below.
const LOGOS = {
  horizontal: { file: 'adyssey-logo-horizontal', w: 640, h: 241, min: 160 },
  stacked: { file: 'adyssey-logo-stacked', w: 512, h: 587, min: 120 },
  mark: { file: 'adyssey-mark', w: 256, h: 205, min: 48 },
};

export default function Logo({ variant = 'horizontal', width, className = '' }: { variant?: keyof typeof LOGOS; width: number; className?: string }) {
  const logo = LOGOS[variant];
  const w = Math.max(width, logo.min);
  const h = Math.round((w * logo.h) / logo.w);
  return (
    <span className={`inline-block shrink-0 ${className}`} style={{ width: w, height: h }}>
      <img src={`/brand/${logo.file}-dark.svg`} alt="Adyssey" width={w} height={h} className="block size-full dark:hidden" />
      <img src={`/brand/${logo.file}-light.svg`} alt="Adyssey" width={w} height={h} className="hidden size-full dark:block" />
    </span>
  );
}
