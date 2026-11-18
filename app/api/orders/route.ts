import { NextResponse } from 'next/server';
import { createOrder } from '@/lib/orders';

const hits = new Map<string, number[]>();
export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'local'; const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter(t => now - t < 60_000);
  if (recent.length >= 8) return NextResponse.json({ error: 'Too many orders. Please wait a minute.' }, { status: 429 });
  hits.set(ip, [...recent, now]);
  try { const o = await createOrder(await req.json()); return NextResponse.json({ id: o.id, number: o.number }); }
  catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : 'Could not place order.' }, { status: 400 }); }
}
