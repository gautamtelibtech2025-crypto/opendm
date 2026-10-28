import { forbidden, requireAdmin } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/service';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
type Context = { params: Promise<{ id: string }> };

const UpdateSchema = z.object({
  accountStatus: z.enum(['active', 'suspended']).optional(),
  planId: z.string().uuid().optional(),
});

export async function GET(request: Request, context: Context): Promise<Response> {
  if (!await requireAdmin(request)) return forbidden();
  const { id } = await context.params;
  const db = createServiceClient();
  const [profile, subscription, accounts, automations] = await Promise.all([
    db.from('profiles').select('id, full_name, avatar_url, role, account_status, suspended_at, suspension_reason, created_at').eq('id', id).maybeSingle(),
    db.from('customer_subscriptions').select('id, status, current_period_end, subscription_plans(id, code, name, max_instagram_accounts, max_active_automations, max_monthly_triggers)').eq('user_id', id).maybeSingle(),
    db.from('instagram_accounts').select('id, username, is_active, created_at').eq('user_id', id),
    db.from('automations').select('id, name, type, is_active, total_dms_sent, created_at').eq('user_id', id),
  ]);
  if (!profile.data) return Response.json({ error: 'not_found' }, { status: 404 });
  return Response.json({ profile: profile.data, subscription: subscription.data, accounts: accounts.data ?? [], automations: automations.data ?? [] });
}

export async function PATCH(request: Request, context: Context): Promise<Response> {
  const admin = await requireAdmin(request);
  if (!admin) return forbidden();
  const { id } = await context.params;
  const parsed = UpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: 'invalid_request' }, { status: 400 });
  const db = createServiceClient();
  if (parsed.data.accountStatus) {
    const suspended = parsed.data.accountStatus === 'suspended';
    const { error } = await db.from('profiles').update({ account_status: parsed.data.accountStatus, suspended_at: suspended ? new Date().toISOString() : null }).eq('id', id);
    if (error) return Response.json({ error: 'update_failed' }, { status: 500 });
    await db.from('admin_audit_logs').insert({ admin_user_id: admin.id, target_user_id: id, action: suspended ? 'customer_suspended' : 'customer_activated' });
  }
  if (parsed.data.planId) {
    const { error } = await db.from('customer_subscriptions').update({ plan_id: parsed.data.planId, status: 'active' }).eq('user_id', id);
    if (error) return Response.json({ error: 'subscription_update_failed' }, { status: 500 });
    await db.from('admin_audit_logs').insert({ admin_user_id: admin.id, target_user_id: id, action: 'subscription_plan_changed', metadata: { planId: parsed.data.planId } });
  }
  return Response.json({ success: true });
}
