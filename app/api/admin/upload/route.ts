import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif' };

export async function POST(req: Request) {
  const file = (await req.formData()).get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'No file.' }, { status: 400 });
  const ext = TYPES[file.type];
  if (!ext) return NextResponse.json({ error: 'Use JPG, PNG, WebP or AVIF.' }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: 'Max 5 MB.' }, { status: 400 });
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  try {
    await fs.writeFile(path.join(process.cwd(), 'data', 'uploads', name), Buffer.from(await file.arrayBuffer()));
  } catch { return NextResponse.json({ error: 'Upload storage unavailable on this host.' }, { status: 500 }); }
  return NextResponse.json({ url: `/media/${name}` });
}
