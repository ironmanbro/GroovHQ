'use client';
import { useEffect, useRef } from 'react';
import { motion, useAnimate, useInView, useMotionValue, useSpring } from 'framer-motion';

/* The GROOV panther, big and present. Plays a mascot video when one is set (settings.mascotVideo: MP4/WebM of a black panther
   on a black background, blended in with `screen` so the black disappears). Without a video it falls back to the graded
   photo, brought to life: it breathes, leans toward the finger/cursor, and lunges when tapped. */
export default function Mascot({ video, image = '/brand/intro-2.webp', reduced, className = '' }: { video?: string; image?: string; reduced: boolean; className?: string }) {
  const wrap = useRef<HTMLDivElement>(null); const vid = useRef<HTMLVideoElement>(null);
  const inView = useInView(wrap, { margin: '120px' });
  const x = useSpring(useMotionValue(0), { stiffness: 60, damping: 16 }); const y = useSpring(useMotionValue(0), { stiffness: 60, damping: 16 });
  const rot = useSpring(useMotionValue(0), { stiffness: 60, damping: 16 });
  const [scope, animate] = useAnimate();

  useEffect(() => {
    if (reduced) return;
    const move = (e: PointerEvent) => {
      const nx = e.clientX / innerWidth - 0.5, ny = e.clientY / innerHeight - 0.5;
      x.set(-nx * 18); y.set(-ny * 10); rot.set(nx * 1.6);
    };
    addEventListener('pointermove', move, { passive: true }); return () => removeEventListener('pointermove', move);
  }, [reduced, x, y, rot]);

  // Only spend battery while it's on screen.
  useEffect(() => { const v = vid.current; if (!v) return; if (inView && !reduced) v.play().catch(() => {}); else v.pause(); }, [inView, reduced]);

  function lunge() {
    if (reduced) return;
    animate(scope.current, { scale: [1, 1.08, 1], filter: ['brightness(1)', 'brightness(1.45)', 'brightness(1)'] }, { duration: 0.8, ease: 'easeOut' });
    if (vid.current) { vid.current.currentTime = 0; vid.current.play().catch(() => {}); }
  }

  return (
    <div ref={wrap} onPointerDown={lunge} className={`absolute inset-0 overflow-hidden ${className}`}>
      <motion.div style={{ x, y, rotate: rot }} className="absolute -inset-4">
        <div ref={scope} className="absolute inset-0">
          <motion.div className="absolute inset-0" animate={inView && !reduced ? { scale: [1, 1.018, 1], y: [0, -3, 0] } : undefined} transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}>
            {video ? (
              <video ref={vid} src={video} poster={image} muted loop playsInline preload="metadata" aria-hidden
                className="h-full w-full object-cover object-[60%_30%]" style={{ mixBlendMode: 'screen' }} />
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={image} alt="" aria-hidden className="h-full w-full object-cover object-[60%_25%]" style={{ filter: 'brightness(1.55) contrast(1.1)' }} />
            )}
          </motion.div>
          {/* a slow pass of cold light across the coat */}
          {!reduced && inView && <motion.div aria-hidden className="absolute inset-0 mix-blend-screen" style={{ background: 'linear-gradient(105deg, transparent 42%, rgba(220,230,245,.13) 50%, transparent 58%)', backgroundSize: '260% 100%' }}
            initial={{ backgroundPosition: '150% 0' }} animate={{ backgroundPosition: ['150% 0', '-50% 0'] }} transition={{ duration: 3.2, repeat: Infinity, repeatDelay: 5, ease: 'easeInOut' }} />}
        </div>
      </motion.div>
    </div>
  );
}
