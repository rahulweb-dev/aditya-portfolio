import 'server-only';
import { unstable_cache } from 'next/cache';
import { DEFAULT_CONTENT, SKILLS, type SiteContent } from '@/lib/content';
import { db, mongoConfigured } from './mongo';

// The site's text lives in MongoDB as one document ({ _id: 'main', site, brand, roles, … }).
// Anything not saved yet falls back to the starting values in lib/content.ts.

export type Section = keyof SiteContent;
export const SECTIONS: Section[] = ['site', 'brand', 'roles', 'ability', 'rooms', 'story'];

const COLLECTION = 'content';

// ---------- cleaning what the dashboard sends (never trust the shape) ----------

const str = (v: unknown, max = 2000) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const strs = (v: unknown, max = 400) => (Array.isArray(v) ? v.map(x => str(x, max)).filter(Boolean).slice(0, 60) : []);
const list = <T,>(v: unknown, each: (x: Record<string, unknown>) => T, keep: (x: T) => boolean = () => true) =>
  (Array.isArray(v) ? v.filter(x => x && typeof x === 'object').map(x => each(x as Record<string, unknown>)).filter(keep) : []).slice(0, 80);
const obj = (v: unknown) => (v && typeof v === 'object' ? (v as Record<string, unknown>) : {});

export function clean<S extends Section>(section: S, raw: unknown): SiteContent[S] {
  const v = obj(raw);
  const d = DEFAULT_CONTENT;
  switch (section) {
    case 'site': {
      const phone = str(v.phone, 40);
      return {
        ...d.site,
        name: str(v.name, 60) || d.site.name,
        fullName: str(v.fullName, 120) || d.site.fullName,
        title: str(v.title, 160),
        email: str(v.email, 160),
        phone,
        phoneHref: phone ? `tel:${phone.replace(/[^\d+]/g, '')}` : '',
        location: str(v.location, 120),
        socials: list(v.socials, x => ({ label: str(x.label, 40), href: str(x.href, 400) }), x => !!x.label && /^https?:\/\//.test(x.href)),
      } as SiteContent[S];
    }
    case 'brand':
      return {
        ...d.brand,
        tagline: str(v.tagline, 160) || d.brand.tagline,
        phonetic: str(v.phonetic, 60),
        senses: strs(v.senses, 400),
        signoff: str(v.signoff, 300),
      } as SiteContent[S];
    case 'roles':
      return list(v as unknown, x => ({ article: str(x.article, 4) || 'a', word: str(x.word, 60) }), x => !!x.word) as SiteContent[S];
    case 'ability':
      return {
        abilities: list(v.abilities, x => ({ skill: str(x.skill, 80), detail: str(x.detail, 200) }), x => !!x.skill),
        tools: strs(v.tools, 60),
        certifications: strs(v.certifications, 80),
        languages: strs(v.languages, 40),
      } as SiteContent[S];
    case 'rooms': {
      const given = Array.isArray(raw) ? (raw as Record<string, unknown>[]) : [];
      // always the four crafts, in their order; only the words change
      return SKILLS.map(key => {
        const base = d.rooms.find(r => r.key === key)!;
        const r = obj(given.find(x => obj(x).key === key));
        return {
          ...base,
          nav: str(r.nav, 40) || base.nav,
          plate: str(r.nav, 40) || base.plate,
          title: str(r.title, 80) || base.title,
          motto: str(r.motto, 120),
          lead: str(r.lead, 600),
          points: strs(r.points, 120),
          projects: list(
            r.projects,
            p => ({ title: str(p.title, 120), tag: str(p.tag, 160), kicker: str(p.kicker, 80), blurb: str(p.blurb, 800), chips: strs(p.chips, 40) }),
            p => !!p.title,
          ),
        };
      }) as SiteContent[S];
    }
    case 'story':
      return list(
        raw,
        x => {
          const range = str(x.range, 60);
          const section = str(x.section, 60);
          return { year: Math.round(Number(x.year)) || new Date().getFullYear(), range, date: range, title: str(x.title, 120), org: str(x.org, 160), points: strs(x.points, 400), ...(section ? { section } : {}) };
        },
        x => !!x.title,
      ) as SiteContent[S];
  }
  throw new Error('Unknown section');
}

// ---------- reading ----------

async function readStored(): Promise<Partial<SiteContent>> {
  if (!mongoConfigured()) return {};
  try {
    const doc = await (await db()).collection(COLLECTION).findOne({ _id: 'main' as unknown as never });
    if (!doc) return {};
    const out: Partial<SiteContent> = {};
    for (const s of SECTIONS) if (doc[s] !== undefined) (out as Record<string, unknown>)[s] = doc[s];
    return out;
  } catch (e) {
    console.error('Content: could not read MongoDB, using the starting values.', e);
    return {};
  }
}

/** The site's text: saved values where there are any, starting values elsewhere. Cached until a save. */
export const getContent = unstable_cache(
  async (): Promise<SiteContent> => ({ ...DEFAULT_CONTENT, ...(await readStored()) }),
  ['site-content'],
  { tags: ['content'], revalidate: 3600 },
);

/** Uncached, for the dashboard. */
export const getContentFresh = async (): Promise<SiteContent> => ({ ...DEFAULT_CONTENT, ...(await readStored()) });

// ---------- writing ----------

export async function saveSection<S extends Section>(section: S, raw: unknown, by: string) {
  const value = clean(section, raw);
  await (await db())
    .collection(COLLECTION)
    .updateOne({ _id: 'main' as unknown as never }, { $set: { [section]: value, updatedAt: new Date(), updatedBy: by } }, { upsert: true });
  return value;
}
