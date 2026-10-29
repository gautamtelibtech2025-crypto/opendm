import { forbidden, requireAdmin } from '@/lib/auth';
import { createFirestoreService as createServiceClient } from '@/lib/firebase/service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request): Promise<Response> {
  if (!await requireAdmin(request)) return forbidden();
  const db = createServiceClient();
  const url = new URL(request.url);
  const search = url.searchParams.get('search')?.trim() ?? '';
  const [customers, connections, automations, profiles] = await Promise.all([
    db.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'customer'),
    db.from('instagram_accounts').select('*', { count: 'exact', head: true }).eq('is_active', true),
    db.from('automations').select('*', { count: 'exact', head: true }).eq('is_active', true),
    db.from('profiles').select('id, full_name, avatar_url, role, account_status, suspended_at, created_at').order('created_at', { ascending: false }).limit(100),
  ]);
  if (customers.error || connections.error || automations.error || profiles.error) {
    return Response.json({ error: 'admin_query_failed' }, { status: 500 });
  }
  const users = (profiles.data ?? []).filter((profile: any) => !search ||
    (profile.full_name ?? '').toLowerCase().includes(search.toLowerCase()) || profile.id.includes(search));
  return Response.json({
    totals: { customers: customers.count ?? 0, activeInstagramConnections: connections.count ?? 0, activeAutomations: automations.count ?? 0 },
    users,
  });
}
