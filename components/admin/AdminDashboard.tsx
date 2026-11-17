'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, type DragEvent } from 'react';
import Logo from '@/components/Logo';
import ContentEditor, { type EditorView } from './ContentEditor';
import type { SkillKey } from '@/lib/content';

type Work = { id: string; name: string; src: string; w: number; h: number; title: string | null; order: number; poster?: string; secs?: number; film?: boolean };
type Craft = { key: SkillKey; name: string };
type Upload = { id: string; name: string; progress: number; status: 'waiting' | 'uploading' | 'done' | 'error'; error?: string };

const UNTITLED: Record<SkillKey, string> = { design: 'Design', photo: 'Frame', video: 'Reel', ai: 'AI film' };
const pad = (n: number) => String(n).padStart(2, '0');
const clock = (s = 0) => `${Math.floor(s / 60)}:${pad(s % 60)}`;
const thumb = (w: Work) => `${w.poster ?? w.src}?tr=w-480,q-70`;
const cleanName = (name: string) => {
  const dot = name.lastIndexOf('.');
  const ext = dot > 0 ? name.slice(dot).toLowerCase() : '';
  const base = (dot > 0 ? name.slice(0, dot) : name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'work';
  return base + ext;
};

/** Width, height (and length for videos), read in the browser before uploading. */
async function readMeta(file: File): Promise<{ w?: number; h?: number; secs?: number }> {
  const url = URL.createObjectURL(file);
  try {
    if (file.type.startsWith('video/')) {
      return await new Promise(res => {
        const v = document.createElement('video');
        v.preload = 'metadata';
        v.onloadedmetadata = () => res({ w: v.videoWidth, h: v.videoHeight, secs: Math.round(v.duration) });
        v.onerror = () => res({});
        v.src = url;
      });
    }
    const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
    return { w: bmp.width, h: bmp.height };
  } catch {
    return {};
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }
}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, { ...init, headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) } });
  const body = await r.json().catch(() => ({}));
  if (r.status === 401) {
    window.location.href = '/admin/login';
    throw new Error('Signed out');
  }
  if (!r.ok) throw new Error(body.error ?? `Request failed (${r.status})`);
  return body as T;
}

