'use client';

import dynamic from 'next/dynamic';
import { useCallback, useState } from 'react';
import { WorkViewer } from './WorkGallery';
import type { FilmFrame } from './three/FilmStrip';

// The film strip is 3D, so it loads in the browser only, after the page itself.
const FilmStrip = dynamic(() => import('./three/FilmStrip'), { ssr: false });

/** The hero's film strip; clicking a frame opens that photo (or plays that film) full screen. */
export default function HeroFilm({ frames }: { frames: FilmFrame[] }) {
  const items = frames.map(f => f.item).filter(Boolean) as NonNullable<FilmFrame['item']>[];
  const [open, setOpen] = useState<{ index: number; from: { x: number; y: number } } | null>(null);
  const close = useCallback(() => setOpen(null), []);
  const step = useCallback((d: number) => setOpen(o => (o ? { ...o, index: (o.index + d + items.length) % items.length } : o)), [items.length]);
  const onOpen = useCallback((index: number, from: { x: number; y: number }) => items.length && setOpen({ index: index % items.length, from }), [items.length]);

  return (
    <>
      <FilmStrip frames={frames} onOpen={items.length ? onOpen : undefined} />
      {open && <WorkViewer items={items} index={open.index} label="Frame" onClose={close} onStep={step} from={open.from} />}
    </>
  );
}
