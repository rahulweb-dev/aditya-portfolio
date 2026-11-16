import type { ReactNode } from 'react';

/** Kicker above a headline: label-caps, e.g. "02 — WHAT I DO". `live` adds the REC dot. */
export function Eyebrow({ children, live = false, onDark = false }: { children: ReactNode; live?: boolean; onDark?: boolean }) {
  return (
    <p className={`label-caps m-0 inline-flex items-center gap-2 ${onDark ? 'text-muted-on-dark' : 'text-soft'}`}>
      {live && <span className="rec-dot rec-blink" />}
      {children}
    </p>
  );
}

/** Small pill with the blinking REC dot, e.g. "Available". */
export function StatusBadge({ children }: { children: ReactNode }) {
  return (
    <span className="label-caps inline-flex min-h-8 items-center gap-2 rounded-full border border-line bg-card px-3 text-fg">
      <span className="rec-dot rec-blink" />
      {children}
    </span>
  );
}

const pill = 'label-caps group inline-flex min-h-11 cursor-pointer items-center gap-2.5 rounded-full px-5 no-underline transition-[opacity,background-color,border-color,transform] duration-300 active:scale-[0.98]';

/** The one primary action in a view: ink pill by day, cream by night. */
export function SolidButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} className={`${pill} bg-action text-on-action hover:opacity-90`}>
      {children}
      <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">→</span>
    </a>
  );
}

/** Outline button: every action that is not the main one. */
export function GhostButton({ href, onClick, children, arrow = true }: { href?: string; onClick?: () => void; children: ReactNode; arrow?: boolean }) {
  const cls = `${pill} border border-line-strong bg-transparent text-fg hover:bg-bg-2`;
  const inner = (
    <>
      {children}
      {arrow && <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">→</span>}
    </>
  );
  return href ? (
    <a href={href} className={cls}>{inner}</a>
  ) : (
    <button type="button" onClick={onClick} className={cls}>{inner}</button>
  );
}

/** Text link in the red for words, e.g. "Let's talk". */
export function TextLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} className="text-[15px] text-link underline decoration-1 underline-offset-4 hover:decoration-2">
      {children}
    </a>
  );
}
