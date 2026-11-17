'use client';

import { useEffect, useState, type ReactNode } from 'react';
import type { Project, Room, SiteContent, SkillKey, StoryEntry } from '@/lib/content';

export type EditorView = 'crafts' | 'story' | 'about';
type Section = keyof SiteContent;

// ---------- small form pieces ----------

const input = 'mt-1.5 block w-full rounded-lg border border-line bg-bg px-3 py-2.5 text-[14px] leading-6 text-fg outline-none transition focus:border-rec focus:ring-2 focus:ring-rec/20';
const btn = 'label-caps cursor-pointer rounded-full border border-line-strong bg-transparent px-3.5 py-2 text-fg hover:bg-bg-2 disabled:cursor-default disabled:opacity-40';
const small = 'grid size-8 shrink-0 cursor-pointer place-items-center rounded-md border border-line bg-transparent text-fg hover:bg-bg-2 disabled:opacity-30';

function Field({ label, value, onChange, hint, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; hint?: string; type?: string }) {
  return (
    <label className="block min-w-0">
      <span className="micro-caps text-soft">{label}</span>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} className={input} />
      {hint && <span className="mt-1 block text-[12px] text-soft">{hint}</span>}
    </label>
  );
}

function Area({ label, value, onChange, rows = 3 }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <label className="block min-w-0">
      <span className="micro-caps text-soft">{label}</span>
      <textarea value={value} rows={rows} onChange={e => onChange(e.target.value)} className={`${input} resize-y`} />
    </label>
  );
}

/** A comma-separated list in one box: "Photoshop, Illustrator, Figma" */
function Tags({ label, value, onChange }: { label: string; value: string[]; onChange: (v: string[]) => void }) {
  const [text, setText] = useState(value.join(', '));
  useEffect(() => setText(value.join(', ')), [value]);
  return (
    <label className="block min-w-0">
      <span className="micro-caps text-soft">{label}</span>
      <input
        value={text}
        onChange={e => setText(e.target.value)}
        onBlur={() => onChange(text.split(',').map(s => s.trim()).filter(Boolean))}
        className={input}
      />
      <span className="mt-1 block text-[12px] text-soft">Separate with commas</span>
    </label>
  );
}

/** A list you can add to, remove from and reorder; each row renders its own fields. */
function List<T>({ label, items, onChange, make, render, addLabel = 'Add' }: { label: string; items: T[]; onChange: (v: T[]) => void; make: () => T; render: (item: T, set: (v: T) => void, i: number) => ReactNode; addLabel?: string }) {
  const move = (i: number, d: number) => {
    const next = [...items];
    const [x] = next.splice(i, 1);
    next.splice(i + d, 0, x);
    onChange(next);
  };
  return (
    <div className="min-w-0">
      <p className="micro-caps m-0 text-soft">{label}</p>
      <ol className="m-0 mt-2 grid list-none gap-3 p-0">
        {items.map((item, i) => (
          <li key={i} className="flex gap-3 rounded-xl border border-line bg-bg p-3">
            <div className="min-w-0 flex-1">{render(item, v => onChange(items.map((x, j) => (j === i ? v : x))), i)}</div>
            <div className="flex shrink-0 flex-col gap-1">
              <button type="button" className={small} disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up">↑</button>
              <button type="button" className={small} disabled={i === items.length - 1} onClick={() => move(i, 1)} aria-label="Move down">↓</button>
              <button type="button" className={`${small} text-rec`} onClick={() => onChange(items.filter((_, j) => j !== i))} aria-label="Remove">✕</button>
            </div>
          </li>
        ))}
      </ol>
      <button type="button" className={`${btn} mt-3`} onClick={() => onChange([...items, make()])}>
        + {addLabel}
      </button>
    </div>
  );
}

function Lines({ label, value, onChange, addLabel }: { label: string; value: string[]; onChange: (v: string[]) => void; addLabel?: string }) {
  return <List label={label} items={value} onChange={onChange} make={() => ''} addLabel={addLabel} render={(v, set) => <input value={v} onChange={e => set(e.target.value)} className={`${input} mt-0`} />} />;
}

