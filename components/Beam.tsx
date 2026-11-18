/* The GROOV prism: diagonal light beams that split into a faint spectrum. Decorative, static (animates only via CSS when asked). */
export default function Beam({ className = '', intensity = 1 }: { className?: string; intensity?: number }) {
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} style={{ opacity: intensity }}>
      <div className="absolute -inset-[30%] rotate-[-32deg]"
        style={{ background: 'linear-gradient(180deg, transparent 38%, rgba(70,130,255,.0) 44%, rgba(90,150,255,.35) 49%, rgba(255,255,255,.55) 51%, rgba(255,160,70,.35) 53.5%, rgba(255,110,40,.0) 58%, transparent 64%)', filter: 'blur(10px)' }} />
    </div>
  );
}
export function Star({ className = 'h-5 w-5' }: { className?: string }) {
  return <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor"><path d="M12 0c.8 6.2 5.8 11.2 12 12-6.2.8-11.2 5.8-12 12-.8-6.2-5.8-11.2-12-12C6.2 11.2 11.2 6.2 12 0Z" /></svg>;
}
