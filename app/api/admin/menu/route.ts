import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getMenu, saveMenu, validateMenu } from '@/lib/menu';

export async function GET() { return NextResponse.json(await getMenu()); }

export async function PUT(req: Request) {
  const body = await req.json().catch(() => null);
  if (!validateMenu(body)) return NextResponse.json({ error: 'Invalid menu data.' }, { status: 400 });
  try { await saveMenu(body); } catch {
    return NextResponse.json({ error: 'Could not save: this host has a read-only filesystem. Connect a database (see README).' }, { status: 500 });
  }
  revalidatePath('/');
  return NextResponse.json({ ok: true });
}