function Card({ title, note, children, onSave, dirty, saving }: { title: string; note?: string; children: ReactNode; onSave: () => void; dirty: boolean; saving: boolean }) {
  return (
    <section className="rounded-2xl border border-line bg-card p-[clamp(16px,3vw,28px)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="m-0 text-[24px] leading-tight">{title}</h2>
          {note && <p className="m-0 mt-1 max-w-[60ch] text-[13px] text-soft">{note}</p>}
        </div>
        <button type="button" onClick={onSave} disabled={!dirty || saving} className="label-caps cursor-pointer rounded-full border-0 bg-fg px-5 py-2.5 text-bg hover:opacity-90 disabled:cursor-default disabled:opacity-35">
          {saving ? 'Saving…' : dirty ? 'Save changes' : 'Saved ✓'}
        </button>
      </div>
      <div className="mt-6 grid gap-5">{children}</div>
    </section>
  );
}

// ---------- the editor ----------

export default function ContentEditor({ view, say }: { view: EditorView; say: (text: string, bad?: boolean) => void }) {
  const [saved, setSaved] = useState<SiteContent | null>(null);
  const [draft, setDraft] = useState<SiteContent | null>(null);
  const [database, setDatabase] = useState(true);
  const [saving, setSaving] = useState<Section | null>(null);
  const [craft, setCraft] = useState<SkillKey>('design');

  useEffect(() => {
    fetch('/api/admin/content')
      .then(r => (r.status === 401 ? (window.location.href = '/admin/login') : r.json()))
      .then(d => {
        if (!d || typeof d !== 'object' || !('content' in d)) return;
        setSaved(d.content);
        setDraft(d.content);
        setDatabase(d.database);
      })
      .catch(() => say('Could not load the content.', true));
  }, [say]);

  // warn before leaving with unsaved changes
  const dirtyAny = !!draft && !!saved && JSON.stringify(draft) !== JSON.stringify(saved);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => dirtyAny && e.preventDefault();
    addEventListener('beforeunload', warn);
    return () => removeEventListener('beforeunload', warn);
  }, [dirtyAny]);

  if (!draft || !saved) return <p className="micro-caps text-soft">Loading…</p>;

  const dirty = (s: Section) => JSON.stringify(draft[s]) !== JSON.stringify(saved[s]);
  const set = <S extends Section>(s: S, v: SiteContent[S]) => setDraft(d => (d ? { ...d, [s]: v } : d));
  async function save(s: Section) {
    setSaving(s);
    try {
      const r = await fetch('/api/admin/content', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ section: s, value: draft![s] }) });
      const body = await r.json().catch(() => ({}));
      if (r.status === 401) return void (window.location.href = '/admin/login');
      if (!r.ok) throw new Error(body.error ?? 'Could not save');
      setSaved(prev => (prev ? { ...prev, [s]: body.value } : prev));
      setDraft(prev => (prev ? { ...prev, [s]: body.value } : prev));
      say('Saved. The site is updated.');
    } catch (e) {
      say((e as Error).message, true);
    } finally {
      setSaving(null);
    }
  }
  const card = (s: Section) => ({ dirty: dirty(s), saving: saving === s, onSave: () => save(s) });

  return (
    <div className="grid gap-6">
      {!database && (
        <p className="m-0 rounded-xl border border-rec/40 bg-rec/10 p-4 text-[14px]">The database isn&apos;t connected on this server (MONGODB_URI), so changes can&apos;t be saved yet.</p>
      )}

      {view === 'crafts' && <CraftEditor rooms={draft.rooms} craft={craft} setCraft={setCraft} onChange={v => set('rooms', v)} card={card('rooms')} />}

      {view === 'story' && (
        <Card title="My story" note="The timeline on the home page, newest first. A section heading (like “Education”) starts a new group above that entry." {...card('story')}>
          <List<StoryEntry>
            label="Entries"
            items={draft.story}
            onChange={v => set('story', v)}
            addLabel="Add entry"
            make={() => ({ year: new Date().getFullYear(), range: '', date: '', title: '', org: '', points: [] })}
            render={(e, setE) => (
              <div className="grid gap-3">
                <div className="grid gap-3 sm:grid-cols-[110px_1fr_1fr]">
                  <Field label="Year" type="number" value={String(e.year)} onChange={v => setE({ ...e, year: Number(v) })} />
                  <Field label="Dates" value={e.range} onChange={v => setE({ ...e, range: v, date: v })} hint="e.g. Jul 2026 — Present" />
                  <Field label="Section heading (optional)" value={e.section ?? ''} onChange={v => setE({ ...e, section: v })} />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Role / degree" value={e.title} onChange={v => setE({ ...e, title: v })} />
                  <Field label="Where" value={e.org} onChange={v => setE({ ...e, org: v })} />
                </div>
                <Lines label="Points" value={e.points} onChange={v => setE({ ...e, points: v })} addLabel="Add point" />
              </div>
            )}
          />
        </Card>
      )}

      {view === 'about' && (
        <>
          <Card title="Contact & details" note="Your name, contact details and links, used in the hero, contact section, footer and menus." {...card('site')}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="First name" value={draft.site.name} onChange={v => set('site', { ...draft.site, name: v })} />
              <Field label="Full name" value={draft.site.fullName} onChange={v => set('site', { ...draft.site, fullName: v })} />
              <Field label="Title" value={draft.site.title} onChange={v => set('site', { ...draft.site, title: v })} />
              <Field label="Location" value={draft.site.location} onChange={v => set('site', { ...draft.site, location: v })} />
              <Field label="Email" type="email" value={draft.site.email} onChange={v => set('site', { ...draft.site, email: v })} />
              <Field label="Phone" value={draft.site.phone} onChange={v => set('site', { ...draft.site, phone: v })} />
            </div>
            <List
              label="Links (footer “Elsewhere”; the first one is the contact button)"
              items={draft.site.socials}
              onChange={v => set('site', { ...draft.site, socials: v })}
              addLabel="Add link"
              make={() => ({ label: '', href: 'https://' })}
              render={(s, setS) => (
                <div className="grid gap-3 sm:grid-cols-[180px_1fr]">
                  <Field label="Name" value={s.label} onChange={v => setS({ ...s, label: v })} />
                  <Field label="Address" value={s.href} onChange={v => setS({ ...s, href: v })} />
                </div>
              )}
            />
          </Card>

          <Card title="“I am a …” words" note="The words that flip on the notebook card in the hero." {...card('roles')}>
            <List
              label="Words"
              items={draft.roles}
              onChange={v => set('roles', v)}
              addLabel="Add word"
              make={() => ({ article: 'a', word: '' })}
              render={(r, setR) => (
                <div className="grid grid-cols-[90px_1fr] gap-3">
                  <label className="block">
                    <span className="micro-caps text-soft">a / an</span>
                    <select value={r.article} onChange={e => setR({ ...r, article: e.target.value })} className={input}>
                      <option value="a">a</option>
                      <option value="an">an</option>
                    </select>
                  </label>
                  <Field label="Word" value={r.word} onChange={v => setR({ ...r, word: v })} />
                </div>
              )}
            />
          </Card>

          <Card title="Ability card" note="The card that opens from “My ability card” in the hero." {...card('ability')}>
            <List
              label="Abilities"
              items={draft.ability.abilities}
              onChange={v => set('ability', { ...draft.ability, abilities: v })}
              addLabel="Add ability"
              make={() => ({ skill: '', detail: '' })}
              render={(a, setA) => (
                <div className="grid gap-3 sm:grid-cols-[1fr_1.4fr]">
                  <Field label="Skill" value={a.skill} onChange={v => setA({ ...a, skill: v })} />
                  <Field label="Detail" value={a.detail} onChange={v => setA({ ...a, detail: v })} />
                </div>
              )}
            />
            <Tags label="Tools" value={draft.ability.tools} onChange={v => set('ability', { ...draft.ability, tools: v })} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Tags label="Certifications" value={draft.ability.certifications} onChange={v => set('ability', { ...draft.ability, certifications: v })} />
              <Tags label="Languages" value={draft.ability.languages} onChange={v => set('ability', { ...draft.ability, languages: v })} />
            </div>
          </Card>

          <Card title="What’s in a name?" note="The Adyssey section and the line under the logo on the loading screen." {...card('brand')}>
            <div className="grid gap-4 sm:grid-cols-[1fr_200px]">
              <Field label="Tagline" value={draft.brand.tagline} onChange={v => set('brand', { ...draft.brand, tagline: v })} />
              <Field label="Pronunciation" value={draft.brand.phonetic} onChange={v => set('brand', { ...draft.brand, phonetic: v })} />
            </div>
            <Lines label="Meanings (1, 2, 3 …)" value={draft.brand.senses} onChange={v => set('brand', { ...draft.brand, senses: v })} addLabel="Add meaning" />
            <Field label="Closing quote" value={draft.brand.signoff} onChange={v => set('brand', { ...draft.brand, signoff: v })} />
          </Card>
        </>
      )}
    </div>
  );
}

