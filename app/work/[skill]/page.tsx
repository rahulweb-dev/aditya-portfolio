import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import Nav from '@/components/Nav';
import PullCord from '@/components/PullCord';
import BackToDoors from '@/components/BackToDoors';
import Contact from '@/components/Contact';
import Footer from '@/components/Footer';
import RoleIcon from '@/components/RoleIcon';
import { Eyebrow } from '@/components/ui';
import { ROOMS, SITE } from '@/lib/content';

type Props = { params: Promise<{ skill: string }> };

export function generateStaticParams() {
  return ROOMS.map(r => ({ skill: r.key }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { skill } = await params;
  const room = ROOMS.find(r => r.key === skill);
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
  const { skill } = await params;
  const room = ROOMS.find(r => r.key === skill);
  if (!room) notFound();
  const [plain, italic] = splitLine(room.motto);

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

        {/* Each card sticks a little lower than the last, so they stack as you scroll */}
        <div className="mt-16 flex flex-col gap-[12vh]">
          {room.projects.map((p, i) => (
            <article
              key={p.title}
              className="sticky grid min-h-[min(540px,70vh)] grid-cols-1 items-center gap-10 rounded-xl border border-line bg-card p-[clamp(20px,3vw,40px)] md:grid-cols-[1.1fr_0.9fr]"
              style={{ top: 96 + i * 20 }}
            >
              <div className="min-w-0">
                <p className="micro-caps m-0 text-soft">
                  Frame {String(i + 1).padStart(2, '0')} · {p.kicker}
                </p>
                <h2 className="mt-4 mb-0 text-[clamp(28px,3.2vw,40px)] leading-[1.15] font-medium">{p.title}</h2>
                <p className="mt-2 text-[13px] text-soft">{p.tag}</p>
                <p className="mt-6 max-w-[52ch] text-[15px] leading-[26px] text-soft">{p.blurb}</p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {p.chips.map(c => (
                    <span key={c} className="micro-caps rounded-full border border-line-strong px-3 py-1.5 text-soft">{c}</span>
                  ))}
                </div>
              </div>

              <div className="relative mx-auto aspect-4/5 w-full max-w-[380px] overflow-hidden rounded-xl bg-bg-2">
                <Image src={p.img} alt={p.title} fill sizes="(max-width: 768px) 100vw, 380px" className="object-cover" priority={i === 0} />
                {p.film && (
                  <span className="absolute inset-0 grid place-items-center">
                    <span className="grid size-16 place-items-center rounded-full bg-[#140D0E]/80 pl-1 text-xl text-[#F3EBE0]">▶</span>
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      </main>

      <Contact />
      <Footer />
      <BackToDoors skill={room.key} />
    </>
  );
}
