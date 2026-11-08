import { NextResponse } from 'next/server';
import { authenticate, logout } from '@/lib/server/auth';
import { failure } from '@/lib/server/http';
export async function POST(request: Request) {
  try { const auth = await authenticate(request); if (auth) await logout(auth.sessionId); return NextResponse.json({ ok: true }); }
  catch (error) { return failure(error); }
}
