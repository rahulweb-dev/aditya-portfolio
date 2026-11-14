import { ROOMS } from '@/lib/content';

/** A slow, endless ticker of the skills: sans caps alternating with italic serif. */
export default function Marquee() {
  const words = [...ROOMS.map(r => r.nav), 'Adyssey'];
  const row = (hidden: boolean) => (
    <div aria-hidden={hidden} className="flex shrink-0 items-center gap-10 pr-10">
      {words.map((w, i) => (
        <span key={w} className="flex items-center gap-10 whitespace-nowrap">
          <span className={i % 2 ? 'serif-accent text-[clamp(40px,6vw,84px)]' : 'text-[clamp(32px,4.6vw,64px)] font-semibold tracking-[-0.03em] uppercase'}>{w}</span>
          <span aria-hidden="true" className="text-[clamp(20px,2.4vw,32px)] text-rec">✶</span>
        </span>
      ))}
    </div>
  );
  return (
    <div className="marquee overflow-hidden border-y border-line py-6">
      <div className="marquee-track flex w-max">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}
