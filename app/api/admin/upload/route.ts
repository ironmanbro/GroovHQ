import { NextResponse } from 'next/server';
import { db } from '@/lib/cf';

const TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif' };

// Photos are stored in Cloudflare D1 (no R2 needed). The admin page shrinks them to ~150 KB first; hard cap 1 MB.
export async function POST(req: Request) {
  const file = (await req.formData()).get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'No file.' }, { status: 400 });
  const ext = TYPES[file.type];
  if (!ext) return NextResponse.json({ error: 'Use JPG, PNG or WebP.' }, { status: 400 });
  if (file.size > 1024 * 1024) return NextResponse.json({ error: 'Photo too large (max 1 MB after optimising).' }, { status: 400 });
  const name = `${Date.now()}-${crypto.randomUUID().slice(0, 6)}.${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer()); let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  try { await (await db()).prepare('INSERT INTO media (name, type, data, created) VALUES (?, ?, ?, ?)').bind(name, file.type, btoa(bin), Date.now()).run(); }
  catch { return NextResponse.json({ error: 'Photo storage unavailable.' }, { status: 500 }); }
  return NextResponse.json({ url: `/media/${name}` });
}
