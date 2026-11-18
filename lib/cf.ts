import 'server-only';
import { getCloudflareContext } from '@opennextjs/cloudflare';

// Minimal binding types (avoids pulling @cloudflare/workers-types into the DOM-typed app).
export interface D1Stmt { bind(...v: unknown[]): D1Stmt; first<T = unknown>(): Promise<T | null>; all<T = unknown>(): Promise<{ results: T[] }>; run(): Promise<unknown> }
export interface D1 { prepare(q: string): D1Stmt; batch(s: D1Stmt[]): Promise<unknown[]> }
export interface R2 {
  put(k: string, v: ArrayBuffer, o?: { httpMetadata?: { contentType?: string } }): Promise<unknown>;
  get(k: string): Promise<{ body: ReadableStream; httpMetadata?: { contentType?: string } } | null>;
}

export function bindings() { return getCloudflareContext().env as unknown as { DB: D1; BUCKET: R2 }; }

let ready: Promise<unknown> | null = null;
export async function db(): Promise<D1> {
  const { DB } = bindings();
  ready ??= DB.batch([
    DB.prepare('CREATE TABLE IF NOT EXISTS kv (k TEXT PRIMARY KEY, v TEXT NOT NULL)'),
    DB.prepare('CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, day TEXT NOT NULL, num INTEGER NOT NULL, status TEXT NOT NULL, created INTEGER NOT NULL, updated INTEGER NOT NULL, data TEXT NOT NULL)'),
    DB.prepare('CREATE INDEX IF NOT EXISTS orders_created ON orders (created)'),
  ]).catch(e => { ready = null; throw e; });
  await ready; return DB;
}
