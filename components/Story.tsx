'use client';

import { Fragment, useEffect, useRef, useState } from 'react';
import { useContent } from './ContentProvider';
import { Eyebrow } from './ui';

const pad = (n: number) => String(n).padStart(2, '0');

export default function Story() {
  const STORY = useContent().story;
  const [active, setActive] = useState(0);
  const [year, setYear] = useState(STORY[0].year);
  const yearRef = useRef(STORY[0].year);
  const items = useRef<(HTMLLIElement | null)[]>([]);

  // Highlight whichever entry crosses the middle of the screen.
  useEffect(() => {
    const io = new IntersectionObserver(
      entries => entries.forEach(e => e.isIntersecting && setActive(Number((e.target as HTMLElement).dataset.index))),
      { rootMargin: '-45% 0px -45% 0px' },
    );
    items.current.forEach(el => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  // Roll the big year to the active entry's year.
  useEffect(() => {
    const target = STORY[active].year;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      yearRef.current = target;
      setYear(target);
      return;
    }
    const from = yearRef.current;
    const start = performance.now();
    let frame = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / 600);
      const value = Math.round(from + (target - from) * (1 - Math.pow(1 - t, 3)));
      yearRef.current = value;
      setYear(value);
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [active]);

  return (
    <section id="story" className="relative grid grid-cols-1 gap-12 px-[clamp(24px,4vw,48px)] py-[clamp(64px,8vw,96px)] md:grid-cols-2">
      <div>
        <div className="flex flex-col gap-[18px] md:sticky md:top-[120px]">
          <Eyebrow>03 — My story</Eyebrow>
          <h2 className="m-0 text-[clamp(40px,5vw,72px)] leading-[1.03] tracking-[-0.015em]">Let&apos;s go back <span className="serif-accent">in time.</span></h2>
          <div className="font-display text-[clamp(96px,13vw,184px)] leading-[0.9] tracking-[-0.03em] tabular-nums">{year}</div>
          <p className="label-caps m-0 flex items-center gap-2 text-soft"><span className="rec-dot rec-blink" />{STORY[active].range}</p>
          <div className="micro-caps flex items-center gap-3.5 text-soft">
            <span><b className="font-medium text-fg">{pad(active + 1)}</b> / {pad(STORY.length)}</span>
            <span className="relative h-0.5 w-[140px] bg-line">
              <i className="absolute inset-y-0 left-0 bg-fg transition-[width] duration-500" style={{ width: `${((active + 1) / STORY.length) * 100}%` }} />
            </span>
          </div>
        </div>
      </div>

      <ol className="m-0 flex list-none flex-col gap-14 border-l border-line py-4 pl-8 md:gap-[14vh] md:pt-[6vh] md:pb-[12vh]">
        {STORY.map((entry, i) => (
          <Fragment key={entry.year + entry.title}>
            {entry.section && (
              // A heading on the line, sitting just above the first entry of its group
              <li className="relative mb-[-32px] before:absolute before:top-1/2 before:-left-[37px] before:size-[9px] before:-translate-y-1/2 before:rotate-45 before:bg-rec before:content-[''] md:mb-[calc(28px-14vh)]">
                <h3 className="label-caps flex items-center gap-3 text-fg">
                  {entry.section}
                  <span aria-hidden="true" className="h-px w-16 bg-line" />
                </h3>
              </li>
            )}
            <li
              ref={el => { items.current[i] = el; }}
              data-index={i}
              className={`relative transition-opacity duration-500 before:absolute before:top-1 before:-left-[38px] before:size-[11px] before:rounded-full before:border-2 before:transition-colors before:content-[''] ${
                i === active ? 'opacity-100 before:border-rec before:bg-rec before:shadow-[0_0_8px_var(--rec)]' : 'opacity-40 before:border-line-strong before:bg-bg'
              }`}
            >
              <p className="micro-caps mb-2 text-soft">{entry.date}</p>
              <h3 className="m-0 text-[clamp(24px,2.4vw,30px)] leading-[1.2] font-medium">{entry.title}</h3>
              <p className="mt-1.5 mb-3 text-[13px] text-soft">{entry.org}</p>
              <ul className="m-0 grid max-w-[56ch] list-disc gap-1.5 pl-[18px] text-[15px] leading-[26px] text-soft">
                {entry.points.map(p => <li key={p}>{p}</li>)}
              </ul>
            </li>
          </Fragment>
        ))}
        {/* signed off by hand: the one Water Brush accent on the page */}
        <li aria-label="Aditya" className="font-brush text-[56px] leading-[60px] text-fg">Aditya</li>
      </ol>
    </section>
  );
}
