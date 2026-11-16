import { TimeText } from './Clock';
import Logo from './Logo';
import { ROOMS, SITE } from '@/lib/content';

const link = 'text-muted-on-dark no-underline transition-colors hover:text-on-dark';
const head = 'label-caps mb-1 text-icon-on-dark';

/** The footer is a dark section in both modes: the stacked cream logo, the links, contact and "Back to top ↑". */
export default function Footer() {
  return (
    <footer className="bg-dark px-[clamp(24px,4vw,48px)] pt-16 pb-32 text-[13px] leading-[22px] text-on-dark md:pb-10">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-12 lg:flex-row lg:gap-20">
        <div className="flex flex-col gap-4">
          <Logo variant="stacked" width={132} tone="night" />
          <p className="m-0 max-w-[30ch] text-muted-on-dark">
            {SITE.fullName}
            <br />
            {SITE.title}
          </p>
        </div>

        <div className="grid flex-1 grid-cols-2 gap-8 md:grid-cols-4">
          <div className="flex flex-col gap-2">
            <p className={head}>Work</p>
            {ROOMS.map(r => <a key={r.key} href={`/work/${r.key}`} className={link}>{r.nav}</a>)}
          </div>
          <div className="flex flex-col gap-2">
            <p className={head}>Navigate</p>
            <a href="/#home" className={link}>Home</a>
            <a href="/#story" className={link}>My story</a>
            <a href="/#contact" className={link}>Contact</a>
          </div>
          <div className="flex flex-col gap-2">
            <p className={head}>Elsewhere</p>
            {SITE.socials.map(s => (
              <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className={link}>
                {s.label} ↗
              </a>
            ))}
          </div>
          <div className="flex flex-col gap-2 text-muted-on-dark">
            <p className={head}>Contact</p>
            <a href={`mailto:${SITE.email}`} className={`${link} break-all`}>{SITE.email}</a>
            <a href={SITE.phoneHref} className={link}>{SITE.phone}</a>
            <p className="m-0">{SITE.location} · <TimeText /></p>
          </div>
        </div>
      </div>
      <div className="micro-caps mx-auto mt-14 flex max-w-[1200px] flex-wrap justify-between gap-3 border-t border-line-on-dark pt-6 text-muted-on-dark">
        <p className="m-0">© {new Date().getFullYear()} {SITE.fullName} · Hyderabad, India</p>
        <a href="#home" className={link}>Back to top ↑</a>
      </div>
    </footer>
  );
}
