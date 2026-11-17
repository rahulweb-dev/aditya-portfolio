'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { withTr } from '@/lib/ik';

export type WorkItem = { id?: string; src: string; w: number; h: number; title: string | null; poster?: string; secs?: number };

/** ImageKit resizes on the fly: ask for the width the layout needs. */
export const ikLoader = ({ src, width, quality }: { src: string; width: number; quality?: number }) => withTr(src, `w-${width},q-${quality ?? 75}`);
const full = (src: string) => ikLoader({ src, width: 2000, quality: 85 });

type Lenis = { stop: () => void; start: () => void };
const lenis = () => (window as Window & { __lenis?: Lenis }).__lenis;
/** A piece far taller than it is wide, like several magazine pages stacked into one image */
const isTall = (it: WorkItem) => !it.poster && it.h / it.w > 2.2;
const clock = (s = 0) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

/**
 * The real work: a masonry wall of pieces (images, or videos shown by their poster with a silent
 * preview on hover). Any piece opens full screen, with arrows, a caption and a counter.
 */
export default function WorkGallery({ items, label }: { items: WorkItem[]; label: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const isVideo = (it: WorkItem) => !!it.poster;

  const close = useCallback(() => setOpen(null), []);
  const step = useCallback((d: number) => setOpen(i => (i === null ? i : (i + d + items.length) % items.length)), [items.length]);

  // While the viewer is open: keys, and the page holds still
  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    };
    addEventListener('keydown', onKey);
    lenis()?.stop();
    const overflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    return () => {
      removeEventListener('keydown', onKey);
      lenis()?.start();
      document.documentElement.style.overflow = overflow;
    };
  }, [open, close, step]);

  return (
    <>
      <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 [&>*]:mb-4">
        {items.map((it, i) => (
          <Tile key={it.src} item={it} index={i} label={label} onOpen={() => setOpen(i)} video={isVideo(it)} />
        ))}
      </div>
      {open !== null && <Viewer items={items} index={open} label={label} onClose={close} onStep={step} />}
    </>
  );
}

function Tile({ item, index, label, onOpen, video }: { item: WorkItem; index: number; label: string; onOpen: () => void; video: boolean }) {
  const preview = useRef<HTMLVideoElement>(null);
  const [hover, setHover] = useState(false);
  const name = item.title ?? `${label} ${String(index + 1).padStart(2, '0')}`;

  useEffect(() => {
    const v = preview.current;
    if (!v) return;
    if (hover) v.play().catch(() => {});
    else v.pause();
  }, [hover]);

  return (
    <button
      type="button"
      onClick={onOpen}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      aria-label={`Open ${name}`}
      className="group relative block w-full cursor-pointer break-inside-avoid overflow-hidden rounded-xl border border-line bg-bg-2 p-0 text-left"
    >
      <Image
        loader={ikLoader}
        src={video ? item.poster! : item.src}
        alt={name}
        width={item.w}
        height={item.h}
        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        className={`block w-full transition-transform duration-700 ease-[cubic-bezier(0.22,0.9,0.3,1)] group-hover:scale-[1.03] ${isTall(item) ? 'aspect-[3/4] object-cover object-top' : 'h-auto'}`}
      />
      {isTall(item) && <span className="absolute top-3 right-3 rounded-full bg-[#140D0E]/75 px-2.5 py-1 micro-caps text-[#F3EBE0]">Spread ↓</span>}
      {video && (
        <>
          {/* a silent preview while the mouse is over it (loaded only then) */}
          {hover && <video ref={preview} src={item.src} muted loop playsInline preload="auto" className="absolute inset-0 size-full object-cover" />}
          <span className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-[#140D0E]/75 px-2.5 py-1 micro-caps text-[#F3EBE0]">
            <span className="rec-dot size-1.5" /> {clock(item.secs)}
          </span>
          <span className="absolute inset-0 grid place-items-center transition-opacity duration-500 group-hover:opacity-0">
            <span className="grid size-14 place-items-center rounded-full bg-[#140D0E]/75 pl-1 text-lg text-[#F3EBE0]">▶</span>
          </span>
        </>
      )}
      {item.title && (
        <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#140D0E]/85 to-transparent px-4 pt-10 pb-3 text-[13px] leading-5 text-[#F3EBE0] opacity-0 transition-opacity duration-500 group-hover:opacity-100">
          {item.title}
        </span>
      )}
    </button>
  );
}

function Viewer({ items, index, label, onClose, onStep }: { items: WorkItem[]; index: number; label: string; onClose: () => void; onStep: (d: number) => void }) {
  const it = items[index];
  const video = !!it.poster;
  const name = it.title ?? `${label} ${String(index + 1).padStart(2, '0')}`;
  const touch = useRef<number | null>(null);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={name}
      data-lenis-prevent
      onClick={onClose}
      onTouchStart={e => (touch.current = e.touches[0].clientX)}
      onTouchEnd={e => {
        if (touch.current === null) return;
        const dx = e.changedTouches[0].clientX - touch.current;
        if (Math.abs(dx) > 50) onStep(dx < 0 ? 1 : -1);
        touch.current = null;
      }}
      className="fixed inset-0 z-[80] flex animate-[fade-in_0.3s_ease] flex-col items-center justify-center bg-[#0E0A0B]/[0.97] px-4 py-16 backdrop-blur-md"
    >
      <div className="relative flex max-h-full w-full max-w-[min(1400px,100%)] flex-1 items-center justify-center" onClick={e => e.stopPropagation()}>
        {video ? (
          <video key={it.src} src={it.src} poster={it.poster} controls autoPlay playsInline className="max-h-[78vh] max-w-full rounded-lg bg-black" />
        ) : (
          isTall(it) ? (
            // a tall spread scrolls inside the viewer
            <div className="max-h-[78vh] w-full max-w-[640px] overflow-y-auto rounded-lg">
              {/* eslint-disable-next-line @next/next/no-img-element -- full size, already web-sized */}
              <img key={it.src} src={full(it.src)} alt={name} className="block w-full" />
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element -- full size, already web-sized
            <img key={it.src} src={full(it.src)} alt={name} className="max-h-[78vh] max-w-full rounded-lg object-contain" />
          )
        )}
      </div>
      <div className="mt-5 flex items-center gap-4 text-[#F3EBE0]" onClick={e => e.stopPropagation()}>
        <button type="button" onClick={() => onStep(-1)} aria-label="Previous" className="grid size-11 cursor-pointer place-items-center rounded-full border border-[#F3EBE0]/30 bg-transparent text-[#F3EBE0] hover:bg-[#F3EBE0]/10">
          ←
        </button>
        <p className="m-0 min-w-[12rem] text-center">
          <span className="block font-display text-[20px] leading-7">{name}</span>
          <span className="micro-caps text-[#C2B3A8]">
            {String(index + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}
          </span>
        </p>
        <button type="button" onClick={() => onStep(1)} aria-label="Next" className="grid size-11 cursor-pointer place-items-center rounded-full border border-[#F3EBE0]/30 bg-transparent text-[#F3EBE0] hover:bg-[#F3EBE0]/10">
          →
        </button>
      </div>
      <button type="button" onClick={onClose} aria-label="Close" className="label-caps absolute top-5 right-5 cursor-pointer rounded-full border border-[#F3EBE0]/30 bg-transparent px-4 py-2 text-[#F3EBE0] hover:bg-[#F3EBE0]/10">
        Close ✕
      </button>
    </div>
  );
}
