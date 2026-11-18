import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getMenu, saveMenu, validateMenu } from '@/lib/menu';

export async function GET() { return NextResponse.json(await getMenu()); }

export async function PUT(req: Request) {
  const body = await req.json().catch(() => null);
  if (!validateMenu(body)) return NextResponse.json({ error: 'Invalid menu data.' }, { status: 400 });
  try { await saveMenu(body); } catch {
    return NextResponse.json({ error: 'Could not save: storage error. Please try again.' }, { status: 500 });
  }
  revalidatePath('/');
  return NextResponse.json({ ok: true });
}
