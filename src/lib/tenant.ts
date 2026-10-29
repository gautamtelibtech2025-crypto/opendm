/** Server-side subscription and tenant-limit enforcement backed by Firestore. */
import { getAdminFirestore } from '@/lib/firebase/admin';

export class PlanLimitError extends Error { constructor(public readonly limit: 'instagram_accounts' | 'active_automations' | 'monthly_triggers') { super(`Your current plan has reached its ${limit.replace('_', ' ')} limit.`); } }
interface Limits { max_instagram_accounts: number; max_active_automations: number; max_monthly_triggers: number; }
const freePlan: Limits = { max_instagram_accounts: 1, max_active_automations: 3, max_monthly_triggers: 1000 };

export async function getTenantLimits(userId: string): Promise<Limits> {
  const db = getAdminFirestore(); const subscription = (await db.collection('customerSubscriptions').doc(userId).get()).data();
  if (!subscription || !['trialing', 'active'].includes(subscription.status)) throw new PlanLimitError('instagram_accounts');
  if (subscription.plan_id === 'free') return freePlan;
  const plan = (await db.collection('plans').doc(subscription.plan_id).get()).data();
  if (!plan?.is_active) throw new PlanLimitError('instagram_accounts');
  return { max_instagram_accounts: plan.max_instagram_accounts, max_active_automations: plan.max_active_automations, max_monthly_triggers: plan.max_monthly_triggers };
}
async function activeCount(collection: string, userId: string): Promise<number> { return (await getAdminFirestore().collection(collection).where('user_id', '==', userId).where('is_active', '==', true).count().get()).data().count; }
export async function assertInstagramAccountCapacity(userId: string): Promise<void> { const [limits, count] = await Promise.all([getTenantLimits(userId), activeCount('instagram_accounts', userId)]); if (count >= limits.max_instagram_accounts) throw new PlanLimitError('instagram_accounts'); }
export async function assertAutomationCapacity(userId: string, willBeActive: boolean): Promise<void> { if (!willBeActive) return; const [limits, count] = await Promise.all([getTenantLimits(userId), activeCount('automations', userId)]); if (count >= limits.max_active_automations) throw new PlanLimitError('active_automations'); }
