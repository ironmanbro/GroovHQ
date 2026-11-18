import { bindings } from '@/lib/cf';

// Serves uploaded photos from Cloudflare R2.
export async function GET(_: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  if (!/^[\w-]+\.(jpg|png|webp|avif)$/.test(name)) return new Response('Not found', { status: 404 });
  const obj = await bindings().BUCKET.get(name);
  if (!obj) return new Response('Not found', { status: 404 });
  return new Response(obj.body, { headers: { 'Content-Type': obj.httpMetadata?.contentType ?? 'image/jpeg', 'Cache-Control': 'public, max-age=31536000, immutable' } });
}
