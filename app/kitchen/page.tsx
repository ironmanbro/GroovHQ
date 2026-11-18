'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Order, Status } from '@/lib/orders';

const NEXT: Record<string, [Status, string]> = { received: ['preparing', 'Start preparing'], preparing: ['ready', 'Mark ready'], ready: ['served', 'Served'] };
const ago = (t: number) => { const m = Math.floor((Date.now() - t) / 60000); return m < 1 ? 'just now' : `${m} min`; };

export default function Kitchen() {
  const [orders, setOrders] = useState<Order[]>([]); const [sound, setSound] = useState(false); const [, tick] = useState(0);
  const seen = useRef<Set<string> | null>(null); const ctx = useRef<AudioContext | null>(null);

  const load = useCallback(async () => {
    const r = await fetch('/api/admin/orders', { cache: 'no-store' }); if (!r.ok) return;
    const all: Order[] = await r.json(); const ids = new Set(all.map(o => o.id));
    if (seen.current && all.some(o => !seen.current!.has(o.id)) && ctx.current) {
      const o = ctx.current.createOscillator(), g = ctx.current.createGain(); o.frequency.value = 880; g.gain.value = 0.15;
      o.connect(g); g.connect(ctx.current.destination); o.start(); o.stop(ctx.current.currentTime + 0.35);
    }
    seen.current = ids; setOrders(all);
  }, []);
  useEffect(() => { load(); const a = setInterval(load, 3000), b = setInterval(() => tick(x => x + 1), 30000); return () => { clearInterval(a); clearInterval(b); }; }, [load]);

  async function move(id: string, status: Status) {
    setOrders(os => os.map(o => o.id === id ? { ...o, status } : o));
    await fetch('/api/admin/orders', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) }); load();
  }
  const cols: [string, Status[]][] = [['New', ['received']], ['Preparing', ['preparing']], ['Ready', ['ready']]];
  return (
    <main className="min-h-dvh p-4">
      <div className="mb-4 flex items-center gap-3">
        <h1 className="chrome-text font-display text-3xl">Kitchen</h1><div className="flex-1" />
        <button onClick={() => { if (!sound) ctx.current = new AudioContext(); else ctx.current?.close(); setSound(!sound); }} className="min-h-11 rounded-full border border-gun px-4 text-xs uppercase tracking-widest">{sound ? 'Sound on' : 'Enable sound'}</button>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {cols.map(([title, sts]) => {
          const list = orders.filter(o => sts.includes(o.status)).sort((a, b) => a.createdAt - b.createdAt);
          return (
            <section key={title}>
              <h2 className="mb-3 text-xs uppercase tracking-[.3em] text-muted">{title} · {list.length}</h2>
              <div className="space-y-3">
                {list.map(o => (
                  <article key={o.id} className="chrome-border rounded-2xl bg-char p-4">
                    <div className="flex items-baseline gap-2">
                      <span className="font-display text-2xl">#{o.number}</span>
                      <span className="rounded-full border border-gun px-2 py-0.5 text-[10px] uppercase tracking-widest">{o.source === 'kiosk' ? `Kiosk · ${o.type}` : `Table ${o.table || '?'}`}</span>
                      <span className="ml-auto text-xs text-muted">{ago(o.createdAt)}</span>
                    </div>
                    {o.name && <p className="text-sm text-silver">{o.name}</p>}
                    <ul className="mt-3 space-y-1 text-sm">{o.lines.map((l, i) => <li key={i}><b>{l.qty}×</b> {l.name}{l.options.length ? <span className="text-muted"> · {l.options.join(', ')}</span> : null}</li>)}</ul>
                    {o.note && <p className="mt-2 text-xs text-amber-300">Note: {o.note}</p>}
                    <p className="mt-3 text-xs text-muted">Total ₹{o.total.toFixed(2)} · collect payment</p>
                    <div className="mt-3 flex gap-2">
                      {NEXT[o.status] && <button onClick={() => move(o.id, NEXT[o.status][0])} className="min-h-12 flex-1 rounded-full bg-chrome text-sm font-semibold text-ink">{NEXT[o.status][1]}</button>}
                      <button onClick={() => confirm('Cancel this order?') && move(o.id, 'cancelled')} className="min-h-12 px-4 text-xs text-red-400">Cancel</button>
                    </div>
                  </article>))}
                {!list.length && <p className="rounded-2xl border border-dashed border-gun/40 p-6 text-center text-sm text-muted">Nothing here</p>}
              </div>
            </section>);
        })}
      </div>
    </main>);
}
