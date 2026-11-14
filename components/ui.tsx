import type { ReactNode } from 'react';

export function Eyebrow({ children, live = false }: { children: ReactNode; live?: boolean }) {
  return (
    <p className="m-0 inline-flex items-center gap-2 font-mono text-xs font-medium tracking-wide text-soft">
      <span className={live ? 'size-1.5 rounded-full bg-live ring-4 ring-live/25' : 'size-1.5 rounded-full bg-current'} />
      {children}
    </p>
  );
}

export function SolidButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      className="group inline-flex min-h-[46px] items-center gap-2.5 rounded-full bg-fg py-0 pr-2 pl-5 text-sm font-medium text-bg no-underline shadow-[3px_3px_0_0_var(--aura-violet)] transition hover:-translate-x-px hover:-translate-y-0.5 hover:shadow-[5px_5px_0_0_var(--aura-violet)]"
    >
      {children}
      <span className="grid size-8 place-items-center rounded-full bg-bg text-fg transition-transform group-hover:-rotate-45">→</span>
    </a>
  );
}

export function GhostButton({ href, onClick, children }: { href?: string; onClick?: () => void; children: ReactNode }) {
  const cls =
    'inline-flex min-h-[46px] cursor-pointer items-center rounded-full border border-line bg-bg/90 px-5 text-sm font-medium text-fg no-underline transition hover:-translate-y-0.5';
  return href ? (
    <a href={href} className={cls}>{children}</a>
  ) : (
    <button type="button" onClick={onClick} className={cls}>{children}</button>
  );
}
