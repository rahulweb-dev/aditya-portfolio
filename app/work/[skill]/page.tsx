import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Nav from '@/components/Nav';
import PullCord from '@/components/PullCord';
import BackToDoors from '@/components/BackToDoors';
import Contact from '@/components/Contact';
import Footer from '@/components/Footer';
import RoleIcon from '@/components/RoleIcon';
import WorkGallery from '@/components/WorkGallery';
import { Eyebrow } from '@/components/ui';
import { SKILLS, type SkillKey } from '@/lib/content';
import { getContent } from '@/lib/cms/content';
import { listWorks } from '@/lib/cms/imagekit';

// The work comes from ImageKit; pages refresh every 5 minutes, or at once when the dashboard changes something.
export const revalidate = 300;

// What to call a piece that has no title of its own
const UNTITLED: Record<SkillKey, string> = { design: 'Design', photo: 'Frame', video: 'Reel', ai: 'AI film' };
const NOUN: Record<SkillKey, string> = { design: 'designs', photo: 'photographs', video: 'films', ai: 'films' };

type Props = { params: Promise<{ skill: string }> };

export function generateStaticParams() {
  return SKILLS.map(skill => ({ skill }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { skill } = await params;
  const { rooms, site: SITE } = await getContent();
  const room = rooms.find(r => r.key === skill);
  return { title: room ? `${room.title} — Adyssey | ${SITE.fullName}` : SITE.name, description: room?.lead };
}

/** The craft's line with its one italic phrase: what follows the comma, else the last three words. */
function splitLine(line: string): [string, string] {
  const comma = line.indexOf(',');
  if (comma > 0) return [line.slice(0, comma + 1) + ' ', line.slice(comma + 2)];
  const words = line.split(' ');
  return [words.slice(0, -3).join(' ') + ' ', words.slice(-3).join(' ')];
}

export default async function RoomPage({ params }: Props) {
  const { rooms: ROOMS } = await getContent();
  const { skill } = await params;
  const room = ROOMS.find(r => r.key === skill);
  if (!room) notFound();
  const [plain, italic] = splitLine(room.motto);
  const items = await listWorks(room.key);

  return (
    <>
      {/* Arriving through the door: fade in from black */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-60 animate-fade-out bg-black" />
      <PullCord />
      <Nav active={room.key} />

      <main className="mx-auto max-w-[1200px] px-[clamp(24px,4vw,48px)] pt-16 pb-[30vh]">
        <div className="flex items-center gap-3">
          <RoleIcon craft={room.key} size={32} />
          <Eyebrow>Work — {room.title}</Eyebrow>
        </div>
        <h1 className="mt-4 mb-0 text-[clamp(38px,5vw,54px)] leading-[1.07] tracking-[-0.01em] text-balance">
          {plain}
          <span className="serif-accent">{italic}</span>
        </h1>
        <p className="mt-6 max-w-[52ch] text-[17px] leading-[30px] text-soft">{room.lead}</p>

        {/* The work itself */}
        <section aria-label="Selected work" className="mt-14">
          <p className="micro-caps m-0 mb-6 text-soft">
            Selected work · {items.length} {NOUN[room.key]}
          </p>
          <WorkGallery items={items} label={UNTITLED[room.key]} />
        </section>

        {/* Written highlights: who it was for and what it involved */}
        {room.projects.length > 0 && (
          <section aria-label="Highlights" className="mt-24">
            <Eyebrow>Highlights</Eyebrow>
            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
              {room.projects.map((p, i) => (
                <article key={p.title} className="min-w-0 rounded-xl border border-line bg-card p-[clamp(20px,3vw,32px)]">
                  <p className="micro-caps m-0 text-soft">
                    {String(i + 1).padStart(2, '0')} · {p.kicker}
                  </p>
                  <h2 className="mt-4 mb-0 text-[clamp(24px,2.6vw,32px)] leading-[1.15] font-medium">{p.title}</h2>
                  <p className="mt-2 text-[13px] text-soft">{p.tag}</p>
                  <p className="mt-5 text-[15px] leading-[26px] text-soft">{p.blurb}</p>
                  <div className="mt-6 flex flex-wrap gap-2">
                    {p.chips.map(c => (
                      <span key={c} className="micro-caps rounded-full border border-line-strong px-3 py-1.5 text-soft">{c}</span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </main>

      <Contact />
      <Footer />
      <BackToDoors skill={room.key} />
    </>
  );
}
