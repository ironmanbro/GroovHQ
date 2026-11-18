'use client';
/* Renders the official logo file untouched (no recolouring/distortion).
   `sweep` adds a light pass clipped to the logo's own shape. */
export default function Logo({ src, className = '', sweep = false, alt = 'GROOV HQ' }: { src: string; className?: string; sweep?: boolean; alt?: string }) {
  return (
    <span className={`relative inline-block ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="block h-full w-auto object-contain select-none" draggable={false} />
      {sweep && <span aria-hidden className="logo-sweep run" style={{ WebkitMaskImage: `url(${src})`, maskImage: `url(${src})` }} />}
    </span>
  );
}
