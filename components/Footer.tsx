import { TimeText } from './Clock';
import Logo from './Logo';
import { getContent } from '@/lib/cms/content';

const link = 'text-muted-on-dark no-underline transition-colors hover:text-on-dark';
const head = 'label-caps mb-1 text-icon-on-dark';

/** The footer is a dark section in both modes: the stacked cream logo, the links, contact and "Back to top ↑". */
export default async function Footer() {
  const { rooms: ROOMS, site: SITE } = await getContent();
  return (
    <footer className="bg-dark px-[clamp(24px,5vw,80px)] pt-16 pb-32 text-[13px] leading-[22px] text-on-dark md:pb-24">
      {/* full width: the logo on the left edge, the columns spread out to the right edge */}
      <div className="flex flex-col gap-12 lg:flex-row lg:justify-between lg:gap-16">
        <div className="flex shrink-0 flex-col gap-4">
          <Logo variant="stacked" width={132} tone="night" />
          <p className="m-0 max-w-[30ch] text-muted-on-dark">
            {SITE.fullName}
            <br />
            {SITE.title}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8 md:flex md:justify-between md:gap-10 lg:w-[min(72%,1100px)]">
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
            <a href={`mailto:${SITE.email}`} className={`${link} [overflow-wrap:anywhere] md:whitespace-nowrap`}>{SITE.email}</a>
            <a href={SITE.phoneHref} className={link}>{SITE.phone}</a>
            <p className="m-0 md:whitespace-nowrap">{SITE.location} · <TimeText /></p>
          </div>
        </div>
      </div>
      <div className="micro-caps mt-14 flex flex-wrap justify-between gap-3 border-t border-line-on-dark pt-6 text-muted-on-dark">
        <p className="m-0">© {new Date().getFullYear()} {SITE.fullName} · Hyderabad, India</p>
        <a href="#home" className={link}>Back to top ↑</a>
      </div>
    </footer>
  );
}
