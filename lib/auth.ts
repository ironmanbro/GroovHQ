// Signed admin session cookie (HMAC-SHA256, Web Crypto — works in middleware and routes).
export const COOKIE = 'groov_admin';
const enc = new TextEncoder();

export function adminPassword() {
  return process.env.ADMIN_PASSWORD || (process.env.NODE_ENV !== 'production' ? 'groov-admin' : '');
}
async function key() {
  const secret = process.env.ADMIN_SECRET || adminPassword();
  return crypto.subtle.importKey('raw', enc.encode(secret || 'disabled'), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
}
const hex = (b: ArrayBuffer) => Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2, '0')).join('');

export async function sign(exp: number) {
  return `${exp}.${hex(await crypto.subtle.sign('HMAC', await key(), enc.encode(String(exp))))}`;
}
export async function verify(token?: string) {
  if (!token || !adminPassword()) return false;
  const [exp] = token.split('.');
  if (!exp || Number(exp) < Date.now()) return false;
  const good = await sign(Number(exp));
  if (good.length !== token.length) return false;
  let diff = 0; for (let i = 0; i < good.length; i++) diff |= good.charCodeAt(i) ^ token.charCodeAt(i);
  return diff === 0;
}
