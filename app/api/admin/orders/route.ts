import { NextResponse } from 'next/server';
import { listOrders, setStatus, Status } from '@/lib/orders';
export const dynamic = 'force-dynamic';
export async function GET() { return NextResponse.json(await listOrders()); }
export async function PATCH(req: Request) {
  const { id, status } = await req.json().catch(() => ({}));
  if (!['received', 'preparing', 'ready', 'served', 'cancelled'].includes(status)) return NextResponse.json({ error: 'Bad status' }, { status: 400 });
  const o = await setStatus(String(id), status as Status);
  return o ? NextResponse.json(o) : NextResponse.json({ error: 'Not found' }, { status: 404 });
}
