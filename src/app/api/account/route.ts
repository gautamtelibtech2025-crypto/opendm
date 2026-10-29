import { getAuthenticatedUser, unauthorized } from '@/lib/auth';
import { getAdminFirestore } from '@/lib/firebase/admin';

export const runtime = 'nodejs';
export async function GET(request: Request) { const user = await getAuthenticatedUser(request); if (!user) return unauthorized(); const doc = await getAdminFirestore().collection('customers').doc(user.id).get(); return Response.json({ account: { id: user.id, email: user.email, full_name: doc.data()?.full_name ?? '' } }); }
export async function PATCH(request: Request) {
  const user = await getAuthenticatedUser(request); if (!user) return unauthorized();
  let body: { fullName?: unknown }; try { body = await request.json(); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }
  if (typeof body.fullName !== 'string' || body.fullName.trim().length > 120) return Response.json({ error: 'Invalid name' }, { status: 400 });
  await getAdminFirestore().collection('customers').doc(user.id).set({ full_name: body.fullName.trim(), updated_at: new Date().toISOString() }, { merge: true });
  return Response.json({ ok: true });
}
