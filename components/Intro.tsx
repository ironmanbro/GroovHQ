'use client';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Logo from './Logo';

type Props = { logo: string; reduced: boolean; onDone: () => void };
const ease = [0.22, 1, 0.36, 1] as const;

export default function Intro({ logo, reduced, onDone }: Props) {
  const [ready, setReady] = useState(reduced);
  const [sound, setSound] = useState(false);
  const audio = useRef<AudioContext | null>(null);

  useEffect(() => { if (reduced) return; const t = setTimeout(() => setReady(true), 2600); return () => clearTimeout(t); }, [reduced]);
  useEffect(() => () => { audio.current?.close(); }, []);

  // Optional ambient drone, synthesised (no download). Off by default.
  function toggleSound() {
    if (sound) { audio.current?.close(); audio.current = null; setSound(false); return; }
    const ctx = new AudioContext(); audio.current = ctx;
    const gain = ctx.createGain(); gain.gain.value = 0; gain.connect(ctx.destination);
    gain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 1.5);
    [55, 82.4, 110.2].forEach((f, i) => { const o = ctx.createOscillator(); o.type = i ? 'sine' : 'triangle'; o.frequency.value = f; o.connect(gain); o.start(); });
    setSound(true);
  }

  return (
    <motion.div className="fixed inset-0 z-[100] overflow-hidden bg-ink" role="dialog" aria-label="GROOV HQ introduction"
      exit={{ opacity: 0, scale: 1.04, filter: 'blur(8px)' }} transition={{ duration: 0.7, ease }}>
      {/* the prism light slowly rises out of the black */}
      <motion.div aria-hidden className="absolute inset-0" style={{ background: 'url(/brand/prism.webp) center bottom/cover' }}
        initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} transition={{ duration: 2.2, ease: 'easeOut' }} />
      <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(70% 50% at 50% 48%, transparent 30%, rgba(5,5,5,.75) 100%)' }} />

      {/* a single chrome light streak crosses the frame, then the logo resolves */}
      {!reduced && (
        <motion.div aria-hidden className="pointer-events-none absolute left-0 top-1/2 h-px w-[60vw]"
          style={{ background: 'linear-gradient(90deg, transparent, #E5E5E5, transparent)', boxShadow: '0 0 24px 4px rgba(229,229,229,.35)' }}
          initial={{ x: '-70vw', opacity: 0 }} animate={{ x: '120vw', opacity: [0, 1, 1, 0] }}
          transition={{ duration: 1.3, delay: 0.5, ease: [0.7, 0, 0.3, 1] }} />
      )}

      <div className="absolute inset-0 flex flex-col items-center justify-center px-8">
        <motion.div initial={{ opacity: 0, scale: 0.92, filter: 'blur(10px)' }} animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          transition={{ duration: 1.2, ease, delay: reduced ? 0 : 1.1 }}>
          <Logo src={logo} sweep={!reduced} sweepDelay={1.9} className="h-[calc(min(80vw,560px)/5.75)]" />
        </motion.div>
        <motion.div className="hairline mt-10 w-44" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1, delay: reduced ? 0 : 1.7, ease }} />
        <motion.p className="mt-5 text-[11px] uppercase tracking-[.5em] text-muted" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: reduced ? 0 : 1.9 }}>
          Coffee · Kitchen · Culture
        </motion.p>
        <div className="mt-12 h-[52px]"><AnimatePresence>
          {ready && (
            <motion.button onClick={onDone} autoFocus initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }}
              className="chrome-border rounded-full px-9 py-4 text-xs font-semibold uppercase tracking-[.4em] text-chrome transition hover:bg-white/5 active:scale-[.98]">
              Enter GROOV HQ
            </motion.button>
          )}
        </AnimatePresence></div>
      </div>

      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <button onClick={toggleSound} aria-pressed={sound} className="min-h-11 px-2 text-[10px] uppercase tracking-[.35em] text-muted/70 hover:text-chrome">
          Sound {sound ? 'on' : 'off'}
        </button>
        {!ready && <button onClick={onDone} className="min-h-11 px-2 text-[10px] uppercase tracking-[.35em] text-muted hover:text-chrome">Skip intro →</button>}
      </div>
    </motion.div>
  );
}
