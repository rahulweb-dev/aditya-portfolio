'use client';

import { useEffect, useState } from 'react';
import { onSoundChange, setSoundOn, soundOn } from '@/lib/doorSound';

/** Turns the doors' sounds on or off (remembered). A small speaker with three little sound bars. */
export default function SoundToggle({ className = '' }: { className?: string }) {
  const [on, setOn] = useState(true);
  useEffect(() => {
    setOn(soundOn());
    const off = onSoundChange(setOn);
    return () => {
      off();
    };
  }, []);

  return (
    <button
      type="button"
      onClick={() => setSoundOn(!on)}
      aria-pressed={on}
      aria-label={on ? 'Turn door sounds off' : 'Turn door sounds on'}
      className={`micro-caps inline-flex cursor-pointer items-center gap-2 rounded-full border border-line bg-card/80 px-3.5 py-2 text-soft backdrop-blur-md transition hover:text-fg ${className}`}
    >
      <svg width="16" height="14" viewBox="0 0 16 14" aria-hidden="true" className="shrink-0">
        <path d="M1 5h3l4-3.5v11L4 9H1z" fill="currentColor" />
        {on ? (
          <g fill="currentColor" className="sound-bars">
            <rect x="10" y="5.5" width="1.4" height="3" rx="0.7" />
            <rect x="12.2" y="3.5" width="1.4" height="7" rx="0.7" />
            <rect x="14.4" y="5" width="1.4" height="4" rx="0.7" />
          </g>
        ) : (
          <path d="M10.5 4.5l4 5m0-5l-4 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        )}
      </svg>
      Sound {on ? 'on' : 'off'}
    </button>
  );
}
