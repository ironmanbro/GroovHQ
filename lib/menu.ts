import 'server-only';
import { promises as fs } from 'fs';
import path from 'path';
import type { Menu } from './types';

// Menu data lives in data/menu.json, separate from the UI. Swap these two
// functions for a database (e.g. Supabase) without touching any component.
const FILE = path.join(process.cwd(), 'data', 'menu.json');

export async function getMenu(): Promise<Menu> {
  return JSON.parse(await fs.readFile(FILE, 'utf8'));
}

export function validateMenu(m: unknown): m is Menu {
  const x = m as Menu;
  return !!x && !!x.settings && Array.isArray(x.categories) && Array.isArray(x.items) &&
    x.items.every(i => typeof i.id === 'string' && typeof i.name === 'string' && typeof i.price === 'number' && typeof i.category === 'string');
}

export async function saveMenu(m: Menu) {
  await fs.writeFile(FILE, JSON.stringify(m, null, 2), 'utf8');
}
