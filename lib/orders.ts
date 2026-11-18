import 'server-only';
import { getMenu } from './menu';
import { db } from './cf';

export type Status = 'received' | 'preparing' | 'ready' | 'served' | 'cancelled';
export type OrderLine = { id: string; name: string; options: string[]; unit: number; qty: number };
export type Order = {
  id: string; number: number; source: 'table' | 'kiosk'; table: string; name: string; type: 'dine-in' | 'takeaway';
  lines: OrderLine[]; subtotal: number; tax: number; total: number; status: Status; note: string; createdAt: number; updatedAt: number;
};

type Row = { id: string; num: number; status: Status; created: number; updated: number; data: string };
const toOrder = (r: Row): Order => ({ ...JSON.parse(r.data), id: r.id, number: r.num, status: r.status, createdAt: r.created, updatedAt: r.updated });

export async function listOrders(): Promise<Order[]> {
  const { results } = await (await db()).prepare('SELECT * FROM orders ORDER BY created').all<Row>(); return results.map(toOrder);
}
export async function getOrder(id: string) {
  const r = await (await db()).prepare('SELECT * FROM orders WHERE id = ?').bind(id).first<Row>(); return r ? toOrder(r) : null;
}
export async function setStatus(id: string, status: Status) {
  const d = await db(); await d.prepare('UPDATE orders SET status = ?, updated = ? WHERE id = ?').bind(status, Date.now(), id).run(); return getOrder(id);
}

type Input = { source?: string; table?: string; name?: string; type?: string; note?: string; lines?: { id: string; qty: number; options?: string[] }[] };

// Prices are recomputed server-side from the menu: the client's totals are never trusted.
export async function createOrder(inp: Input): Promise<Order> {
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
  const clean = (s?: string, n = 40) => String(s ?? '').replace(/[<>]/g, '').trim().slice(0, n);
  const now = Date.now(); const id = crypto.randomUUID().replace(/-/g, '').slice(0, 10);
  const day = new Date(now).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  const data = { source: inp.source === 'kiosk' ? 'kiosk' : 'table', table: clean(inp.table, 8), name: clean(inp.name), type: inp.type === 'takeaway' ? 'takeaway' : 'dine-in',
    lines, subtotal, tax, total: subtotal + tax, note: clean(inp.note, 140) };
  const d = await db();
  // Daily order number is assigned atomically inside the INSERT.
  await d.batch([
    d.prepare('DELETE FROM orders WHERE created < ?').bind(now - 3 * 864e5),
    d.prepare("INSERT INTO orders (id, day, num, status, created, updated, data) VALUES (?, ?, (SELECT COUNT(*) + 1 FROM orders WHERE day = ?), 'received', ?, ?, ?)").bind(id, day, day, now, now, JSON.stringify(data)),
  ]);
  return (await getOrder(id))!;
}
