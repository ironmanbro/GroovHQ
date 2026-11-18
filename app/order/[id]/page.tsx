'use client';
import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import Logo from '@/components/Logo';
import Beam, { Star } from '@/components/Beam';

type O = { number: number; status: string; table: string; total: number; type: string; lines: { name: string; qty: number; options: string[] }[] };
const STEPS = [['received', 'Received'], ['preparing', 'Preparing'], ['ready', 'Ready']] as const;
const COPY: Record<string, string> = { received: 'Your order is with the kitchen.', preparing: 'Our team is preparing your order.', ready: 'Your order is ready — it’s on its way to you.', served: 'Enjoy. Thank you for visiting GROOV HQ.', cancelled: 'This order was cancelled. Please speak to our team.' };

export default function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params); const [o, setO] = useState<O | null>(null); const [gone, setGone] = useState(false);
  useEffect(() => {
    let stop = false;
    const go = async () => { try { const r = await fetch(`/api/orders/${id}`, { cache: 'no-store' }); if (r.status === 404) return setGone(true); if (r.ok && !stop) setO(await r.json()); } catch {} };
    go(); const t = setInterval(go, 3000); return () => { stop = true; clearInterval(t); };
  }, [id]);
  const idx = o ? Math.max(0, STEPS.findIndex(s => s[0] === o.status)) : 0; const done = o && ['served'].includes(o.status);
  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden px-6 py-10">
      <div className="absolute inset-0 opacity-40" style={{ background: 'url(/brand/prism.webp) center bottom/cover' }} /><div className="absolute inset-0 bg-ink/70" /><Beam intensity={.6} />
      <div className="relative w-full max-w-md text-center">
        <Logo src="/brand/logo.png" className="h-8" />
        {gone ? <p className="mt-16 text-muted">We couldn’t find that order.</p> : !o ? <p className="mt-16 text-muted">Loading…</p> : <>
          <p className="mt-14 text-[10px] uppercase tracking-[.5em] text-muted">Order number</p>
          <p className="chrome-text font-display text-8xl leading-none">{o.number}</p>
          <p className="mt-3 text-xs uppercase tracking-[.3em] text-muted">{o.table ? `Table ${o.table}` : o.type}</p>
          {o.status !== 'cancelled' && (
            <ol className="mx-auto mt-10 flex max-w-xs items-center" aria-label="Order progress">
              {STEPS.map(([k, label], i) => (
                <li key={k} className="flex flex-1 flex-col items-center gap-2 text-[10px] uppercase tracking-[.2em]">
                  <span className={`grid h-9 w-9 place-items-center rounded-full border transition duration-700 ${i <= idx ? 'border-chrome bg-chrome text-ink' : 'border-gun text-gun'} ${i === idx && !done ? 'shadow-[0_0_28px_rgba(180,210,255,.55)]' : ''}`}>
                    {i <= idx ? <Star className="h-4 w-4" /> : i + 1}</span>
                  <span className={i <= idx ? 'text-chrome' : 'text-gun'}>{label}</span>
                </li>))}
            </ol>)}
          <p className="mt-8 text-[15px] text-silver" role="status">{COPY[o.status]}</p>
          <ul className="mx-auto mt-8 max-w-xs space-y-1 text-left text-sm text-muted">{o.lines.map((l, i) => <li key={i} className="flex justify-between"><span>{l.qty}× {l.name}</span></li>)}</ul>
          <p className="mt-4 text-sm text-silver">Total ₹{o.total.toFixed(2)} · pay at your table</p>
          <Link href="/?intro=0" className="mt-10 inline-block text-xs uppercase tracking-[.3em] text-muted underline underline-offset-8">Order more</Link>
        </>}
      </div>
    </main>);
}
