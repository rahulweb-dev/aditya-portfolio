'use client';

import Lenis from 'lenis';
import { useEffect } from 'react';

/**
 * Smooth, eased scrolling with the mouse wheel and trackpad (Lenis).
 * Off for anyone who prefers reduced motion; phones keep their native scrolling.
 */
export default function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const lenis = new Lenis({ autoRaf: true, lerp: 0.11, wheelMultiplier: 0.95 });
    // so a full-screen viewer can pause the page's scrolling while it is open
    (window as Window & { __lenis?: Lenis }).__lenis = lenis;
    return () => {
      lenis.destroy();
      delete (window as Window & { __lenis?: Lenis }).__lenis;
    };
  }, []);
  return null;
}
