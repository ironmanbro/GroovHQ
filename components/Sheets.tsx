'use client';
import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import type { Item, Settings } from '@/lib/types';
import { Spice, Tags, VegMark } from './ItemCard';

export type CartLine = { key: string; id: string; name: string; options: string[]; unit: number; qty: number };
const ease = [0.22, 1, 0.36, 1] as const;

function Sheet({ onClose, label, children }: { onClose: () => void; label: string; children: React.ReactNode }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', k); document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', k); document.body.style.overflow = ''; };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={label}>
      <motion.div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
      <motion.div className="chrome-border relative max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-char sm:max-w-lg sm:rounded-3xl"
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ duration: 0.45, ease }}>
        <button onClick={onClose} aria-label="Close" className="glass absolute right-3 top-3 z-10 grid h-11 w-11 place-items-center rounded-full text-chrome">✕</button>
        {children}
      </motion.div>
    </div>
  );
}

export function ItemSheet({ item, settings, onClose, onAdd }: { item: Item; settings: Settings; onClose: () => void; onAdd: (l: CartLine) => void }) {
  const c = settings.currency;
  const [sel, setSel] = useState<Record<string, string[]>>(() =>
    Object.fromEntries((item.customisations ?? []).map(g => [g.name, g.type === 'single' ? [g.options[0].label] : []])));
  const [qty, setQty] = useState(1);
  const extras = useMemo(() => (item.customisations ?? []).flatMap(g => g.options.filter(o => sel[g.name]?.includes(o.label))), [sel, item]);
  const unit = item.price + extras.reduce((s, o) => s + o.price, 0);
  const toggle = (g: string, label: string, single: boolean) =>
    setSel(s => ({ ...s, [g]: single ? [label] : s[g].includes(label) ? s[g].filter(x => x !== label) : [...s[g], label] }));

  return (
    <Sheet onClose={onClose} label={item.name}>
      <div className="relative aspect-[4/3] w-full">
        <Image src={item.image} alt={item.name} fill sizes="(min-width:640px) 512px, 100vw" className="food-img object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-char via-transparent to-transparent" />
        <div className="absolute bottom-4 left-5 flex gap-1.5"><Tags item={item} /></div>
      </div>
      <div className="px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-2">
        <div className="flex items-start gap-3"><span className="mt-2"><VegMark veg={item.veg} /></span>
          <h2 className="flex-1 font-display text-3xl leading-tight">{item.name}</h2></div>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">{item.description}</p>
        <div className="mt-3 flex items-center gap-4"><span className="chrome-text font-display text-2xl">{c}{item.price}</span><Spice level={item.spice} /></div>

        {(item.customisations ?? []).map(g => (
          <fieldset key={g.name} className="mt-6">
            <legend className="mb-3 text-[11px] font-semibold uppercase tracking-[.3em] text-silver">{g.name}{g.type === 'multi' && <span className="ml-2 normal-case tracking-normal text-muted">optional</span>}</legend>
            <div className="flex flex-wrap gap-2">
              {g.options.map(o => {
                const on = sel[g.name]?.includes(o.label);
                return <button key={o.label} onClick={() => toggle(g.name, o.label, g.type === 'single')} aria-pressed={on}
                  className={`min-h-11 rounded-full border px-4 text-sm transition ${on ? 'border-chrome bg-chrome text-ink' : 'border-gun/70 text-off hover:border-silver'}`}>
                  {o.label}{o.price ? ` +${c}${o.price}` : ''}</button>;
              })}
            </div>
          </fieldset>
        ))}

        {settings.orderingEnabled && (item.available ? (
          <div className="mt-8 flex items-center gap-3">
            <Stepper qty={qty} set={setQty} min={1} />
            <button onClick={() => { onAdd({ key: `${item.id}|${extras.map(e => e.label).join(',')}`, id: item.id, name: item.name, options: extras.map(e => e.label), unit, qty }); onClose(); }}
              className="min-h-14 flex-1 rounded-full bg-gradient-to-b from-[#f4f4f4] to-[#b9bcbf] px-6 text-sm font-bold uppercase tracking-[.2em] text-ink shadow-[inset_0_1px_0_#fff,0_8px_24px_rgba(0,0,0,.5)] active:scale-[.98]">
              Add · {c}{unit * qty}
            </button>
          </div>
        ) : <p className="mt-8 rounded-2xl border border-gun/50 p-4 text-center text-sm text-muted">Unavailable today — please ask our team for alternatives.</p>)}
      </div>
    </Sheet>
  );
}

