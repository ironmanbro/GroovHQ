'use client';
import Image from 'next/image';
import type { Item } from '@/lib/types';

export function VegMark({ veg }: { veg: boolean }) {
  return (
    <span title={veg ? 'Vegetarian' : 'Non-vegetarian'} aria-label={veg ? 'Vegetarian' : 'Non-vegetarian'}
      className={`inline-grid h-4 w-4 shrink-0 place-items-center rounded-[3px] border ${veg ? 'border-emerald-500/80' : 'border-red-500/80'}`}>
      <span className={`h-2 w-2 ${veg ? 'rounded-full bg-emerald-500' : 'bg-red-500 [clip-path:polygon(50%_0,100%_100%,0_100%)]'}`} />
    </span>
  );
}
export function Spice({ level = 0 }: { level?: number }) {
  if (!level) return null;
  return <span aria-label={`Spice level ${level} of 3`} className="text-[10px] tracking-widest text-muted">{'●'.repeat(level)}<span className="opacity-25">{'●'.repeat(3 - level)}</span> SPICE</span>;
}
export function Tags({ item }: { item: Item }) {
  return <>
    {item.chefSpecial && <span className="rounded-full bg-chrome px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.2em] text-ink">Chef&apos;s Special</span>}
    {item.bestseller && <span className="glass chrome-border rounded-full px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[.2em] text-chrome">Bestseller</span>}
  </>;
}

export default function ItemCard({ item, currency, onOpen, priority }: { item: Item; currency: string; onOpen: () => void; priority?: boolean }) {
  return (
    <button onClick={onOpen} aria-label={`${item.name}, ${currency}${item.price}${item.available ? '' : ', currently unavailable'}`}
      className="group chrome-border block w-full overflow-hidden rounded-2xl bg-char text-left transition duration-300 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-1 focus-visible:outline-chrome">
      <div className="relative aspect-[4/3] overflow-hidden bg-[#0c0c0c]">
        <Image src={item.image} alt={item.name} fill sizes="(min-width:1024px) 30vw, (min-width:640px) 45vw, 92vw" priority={priority}
          className={`food-img object-cover transition duration-700 group-hover:scale-[1.04] ${item.available ? '' : 'grayscale opacity-50'}`} />
        <div className="photo-vignette absolute inset-0" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5"><Tags item={item} /></div>
        {!item.available && <span className="absolute right-3 top-3 rounded-full bg-ink/80 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[.2em] text-muted">Unavailable today</span>}
      </div>
      <div className="px-4 pb-4 pt-1">
        <div className="flex items-start gap-3">
          <VegMark veg={item.veg} />
          <h3 className="flex-1 font-display text-[19px] leading-tight text-off">{item.name}</h3>
          <span className="chrome-text font-display text-lg leading-tight">{currency}{item.price}</span>
        </div>
        <p className="mt-2 line-clamp-2 pl-7 text-[13px] leading-relaxed text-muted">{item.description}</p>
        {!!item.spice && <div className="mt-2 pl-7"><Spice level={item.spice} /></div>}
      </div>
    </button>
  );
}
