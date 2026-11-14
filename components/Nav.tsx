'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Clock from './Clock';
import Logo from './Logo';
import { ROOMS, SITE, type SkillKey } from '@/lib/content';

type Section = 'home' | 'work' | 'story' | 'contact';

const SECTIONS: { id: Section; label: string; href: string }[] = [
  { id: 'home', label: 'Home', href: '/#home' },
  { id: 'work', label: 'Work', href: '/#work' },
  { id: 'story', label: 'My story', href: '/#story' },
  { id: 'contact', label: 'Contact', href: '/#contact' },
];

/** Which section is in the middle of the screen (on a skill page it's always Work). */
function useCurrentSection(active?: SkillKey): Section {
  const pathname = usePathname();
  const [section, setSection] = useState<Section>('home');
  useEffect(() => {
    if (pathname !== '/') return;
    const io = new IntersectionObserver(
      entries => entries.forEach(e => e.isIntersecting && setSection(e.target.id as Section)),
      { rootMargin: '-45% 0px -50% 0px' },
    );
    SECTIONS.forEach(s => {
      const el = document.getElementById(s.id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, [pathname]);
  return active ? 'work' : section;
}

function useScrolled() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  return scrolled;
}

export default function Nav({ active }: { active?: SkillKey }) {
  const current = useCurrentSection(active);
  const scrolled = useScrolled();

  return (
    <>
      <header className="sticky top-0 z-30">
        <div
          className={`flex items-center justify-between gap-6 py-2 pr-16 pl-[clamp(16px,4vw,64px)] transition-[background-color,border-color,box-shadow] duration-300 lg:pr-[clamp(64px,6vw,96px)] ${
            scrolled ? 'border-b border-line bg-bg/95 shadow-[0_10px_30px_-20px_var(--shadow-color)]' : 'border-b border-transparent'
          }`}
        >
          <Link href="/#home" aria-label={`Adyssey, ${SITE.fullName}: home`} className="no-underline">
            <Logo width={160} />
          </Link>

          <DesktopLinks current={current} active={active} />

          <div className="hidden items-center gap-3 md:flex">
            <Clock />
            <Link
              href="/#contact"
              className="inline-flex min-h-10 items-center gap-2 rounded-full bg-fg px-4 text-[13px] font-medium text-bg no-underline transition hover:-translate-y-0.5"
            >
              <span className="size-1.5 rounded-full bg-live ring-4 ring-live/30" />
              Let&apos;s talk
            </Link>
          </div>

          {/* Phones: availability in the top bar, everything else in the bottom bar */}
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-card/70 px-3 py-1.5 text-xs text-soft md:hidden">
            <span className="size-1.5 rounded-full bg-live ring-4 ring-live/25" />
            Available
          </span>
        </div>
      </header>

      <BottomBar current={current} active={active} />
    </>
  );
}

/* ---------------- Desktop: floating pill with a sliding highlight ---------------- */

function DesktopLinks({ current, active }: { current: Section; active?: SkillKey }) {
  const wrap = useRef<HTMLDivElement>(null);
  const items = useRef<Partial<Record<Section, HTMLElement | null>>>({});
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [hover, setHover] = useState<Section | null>(null);
  const [menu, setMenu] = useState(false);
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null);
  const target = menu ? 'work' : (hover ?? current);

  const measure = useCallback(() => {
    const el = items.current[target];
    const box = wrap.current;
    if (!el || !box) return;
    const a = el.getBoundingClientRect();
    const b = box.getBoundingClientRect();
    setPill({ left: a.left - b.left, width: a.width });
  }, [target]);

  useLayoutEffect(measure, [measure]);
  useEffect(() => {
    window.addEventListener('resize', measure);
    document.fonts?.ready.then(measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure]);

  // Close the Work menu on Escape or a click elsewhere.
  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenu(false);
    const onClick = (e: MouseEvent) => !wrap.current?.contains(e.target as Node) && setMenu(false);
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [menu]);

  const openMenu = () => {
    clearTimeout(closeTimer.current);
    setMenu(true);
  };
  const closeMenuSoon = () => {
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setMenu(false), 160);
  };

  const linkCls = (on: boolean) =>
    `relative z-10 inline-flex min-h-9 items-center gap-1.5 rounded-full px-4 text-[13px] font-medium no-underline transition-colors duration-300 ${
      on ? 'text-bg' : 'text-soft hover:text-fg'
    }`;

  return (
    <nav aria-label="Main" className="hidden md:block">
      <div
        ref={wrap}
        onMouseLeave={() => setHover(null)}
        className="relative flex items-center rounded-full border border-line bg-card p-1 shadow-[0_8px_24px_-16px_var(--shadow-color)]"
      >
        {pill && (
          <span
            aria-hidden="true"
            className="absolute top-1 bottom-1 rounded-full bg-fg transition-[left,width] duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]"
            style={{ left: pill.left, width: pill.width }}
          />
        )}

        {SECTIONS.map(s =>
          s.id === 'work' ? (
            <div key={s.id} className="relative" onMouseEnter={openMenu} onMouseLeave={closeMenuSoon}>
              <button
                ref={el => { items.current.work = el; }}
                type="button"
                aria-expanded={menu}
                aria-haspopup="true"
                onClick={() => setMenu(m => !m)}
                onMouseEnter={() => setHover('work')}
                className={`${linkCls(target === 'work')} cursor-pointer border-0 bg-transparent`}
              >
                Work
                <svg aria-hidden="true" viewBox="0 0 12 12" className={`size-3 transition-transform duration-300 ${menu ? 'rotate-180' : ''}`}>
                  <path d="M3 4.5 6 7.5 9 4.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {menu && <WorkMenu active={active} onPick={() => setMenu(false)} />}
            </div>
          ) : (
            <Link
              key={s.id}
              ref={el => { items.current[s.id] = el; }}
              href={s.href}
              aria-current={current === s.id ? 'true' : undefined}
              onMouseEnter={() => setHover(s.id)}
              className={linkCls(target === s.id)}
            >
              {s.label}
            </Link>
          ),
        )}
      </div>
    </nav>
  );
}

function MiniDoor({ color, className = '' }: { color: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`gothic-arch relative block shrink-0 ${className}`}
      style={{ background: `repeating-linear-gradient(90deg, rgba(0,0,0,0.18) 0 1px, transparent 1px 4px), ${color}` }}
    >
      <span className="absolute top-[55%] right-[18%] size-[3px] rounded-full bg-gold" />
    </span>
  );
}

