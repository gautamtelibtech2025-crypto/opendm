'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

type Detail = { profile: { id: string; full_name: string | null; account_status: 'active' | 'suspended'; created_at: string }; subscription: { status: string; subscription_plans: { name: string; code: string; max_instagram_accounts: number; max_active_automations: number; max_monthly_triggers: number } | null } | null; accounts: Array<{ id: string; username: string; is_active: boolean }>; automations: Array<{ id: string; name: string; type: string; is_active: boolean; total_dms_sent: number }> };

export function AdminUserDetail({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['admin-user', userId], queryFn: () => apiClient<Detail>(`/admin/users/${userId}`) });
  const mutation = useMutation({ mutationFn: (accountStatus: 'active' | 'suspended') => apiClient(`/admin/users/${userId}`, { method: 'PATCH', body: JSON.stringify({ accountStatus }) }), onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['admin-user', userId] }) });
  if (isLoading || !data) return <p className="text-sm text-muted-foreground">Loading customer…</p>;
  const plan = data.subscription?.subscription_plans;
  return <div className="max-w-4xl mx-auto space-y-6 pb-16"><div className="flex justify-between gap-4"><div><h1 className="text-xl font-semibold">{data.profile.full_name || 'Customer'}</h1><p className="text-xs text-muted-foreground font-mono">{data.profile.id}</p></div><button onClick={() => mutation.mutate(data.profile.account_status === 'active' ? 'suspended' : 'active')} className="h-9 rounded-lg border border-border px-3 text-sm font-semibold">{data.profile.account_status === 'active' ? 'Suspend customer' : 'Activate customer'}</button></div><section className="rounded-xl border border-border bg-card p-5"><h2 className="font-semibold">Subscription and limits</h2><p className="mt-2 text-sm text-muted-foreground">{data.subscription?.status ?? 'No subscription'} · {plan?.name ?? 'No plan'}</p>{plan && <ul className="mt-3 text-sm text-muted-foreground"><li>{plan.max_instagram_accounts} Instagram account(s)</li><li>{plan.max_active_automations} active automation(s)</li><li>{plan.max_monthly_triggers.toLocaleString()} monthly triggers</li></ul>}</section><section className="rounded-xl border border-border bg-card p-5"><h2 className="font-semibold">Instagram connections</h2><p className="mt-2 text-sm text-muted-foreground">{data.accounts.map((account) => `@${account.username}`).join(', ') || 'None'}</p></section><section className="rounded-xl border border-border bg-card p-5"><h2 className="font-semibold">Automations</h2><p className="mt-2 text-sm text-muted-foreground">{data.automations.map((automation) => automation.name).join(', ') || 'None'}</p></section></div>;
}
