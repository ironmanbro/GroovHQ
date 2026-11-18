'use client';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Logo from './Logo';

type Props = { logo: string; video?: string; reduced: boolean; onDone: () => void };
const ease = [0.22, 1, 0.36, 1] as const;

export default function Intro({ logo, video, reduced, onDone }: Props) {
  const [phase, setPhase] = useState<'panther' | 'logo' | 'ready'>(reduced ? 'ready' : 'panther');
  const [sound, setSound] = useState(false);
  const audio = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (reduced) return;
    const t1 = setTimeout(() => setPhase('logo'), video ? 3600 : 3700);
    const t2 = setTimeout(() => setPhase('ready'), video ? 4800 : 4900);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [reduced, video]);

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
      {/* drifting atmosphere */}
      <div className="pointer-events-none absolute inset-0 opacity-60" style={{ background: 'radial-gradient(60% 40% at 50% 45%, rgba(85,91,97,.18), transparent 70%)' }} />

      <AnimatePresence>
        {phase === 'panther' && (
          <motion.div key="p" className="absolute inset-0 grid place-items-center"
            exit={{ opacity: 0, scale: 1.12, filter: 'blur(10px)' }} transition={{ duration: 0.7, ease: 'easeIn' }}>
            {video ? (
              <video src={video} autoPlay muted playsInline preload="auto" className="h-full w-full object-cover" />
            ) : (
              <>
                {/* Scene 1: the leopard emerges from darkness, a key light sweeping across it */}
                <motion.img src="/brand/intro-1.webp" alt="" className="absolute inset-0 h-full w-full object-cover object-center" style={{ filter: 'brightness(1.7) contrast(1.1)' }}
                  initial={{ opacity: 0, scale: 1.18 }} animate={{ opacity: [0, 1, 1, 0], scale: 1.04 }}
                  transition={{ duration: 2.6, times: [0, 0.35, 0.8, 1], ease: 'easeInOut' }} />
                {/* Scene 2: it turns on the viewer */}
                <motion.img src="/brand/intro-2.webp" alt="" className="absolute inset-0 h-full w-full object-cover object-[60%_30%]" style={{ filter: 'brightness(1.5) contrast(1.1)' }}
                  initial={{ opacity: 0, scale: 1.12, x: '4%' }} animate={{ opacity: [0, 1, 1], scale: 1.0, x: '0%' }}
                  transition={{ duration: 1.4, delay: 1.7, ease }} />
                <motion.div aria-hidden className="absolute inset-0" style={{ background: 'radial-gradient(70% 55% at 50% 45%, transparent 20%, #050505 85%)' }} />
                <motion.div aria-hidden className="absolute inset-0 mix-blend-screen"
                  style={{ background: 'linear-gradient(105deg, transparent 40%, rgba(229,229,229,.12) 50%, transparent 54%)', backgroundSize: '250% 100%' }}
                  initial={{ backgroundPosition: '140% 0' }} animate={{ backgroundPosition: '-40% 0' }} transition={{ duration: 2.6, delay: 0.2, ease }} />
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* chrome light trail crossing the frame as the panther moves through */}
      {!reduced && (
        <motion.div aria-hidden className="pointer-events-none absolute left-0 top-1/2 h-px w-[60vw]"
          style={{ background: 'linear-gradient(90deg, transparent, #E5E5E5, transparent)', boxShadow: '0 0 24px 4px rgba(229,229,229,.35)' }}
          initial={{ x: '-70vw', opacity: 0 }} animate={{ x: '120vw', opacity: [0, 1, 1, 0] }}
          transition={{ duration: 1.3, delay: 2.5, ease: [0.7, 0, 0.3, 1] }} />
      )}

      {phase !== 'panther' && (
        <motion.div aria-hidden className="absolute inset-0" style={{ background: 'url(/brand/prism.webp) center bottom/cover' }}
          initial={{ opacity: 0 }} animate={{ opacity: 0.55 }} transition={{ duration: 1.6 }} />
      )}
      {phase !== 'panther' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center px-8">
          <motion.div initial={{ opacity: 0, scale: 0.94, filter: 'blur(6px)' }} animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            transition={{ duration: 1, ease, delay: reduced ? 0 : 0.45 }}>
            <Logo src={logo} sweep={!reduced} className="h-14 sm:h-20" />
          </motion.div>
          <motion.div className="hairline mt-8 w-40" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1, delay: 0.4, ease }} />
          <motion.p className="mt-5 text-[11px] uppercase tracking-[.5em] text-muted" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
            Coffee · Kitchen · Culture
          </motion.p>
          <AnimatePresence>
            {phase === 'ready' && (
              <motion.button onClick={onDone} autoFocus
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }}
                className="chrome-border mt-12 rounded-full px-9 py-4 text-xs font-semibold uppercase tracking-[.4em] text-chrome transition hover:bg-white/5 active:scale-[.98]">
                Enter GROOV HQ
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <button onClick={toggleSound} aria-pressed={sound} className="min-h-11 px-2 text-[10px] uppercase tracking-[.35em] text-muted/70 hover:text-chrome">
          Sound {sound ? 'on' : 'off'}
        </button>
        {phase !== 'ready' && (
          <button onClick={onDone} className="min-h-11 px-2 text-[10px] uppercase tracking-[.35em] text-muted hover:text-chrome">Skip intro →</button>
        )}
      </div>
    </motion.div>
  );
}
