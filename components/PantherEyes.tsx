'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, animate, motion, useMotionValue, useSpring } from 'framer-motion';

/* The GROOV panther, always watching from the corner of the screen: two silver eyes glowing out of the dark.
   They follow the finger/cursor, glance along with scrolling, blink, widen when something is added to the basket,
   doze off when nobody is around, and a tap gets a recommendation. Pure SVG: no image weight. */
export type Tip = { text: string; itemId?: string };
const EYE = 'M-21 0 Q-3 -15 21 -1 Q2 13 -21 0Z';
const CX = [27, 77];

export default function PantherEyes({ tips, onOpenItem, reduced, pulse, lift }: { tips: Tip[]; onOpenItem: (id: string) => void; reduced: boolean; pulse: number; lift: boolean }) {
  const box = useRef<HTMLButtonElement>(null);
  const ix = useSpring(useMotionValue(0), { stiffness: 170, damping: 18 });
  const iy = useSpring(useMotionValue(0), { stiffness: 170, damping: 18 });
  const lid = useMotionValue(reduced ? 0 : 0.9);          // 0 open … 1 shut (starts half-asleep, then wakes)
  const pupil = useSpring(useMotionValue(2.6), { stiffness: 120, damping: 14 }); // rx of the slit; bigger = dilated
  const [chip, setChip] = useState<Tip | null>(null); const [n, setN] = useState(0);
  const last = useRef(Date.now()); const asleep = useRef(true); const lastPointer = useRef(0); const lastY = useRef(0);

  const wake = useCallback(() => {
    last.current = Date.now();
    if (asleep.current) { asleep.current = false; animate(lid, 0, { duration: 0.6, ease: 'easeOut' }); }
  }, [lid]);

  const look = useCallback((x: number, y: number) => {
    const r = box.current?.getBoundingClientRect(); if (!r) return;
    const dx = x - (r.left + r.width / 2), dy = y - (r.top + r.height / 2), d = Math.hypot(dx, dy) || 1, f = Math.min(1, d / 140);
    ix.set((dx / d) * 6.5 * f); iy.set((dy / d) * 4.5 * f); lastPointer.current = Date.now(); wake();
  }, [ix, iy, wake]);

  useEffect(() => {
    if (reduced) { lid.set(0); return; }
    const move = (e: PointerEvent) => look(e.clientX, e.clientY);
    const scroll = () => {
      const y = scrollY, dir = Math.sign(y - lastY.current); lastY.current = y; wake();
      if (Date.now() - lastPointer.current > 1500) { iy.set(dir * 4.5); setTimeout(() => iy.set(0), 700); }
    };
    addEventListener('pointermove', move, { passive: true }); addEventListener('pointerdown', move, { passive: true }); addEventListener('scroll', scroll, { passive: true });
    // blink loop + sleep after ~25s of nobody around
    let t: ReturnType<typeof setTimeout>;
    const loop = () => {
      t = setTimeout(async () => {
        if (!asleep.current) {
          if (Date.now() - last.current > 25000) { asleep.current = true; ix.set(0); iy.set(0); animate(lid, 0.92, { duration: 1.6, ease: 'easeInOut' }); }
          else { await animate(lid, 1, { duration: 0.09 }); animate(lid, 0, { duration: 0.16 }); }
        }
        loop();
      }, 2600 + Math.random() * 3800);
    };
    loop(); const open = setTimeout(wake, 600);
    return () => { removeEventListener('pointermove', move); removeEventListener('pointerdown', move); removeEventListener('scroll', scroll); clearTimeout(t); clearTimeout(open); };
  }, [reduced, look, wake, lid, ix, iy]);

  // Something added to the basket: eyes widen and the slits dilate for a moment.
  useEffect(() => {
    if (!pulse) return; wake(); pupil.set(6.5); animate(lid, -0.0, { duration: 0.1 }); const t = setTimeout(() => pupil.set(2.6), 900); return () => clearTimeout(t);
  }, [pulse, wake, pupil, lid]);

  useEffect(() => { if (!chip) return; const t = setTimeout(() => setChip(null), 7000); return () => clearTimeout(t); }, [chip]);

  function tap() {
    wake(); if (!reduced) { animate(lid, 1, { duration: 0.12 }).then(() => animate(lid, 0, { duration: 0.3 })); }
    if (chip) return setChip(null);
    if (!tips.length) return; setChip(tips[n % tips.length]); setN(n + 1);
  }

  return (
    <div className={`fixed right-3 z-30 transition-[bottom] duration-500 ${lift ? 'bottom-[calc(env(safe-area-inset-bottom)+5.25rem)]' : 'bottom-[calc(env(safe-area-inset-bottom)+1.1rem)]'}`}>
      <AnimatePresence>
        {chip && (
          <motion.div initial={{ opacity: 0, y: 8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6 }} transition={{ duration: 0.3 }}
            className="glass chrome-border absolute bottom-full right-0 mb-3 w-max max-w-[230px] rounded-2xl p-1">
            <button onClick={() => { if (chip.itemId) onOpenItem(chip.itemId); setChip(null); }} className="block min-h-11 w-full rounded-xl px-3.5 py-2.5 text-left text-[13px] leading-snug text-off">
              {chip.text}{chip.itemId && <span className="ml-1 text-silver">→</span>}
            </button>
          </motion.div>)}
      </AnimatePresence>

      <button ref={box} onClick={tap} aria-label="GROOV panther. Tap for a recommendation" className="relative block h-[46px] w-[104px] select-none outline-none focus-visible:ring-1 focus-visible:ring-chrome">
        <span aria-hidden className="pointer-events-none absolute -inset-5 rounded-full" style={{ background: 'radial-gradient(closest-side, rgba(5,5,5,.92) 40%, rgba(5,5,5,.55) 72%, transparent)' }} />
        <svg viewBox="0 0 104 46" className="relative h-full w-full overflow-visible" aria-hidden style={{ filter: 'drop-shadow(0 0 10px rgba(190,205,225,.28))' }}>
          <defs>
            <radialGradient id="pe-iris" cx="50%" cy="42%" r="60%"><stop offset="0" stopColor="#eef0f2" /><stop offset=".35" stopColor="#c9ced3" /><stop offset=".8" stopColor="#7d848a" /><stop offset="1" stopColor="#2a2d30" /></radialGradient>
            {CX.map((c, i) => <clipPath key={i} id={`pe-clip-${i}`}><path d={EYE} transform={`translate(${c} 23)`} /></clipPath>)}
          </defs>
          {CX.map((c, i) => (
            <g key={i} clipPath={`url(#pe-clip-${i})`}>
              <path d={EYE} transform={`translate(${c} 23)`} fill="#0b0b0c" />
              <g transform={`translate(${c} 23)`}>
                <motion.g style={{ x: ix, y: iy }}>
                  <circle r="11" fill="url(#pe-iris)" />
                  <motion.ellipse rx={pupil} ry="10" fill="#050505" />
                  <circle cx="-3.5" cy="-4" r="1.8" fill="#fff" opacity=".9" />
                </motion.g>
              </g>
              <motion.rect x={c - 24} y="7" width="48" height="32" fill="#050505" style={{ scaleY: lid, originY: 0 }} />
            </g>))}
          {CX.map((c, i) => <path key={i} d={EYE} transform={`translate(${c} 23)`} fill="none" stroke="#8e959b" strokeWidth=".8" opacity=".55" />)}
        </svg>
      </button>
    </div>);
}
