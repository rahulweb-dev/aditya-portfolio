'use client';

import { useEffect, useRef, useState } from 'react';
import { STORY } from '@/lib/content';
import { Eyebrow } from './ui';

const pad = (n: number) => String(n).padStart(2, '0');

export default function Story() {
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
    <section id="story" className="story-glow relative grid grid-cols-1 gap-12 px-[clamp(16px,4vw,64px)] py-[120px] md:grid-cols-2">
      <div>
        <div className="flex flex-col gap-[18px] md:sticky md:top-[120px]">
          <Eyebrow>My story</Eyebrow>
          <h2 className="text-[clamp(32px,4vw,54px)] font-semibold tracking-[-0.03em]">Let&apos;s go back in time.</h2>
          <div className="text-[clamp(90px,13vw,190px)] leading-[0.9] font-bold tracking-[-0.05em] tabular-nums">{year}</div>
          <p className="m-0 font-mono text-[13px] font-medium tracking-[0.08em] text-soft uppercase">{STORY[active].range}</p>
          <div className="flex items-center gap-3.5 font-mono text-xs text-soft">
            <span><b className="font-medium text-fg">{pad(active + 1)}</b> / {pad(STORY.length)}</span>
            <span className="relative h-0.5 w-[140px] bg-line">
              <i className="absolute inset-y-0 left-0 bg-fg transition-[width] duration-500" style={{ width: `${((active + 1) / STORY.length) * 100}%` }} />
            </span>
          </div>
        </div>
      </div>

      <ol className="m-0 flex list-none flex-col gap-14 border-l border-line py-4 pl-8 md:gap-[22vh] md:pt-[8vh] md:pb-[20vh]">
        {STORY.map((entry, i) => (
          <li
            key={entry.year + entry.title}
            ref={el => { items.current[i] = el; }}
            data-index={i}
            className={`relative transition-opacity duration-500 before:absolute before:top-1 before:-left-[38px] before:size-[11px] before:rounded-full before:border-2 before:transition-colors before:content-[''] ${
              i === active ? 'opacity-100 before:border-live before:bg-live' : 'opacity-35 before:border-muted before:bg-bg'
            }`}
          >
            <p className="mb-2 font-mono text-[11px] font-medium tracking-[0.08em] text-soft uppercase">{entry.date}</p>
            <h3 className="text-[clamp(24px,2.6vw,34px)] font-semibold tracking-[-0.02em]">{entry.title}</h3>
            <p className="mt-1.5 mb-3 text-sm text-soft">{entry.org}</p>
            <ul className="m-0 grid max-w-[52ch] list-disc gap-1.5 pl-[18px] text-sm leading-relaxed text-soft">
              {entry.points.map(p => <li key={p}>{p}</li>)}
            </ul>
          </li>
        ))}
      </ol>
    </section>
  );
}
