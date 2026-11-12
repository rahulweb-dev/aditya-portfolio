'use client';

import { useEffect, useState } from 'react';
import { SITE } from '@/lib/content';

function read() {
  const now = new Date();
  return {
    time: now
      .toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: SITE.timezone })
      .replace(' ', '')
      .toLowerCase(),
    date: now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: SITE.timezone }),
  };
}

// Renders a placeholder on the server, then the real time once mounted.
export function useLocalTime() {
  const [value, setValue] = useState({ time: '--:--', date: '' });
  useEffect(() => {
    setValue(read());
    const id = setInterval(() => setValue(read()), 15000);
    return () => clearInterval(id);
  }, []);
  return value;
}

export function TimeText() {
  return <>{useLocalTime().time}</>;
}

export default function Clock() {
  const { time, date } = useLocalTime();
  return (
    <div className="hidden items-center gap-1.5 rounded-full border border-line px-3 py-1.5 font-mono text-[11px] whitespace-nowrap text-soft lg:flex">
      <span>Local time</span>
      <b className="font-medium text-fg">{time}</b>
      <span className="opacity-50">·</span>
      <span>{date}</span>
    </div>
  );
}
