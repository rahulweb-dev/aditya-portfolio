/* eslint-disable @next/next/no-img-element -- the wordmark is an SVG logo file */
import Reveal from './Reveal';
import { Eyebrow } from './ui';
import { getContent } from '@/lib/cms/content';

/** "01 — What's in a name?" Explains Adyssey like a dictionary entry. The heading is the wordmark file, never typed. */
export default async function AdysseyMeaning() {
  const BRAND = (await getContent()).brand;
  return (
    <section id="adyssey" aria-labelledby="adyssey-title" className="px-[clamp(24px,4vw,48px)] py-[clamp(64px,8vw,96px)]">
      <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-16">
        <Reveal>
          <Eyebrow>01 — What&apos;s in a name?</Eyebrow>
          <h2 id="adyssey-title" className="mt-6 mb-0">
            <span className="sr-only">{BRAND.name}</span>
            <img src="/logo/adyssey-wordmark-day.svg" alt="" width={420} height={172} className="block h-auto w-[280px] md:w-[420px] dark:hidden" />
            <img src="/logo/adyssey-wordmark-night.svg" alt="" width={420} height={172} className="hidden h-auto w-[280px] md:w-[420px] dark:block" />
          </h2>
          <p className="micro-caps mt-6 text-soft">
            {BRAND.phonetic} <span className="mx-2">·</span> <span className="normal-case italic">noun</span>
          </p>

          {/* the equation */}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <span className="label-caps rounded-full border border-line-strong px-4 py-2.5">Aditya</span>
            <span aria-hidden="true" className="text-xl text-soft">+</span>
            <span className="label-caps rounded-full border border-line-strong px-4 py-2.5">Odyssey</span>
            <span aria-hidden="true" className="text-xl text-soft">=</span>
            {/* the name as the wordmark file on an ink (day) or cream (night) pill */}
            <span className="inline-flex rounded-full bg-action px-4 py-2">
              <img src="/logo/adyssey-wordmark-night.svg" alt="Adyssey" width={96} height={39} className="block h-auto w-24 dark:hidden" />
              <img src="/logo/adyssey-wordmark-day.svg" alt="Adyssey" width={96} height={39} className="hidden h-auto w-24 dark:block" />
            </span>
          </div>
        </Reveal>

        <Reveal delay={80}>
          <ol className="m-0 grid list-none gap-6 border-l border-line p-0 pl-7">
            {BRAND.senses.map((sense, i) => (
              <li key={sense} className="grid grid-cols-[28px_minmax(0,1fr)] gap-2">
                <span className="label-caps pt-1.5 text-rec">{i + 1}.</span>
                <p className={`m-0 ${i === 1 ? 'font-display text-[clamp(24px,2.4vw,32px)] leading-[1.2] font-medium' : 'text-[17px] leading-[30px] text-soft'}`}>{sense}</p>
              </li>
            ))}
          </ol>
          <p className="mt-10 font-display text-[clamp(26px,3vw,38px)] leading-tight">
            “<span className="serif-accent">{BRAND.signoff}</span>”
          </p>
        </Reveal>
      </div>
    </section>
  );
}
