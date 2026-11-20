'use client';
import { useEffect, useState } from 'react';
import type { Item, Menu } from '@/lib/types';

const inp = 'h-10 w-full rounded-lg border border-gun/70 bg-ink px-3 text-sm focus:border-silver focus:outline-none';
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `x-${Date.now()}`;

// Resize to max 1200px and re-encode as WebP in the browser so photos stay small (~100-200 KB).
async function shrink(f: File): Promise<File> {
  try {
    const bmp = await createImageBitmap(f); const k = Math.min(1, 1200 / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas'); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height);
    const blob = await new Promise<Blob | null>(r => c.toBlob(r, 'image/webp', 0.82));
    return blob ? new File([blob], 'photo.webp', { type: 'image/webp' }) : f;
  } catch { return f; }
}

export default function Admin() {
  const [menu, setMenu] = useState<Menu | null>(null);
  const [msg, setMsg] = useState(''); const [dirty, setDirty] = useState(false); const [filter, setFilter] = useState('');

  useEffect(() => { fetch('/api/admin/menu').then(r => r.json()).then(setMenu).catch(() => setMsg('Could not load menu.')); }, []);
  if (!menu) return <main className="p-8 text-muted">{msg || 'Loading…'}</main>;

  const upd = (m: Menu) => { setMenu(m); setDirty(true); setMsg(''); };
  const setItem = (id: string, patch: Partial<Item>) => upd({ ...menu, items: menu.items.map(i => i.id === id ? { ...i, ...patch } : i) });
  async function save() {
    setMsg('Saving…');
    const r = await fetch('/api/admin/menu', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(menu) });
    const j = await r.json(); setMsg(r.ok ? 'Saved. Live menu updated.' : j.error); if (r.ok) setDirty(false);
  }
  async function upload(id: string, f: File) {
    setMsg('Optimising photo…'); const small = await shrink(f); const fd = new FormData(); fd.append('file', small);
    const r = await fetch('/api/admin/upload', { method: 'POST', body: fd }); const j = await r.json();
    if (r.ok) { setItem(id, { image: j.url }); setMsg('Photo uploaded — remember to save.'); } else setMsg(j.error);
  }
  function addItem(category: string) {
    const id = `${slug('new item')}-${Date.now().toString(36)}`;
    upd({ ...menu!, items: [{ id, category, name: 'New item', description: '', price: 0, veg: true, image: menu!.items[0]?.image ?? '', available: false }, ...menu!.items] });
  }
  const s = menu.settings;
  const shown = menu.items.filter(i => !filter || i.category === filter);

  return (
    <main className="mx-auto max-w-5xl p-4 pb-32">
      <div className="sticky top-0 z-10 -mx-4 flex items-center gap-3 border-b border-white/5 bg-ink/90 px-4 py-3 backdrop-blur">
        <h1 className="chrome-text font-display text-2xl">Menu admin</h1><div className="flex-1" />
        <span className="text-xs text-muted" role="status">{msg}</span>
        <a href="/" target="_blank" className="text-xs text-muted underline">View menu</a>
        <button onClick={save} disabled={!dirty} className="h-10 rounded-lg bg-chrome px-5 text-sm font-semibold text-ink disabled:opacity-40">Save</button>
        <button onClick={async () => { await fetch('/api/admin/logout', { method: 'POST' }); location.href = '/admin/login'; }} className="text-xs text-muted">Sign out</button>
      </div>

      <section className="mt-6 grid gap-3 rounded-2xl bg-char p-4 sm:grid-cols-4">
        <h2 className="font-display text-lg sm:col-span-4">Settings</h2>
        <label className="text-xs text-muted">Logo URL<input className={inp} value={s.logo} onChange={e => upd({ ...menu, settings: { ...s, logo: e.target.value } })} /></label>
        <label className="text-xs text-muted">Tax %<input type="number" className={inp} value={s.taxRate} onChange={e => upd({ ...menu, settings: { ...s, taxRate: Number(e.target.value) } })} /></label>
        <div className="flex flex-col justify-end gap-1 text-xs text-muted">
          <label><input type="checkbox" checked={s.orderingEnabled} onChange={e => upd({ ...menu, settings: { ...s, orderingEnabled: e.target.checked } })} /> Ordering enabled</label>
          <label><input type="checkbox" checked={s.orderingDemo} onChange={e => upd({ ...menu, settings: { ...s, orderingDemo: e.target.checked } })} /> Demo mode label</label>
        </div>
      </section>

      <section className="mt-6 rounded-2xl bg-char p-4">
        <h2 className="font-display text-lg">Categories</h2>
        <ul className="mt-3 space-y-2">
          {menu.categories.map((c, idx) => (
            <li key={c.id} className="flex gap-2">
              <input className={inp} value={c.name} aria-label="Category name" onChange={e => upd({ ...menu, categories: menu.categories.map(x => x.id === c.id ? { ...x, name: e.target.value } : x) })} />
              <button className="px-2 text-muted" aria-label="Move up" disabled={!idx} onClick={() => { const a = [...menu.categories]; [a[idx - 1], a[idx]] = [a[idx], a[idx - 1]]; upd({ ...menu, categories: a }); }}>↑</button>
              <button className="px-2 text-red-400" onClick={() => {
                if (menu.items.some(i => i.category === c.id)) return setMsg('Move or delete its items first.');
                upd({ ...menu, categories: menu.categories.filter(x => x.id !== c.id) });
              }}>Delete</button>
            </li>
          ))}
        </ul>
        <button className="mt-3 text-sm text-chrome underline" onClick={() => { const name = prompt('Category name'); if (name) upd({ ...menu, categories: [...menu.categories, { id: slug(name), name }] }); }}>+ Add category</button>
      </section>

      <section className="mt-6">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-lg">Items ({shown.length})</h2>
          <select className={`${inp} w-auto`} value={filter} onChange={e => setFilter(e.target.value)} aria-label="Filter by category">
            <option value="">All categories</option>{menu.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button className="text-sm text-chrome underline" onClick={() => addItem(filter || menu.categories[0].id)}>+ Add item</button>
        </div>
        <ul className="mt-3 space-y-3">
          {shown.map(i => (
            <li key={i.id} className={`grid gap-3 rounded-2xl bg-char p-4 sm:grid-cols-[96px_1fr] ${i.available ? '' : 'opacity-70'}`}>
              <div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {i.image && <img src={i.image.startsWith('http') ? `${i.image}?w=200&q=60&auto=format` : i.image} alt="" className="aspect-square w-24 rounded-lg object-cover" />}
                <label className="mt-2 block cursor-pointer text-center text-[11px] text-chrome underline">Upload<input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && upload(i.id, e.target.files[0])} /></label>
              </div>
              <div className="grid gap-2 sm:grid-cols-6">
                <input className={`${inp} sm:col-span-3`} value={i.name} aria-label="Name" onChange={e => setItem(i.id, { name: e.target.value })} />
                <input type="number" className={inp} value={i.price} aria-label="Price (₹)" onChange={e => setItem(i.id, { price: Number(e.target.value) })} />
                <select className={`${inp} sm:col-span-2`} value={i.category} aria-label="Category" onChange={e => setItem(i.id, { category: e.target.value })}>
                  {menu.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                <textarea className={`${inp} h-16 py-2 sm:col-span-6`} value={i.description} aria-label="Description" onChange={e => setItem(i.id, { description: e.target.value })} />
                <input className={`${inp} sm:col-span-3`} value={i.image} aria-label="Image URL" onChange={e => setItem(i.id, { image: e.target.value })} />
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted sm:col-span-3">
                  {(['veg', 'available', 'bestseller', 'chefSpecial'] as const).map(k => (
                    <label key={k}><input type="checkbox" checked={!!i[k]} onChange={e => setItem(i.id, { [k]: e.target.checked })} /> {k === 'chefSpecial' ? "Chef's" : k}</label>))}
                  <label>Spice <select value={i.spice ?? 0} onChange={e => setItem(i.id, { spice: Number(e.target.value) })} className="bg-ink">{[0, 1, 2, 3].map(n => <option key={n}>{n}</option>)}</select></label>
                  <button className="ml-auto text-red-400" onClick={() => confirm(`Delete ${i.name}?`) && upd({ ...menu, items: menu.items.filter(x => x.id !== i.id) })}>Delete</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
