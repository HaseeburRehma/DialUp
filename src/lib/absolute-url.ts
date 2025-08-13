// lib/absolute-url.ts (server-only)
import { headers } from 'next/headers';
export async function absoluteUrl(path = '') {
  const h = await headers();
  const proto = h.get('x-forwarded-proto') ?? 'https';
  const host  = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000';
  return `${proto}://${host}${path}`;
}
