import 'server-only';
import seed from '@/data/menu.json';
import type { Menu } from './types';
import { db } from './cf';

// Menu lives in Cloudflare D1 (table kv, key 'menu'). data/menu.json is only the first-run seed.
export async function getMenu(): Promise<Menu> {
  const row = await (await db()).prepare("SELECT v FROM kv WHERE k = 'menu'").first<{ v: string }>();
  return row ? JSON.parse(row.v) : (seed as unknown as Menu);
}

export function validateMenu(m: unknown): m is Menu {
  const x = m as Menu;
  return !!x && !!x.settings && Array.isArray(x.categories) && Array.isArray(x.items) &&
    x.items.every(i => typeof i.id === 'string' && typeof i.name === 'string' && typeof i.price === 'number' && typeof i.category === 'string');
}

export async function saveMenu(m: Menu) {
  await (await db()).prepare("INSERT INTO kv (k, v) VALUES ('menu', ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v").bind(JSON.stringify(m)).run();
}
