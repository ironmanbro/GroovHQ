import { promises as fs } from 'fs';
import path from 'path';

const MIME: Record<string, string> = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp', avif: 'image/avif' };

export async function GET(_: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  if (!/^[\w-]+\.(jpg|png|webp|avif)$/.test(name)) return new Response('Not found', { status: 404 });
  try {
    const buf = await fs.readFile(path.join(process.cwd(), 'data', 'uploads', name));
    return new Response(buf, { headers: { 'Content-Type': MIME[name.split('.').pop()!], 'Cache-Control': 'public, max-age=31536000, immutable' } });
  } catch { return new Response('Not found', { status: 404 }); }
}
