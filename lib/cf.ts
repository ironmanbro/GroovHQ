import 'server-only';
import { getCloudflareContext } from '@opennextjs/cloudflare';

// Minimal binding types (avoids pulling @cloudflare/workers-types into the DOM-typed app).
export interface D1Stmt { bind(...v: unknown[]): D1Stmt; first<T = unknown>(): Promise<T | null>; all<T = unknown>(): Promise<{ results: T[] }>; run(): Promise<unknown> }
export interface D1 { prepare(q: string): D1Stmt; batch(s: D1Stmt[]): Promise<unknown[]> }

export function bindings() { return getCloudflareContext().env as unknown as { DB: D1 }; }

let ready: Promise<unknown> | null = null;
export async function db(): Promise<D1> {
  const { DB } = bindings();
  ready ??= DB.batch([
    DB.prepare('CREATE TABLE IF NOT EXISTS kv (k TEXT PRIMARY KEY, v TEXT NOT NULL)'),
    DB.prepare('CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, day TEXT NOT NULL, num INTEGER NOT NULL, status TEXT NOT NULL, created INTEGER NOT NULL, updated INTEGER NOT NULL, data TEXT NOT NULL)'),
    DB.prepare('CREATE INDEX IF NOT EXISTS orders_created ON orders (created)'),
    DB.prepare('CREATE TABLE IF NOT EXISTS media (name TEXT PRIMARY KEY, type TEXT NOT NULL, data TEXT NOT NULL, created INTEGER NOT NULL)'),
  ]).catch(e => { ready = null; throw e; });
  await ready; return DB;
}
