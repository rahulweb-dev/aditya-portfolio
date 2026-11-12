'use client';

import { useEffect, useState } from 'react';

const read = (names: string[]) => {
  const style = getComputedStyle(document.documentElement);
  return Object.fromEntries(names.map(n => [n, style.getPropertyValue(`--${n}`).trim() || '#888888']));
};

/** Reads CSS colour tokens and re-reads them whenever the pull cord flips the theme. */
export function useThemeColors<T extends string>(names: T[]): Record<T, string> & { dark: boolean } {
  const key = names.join(',');
  const [colors, setColors] = useState(() => ({ ...read(names), dark: document.documentElement.dataset.theme === 'dark' }) as Record<T, string> & { dark: boolean });

  useEffect(() => {
    const list = key.split(',');
    const update = () => setColors({ ...read(list), dark: document.documentElement.dataset.theme === 'dark' } as Record<T, string> & { dark: boolean });
    const mo = new MutationObserver(update);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => mo.disconnect();
  }, [key]);

  return colors;
}

/** Pauses a canvas while it's off screen so it doesn't use the GPU for nothing. */
export function useOnScreen(ref: React.RefObject<HTMLElement | null>) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: '100px' });
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
  return visible;
}
