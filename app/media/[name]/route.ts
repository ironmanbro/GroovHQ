import { db } from '@/lib/cf';

// Serves uploaded photos stored in D1.
export async function GET(_: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  if (!/^[\w-]+\.(jpg|png|webp|avif)$/.test(name)) return new Response('Not found', { status: 404 });
  const row = await (await db()).prepare('SELECT type, data FROM media WHERE name = ?').bind(name).first<{ type: string; data: string }>();
  if (!row) return new Response('Not found', { status: 404 });
  const bin = atob(row.data); const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Response(bytes, { headers: { 'Content-Type': row.type, 'Cache-Control': 'public, max-age=31536000, immutable' } });
}
