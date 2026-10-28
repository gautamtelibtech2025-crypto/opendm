/** Server-side subscription and tenant-limit enforcement. */

import { createServiceClient } from '@/lib/supabase/service';

export class PlanLimitError extends Error {
  constructor(public readonly limit: 'instagram_accounts' | 'active_automations' | 'monthly_triggers') {
    super(`Your current plan has reached its ${limit.replace('_', ' ')} limit.`);
  }
}

interface Limits { max_instagram_accounts: number; max_active_automations: number; max_monthly_triggers: number; }

export async function getTenantLimits(userId: string): Promise<Limits> {
  const db = createServiceClient();
  const { data, error } = await db
    .from('customer_subscriptions')
    .select('status, subscription_plans(max_instagram_accounts, max_active_automations, max_monthly_triggers)')
    .eq('user_id', userId)
    .maybeSingle();
  if (error || !data || !['trialing', 'active'].includes(data.status as string)) {
    throw new PlanLimitError('instagram_accounts');
  }
  const plan = data.subscription_plans as unknown as Limits | null;
  if (!plan) throw new PlanLimitError('instagram_accounts');
  return plan;
}

export async function assertInstagramAccountCapacity(userId: string): Promise<void> {
  const [limits, db] = await Promise.all([getTenantLimits(userId), Promise.resolve(createServiceClient())]);
  const { count, error } = await db.from('instagram_accounts').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('is_active', true);
  if (error) throw error;
  if ((count ?? 0) >= limits.max_instagram_accounts) throw new PlanLimitError('instagram_accounts');
}

export async function assertAutomationCapacity(userId: string, willBeActive: boolean): Promise<void> {
  if (!willBeActive) return;
  const [limits, db] = await Promise.all([getTenantLimits(userId), Promise.resolve(createServiceClient())]);
  const { count, error } = await db.from('automations').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('is_active', true);
  if (error) throw error;
  if ((count ?? 0) >= limits.max_active_automations) throw new PlanLimitError('active_automations');
}
