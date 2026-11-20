'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import type { Item, Menu } from '@/lib/types';
import Intro from './Intro';
import Logo from './Logo';
import Beam from './Beam';
import PantherEyes, { Tip } from './PantherEyes';
import ItemCard from './ItemCard';
import { CartLine, CartSheet, ItemSheet } from './Sheets';

const INTRO_KEY = 'groov-intro-seen';
const CART_KEY = 'groov-cart';
type Diet = 'all' | 'veg' | 'non';
const ss = { get: (k: string) => { try { return sessionStorage.getItem(k); } catch { return null; } },
             set: (k: string, v: string) => { try { sessionStorage.setItem(k, v); } catch {} } };

export default function MenuApp({ menu }: { menu: Menu }) {
  const { settings, categories, items } = menu;
  const params = useSearchParams(); const router = useRouter();
  const [intro, setIntro] = useState<'pending' | 'show' | 'done'>('pending');
  const [reduced, setReduced] = useState(false);
  const [diet, setDiet] = useState<Diet>('all');
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState<Item | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [active, setActive] = useState(categories[0]?.id);
  const [table, setTable] = useState('');
  const [pulse, setPulse] = useState(0);
  const navRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const rm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setReduced(rm);
    setIntro(ss.get(INTRO_KEY) || params.get('intro') === '0' ? 'done' : 'show');
    const t = (params.get('table') || params.get('t') || ss.get('groov-table') || '').replace(/[^\w-]/g, '').slice(0, 8);
    if (t) { setTable(t); ss.set('groov-table', t); }
    try { setCart(JSON.parse(ss.get(CART_KEY) || '[]')); } catch {}
  }, [params]);
  useEffect(() => { ss.set(CART_KEY, JSON.stringify(cart)); }, [cart]);

  const finishIntro = useCallback(() => { ss.set(INTRO_KEY, '1'); setIntro('done'); window.scrollTo(0, 0); }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(i => (diet === 'all' || (diet === 'veg') === i.veg) && (!q || `${i.name} ${i.description}`.toLowerCase().includes(q)));
  }, [items, diet, query]);
  const sections = categories.map(c => ({ ...c, items: filtered.filter(i => i.category === c.id) })).filter(s => s.items.length);

  // Active category tracking
  useEffect(() => {
    const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && setActive(e.target.id.replace('cat-', ''))),
      { rootMargin: '-35% 0px -60% 0px' });
    document.querySelectorAll('section[id^="cat-"]').forEach(s => io.observe(s));
    return () => io.disconnect();
  }, [sections.length, diet, query]);
  useEffect(() => {
    const nav = navRef.current; const el = nav?.querySelector<HTMLElement>(`[data-cat="${active}"]`);
    if (nav && el) nav.scrollTo({ left: el.offsetLeft - nav.clientWidth / 2 + el.clientWidth / 2, behavior: reduced ? 'auto' : 'smooth' });
  }, [active, reduced]);

  const go = (id: string) => {
    setActive(id);
    const el = document.getElementById(`cat-${id}`); const h = document.querySelector('header')?.offsetHeight ?? 0;
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - h + 24, behavior: reduced ? 'auto' : 'smooth' });
  };
  const add = (l: CartLine) => { setPulse(p => p + 1); setCart(c => c.some(x => x.key === l.key) ? c.map(x => x.key === l.key ? { ...x, qty: Math.min(20, x.qty + l.qty) } : x) : [...c, l]); };
  const count = cart.reduce((s, l) => s + l.qty, 0);
  const total = cart.reduce((s, l) => s + l.unit * l.qty, 0);
  const picks = items.filter(i => i.available && (i.bestseller || i.chefSpecial));
  const tips: Tip[] = [...picks.map(i => ({ text: `${i.chefSpecial ? 'Chef’s special' : 'Bestseller'}: ${i.name} — ${settings.currency}${i.price}`, itemId: i.id })),
    { text: 'Tap any dish for a closer look and options.' }, { text: 'Prefer vegetarian? Use the Veg filter up top.' }, { text: 'Hungry? Burgers & Pizza are a swipe away.' }];
  let n = 0;

  return (
    <>
      <AnimatePresence>
        {intro === 'show' && <Intro key="intro" logo={settings.logo} reduced={reduced} onDone={finishIntro} />}
      </AnimatePresence>
      {intro === 'pending' && <div className="fixed inset-0 z-[100] bg-ink" />}

      <header className="glass sticky top-0 z-40 border-b border-white/[.06] pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4">
          <a href="#top" aria-label="GROOV HQ home"><Logo src={settings.logo} className="h-6" /></a>
          {table && <span className="ml-1 rounded-full border border-gun/70 px-2.5 py-1 text-[10px] uppercase tracking-[.25em] text-muted">Table {table}</span>}
          <div className="flex-1" />
          <button aria-label="Search menu" onClick={() => { setSearching(s => !s); setTimeout(() => searchRef.current?.focus(), 50); }}
            className="grid h-11 w-11 place-items-center rounded-full text-chrome hover:bg-white/5">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          </button>
          {settings.orderingEnabled && (
            <button aria-label={`Basket, ${count} items`} onClick={() => setCartOpen(true)} className="relative grid h-11 w-11 place-items-center rounded-full text-chrome hover:bg-white/5">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 8h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8L5 8Z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></svg>
              {!!count && <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-chrome px-1 text-[9px] font-bold text-ink">{count}</span>}
            </button>
          )}
        </div>
        {searching && (
          <div className="mx-auto max-w-6xl px-4 pb-3">
            <input ref={searchRef} value={query} onChange={e => setQuery(e.target.value)} placeholder="Search coffee, burgers, desserts…" type="search" aria-label="Search the menu"
              className="h-12 w-full rounded-full border border-gun/70 bg-ink/70 px-5 text-[16px] text-off placeholder:text-muted/60 focus:border-silver focus:outline-none" />
          </div>
        )}
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 pb-3">
          <div ref={navRef} className="no-scrollbar flex flex-1 gap-1 overflow-x-auto" role="tablist" aria-label="Menu categories">
            {sections.map(s => (
              <button key={s.id} data-cat={s.id} role="tab" aria-selected={active === s.id} onClick={() => go(s.id)}
                className={`relative min-h-10 shrink-0 whitespace-nowrap rounded-full px-4 text-[12px] font-medium uppercase tracking-[.14em] transition-colors ${active === s.id ? 'text-ink' : 'text-muted hover:text-chrome'}`}>
                {active === s.id && <motion.span layoutId="pill" className="absolute inset-0 rounded-full bg-chrome shadow-[0_0_22px_rgba(150,190,255,.35),0_4px_14px_rgba(255,140,60,.18)]" transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} />}
                <span className="relative">{s.name}</span></button>
            ))}
          </div>
        </div>
        <div className="mx-auto flex max-w-6xl gap-1 px-4 pb-3" role="radiogroup" aria-label="Dietary filter">
          {([['all', 'All'], ['veg', 'Veg'], ['non', 'Non-veg']] as const).map(([k, l]) => (
            <button key={k} role="radio" aria-checked={diet === k} onClick={() => setDiet(k)}
              className={`min-h-9 rounded-full border px-3.5 text-[11px] uppercase tracking-[.18em] transition ${diet === k ? 'border-silver text-chrome' : 'border-transparent text-muted'}`}>
              {k !== 'all' && <span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${k === 'veg' ? 'bg-emerald-500' : 'bg-red-500'}`} />}{l}
            </button>
          ))}
        </div>
      </header>

      <main id="top" className="mx-auto max-w-6xl px-4 pb-32">
        <section className="chrome-border relative mt-6 overflow-hidden rounded-3xl bg-ink px-6 py-14 text-center sm:py-20">
          <div aria-hidden className="absolute inset-0 opacity-70" style={{ background: 'url(/brand/prism.webp) center bottom/cover' }} />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-ink/55 via-ink/45 to-ink/80" /><Beam intensity={.45} />
          <div className="relative">
            <h1 className="sr-only">GROOV HQ — menu</h1>
            <Logo src={settings.logo} alt="" className="h-[calc(min(74vw,440px)/5.75)]" />
            <div className="hairline mx-auto mt-8 w-32" />
            <p className="chrome-text mt-6 font-display text-2xl leading-none sm:text-4xl">Crafted after dark.</p>
            <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-muted">Specialty coffee, kitchen plates and late-night indulgences. Tap any dish to explore.</p>
          </div>
        </section>

        {!sections.length && <p className="py-24 text-center text-muted">Nothing matches “{query}”. <button className="underline" onClick={() => { setQuery(''); setDiet('all'); }}>Clear filters</button></p>}

        {sections.map(s => (
          <section key={s.id} id={`cat-${s.id}`} className="scroll-mt-[190px] pt-12" aria-labelledby={`h-${s.id}`}>
            <div className="mb-6 flex items-center gap-4">
              <h2 id={`h-${s.id}`} className="chrome-text font-display text-[28px] leading-none sm:text-4xl">{s.name}</h2>
              <div className="hairline flex-1" /><span className="text-[10px] tracking-[.3em] text-gun">{String(s.items.length).padStart(2, '0')}</span>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {s.items.map(i => <ItemCard key={i.id} item={i} currency={settings.currency} onOpen={() => setOpen(i)} priority={n++ < 2} />)}
            </div>
          </section>
        ))}

        <footer className="mt-24 text-center">
          <div className="hairline mx-auto w-40" />
          <Logo src={settings.logo} className="mx-auto mt-8 h-7 opacity-80" />
          <Logo src="/brand/logo-hindi.png" alt="ग्रूव एच क्यु" className="mx-auto mt-5 block h-12 opacity-60" />
          <p className="mt-4 text-xs text-muted">Prices in INR, {settings.taxRate ? `${settings.taxLabel} ${settings.taxRate}% extra` : 'inclusive of taxes'}. Please inform our team of any allergies.</p>
        </footer>
      </main>

      {settings.orderingEnabled && count > 0 && !cartOpen && !open && (
        <button onClick={() => setCartOpen(true)}
          className="fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 mx-auto flex min-h-14 max-w-md items-center justify-between rounded-full bg-gradient-to-b from-[#f4f4f4] to-[#b9bcbf] px-6 text-ink shadow-[0_10px_40px_rgba(0,0,0,.7)]">
          <span className="text-sm font-bold uppercase tracking-[.2em]">View basket · {count}</span>
          <span className="font-display text-lg">{settings.currency}{total}</span>
        </button>
      )}

      {intro === 'done' && <PantherEyes tips={tips} reduced={reduced} pulse={pulse} lift={settings.orderingEnabled && count > 0 && !cartOpen && !open}
        onOpenItem={id => setOpen(items.find(i => i.id === id) ?? null)} />}

      <AnimatePresence>
        {open && <ItemSheet key="item" item={open} settings={settings} onClose={() => setOpen(null)} onAdd={add} />}
        {cartOpen && <CartSheet key="cart" lines={cart} settings={settings} table={table} onClose={() => setCartOpen(false)}
          onQty={(k, q) => setCart(c => q ? c.map(l => l.key === k ? { ...l, qty: q } : l) : c.filter(l => l.key !== k))} onClear={() => setCart([])}
          onPlaced={(id, t) => { ss.set('groov-table', t); setCart([]); setCartOpen(false); router.push(`/order/${id}`); }} />}
      </AnimatePresence>
    </>
  );
}
