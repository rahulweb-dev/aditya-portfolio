import 'server-only';
import crypto from 'node:crypto';
import type { SkillKey } from '@/lib/content';

// ImageKit holds the work's images and videos, one folder per craft: <IMAGEKIT_FOLDER>/<craft>/.
// Each file carries its own details as custom metadata: title, order, w, h, secs.
// (When MongoDB arrives, titles and order can move there; the files stay on ImageKit.)

const PRIVATE = process.env.IMAGEKIT_PRIVATE_KEY ?? '';
const PUBLIC = process.env.IMAGEKIT_PUBLIC_KEY ?? '';
export const URL_ENDPOINT = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT ?? '';
export const FOLDER = process.env.IMAGEKIT_FOLDER ?? '/adyssey';
export const CRAFTS: SkillKey[] = ['design', 'photo', 'video', 'ai'];

export const configured = () => !!(PRIVATE && PUBLIC && URL_ENDPOINT);
const auth = () => 'Basic ' + Buffer.from(PRIVATE + ':').toString('base64');
export const folderOf = (craft: SkillKey) => `${FOLDER}/${craft}`;

export type Meta = { title?: string; order?: number; w?: number; h?: number; secs?: number; film?: number };
type IkFile = {
  fileId: string;
  name: string;
  url: string;
  fileType: 'image' | 'non-image';
  mime?: string;
  width?: number;
  height?: number;
  duration?: number;
  createdAt: string;
  customMetadata?: Meta;
};

/** One piece of work, as the site and the dashboard use it. */
export type Work = {
  id: string;
  name: string;
  src: string;
  w: number;
  h: number;
  title: string | null;
  order: number;
  poster?: string; // videos only: a frame ImageKit makes from the video
  secs?: number;
  film?: boolean; // photographs: shown on the hero's film strip
};

const isVideo = (f: IkFile) => f.mime?.startsWith('video/') || /\.(mp4|mov|webm|m4v)$/i.test(f.name);

function toWork(f: IkFile): Work {
  const m = f.customMetadata ?? {};
  const video = isVideo(f);
  return {
    id: f.fileId,
    name: f.name,
    src: f.url,
    w: m.w || f.width || 1200,
    h: m.h || f.height || 1500,
    title: m.title?.trim() || null,
    order: m.order ?? Number.MAX_SAFE_INTEGER,
    ...(m.film ? { film: true } : {}),
    ...(video ? { poster: `${f.url}/ik-thumbnail.jpg`, secs: Math.round(m.secs || f.duration || 0) } : {}),
  };
}

const sortWorks = (a: Work, b: Work) => a.order - b.order || a.name.localeCompare(b.name);

/** Everything in a craft's folder, in display order. Cached and refreshed when the dashboard changes something. */
export async function listWorks(craft: SkillKey, opts: { fresh?: boolean } = {}): Promise<Work[]> {
  if (!configured()) return [];
  const url = `https://api.imagekit.io/v1/files?path=${encodeURIComponent(folderOf(craft))}&type=file&limit=1000`;
  try {
    const r = await fetch(url, {
      headers: { Authorization: auth() },
      ...(opts.fresh ? { cache: 'no-store' as const } : { next: { revalidate: 300, tags: ['works'] } }),
    });
    if (!r.ok) throw new Error(`ImageKit list ${r.status}`);
    const files = (await r.json()) as IkFile[];
    return files.map(toWork).sort(sortWorks);
  } catch (e) {
    console.error(e);
    return [];
  }
}

/** Change a file's title, order or size. ImageKit merges this into its details; an empty title clears it. */
export async function updateWork(id: string, patch: Meta) {
  const meta: Record<string, string | number | null> = { ...patch };
  if (typeof patch.title === 'string' && !patch.title.trim()) meta.title = null;
  const r = await fetch(`https://api.imagekit.io/v1/files/${encodeURIComponent(id)}/details`, {
    method: 'PATCH',
    headers: { Authorization: auth(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ customMetadata: meta }),
  });
  if (!r.ok) throw new Error(`ImageKit update ${r.status}: ${await r.text()}`);
}

export async function deleteWork(id: string) {
  const r = await fetch(`https://api.imagekit.io/v1/files/${encodeURIComponent(id)}`, { method: 'DELETE', headers: { Authorization: auth() } });
  if (!r.ok && r.status !== 404) throw new Error(`ImageKit delete ${r.status}`);
}

/** One-time permission for the browser to upload a single file straight to ImageKit. */
export function uploadAuth() {
  const token = crypto.randomUUID();
  const expire = Math.floor(Date.now() / 1000) + 30 * 60; // 30 minutes (ImageKit allows under an hour)
  const signature = crypto.createHmac('sha1', PRIVATE).update(token + expire).digest('hex');
  return { token, expire, signature, publicKey: PUBLIC };
}