function CraftEditor({ rooms, craft, setCraft, onChange, card }: { rooms: Room[]; craft: SkillKey; setCraft: (k: SkillKey) => void; onChange: (v: Room[]) => void; card: { dirty: boolean; saving: boolean; onSave: () => void } }) {
  const room = rooms.find(r => r.key === craft)!;
  const setRoom = (r: Room) => onChange(rooms.map(x => (x.key === r.key ? r : x)));
  return (
    <Card title="Crafts" note="The words on each door and its Work page. The pieces themselves are under “Work”." {...card}>
      <div className="flex flex-wrap gap-2">
        {rooms.map(r => (
          <button key={r.key} type="button" onClick={() => setCraft(r.key)} aria-pressed={craft === r.key} className={`label-caps cursor-pointer rounded-full border px-4 py-2 ${craft === r.key ? 'border-fg bg-fg text-bg' : 'border-line-strong bg-transparent text-fg hover:bg-bg-2'}`}>
            {r.nav}
          </button>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name (menu & door)" value={room.nav} onChange={v => setRoom({ ...room, nav: v })} />
        <Field label="Page title" value={room.title} onChange={v => setRoom({ ...room, title: v })} />
      </div>
      <Field label="Line (shown on hover and as the page headline)" value={room.motto} onChange={v => setRoom({ ...room, motto: v })} hint="The words after a comma (or the last three) appear in red italics on the page." />
      <Area label="Introduction" value={room.lead} onChange={v => setRoom({ ...room, lead: v })} />
      <Lines label="What it covers" value={room.points} onChange={v => setRoom({ ...room, points: v })} addLabel="Add point" />
      <List<Project>
        label="Highlights (cards under the gallery)"
        items={room.projects}
        onChange={v => setRoom({ ...room, projects: v })}
        addLabel="Add highlight"
        make={() => ({ title: '', tag: '', kicker: '', blurb: '', chips: [] })}
        render={(p, setP) => (
          <div className="grid gap-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Title" value={p.title} onChange={v => setP({ ...p, title: v })} />
              <Field label="Client / where" value={p.tag} onChange={v => setP({ ...p, tag: v })} />
            </div>
            <Field label="Small label" value={p.kicker} onChange={v => setP({ ...p, kicker: v })} hint="e.g. Social · Automotive" />
            <Area label="Description" value={p.blurb} onChange={v => setP({ ...p, blurb: v })} />
            <Tags label="Tags" value={p.chips} onChange={v => setP({ ...p, chips: v })} />
          </div>
        )}
      />
    </Card>
  );
}