function WorkMenu({ active, onPick }: { active?: SkillKey; onPick: () => void }) {
  return (
    <div className="absolute top-full left-1/2 z-40 w-[440px] -translate-x-1/2 animate-drop pt-3">
      <div className="rounded-3xl border border-line bg-card p-2 shadow-[0_30px_60px_-30px_var(--shadow-color)]">
        <ul className="m-0 grid list-none gap-0.5 p-0">
          {ROOMS.map(r => (
            <li key={r.key}>
              <Link
                href={`/work/${r.key}`}
                onClick={onPick}
                aria-current={active === r.key ? 'page' : undefined}
                className={`group flex items-center gap-3.5 rounded-2xl p-3 no-underline transition-colors hover:bg-bg-2 ${active === r.key ? 'bg-bg-2' : ''}`}
              >
                <MiniDoor color={r.color} className="h-9 w-[22px]" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-fg">{r.title}</span>
                  <span className="block truncate font-mono text-[10px] tracking-[0.1em] text-soft uppercase">{r.motto}</span>
                </span>
                <span aria-hidden="true" className="text-soft opacity-0 transition-[opacity,translate] group-hover:translate-x-0.5 group-hover:opacity-100">→</span>
              </Link>
            </li>
          ))}
        </ul>
        <Link
          href="/#work"
          onClick={onPick}
          className="mt-1 flex items-center justify-between rounded-2xl bg-bg-2 px-4 py-3 text-[13px] font-medium text-fg no-underline transition-colors hover:bg-line"
        >
          Walk through the doors
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  );
}

/* ---------------- Phones: floating bottom tab bar ---------------- */

const ICONS: Record<Section, React.ReactNode> = {
  home: <path d="M3.5 10.5 12 3.5l8.5 7V20a1 1 0 0 1-1 1H15v-6H9v6H4.5a1 1 0 0 1-1-1z" />,
  work: (
    <>
      <path d="M6 21V9.5a6 6 0 0 1 12 0V21" />
      <path d="M3.5 21h17M14.5 14h.01" />
    </>
  ),
  story: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  contact: <path d="M20.5 12a8.5 8.5 0 0 1-12.3 7.6L3.5 20.5l1-4.4A8.5 8.5 0 1 1 20.5 12z" />,
};

