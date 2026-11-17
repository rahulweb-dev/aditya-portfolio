'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState, type FormEvent } from 'react';

const field = 'mt-2 block w-full rounded-lg border border-[#F3EBE0]/20 bg-[#1E1214] px-4 py-3 text-[15px] text-[#F3EBE0] outline-none transition focus:border-[#FF5A48] focus:ring-2 focus:ring-[#FF5A48]/30';

function Form() {
  const router = useRouter();
  const next = useSearchParams().get('next');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const r = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    if (r.ok) {
      router.replace(next?.startsWith('/admin') ? next : '/admin');
      router.refresh();
      return;
    }
    setError(((await r.json().catch(() => ({}))) as { error?: string }).error ?? 'Could not sign in.');
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="mt-10 flex flex-col gap-5">
      <label className="micro-caps text-[#C2B3A8]">
        Username
        <input name="username" autoComplete="username" required autoFocus className={field} />
      </label>
      <label className="micro-caps text-[#C2B3A8]">
        Password
        <input name="password" type="password" autoComplete="current-password" required className={field} />
      </label>
      {error && (
        <p role="alert" className="m-0 rounded-lg border border-[#FF5A48]/40 bg-[#FF5A48]/10 px-4 py-3 text-[13px] text-[#FFB4AA]">
          {error}
        </p>
      )}
      <button type="submit" disabled={busy} className="label-caps mt-2 min-h-12 cursor-pointer rounded-full border-0 bg-[#F3EBE0] px-6 text-[#140D0E] transition hover:bg-white disabled:cursor-wait disabled:opacity-60">
        {busy ? 'Signing in…' : 'Sign in →'}
      </button>
    </form>
  );
}

export default function LoginForm() {
  return (
    <Suspense>
      <Form />
    </Suspense>
  );
}
