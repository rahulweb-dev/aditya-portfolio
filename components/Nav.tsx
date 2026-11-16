'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import Logo from './Logo';
import ModeSwitch from './ModeSwitch';
import RoleIcon from './RoleIcon';
import { SolidButton, StatusBadge } from './ui';
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

/** The header: transparent over the hero; once you scroll it turns surface-raised with a hairline. */
export default function Nav({ active }: { active?: SkillKey }) {
  const current = useCurrentSection(active);
  const scrolled = useScrolled() || !!active;

  return (
    <>
      <header className="sticky top-0 z-30">
        <div
          className={`flex h-16 items-center justify-between gap-6 pr-12 pl-[clamp(20px,4vw,48px)] md:pr-[clamp(56px,5vw,72px)] transition-[background-color,border-color] duration-300 ${
            scrolled ? 'border-b border-line bg-card/95' : 'border-b border-transparent'
          }`}
        >
          <Link href="/#home" aria-label={`Adyssey, ${SITE.fullName}: home`} className="no-underline">
            <Logo width={160} />
          </Link>

          <DesktopLinks current={current} active={active} />

          <div className="flex items-center gap-3">
            <span className="hidden lg:inline-flex">
              <StatusBadge>Available</StatusBadge>
            </span>
            <ModeSwitch />
            <span className="hidden md:inline-flex">
              <SolidButton href="/#contact">Start a project</SolidButton>
            </span>
          </div>
        </div>
      </header>

      <BottomBar current={current} active={active} />
    </>
  );
}

/* ---------------- Desktop: capital-letter links; the current one is underlined in red ---------------- */

function DesktopLinks({ current, active }: { current: Section; active?: SkillKey }) {
  const wrap = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [menu, setMenu] = useState(false);

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
    `label-caps relative inline-flex min-h-11 items-center gap-1.5 border-0 bg-transparent no-underline transition-colors duration-150 after:absolute after:inset-x-0 after:bottom-2 after:h-px after:transition-colors ${
      on ? 'text-fg after:bg-link' : 'text-soft after:bg-transparent hover:text-fg'
    }`;

  return (
    <nav aria-label="Main" className="hidden md:block">
      <div ref={wrap} className="flex items-center gap-7">
        {SECTIONS.map(s =>
          s.id === 'work' ? (
            <div key={s.id} className="relative" onMouseEnter={openMenu} onMouseLeave={closeMenuSoon}>
              <button
                type="button"
                aria-expanded={menu}
                aria-haspopup="true"
                onClick={() => setMenu(m => !m)}
                className={`${linkCls(current === 'work')} cursor-pointer`}
              >
                Work
                <svg aria-hidden="true" viewBox="0 0 12 12" className={`size-3 transition-transform duration-300 ${menu ? 'rotate-180' : ''}`}>
                  <path d="M3 4.5 6 7.5 9 4.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {menu && <WorkMenu active={active} onPick={() => setMenu(false)} />}
            </div>
          ) : (
            <Link key={s.id} href={s.href} aria-current={current === s.id ? 'true' : undefined} className={linkCls(current === s.id)}>
              {s.label}
            </Link>
          ),
        )}
      </div>
    </nav>
  );
}

/** The Work menu is a dark section in both modes, like the doors. */
function WorkMenu({ active, onPick }: { active?: SkillKey; onPick: () => void }) {
  return (
    <div className="absolute top-full left-1/2 z-40 w-[440px] -translate-x-1/2 animate-drop pt-2">
      <div className="rounded-[20px] border border-line-on-dark bg-dark p-2 text-on-dark">
        <ul className="m-0 grid list-none gap-0.5 p-0">
          {ROOMS.map(r => (
            <li key={r.key}>
              <Link
                href={`/work/${r.key}`}
                onClick={onPick}
                aria-current={active === r.key ? 'page' : undefined}
                className={`group flex items-center gap-4 rounded-xl p-3 no-underline transition-colors hover:bg-white/5 ${active === r.key ? 'bg-white/5' : ''}`}
              >
                <RoleIcon craft={r.key} tone="night" size={32} />
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-[18px] leading-6 font-medium text-on-dark">{r.title}</span>
                  <span className="micro-caps block truncate text-muted-on-dark">{r.motto}</span>
                </span>
                <span aria-hidden="true" className="text-icon-on-dark transition-transform group-hover:translate-x-1">→</span>
              </Link>
            </li>
          ))}
        </ul>
        <Link href="/#work" onClick={onPick} className="label-caps mt-1 flex items-center justify-between rounded-xl border-t border-line-on-dark px-3 py-3 text-icon-on-dark no-underline">
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
      <path d="M6 21V10a6 7 0 0 1 12 0v11" />
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
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-[22px]" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      {ICONS[id]}
    </svg>
  );
}

function BottomBar({ current, active }: { current: Section; active?: SkillKey }) {
  const [sheet, setSheet] = useState(false);
  const index = SECTIONS.findIndex(s => s.id === (sheet ? 'work' : current));

  const tabCls = (on: boolean) =>
    `micro-caps relative z-10 flex min-h-[54px] flex-col items-center justify-center gap-1 rounded-2xl border-0 bg-transparent no-underline transition-colors duration-300 ${
      on ? 'text-on-action' : 'text-soft'
    }`;

  return (
    <>
      <nav aria-label="Main" className="fixed inset-x-3 bottom-[max(12px,env(safe-area-inset-bottom))] z-40 md:hidden">
        <div className="relative grid grid-cols-4 rounded-[24px] border border-line bg-card/[0.97] p-1.5">
          <span
            aria-hidden="true"
            className="absolute top-1.5 bottom-1.5 left-1.5 w-[calc((100%-12px)/4)] rounded-2xl bg-action transition-transform duration-500 ease-[cubic-bezier(0.22,0.9,0.3,1)]"
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
      <div className="absolute inset-x-3 bottom-[max(12px,env(safe-area-inset-bottom))] animate-sheet-up rounded-[24px] border border-line-on-dark bg-dark p-3 pt-2 text-on-dark">
        <div aria-hidden="true" className="mx-auto mb-3 h-1 w-10 rounded-full bg-line-on-dark" />
        <p className="label-caps mb-2 px-2 text-muted-on-dark">Pick a door</p>
        <ul className="m-0 grid list-none grid-cols-1 gap-1 p-0">
          {ROOMS.map((r, i) => (
            <li key={r.key}>
              <Link
                ref={i === 0 ? first : undefined}
                href={`/work/${r.key}`}
                onClick={onClose}
                aria-current={active === r.key ? 'page' : undefined}
                className={`flex items-center gap-4 rounded-xl p-2.5 no-underline active:bg-white/5 ${active === r.key ? 'bg-white/5' : ''}`}
              >
                <RoleIcon craft={r.key} tone="night" size={32} />
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-[18px] leading-6 font-medium">{r.title}</span>
                  <span className="micro-caps block truncate text-muted-on-dark">{r.motto}</span>
                </span>
                <span aria-hidden="true" className="text-icon-on-dark">→</span>
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Link href="/#work" onClick={onClose} className="label-caps flex min-h-12 items-center justify-center rounded-full border border-line-on-dark text-on-dark no-underline">
            All doors
          </Link>
          <button type="button" onClick={onClose} className="label-caps min-h-12 cursor-pointer rounded-full bg-[#F3EBE0] text-[#140D0E]">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
