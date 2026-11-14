import Reveal from './Reveal';
import { Eyebrow } from './ui';
import { BRAND } from '@/lib/content';

/** "What's in a name?" Explains Adyssey like a dictionary entry: Aditya + odyssey. */
export default function AdysseyMeaning() {
  return (
    <section id="adyssey" aria-labelledby="adyssey-title" className="relative overflow-hidden px-[clamp(16px,4vw,64px)] py-[clamp(72px,10vw,128px)]">
      {/* warm aura behind the word */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-1/4 left-[-10%] h-[90%] w-[70%] opacity-60 blur-3xl"
        style={{ background: 'radial-gradient(closest-side, color-mix(in srgb, var(--aura-violet) 28%, transparent), transparent), radial-gradient(closest-side at 70% 70%, color-mix(in srgb, var(--aura-orange) 18%, transparent), transparent)' }}
      />

      <div className="relative mx-auto grid max-w-[1240px] grid-cols-1 items-center gap-12 md:grid-cols-[1fr_1fr] md:gap-16">
        <Reveal>
          <Eyebrow>What&apos;s in a name?</Eyebrow>
          <h2 id="adyssey-title" className="mt-5 pb-[0.2em] font-serif text-[clamp(84px,13vw,184px)] leading-[0.95] font-normal tracking-[-0.012em] italic">
            {BRAND.name}
          </h2>
          <p className="mt-4 font-mono text-[13px] tracking-[0.06em] text-soft">
            {BRAND.phonetic} <span className="mx-2 opacity-50">·</span> <span className="italic">noun</span>
          </p>

          {/* the equation, as stickers */}
          <div className="mt-8 flex flex-wrap items-center gap-3 text-[15px] font-medium">
            <span className="-rotate-3 rounded-full border border-line bg-card px-4 py-2 shadow-[3px_3px_0_0_var(--aura-violet)]">Aditya</span>
            <span aria-hidden="true" className="text-xl text-soft">+</span>
            <span className="rotate-2 rounded-full border border-line bg-card px-4 py-2 shadow-[3px_3px_0_0_var(--aura-pink)]">Odyssey</span>
            <span aria-hidden="true" className="text-xl text-soft">=</span>
            <span className="-rotate-1 rounded-full bg-fg px-4 py-2 font-serif text-[19px] text-bg italic shadow-[3px_3px_0_0_var(--rec)]">Adyssey</span>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <ol className="m-0 grid list-none gap-6 border-l border-line p-0 pl-7">
            {BRAND.senses.map((sense, i) => (
              <li key={sense} className="grid grid-cols-[28px_minmax(0,1fr)] gap-2">
                <span className="font-mono text-xs text-rec">{i + 1}.</span>
                <p className={`m-0 leading-snug ${i === 1 ? 'text-[clamp(22px,2.4vw,32px)] font-semibold tracking-[-0.02em]' : 'text-[clamp(16px,1.4vw,19px)] text-soft'}`}>{sense}</p>
              </li>
            ))}
          </ol>
          <p className="mt-10 font-serif text-[clamp(26px,3vw,40px)] leading-tight italic">“{BRAND.signoff}”</p>
        </Reveal>
      </div>
    </section>
  );
}
