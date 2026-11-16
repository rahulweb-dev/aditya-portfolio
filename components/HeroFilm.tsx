'use client';

import dynamic from 'next/dynamic';

// The film strip is 3D, so it loads in the browser only, after the page itself.
const FilmStrip = dynamic(() => import('./three/FilmStrip'), { ssr: false });

export default function HeroFilm() {
  return <FilmStrip />;
}
