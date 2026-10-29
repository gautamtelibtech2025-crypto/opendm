/** Firebase ID-token/session-cookie authentication and tenant status checks. */
import { cookies } from 'next/headers';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase/admin';

export interface AuthenticatedUser { id: string; email: string | undefined; role: 'customer' | 'admin'; }

async function ensureCustomer(id: string, email: string | undefined, name?: string | null): Promise<{ role: 'customer' | 'admin'; account_status: 'active' | 'suspended' }> {
  const db = getAdminFirestore(); const ref = db.collection('customers').doc(id); const snapshot = await ref.get();
  if (!snapshot.exists) {
    const adminEmails = (process.env.OPENDM_ADMIN_EMAILS ?? '').split(',').map(value => value.trim().toLowerCase()).filter(Boolean);
    const role = email && adminEmails.includes(email.toLowerCase()) ? 'admin' : 'customer';
    const createdAt = new Date().toISOString();
    await db.runTransaction(async tx => {
      if ((await tx.get(ref)).exists) return;
      tx.set(ref, { id, full_name: name ?? null, avatar_url: null, email: email ?? null, role, account_status: 'active', created_at: createdAt, updated_at: createdAt });
      tx.set(db.collection('customerSubscriptions').doc(id), { id, user_id: id, plan_id: 'free', status: 'trialing', created_at: createdAt, updated_at: createdAt });
    });
    return { role, account_status: 'active' };
  }
  const data = snapshot.data()!;
  return { role: data.role === 'admin' ? 'admin' : 'customer', account_status: data.account_status === 'suspended' ? 'suspended' : 'active' };
}

export async function getAuthenticatedUser(request: Request): Promise<AuthenticatedUser | null> {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : (await cookies()).get('opendm_session')?.value;
    if (!token) return null;
    const decoded = authHeader?.startsWith('Bearer ') ? await getAdminAuth().verifyIdToken(token, true) : await getAdminAuth().verifySessionCookie(token, true);
    const profile = await ensureCustomer(decoded.uid, decoded.email, decoded.name);
    if (profile.account_status !== 'active') return null;
    return { id: decoded.uid, email: decoded.email, role: profile.role };
  } catch { return null; }
}

/** Server Component helper. Cookie verification still happens in Firebase Admin. */
export async function getSessionUser(): Promise<AuthenticatedUser | null> {
  try {
    const token = (await cookies()).get('opendm_session')?.value;
    if (!token) return null;
    const decoded = await getAdminAuth().verifySessionCookie(token, true);
    const profile = await ensureCustomer(decoded.uid, decoded.email, decoded.name);
    return profile.account_status === 'active' ? { id: decoded.uid, email: decoded.email, role: profile.role } : null;
  } catch { return null; }
}

export function unauthorized(): Response { return Response.json({ error: 'Unauthorized', message: 'Valid Firebase session required' }, { status: 401 }); }
export async function requireAdmin(request: Request): Promise<AuthenticatedUser | null> { const user = await getAuthenticatedUser(request); return user?.role === 'admin' ? user : null; }
export function forbidden(): Response { return Response.json({ error: 'Forbidden', message: 'Administrator access required' }, { status: 403 }); }
