/* eslint-disable @next/next/no-img-element -- SVG logos don't need Next's image resizing */

// Adyssey logo from the Red Sun kit. Day files (ink + sun red) on light grounds, night files
// (cream + REC red) on dark grounds; `auto` follows day and night, `night` is for dark sections.
// Never smaller than the minimum widths below.
const LOGOS = {
  horizontal: { file: 'adyssey-logo-horizontal', w: 640, h: 241, min: 160 },
  stacked: { file: 'adyssey-logo-stacked', w: 512, h: 587, min: 120 },
  mark: { file: 'adyssey-mark', w: 256, h: 205, min: 48 },
  wordmark: { file: 'adyssey-wordmark', w: 640, h: 262, min: 160 },
};

export default function Logo({
  variant = 'horizontal',
  width,
  tone = 'auto',
  className = '',
}: {
  variant?: keyof typeof LOGOS;
  width: number;
  tone?: 'auto' | 'night';
  className?: string;
}) {
  const logo = LOGOS[variant];
  const w = Math.max(width, logo.min);
  const h = Math.round((w * logo.h) / logo.w);
  if (tone === 'night') return <img src={`/logo/${logo.file}-night.svg`} alt="Adyssey" width={w} height={h} className={`block shrink-0 ${className}`} />;
  return (
    <span className={`inline-block shrink-0 ${className}`} style={{ width: w, height: h }}>
      <img src={`/logo/${logo.file}-day.svg`} alt="Adyssey" width={w} height={h} className="block size-full dark:hidden" />
      <img src={`/logo/${logo.file}-night.svg`} alt="Adyssey" width={w} height={h} className="hidden size-full dark:block" />
    </span>
  );
}