export default function AdminDashboard({ user, ready, crafts }: { user: string; ready: boolean; urlEndpoint: string; crafts: Craft[] }) {
  const router = useRouter();
  const [view, setView] = useState<'work' | EditorView>('work');
  const [craft, setCraft] = useState<SkillKey>(crafts[0].key);
  const [works, setWorks] = useState<Partial<Record<SkillKey, Work[]>>>({});
  const [loading, setLoading] = useState(false);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [toast, setToast] = useState<{ text: string; bad?: boolean } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const dragFrom = useRef<number | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const list = works[craft] ?? [];
  const settle = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Refresh the public pages now, and again once ImageKit's listing has caught up with the change. */
  const refreshSite = useCallback(() => {
    api('/api/admin/works', { method: 'POST' }).catch(() => {});
    if (settle.current) clearTimeout(settle.current);
    settle.current = setTimeout(() => api('/api/admin/works', { method: 'POST' }).catch(() => {}), 8000);
  }, []);

  const say = useCallback((text: string, bad = false) => {
    setToast({ text, bad });
    setTimeout(() => setToast(t => (t?.text === text ? null : t)), 3500);
  }, []);

  const load = useCallback(
    async (key: SkillKey) => {
      setLoading(true);
      try {
        const { works: w } = await api<{ works: Work[] }>(`/api/admin/works?craft=${key}`);
        setWorks(prev => ({ ...prev, [key]: w }));
      } catch (e) {
        say((e as Error).message, true);
      } finally {
        setLoading(false);
      }
    },
    [say],
  );

  // Load every craft once (for the counts), the open one first
  useEffect(() => {
    if (!ready) return;
    load(crafts[0].key).then(() => crafts.slice(1).forEach(c => load(c.key)));
  }, [ready, crafts, load]);

  // ---------- Upload: straight from the browser to ImageKit ----------
  async function uploadFiles(files: File[]) {
    const accepted = files.filter(f => f.type.startsWith('image/') || f.type.startsWith('video/'));
    if (accepted.length < files.length) say('Only images and videos can be uploaded.', true);
    if (!accepted.length) return;
    const target = craft;
    const startOrder = Math.max(0, ...(works[target] ?? []).map(w => (Number.isFinite(w.order) && w.order < 1e9 ? w.order : 0)));
    const jobs: Upload[] = accepted.map((f, i) => ({ id: `${Date.now()}-${i}`, name: f.name, progress: 0, status: 'waiting' }));
    setUploads(u => [...jobs, ...u]);
    const patch = (id: string, p: Partial<Upload>) => setUploads(u => u.map(x => (x.id === id ? { ...x, ...p } : x)));

    let ok = 0;
    for (const [i, file] of accepted.entries()) {
      const job = jobs[i];
      patch(job.id, { status: 'uploading' });
      try {
        const meta = await readMeta(file);
        const auth = await api<{ token: string; expire: number; signature: string; publicKey: string; folder: string }>(`/api/admin/upload-auth?craft=${target}`);
        const form = new FormData();
        form.append('file', file);
        form.append('fileName', cleanName(file.name));
        form.append('folder', auth.folder);
        form.append('useUniqueFileName', 'true');
        form.append('publicKey', auth.publicKey);
        form.append('signature', auth.signature);
        form.append('expire', String(auth.expire));
        form.append('token', auth.token);
        form.append('customMetadata', JSON.stringify({ order: startOrder + i + 1, ...meta }));
        const res = await new Promise<{ fileId: string; name: string; url: string; width?: number; height?: number }>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('POST', 'https://upload.imagekit.io/api/v1/files/upload');
          xhr.upload.onprogress = e => e.lengthComputable && patch(job.id, { progress: Math.round((e.loaded / e.total) * 100) });
          xhr.onload = () => {
            const body = JSON.parse(xhr.responseText || '{}');
            if (xhr.status >= 200 && xhr.status < 300) resolve(body);
            else reject(new Error(body.message ?? `Upload failed (${xhr.status})`));
          };
          xhr.onerror = () => reject(new Error('Network error while uploading'));
          xhr.send(form);
        });
        // if the browser couldn't read its size, use ImageKit's
        if (!meta.w && res.width && res.height) await api(`/api/admin/works/${res.fileId}`, { method: 'PATCH', body: JSON.stringify({ w: res.width, h: res.height }) });
        patch(job.id, { status: 'done', progress: 100 });
        ok++;
        // show it at once (ImageKit's listing can take a few seconds to include new files)
        const video = file.type.startsWith('video/');
        const added: Work = {
          id: res.fileId,
          name: res.name,
          src: res.url,
          w: meta.w || res.width || 1200,
          h: meta.h || res.height || 1500,
          title: null,
          order: startOrder + i + 1,
          ...(video ? { poster: `${res.url}/ik-thumbnail.jpg`, secs: meta.secs ?? 0 } : {}),
        };
        setWorks(prev => ({ ...prev, [target]: [...(prev[target] ?? []), added] }));
      } catch (e) {
        patch(job.id, { status: 'error', error: (e as Error).message });
      }
    }
    if (ok) {
      refreshSite();
      say(`${ok} ${ok === 1 ? 'piece' : 'pieces'} added to ${crafts.find(c => c.key === target)?.name}.`);
      setTimeout(() => setUploads(u => u.filter(x => x.status !== 'done')), 4000);
    }
  }

  // ---------- Edit ----------
  async function rename(w: Work, title: string) {
    if ((w.title ?? '') === title.trim()) return;
    setWorks(prev => ({ ...prev, [craft]: (prev[craft] ?? []).map(x => (x.id === w.id ? { ...x, title: title.trim() || null } : x)) }));
    try {
      await api(`/api/admin/works/${w.id}`, { method: 'PATCH', body: JSON.stringify({ title }) });
      refreshSite();
      say('Title saved.');
    } catch (e) {
      say((e as Error).message, true);
      load(craft);
    }
  }

  async function saveOrder(next: Work[]) {
    // positions 1, 2, 3…; send only the pieces whose position actually changed
    const orders = next.map((w, i) => ({ id: w.id, order: i + 1, was: w.order })).filter(o => o.order !== o.was).map(({ id, order }) => ({ id, order }));
    setWorks(prev => ({ ...prev, [craft]: next.map((w, i) => ({ ...w, order: i + 1 })) }));
    if (!orders.length) return;
    try {
      await api('/api/admin/works', { method: 'PUT', body: JSON.stringify({ orders }) });
      refreshSite();
      say('Order saved.');
    } catch (e) {
      say((e as Error).message, true);
      load(craft);
    }
  }

  function move(from: number, to: number) {
    if (to < 0 || to >= list.length || from === to) return;
    const next = [...list];
    const [w] = next.splice(from, 1);
    next.splice(to, 0, w);
    saveOrder(next);
  }

  /** Photographs: show on (or take off) the film strip in the hero. Up to eight. */
  async function toggleFilm(w: Work) {
    const on = !w.film;
    if (on && list.filter(x => x.film).length >= 8) return say('The film strip holds eight photos. Take one off first.', true);
    setWorks(prev => ({ ...prev, [craft]: (prev[craft] ?? []).map(x => (x.id === w.id ? { ...x, film: on } : x)) }));
    try {
      await api(`/api/admin/works/${w.id}`, { method: 'PATCH', body: JSON.stringify({ film: on ? 1 : 0 }) });
      refreshSite();
      say(on ? 'Added to the film strip.' : 'Taken off the film strip.');
    } catch (e) {
      say((e as Error).message, true);
      load(craft);
    }
  }

  async function remove(w: Work, index: number) {
    if (!confirm(`Delete "${w.title ?? `${UNTITLED[craft]} ${pad(index + 1)}`}"? This removes it from ImageKit and the site.`)) return;
    setWorks(prev => ({ ...prev, [craft]: (prev[craft] ?? []).filter(x => x.id !== w.id) }));
    try {
      await api(`/api/admin/works/${w.id}`, { method: 'DELETE' });
      refreshSite();
      say('Deleted.');
    } catch (e) {
      say((e as Error).message, true);
      load(craft);
    }
  }

  async function signOut() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.replace('/admin/login');
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) uploadFiles([...e.dataTransfer.files]);
  };

  return (
    <div className="min-h-screen">
      {/* top bar */}
      <header className="sticky top-0 z-30 border-b border-line bg-bg/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between gap-4 px-[clamp(16px,3vw,32px)]">
          <div className="flex items-center gap-3">
            <Logo variant="mark" width={48} />
            <div className="leading-tight">
              <p className="m-0 font-display text-[18px] whitespace-nowrap">Content studio</p>
              <p className="micro-caps m-0 hidden text-soft sm:block">Signed in as {user}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/work/${craft}`} target="_blank" className="label-caps rounded-full border border-line-strong px-3 py-2 whitespace-nowrap text-fg no-underline hover:bg-bg-2 sm:px-4">
              <span className="hidden sm:inline">View page</span><span className="sm:hidden">Site</span> ↗
            </Link>
            <button type="button" onClick={signOut} className="label-caps cursor-pointer rounded-full border-0 bg-fg px-3 py-2 whitespace-nowrap text-bg hover:opacity-90 sm:px-4">
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1280px] px-[clamp(16px,3vw,32px)] pt-8 pb-24">
        {/* what to edit */}
        <nav aria-label="Sections" className="-mx-1 mb-8 flex gap-1 overflow-x-auto border-b border-line pb-px">
          {(
            [
              ['work', 'Work'],
              ['crafts', 'Crafts'],
              ['story', 'Story'],
              ['about', 'About & contact'],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setView(k)}
              aria-current={view === k ? 'page' : undefined}
              className={`label-caps -mb-px shrink-0 cursor-pointer border-0 border-b-2 bg-transparent px-3 py-3 ${view === k ? 'border-rec text-fg' : 'border-transparent text-soft hover:text-fg'}`}
            >
              {label}
            </button>
          ))}
        </nav>

        {view !== 'work' ? (
          <ContentEditor view={view} say={say} />
        ) : (
        <>
        {!ready && (
          <p className="rounded-xl border border-rec/40 bg-rec/10 p-4 text-[14px]">
            ImageKit isn&apos;t set up on this server. Add IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY and NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT to the environment.
          </p>
        )}

        {/* crafts */}
        <nav aria-label="Crafts" className="flex flex-wrap gap-2">
          {crafts.map(c => (
            <button
              key={c.key}
              type="button"
              onClick={() => setCraft(c.key)}
              aria-pressed={craft === c.key}
              className={`label-caps flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2.5 transition ${craft === c.key ? 'border-fg bg-fg text-bg' : 'border-line-strong bg-transparent text-fg hover:bg-bg-2'}`}
            >
              {c.name}
              <span className={`rounded-full px-2 py-0.5 text-[11px] ${craft === c.key ? 'bg-bg/20' : 'bg-bg-2'}`}>{works[c.key]?.length ?? '…'}</span>
            </button>
          ))}
        </nav>

        {/* upload */}
        <section
          onDragOver={e => {
            e.preventDefault();
            if (dragFrom.current === null) setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`mt-6 flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition ${dragOver ? 'border-rec bg-rec/5' : 'border-line-strong'}`}
        >
          <p className="m-0 font-display text-[24px]">
            Add to <span className="serif-accent">{crafts.find(c => c.key === craft)?.name}</span>
          </p>
          <p className="m-0 max-w-[52ch] text-[13px] text-soft">Drop images or videos here, or choose them. They go straight to ImageKit and appear on the site within a few seconds, at the end of the list.</p>
          <button type="button" onClick={() => fileInput.current?.click()} disabled={!ready} className="label-caps mt-1 cursor-pointer rounded-full border-0 bg-fg px-5 py-2.5 text-bg hover:opacity-90 disabled:opacity-40">
            Choose files
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="image/*,video/*"
            multiple
            hidden
            onChange={e => {
              uploadFiles([...(e.target.files ?? [])]);
              e.target.value = '';
            }}
          />
        </section>

        {uploads.length > 0 && (
          <ul className="mt-4 grid list-none gap-2 p-0">
            {uploads.map(u => (
              <li key={u.id} className="rounded-lg border border-line bg-card px-4 py-3 text-[13px]">
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate">{u.name}</span>
                  <span className={`micro-caps shrink-0 ${u.status === 'error' ? 'text-rec' : 'text-soft'}`}>
                    {u.status === 'uploading' ? `${u.progress}%` : u.status === 'done' ? 'Added ✓' : u.status === 'error' ? 'Failed' : 'Waiting'}
                  </span>
                </div>
                {u.status !== 'error' ? (
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-bg-2">
                    <div className="h-full bg-rec transition-[width] duration-300" style={{ width: `${u.progress}%` }} />
                  </div>
                ) : (
                  <p className="m-0 mt-1 text-rec">{u.error}</p>
                )}
              </li>
            ))}
          </ul>
        )}

        {/* the pieces */}
        <div className="mt-10 flex items-end justify-between gap-4">
          <p className="micro-caps m-0 text-soft">
            {loading && !list.length ? 'Loading…' : `${list.length} pieces · drag to reorder · titles save when you press Enter or click away${craft === 'photo' ? ` · ★ ${list.filter(w => w.film).length}/8 on the hero's film strip` : ''}`}
          </p>
        </div>
        <ul className="mt-4 grid list-none grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3 sm:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] sm:gap-4 p-0">
          {list.map((w, i) => (
            <li
              key={w.id}
              draggable
              onDragStart={() => (dragFrom.current = i)}
              onDragEnd={() => (dragFrom.current = null)}
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                e.preventDefault();
                e.stopPropagation();
                if (dragFrom.current !== null) move(dragFrom.current, i);
                dragFrom.current = null;
              }}
              className="group flex cursor-grab flex-col overflow-hidden rounded-xl border border-line bg-card active:cursor-grabbing"
            >
              <div className="relative aspect-4/5 bg-bg-2">
                {/* eslint-disable-next-line @next/next/no-img-element -- small ImageKit thumbnail */}
                <img src={thumb(w)} alt="" loading="lazy" draggable={false} className="size-full object-cover" />
                <span className="micro-caps absolute top-2 left-2 rounded-full bg-[#140D0E]/80 px-2 py-1 text-[#F3EBE0]">{pad(i + 1)}</span>
                {w.poster && <span className="micro-caps absolute top-2 right-2 rounded-full bg-[#140D0E]/80 px-2 py-1 text-[#F3EBE0]">▶ {clock(w.secs)}</span>}
                {craft === 'photo' && (
                  <button
                    type="button"
                    onClick={() => toggleFilm(w)}
                    aria-pressed={!!w.film}
                    title={w.film ? 'On the film strip: click to take it off' : 'Show on the film strip in the hero'}
                    className={`micro-caps absolute top-2 right-2 cursor-pointer rounded-full border-0 px-2.5 py-1 ${w.film ? 'bg-rec text-white' : 'bg-[#140D0E]/70 text-[#F3EBE0] hover:bg-[#140D0E]/90'}`}
                  >
                    {w.film ? '★ Film strip' : '☆ Film strip'}
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-2 p-3">
                <input
                  defaultValue={w.title ?? ''}
                  placeholder={`Untitled · shows as “${UNTITLED[craft]} ${pad(i + 1)}”`}
                  aria-label="Title"
                  onBlur={e => rename(w, e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                  className="w-full rounded-md border border-line bg-bg px-2.5 py-2 text-[13px] text-fg outline-none focus:border-rec"
                />
                <div className="flex items-center justify-between gap-2">
                  <div className="flex gap-1">
                    <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label="Move earlier" className="grid size-8 cursor-pointer place-items-center rounded-md border border-line bg-transparent text-fg hover:bg-bg-2 disabled:opacity-30">
                      ←
                    </button>
                    <button type="button" onClick={() => move(i, i + 1)} disabled={i === list.length - 1} aria-label="Move later" className="grid size-8 cursor-pointer place-items-center rounded-md border border-line bg-transparent text-fg hover:bg-bg-2 disabled:opacity-30">
                      →
                    </button>
                  </div>
                  <button type="button" onClick={() => remove(w, i)} className="micro-caps cursor-pointer rounded-md border border-line bg-transparent px-2.5 py-2 text-rec hover:bg-rec/10">
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        </>
        )}
      </main>

      {toast && (
        <p role="status" className={`fixed bottom-6 left-1/2 z-40 m-0 -translate-x-1/2 rounded-full px-5 py-3 text-[13px] shadow-lg ${toast.bad ? 'bg-rec text-white' : 'bg-fg text-bg'}`}>
          {toast.text}
        </p>
      )}
    </div>
  );
}
