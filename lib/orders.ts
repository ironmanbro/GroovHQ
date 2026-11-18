import 'server-only';
import { promises as fs } from 'fs';
import path from 'path';
import { getMenu } from './menu';

// File-backed order store (data/orders.json). Swap for a database (e.g. Supabase) for multi-instance hosting.
const FILE = path.join(process.cwd(), 'data', 'orders.json');
export type Status = 'received' | 'preparing' | 'ready' | 'served' | 'cancelled';
export type OrderLine = { id: string; name: string; options: string[]; unit: number; qty: number };
export type Order = {
  id: string; number: number; source: 'table' | 'kiosk'; table: string; name: string; type: 'dine-in' | 'takeaway';
  lines: OrderLine[]; subtotal: number; tax: number; total: number; status: Status; note: string; createdAt: number; updatedAt: number;
};

let queue: Promise<unknown> = Promise.resolve();
const serial = <T,>(fn: () => Promise<T>) => (queue = queue.then(fn, fn)) as Promise<T>;

async function read(): Promise<Order[]> {
  try { return JSON.parse(await fs.readFile(FILE, 'utf8')); } catch { return []; }
}
const write = (o: Order[]) => fs.writeFile(FILE, JSON.stringify(o), 'utf8');

export const listOrders = () => read();
export const getOrder = async (id: string) => (await read()).find(o => o.id === id) ?? null;

export const setStatus = (id: string, status: Status) => serial(async () => {
  const all = await read(); const o = all.find(x => x.id === id); if (!o) return null;
  o.status = status; o.updatedAt = Date.now(); await write(all); return o;
});

type Input = { source?: string; table?: string; name?: string; type?: string; note?: string; lines?: { id: string; qty: number; options?: string[] }[] };

// Prices are recomputed server-side from the menu: the client's totals are never trusted.
export const createOrder = (inp: Input) => serial(async () => {
  const menu = await getMenu(); const lines: OrderLine[] = [];
  if (!Array.isArray(inp.lines) || !inp.lines.length || inp.lines.length > 40) throw new Error('Basket is empty.');
  for (const l of inp.lines) {
    const item = menu.items.find(i => i.id === l.id);
    const qty = Math.floor(Number(l.qty));
    if (!item || !(qty >= 1 && qty <= 20)) throw new Error('Invalid item.');
    if (!item.available) throw new Error(`${item.name} is unavailable right now.`);
    const picked = new Set(l.options ?? []); let unit = item.price; const opts: string[] = [];
    for (const g of item.customisations ?? []) for (const o of g.options) if (picked.has(o.label)) { unit += o.price; opts.push(o.label); }
    lines.push({ id: item.id, name: item.name, options: opts, unit, qty });
  }
  const subtotal = lines.reduce((s, l) => s + l.unit * l.qty, 0);
  const tax = Math.round(subtotal * menu.settings.taxRate) / 100;
  const all = await read(); const now = Date.now();
  const today = new Date().toDateString();
  const number = all.filter(o => new Date(o.createdAt).toDateString() === today).length + 1;
  const clean = (s?: string, n = 40) => String(s ?? '').replace(/[<>]/g, '').trim().slice(0, n);
  const order: Order = {
    id: Math.random().toString(36).slice(2, 10), number, source: inp.source === 'kiosk' ? 'kiosk' : 'table',
    table: clean(inp.table, 8), name: clean(inp.name), type: inp.type === 'takeaway' ? 'takeaway' : 'dine-in',
    lines, subtotal, tax, total: subtotal + tax, status: 'received', note: clean(inp.note, 140), createdAt: now, updatedAt: now,
  };
  all.push(order); await write(all.filter(o => now - o.createdAt < 3 * 864e5)); return order;
});
