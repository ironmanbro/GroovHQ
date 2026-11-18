import { NextResponse } from 'next/server';
import { COOKIE, adminPassword, sign } from '@/lib/auth';

export async function POST(req: Request) {
  const pw = adminPassword();
  if (!pw) return NextResponse.json({ error: 'Admin disabled: set ADMIN_PASSWORD.' }, { status: 503 });
  const { password } = await req.json().catch(() => ({}));
  if (password !== pw) {
    await new Promise(r => setTimeout(r, 600));
    return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 });
  }
  const exp = Date.now() + 1000 * 60 * 60 * 12;
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, await sign(exp), { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', path: '/', expires: new Date(exp) });
  return res;
}
