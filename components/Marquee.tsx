import { ROOMS } from '@/lib/content';

/** A slow, endless ticker of the crafts: Bodoni Moda alternating with its italic, red six-point stars between. */
export default function Marquee() {
  const words = ROOMS.map(r => r.nav);
  const row = (hidden: boolean) => (
    <div aria-hidden={hidden} className="flex shrink-0 items-center gap-12 pr-12">
      {words.map((w, i) => (
        <span key={w} className="flex items-center gap-12 whitespace-nowrap">
          <span className={`font-display text-[clamp(40px,5.6vw,76px)] leading-none ${i % 2 ? 'italic' : ''}`}>{w}</span>
          <span aria-hidden="true" className="text-[clamp(20px,2.4vw,32px)] leading-none text-rec">✶</span>
        </span>
      ))}
    </div>
  );
  return (
    <div className="marquee overflow-hidden border-y border-line py-7">
      <div className="marquee-track flex w-max">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}
