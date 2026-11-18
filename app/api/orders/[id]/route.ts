import { NextResponse } from 'next/server';
import { getOrder } from '@/lib/orders';
export const dynamic = 'force-dynamic';
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const o = await getOrder((await params).id);
  if (!o) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ number: o.number, status: o.status, table: o.table, total: o.total, lines: o.lines, type: o.type });
}
