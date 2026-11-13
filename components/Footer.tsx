import { TimeText } from './Clock';
import { ROOMS, SITE } from '@/lib/content';

const link = 'text-soft no-underline transition-colors hover:text-fg';
const head = 'mb-1 font-mono text-[11px] font-medium tracking-[0.1em] text-fg uppercase';

export default function Footer() {
  return (
    <footer className="border-t border-line px-[clamp(16px,4vw,64px)] pt-10 pb-32 text-sm md:pb-8">
      <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
        <div className="flex flex-col gap-2">
          <p className={head}>Work</p>
          {ROOMS.map(r => <a key={r.key} href={`/work/${r.key}`} className={link}>{r.nav}</a>)}
        </div>
        <div className="flex flex-col gap-2">
          <p className={head}>Navigate</p>
          <a href="#home" className={link}>Home</a>
          <a href="#story" className={link}>My story</a>
          <a href="#contact" className={link}>Contact</a>
        </div>
        <div className="flex flex-col gap-2">
          <p className={head}>Elsewhere</p>
          {SITE.socials.map(s => (
            <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className={link}>
              {s.label} ↗
            </a>
          ))}
        </div>
        <div className="flex flex-col gap-2 text-soft">
          <p className={head}>Contact</p>
          <a href={`mailto:${SITE.email}`} className={`${link} break-all`}>{SITE.email}</a>
          <a href={SITE.phoneHref} className={link}>{SITE.phone}</a>
          <p>{SITE.location} · <TimeText /></p>
        </div>
      </div>
      <div className="mt-12 flex flex-wrap justify-between gap-3 text-[13px] text-muted">
        <p>© {new Date().getFullYear()} {SITE.fullName} · {SITE.title}</p>
        <a href="#home" className={link}>Back to top ↑</a>
      </div>
    </footer>
  );
}
