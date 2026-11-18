'use client';
import { useState } from 'react';

export default function Login() {
  const [pw, setPw] = useState(''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr('');
    const r = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: pw }) });
    if (r.ok) location.href = new URLSearchParams(location.search).get('next') === 'kitchen' ? '/kitchen' : '/admin'; else { setErr((await r.json()).error || 'Login failed'); setBusy(false); }
  }
  return (
    <main className="grid min-h-dvh place-items-center p-6">
      <form onSubmit={submit} className="chrome-border w-full max-w-sm rounded-3xl bg-char p-8">
        <h1 className="chrome-text font-display text-3xl">Admin</h1>
        <p className="mt-1 text-sm text-muted">GROOV HQ menu management</p>
        <input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="Password" autoFocus aria-label="Password"
          className="mt-6 h-12 w-full rounded-xl border border-gun bg-ink px-4 text-[16px] focus:border-silver focus:outline-none" />
        {err && <p role="alert" className="mt-3 text-sm text-red-400">{err}</p>}
        <button disabled={busy} className="mt-6 h-12 w-full rounded-xl bg-chrome font-semibold text-ink disabled:opacity-60">{busy ? 'Checking…' : 'Sign in'}</button>
      </form>
    </main>
  );
}
