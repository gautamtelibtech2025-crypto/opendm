import { NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase/admin';

export const runtime = 'nodejs';
const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 5;

export async function POST(request: Request) {
  try {
    const { idToken } = await request.json();
    if (typeof idToken !== 'string' || !idToken) return NextResponse.json({ error: 'idToken is required' }, { status: 400 });
    await getAdminAuth().verifyIdToken(idToken, true);
    const session = await getAdminAuth().createSessionCookie(idToken, { expiresIn: SESSION_MAX_AGE_MS });
    const response = NextResponse.json({ ok: true });
    response.cookies.set('opendm_session', session, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: SESSION_MAX_AGE_MS / 1000 });
    return response;
  } catch { return NextResponse.json({ error: 'Unable to establish session' }, { status: 401 }); }
}
export async function DELETE() { const response = NextResponse.json({ ok: true }); response.cookies.set('opendm_session', '', { httpOnly: true, path: '/', maxAge: 0 }); return response; }
