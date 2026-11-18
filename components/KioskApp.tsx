'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Item, Menu } from '@/lib/types';
import Logo from './Logo';
import Beam, { Star } from './Beam';
import ItemCard from './ItemCard';
import { CartLine, ItemSheet, Stepper, submitOrder, toPayload } from './Sheets';

const IDLE_WARN = 45_000, IDLE_RESET = 60_000, DONE_RESET = 15_000;
const ease = [0.22, 1, 0.36, 1] as const;
type Screen = 'attract' | 'menu' | 'done';

export default function KioskApp({ menu }: { menu: Menu }) {
  const { settings, categories, items } = menu; const c = settings.currency;
  const [screen, setScreen] = useState<Screen>('attract');
  const [cart, setCart] = useState<CartLine[]>([]); const [cat, setCat] = useState(categories[0]?.id);
  const [open, setOpen] = useState<Item | null>(null); const [type, setType] = useState<'dine-in' | 'takeaway'>('dine-in');
  const [name, setName] = useState(''); const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); const [number, setNumber] = useState(0);
  const [warn, setWarn] = useState(false); const idle = useRef<ReturnType<typeof setTimeout>[]>([]);
  const glow = useRef<HTMLDivElement>(null);

  const reset = useCallback(() => { setCart([]); setName(''); setType('dine-in'); setOpen(null); setWarn(false); setErr(''); setScreen('attract'); setCat(categories[0]?.id); }, [categories]);
  const poke = useCallback(() => {
    idle.current.forEach(clearTimeout); setWarn(false);
    if (screen !== 'menu') return;
    idle.current = [setTimeout(() => setWarn(true), IDLE_WARN), setTimeout(reset, IDLE_RESET)];
  }, [screen, reset]);
  useEffect(() => { poke(); return () => idle.current.forEach(clearTimeout); }, [poke]);
  useEffect(() => { if (screen !== 'done') return; const t = setTimeout(reset, DONE_RESET); return () => clearTimeout(t); }, [screen, reset]);
  useEffect(() => { document.body.style.overscrollBehavior = 'none'; return () => { document.body.style.overscrollBehavior = ''; }; }, []);

  const sub = cart.reduce((s, l) => s + l.unit * l.qty, 0); const tax = Math.round(sub * settings.taxRate) / 100;
  const count = cart.reduce((s, l) => s + l.qty, 0);
  const add = (l: CartLine) => setCart(p => p.some(x => x.key === l.key) ? p.map(x => x.key === l.key ? { ...x, qty: Math.min(20, x.qty + l.qty) } : x) : [...p, l]);
  const setQty = (k: string, q: number) => setCart(p => q ? p.map(l => l.key === k ? { ...l, qty: q } : l) : p.filter(l => l.key !== k));

  async function place() {
    setBusy(true); setErr('');
    const r = await submitOrder({ source: 'kiosk', type, name, lines: toPayload(cart) });
    setBusy(false);
    if (!r.id) return setErr(r.error!);
    const o = await (await fetch(`/api/orders/${r.id}`)).json(); setNumber(o.number); setScreen('done');
  }
  const shown = items.filter(i => i.category === cat);

  return (
    <div className="fixed inset-0 select-none overflow-hidden bg-ink" onPointerDown={poke} style={{ touchAction: 'manipulation' }}
      onPointerMove={e => { if (glow.current) glow.current.style.transform = `translate(${e.clientX - 160}px, ${e.clientY - 160}px)`; }}>
      <div ref={glow} aria-hidden className="pointer-events-none absolute left-0 top-0 z-[60] h-80 w-80 rounded-full opacity-60 mix-blend-screen"
        style={{ background: 'radial-gradient(circle, rgba(170,200,255,.18), rgba(255,150,70,.06) 45%, transparent 70%)' }} />

      <AnimatePresence mode="wait">
        {screen === 'attract' && (
          <motion.button key="a" onClick={() => setScreen('menu')} aria-label="Touch to order" className="absolute inset-0 block h-full w-full text-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.04 }} transition={{ duration: 0.6, ease }}>
            <div className="absolute inset-0 opacity-70" style={{ background: 'url(/brand/prism.webp) center bottom/cover' }} />
            <div className="absolute inset-0 bg-gradient-to-b from-ink/70 via-ink/20 to-ink" />
            <motion.img src="/brand/intro-2.webp" alt="" aria-hidden className="absolute inset-y-0 right-0 h-full w-auto max-w-[70%] object-cover object-left"
              style={{ filter: 'brightness(1.5) contrast(1.1)', maskImage: 'linear-gradient(90deg, transparent, #000 40%)', WebkitMaskImage: 'linear-gradient(90deg, transparent, #000 40%)' }}
              animate={{ scale: [1, 1.03, 1] }} transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }} />
            <Beam intensity={.7} />
            <div className="relative flex h-full flex-col items-center justify-center px-8">
              <Logo src="/brand/logo.png" sweep className="h-16 sm:h-24" />
              <motion.span className="mt-14 flex items-center gap-3 text-sm uppercase tracking-[.5em] text-chrome" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2.6, repeat: Infinity }}>
                <Star className="h-4 w-4" /> Touch to order <Star className="h-4 w-4" />
              </motion.span>
              <p className="mt-4 text-[11px] uppercase tracking-[.4em] text-muted">Coffee · Kitchen · Culture</p>
            </div>
          </motion.button>)}

        {screen === 'menu' && (
          <motion.div key="m" className="absolute inset-0 flex" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
            {/* categories */}
            <nav className="no-scrollbar flex w-44 shrink-0 flex-col gap-1 overflow-y-auto border-r border-white/[.06] bg-char/60 p-3 pb-6" aria-label="Categories">
              <Logo src="/brand/logo.png" className="mx-2 mb-4 mt-2 h-6" />
              {categories.map(k => (
                <button key={k.id} onClick={() => setCat(k.id)} aria-current={cat === k.id}
                  className={`relative min-h-14 rounded-xl px-3 text-left text-[13px] font-medium uppercase tracking-[.12em] transition ${cat === k.id ? 'text-ink' : 'text-muted active:bg-white/5'}`}>
                  {cat === k.id && <motion.span layoutId="rail" className="absolute inset-0 rounded-xl bg-chrome" transition={{ duration: 0.35, ease }} />}
                  <span className="relative">{k.name}</span>
                </button>))}
            </nav>
            {/* items */}
            <main className="relative flex-1 overflow-y-auto p-5" key={cat}>
              <motion.div className="grid grid-cols-2 gap-4 xl:grid-cols-3" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease }}>
                {shown.map(i => <ItemCard key={i.id} item={i} currency={c} onOpen={() => setOpen(i)} />)}
              </motion.div>
            </main>
            {/* basket */}
            <aside className="relative flex w-[300px] shrink-0 flex-col border-l border-white/[.06] bg-char/80 xl:w-[340px]" aria-label="Your order">
              <Beam intensity={.35} />
              <div className="relative p-5 pb-2"><h2 className="font-display text-2xl">Your order</h2>
                <div className="mt-3 grid grid-cols-2 gap-1 rounded-full border border-gun/60 p-1" role="radiogroup" aria-label="Order type">
                  {(['dine-in', 'takeaway'] as const).map(t => <button key={t} role="radio" aria-checked={type === t} onClick={() => setType(t)}
                    className={`min-h-11 rounded-full text-[11px] font-semibold uppercase tracking-[.18em] ${type === t ? 'bg-chrome text-ink' : 'text-muted'}`}>{t === 'dine-in' ? 'Dine in' : 'Takeaway'}</button>)}
                </div></div>
              <ul className="relative flex-1 divide-y divide-white/5 overflow-y-auto px-5">
                {!cart.length && <li className="py-12 text-center text-sm text-muted">Tap a dish to begin.</li>}
                {cart.map(l => <li key={l.key} className="flex items-center gap-2 py-3">
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{l.name}</p>{!!l.options.length && <p className="truncate text-[11px] text-muted">{l.options.join(' · ')}</p>}<p className="text-xs text-silver">{c}{l.unit * l.qty}</p></div>
                  <Stepper qty={l.qty} set={q => setQty(l.key, q)} /></li>)}
              </ul>
              <div className="relative border-t border-white/[.06] p-5">
                <input value={name} onChange={e => setName(e.target.value.slice(0, 30))} placeholder="Name for your order" aria-label="Name"
                  className="mb-3 h-12 w-full rounded-xl border border-gun/70 bg-ink px-4 text-[16px] focus:border-silver focus:outline-none" />
                <div className="flex justify-between text-xs text-muted"><span>Subtotal</span><span>{c}{sub.toFixed(2)}</span></div>
                {settings.taxRate > 0 && <div className="flex justify-between text-xs text-muted"><span>{settings.taxLabel} {settings.taxRate}%</span><span>{c}{tax.toFixed(2)}</span></div>}
                <div className="mt-1 flex justify-between font-display text-xl"><span>Total</span><span className="chrome-text">{c}{(sub + tax).toFixed(2)}</span></div>
                {err && <p role="alert" className="mt-2 text-xs text-red-400">{err}</p>}
                <button disabled={!count || busy} onClick={place} className="mt-3 min-h-16 w-full rounded-full bg-gradient-to-b from-[#f4f4f4] to-[#b9bcbf] text-sm font-bold uppercase tracking-[.2em] text-ink disabled:opacity-40">
                  {busy ? 'Sending…' : `Place order · ${count}`}</button>
                <p className="mt-2 text-center text-[11px] text-muted">Pay at the counter</p>
                {!!count && <button onClick={() => setCart([])} className="mt-1 min-h-11 w-full text-[11px] uppercase tracking-[.3em] text-muted">Clear</button>}
              </div>
            </aside>
          </motion.div>)}

        {screen === 'done' && (
          <motion.div key="d" className="absolute inset-0 grid place-items-center text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 opacity-50" style={{ background: 'url(/brand/prism.webp) center bottom/cover' }} /><div className="absolute inset-0 bg-ink/70" /><Beam />
            <div className="relative px-8">
              <motion.div initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ duration: 0.7, ease }} className="mx-auto w-fit text-chrome"><Star className="h-14 w-14" /></motion.div>
              <p className="mt-6 text-[11px] uppercase tracking-[.5em] text-muted">Your order number</p>
              <p className="chrome-text font-display text-[9rem] leading-none">{number}</p>
              <p className="mx-auto mt-6 max-w-sm text-silver">Please pay at the counter. We’ll call your number when it’s ready.</p>
              <button onClick={reset} className="chrome-border mt-10 min-h-14 rounded-full px-10 text-xs uppercase tracking-[.4em] text-chrome">Done</button>
            </div>
          </motion.div>)}
      </AnimatePresence>

      <AnimatePresence>{open && <ItemSheet key="i" item={open} settings={settings} onClose={() => setOpen(null)} onAdd={add} />}</AnimatePresence>
      <AnimatePresence>{warn && screen === 'menu' && (
        <motion.div className="absolute inset-0 z-[70] grid place-items-center bg-ink/80 backdrop-blur" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="alertdialog" aria-label="Still there?">
          <div className="chrome-border rounded-3xl bg-char p-10 text-center"><p className="font-display text-3xl">Still there?</p>
            <p className="mt-2 text-sm text-muted">This screen will reset shortly.</p>
            <button onClick={poke} className="mt-6 min-h-14 rounded-full bg-chrome px-10 text-sm font-semibold uppercase tracking-[.2em] text-ink">Keep ordering</button></div>
        </motion.div>)}</AnimatePresence>
    </div>);
}
