import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/cms/auth';
import { getContentFresh, saveSection, SECTIONS, type Section } from '@/lib/cms/content';
import { mongoConfigured } from '@/lib/cms/mongo';

/** Everything editable, fresh from MongoDB (starting values where nothing is saved yet). */
export async function GET(req: Request) {
  const who = await requireAdmin(req);
  if ('error' in who) return who.error;
  return NextResponse.json({ content: await getContentFresh(), database: mongoConfigured() }, { headers: { 'Cache-Control': 'no-store' } });
}

/** Save one section: { section: 'story', value: [...] }. The site picks it up at once. */
export async function PUT(req: Request) {
  const who = await requireAdmin(req);
  if ('error' in who) return who.error;
  if (!mongoConfigured()) return NextResponse.json({ error: 'The database is not set up (MONGODB_URI).' }, { status: 503 });
  const { section, value } = (await req.json().catch(() => ({}))) as { section?: string; value?: unknown };
  if (!section || !SECTIONS.includes(section as Section)) return NextResponse.json({ error: 'Unknown section' }, { status: 400 });
  try {
    const saved = await saveSection(section as Section, value, who.user);
    revalidateTag('content');
    return NextResponse.json({ ok: true, value: saved });
  } catch (e) {
    return NextResponse.json({ error: `Could not save: ${(e as Error).message}` }, { status: 502 });
  }
}
