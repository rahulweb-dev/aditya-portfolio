'use client';

import { useEffect, useState } from 'react';
import { switchTheme, type Mode } from '@/lib/theme';

/**
 * The sun and moon switch: a pill with a red sun (day) and a red crescent (night); the knob sits over the active one.
 * Until someone chooses, the site follows the device setting; the choice is remembered.
 */
export default function ModeSwitch({ className = '' }: { className?: string }) {
  const [mode, setMode] = useState<Mode>('light');

  useEffect(() => {
    const root = document.documentElement;
    setMode(root.dataset.theme === 'dark' ? 'dark' : 'light');
    // Keep following the device while the visitor hasn't chosen.
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const onDevice = () => {
      let saved: string | null = null;
      try {
        saved = localStorage.getItem('theme');
      } catch {}
      if (saved) return;
      const next: Mode = mq.matches ? 'dark' : 'light';
      root.dataset.theme = next;
      setMode(next);
    };
    mq.addEventListener('change', onDevice);
    // Stay in step with the mode, whoever changes it (this switch, the pull cord, the sunset scene).
    const mo = new MutationObserver(() => setMode(root.dataset.theme === 'dark' ? 'dark' : 'light'));
    mo.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    return () => {
      mq.removeEventListener('change', onDevice);
      mo.disconnect();
    };
  }, []);

  // The sun sets (or rises) first; the knob moves when the mode actually changes.
  function toggle() {
    switchTheme(mode === 'dark' ? 'light' : 'dark');
  }

  const night = mode === 'dark';
  return (
    <button
      type="button"
      role="switch"
      aria-checked={night}
      aria-label="Light and dark mode"
      onClick={toggle}
      className={`relative inline-flex h-8 w-[62px] shrink-0 cursor-pointer items-center justify-between rounded-full border border-line-strong bg-bg-2 px-[7px] ${className}`}
    >
      <span
        aria-hidden="true"
        className="absolute top-[3px] left-[3px] size-6 rounded-full bg-card shadow-[0_1px_3px_rgba(0,0,0,0.25)] transition-transform duration-300"
        style={{ transform: night ? 'translateX(30px)' : 'none' }}
      />
      {/* the sun */}
      <span aria-hidden="true" className="relative size-3 rounded-full bg-sun-red" />
      {/* the crescent, lit on the right */}
      <span aria-hidden="true" className="relative size-3 overflow-hidden rounded-full bg-crescent-red">
        <span className="absolute -top-px -left-[3px] size-[11px] rounded-full bg-bg-2" style={night ? { background: 'var(--card)' } : undefined} />
      </span>
    </button>
  );
}
