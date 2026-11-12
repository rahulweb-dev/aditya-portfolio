'use client';

import dynamic from 'next/dynamic';

// Loads the 3D film strip in the browser only, after the page itself.
const FilmStrip = dynamic(() => import('./three/FilmStrip'), { ssr: false });

export default function HeroBackdrop() {
  return <FilmStrip />;
}