export function Stepper({ qty, set, min = 0 }: { qty: number; set: (n: number) => void; min?: number }) {
  return (
    <div className="flex h-14 items-center rounded-full border border-gun/70">
      <button aria-label="Decrease quantity" onClick={() => set(Math.max(min, qty - 1))} className="h-full w-12 text-xl text-chrome">−</button>
      <span className="w-6 text-center tabular-nums" aria-live="polite">{qty}</span>
      <button aria-label="Increase quantity" onClick={() => set(Math.min(20, qty + 1))} className="h-full w-12 text-xl text-chrome">+</button>
    </div>
  );
}

export async function submitOrder(body: object): Promise<{ id?: string; error?: string }> {
  try {
    const r = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const j = await r.json(); return r.ok ? { id: j.id } : { error: j.error || 'Could not place order.' };
  } catch { return { error: 'No connection. Please try again.' }; }
}
export const toPayload = (lines: CartLine[]) => lines.map(l => ({ id: l.id, qty: l.qty, options: l.options }));

export function CartSheet({ lines, settings, table, onQty, onClose, onClear, onPlaced }:
  { lines: CartLine[]; settings: Settings; table: string; onQty: (key: string, q: number) => void; onClose: () => void; onClear: () => void; onPlaced: (id: string, table: string) => void }) {
  const c = settings.currency;
  const [tbl, setTbl] = useState(table); const [note, setNote] = useState(''); const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const sub = lines.reduce((s, l) => s + l.unit * l.qty, 0);
  const tax = Math.round(sub * settings.taxRate) / 100;
  async function place() {
    if (!tbl.trim()) return setErr('Please enter your table number.');
    setBusy(true); setErr('');
    const r = await submitOrder({ source: 'table', table: tbl, note, lines: toPayload(lines) });
    setBusy(false); if (r.id) onPlaced(r.id, tbl); else setErr(r.error!);
  }
  return (
    <Sheet onClose={onClose} label="Your order">
      <div className="px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6">
        <h2 className="font-display text-3xl">Your order</h2>
        {settings.orderingDemo && <p className="mt-4 rounded-xl border border-gun/60 bg-ink/50 px-4 py-3 text-xs leading-relaxed text-muted"><b className="text-chrome">Demo ordering.</b> Orders are not sent to the kitchen yet.</p>}
        {!lines.length ? <p className="py-12 text-center text-muted">Your basket is empty.</p> : (
          <ul className="mt-5 divide-y divide-white/5">
            {lines.map(l => (
              <li key={l.key} className="flex items-center gap-3 py-4">
                <div className="flex-1"><p className="font-medium">{l.name}</p>
                  {!!l.options.length && <p className="text-xs text-muted">{l.options.join(' · ')}</p>}
                  <p className="mt-1 text-sm text-silver">{c}{l.unit * l.qty}</p></div>
                <Stepper qty={l.qty} set={q => onQty(l.key, q)} />
              </li>
            ))}
          </ul>
        )}
        {!!lines.length && <>
          <div className="hairline my-4" />
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between text-muted"><dt>Subtotal</dt><dd>{c}{sub.toFixed(2)}</dd></div>
            {settings.taxRate > 0 && <div className="flex justify-between text-muted"><dt>{settings.taxLabel} ({settings.taxRate}%)</dt><dd>{c}{tax.toFixed(2)}</dd></div>}
            <div className="flex justify-between font-display text-xl"><dt>Total</dt><dd className="chrome-text">{c}{(sub + tax).toFixed(2)}</dd></div>
          </dl>
          <div className="mt-5 grid grid-cols-[96px_1fr] gap-2">
            <input value={tbl} onChange={e => setTbl(e.target.value.replace(/[^\w-]/g, '').slice(0, 8))} placeholder="Table" aria-label="Table number" inputMode="text"
              className="h-12 rounded-xl border border-gun/70 bg-ink px-3 text-center text-[16px] focus:border-silver focus:outline-none" />
            <input value={note} onChange={e => setNote(e.target.value)} maxLength={140} placeholder="Notes (allergies, less spicy…)" aria-label="Notes"
              className="h-12 rounded-xl border border-gun/70 bg-ink px-4 text-[16px] focus:border-silver focus:outline-none" />
          </div>
          {err && <p role="alert" className="mt-3 text-sm text-red-400">{err}</p>}
          <button onClick={place} disabled={busy} className="mt-5 min-h-14 w-full rounded-full bg-gradient-to-b from-[#f4f4f4] to-[#b9bcbf] text-sm font-bold uppercase tracking-[.2em] text-ink disabled:opacity-60">
            {busy ? 'Sending…' : 'Place order'}</button>
          <p className="mt-3 text-center text-xs text-muted">Pay at your table — our team will bring the bill.</p>
          <button onClick={onClear} className="mt-1 min-h-11 w-full text-xs uppercase tracking-[.3em] text-muted">Clear basket</button>
        </>}
      </div>
    </Sheet>
  );
}