function TabIcon({ id }: { id: Section }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-[22px]" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {ICONS[id]}
    </svg>
  );
}

function BottomBar({ current, active }: { current: Section; active?: SkillKey }) {
  const [sheet, setSheet] = useState(false);
  const index = SECTIONS.findIndex(s => s.id === (sheet ? 'work' : current));

  const tabCls = (on: boolean) =>
    `relative z-10 flex min-h-[54px] flex-col items-center justify-center gap-1 rounded-2xl border-0 bg-transparent text-[10.5px] font-medium no-underline transition-colors duration-300 ${
      on ? 'text-bg' : 'text-soft'
    }`;

  return (
    <>
      <nav aria-label="Main" className="fixed inset-x-3 bottom-[max(12px,env(safe-area-inset-bottom))] z-40 md:hidden">
        <div className="relative grid grid-cols-4 rounded-[24px] border border-line bg-card/[0.97] p-1.5 shadow-[0_20px_40px_-18px_var(--shadow-color)]">
          <span
            aria-hidden="true"
            className="absolute top-1.5 bottom-1.5 left-1.5 w-[calc((100%-12px)/4)] rounded-2xl bg-fg transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
            style={{ transform: `translateX(${index * 100}%)` }}
          />
          {SECTIONS.map(s =>
            s.id === 'work' ? (
              <button key={s.id} type="button" aria-expanded={sheet} onClick={() => setSheet(true)} className={`${tabCls(index === 1)} cursor-pointer`}>
                <TabIcon id="work" />
                Work
              </button>
            ) : (
              <Link key={s.id} href={s.href} aria-current={current === s.id ? 'true' : undefined} className={tabCls(SECTIONS[index].id === s.id)}>
                <TabIcon id={s.id} />
                {s.id === 'story' ? 'Story' : s.label}
              </Link>
            ),
          )}
        </div>
      </nav>
      {sheet && <WorkSheet active={active} onClose={() => setSheet(false)} />}
    </>
  );
}

function WorkSheet({ active, onClose }: { active?: SkillKey; onClose: () => void }) {
  const first = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    first.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div role="dialog" aria-modal="true" aria-label="Work" className="fixed inset-0 z-50 md:hidden">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 animate-fade-in cursor-default border-0 bg-black/55" />
      <div className="absolute inset-x-3 bottom-[max(12px,env(safe-area-inset-bottom))] animate-sheet-up rounded-[28px] border border-line bg-card p-3 pt-2 shadow-[0_-10px_50px_-20px_rgba(0,0,0,0.5)]">
        <div aria-hidden="true" className="mx-auto mb-3 h-1 w-10 rounded-full bg-line" />
        <p className="mb-2 px-2 font-mono text-[11px] font-medium tracking-[0.12em] text-soft uppercase">Pick a door</p>
        <ul className="m-0 grid list-none grid-cols-1 gap-1 p-0">
          {ROOMS.map((r, i) => (
            <li key={r.key}>
              <Link
                ref={i === 0 ? first : undefined}
                href={`/work/${r.key}`}
                onClick={onClose}
                aria-current={active === r.key ? 'page' : undefined}
                className={`flex items-center gap-3.5 rounded-2xl p-2.5 no-underline active:bg-bg-2 ${active === r.key ? 'bg-bg-2' : ''}`}
              >
                <MiniDoor color={r.color} className="h-10 w-6" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-semibold text-fg">{r.title}</span>
                  <span className="block truncate font-mono text-[10px] tracking-[0.1em] text-soft uppercase">{r.motto}</span>
                </span>
                <span aria-hidden="true" className="text-soft">→</span>
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Link href="/#work" onClick={onClose} className="flex min-h-12 items-center justify-center rounded-2xl bg-bg-2 text-sm font-medium text-fg no-underline">
            All doors
          </Link>
          <button type="button" onClick={onClose} className="min-h-12 cursor-pointer rounded-2xl border border-line bg-transparent text-sm font-medium text-fg">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
