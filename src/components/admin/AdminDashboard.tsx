'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { apiClient } from '@/lib/api/client';

type Overview = { totals: { customers: number; activeInstagramConnections: number; activeAutomations: number }; users: Array<{ id: string; full_name: string | null; role: string; account_status: string; created_at: string }> };

export function AdminDashboard() {
  const { data, isLoading, error } = useQuery({ queryKey: ['admin-overview'], queryFn: () => apiClient<Overview>('/admin/overview') });
  if (isLoading) return <p className="text-sm text-muted-foreground">Loading platform data…</p>;
  if (error) return <p className="text-sm text-destructive">Unable to load the admin dashboard.</p>;
  return <div className="max-w-6xl mx-auto space-y-7 pb-16">
    <div><h1 className="text-xl font-heading font-semibold">OpenDM Super Admin</h1><p className="mt-1 text-sm text-muted-foreground">Platform-wide customer and automation oversight.</p></div>
    <div className="grid gap-3 sm:grid-cols-3">{[
      ['Customers', data?.totals.customers ?? 0], ['Active Instagram connections', data?.totals.activeInstagramConnections ?? 0], ['Active automations', data?.totals.activeAutomations ?? 0],
    ].map(([label, value]) => <div key={String(label)} className="rounded-xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></div>)}</div>
    <section className="rounded-xl border border-border bg-card overflow-hidden"><div className="border-b border-border px-5 py-3"><h2 className="font-semibold">Customers</h2></div><div className="divide-y divide-border">{data?.users.map((user) => <Link key={user.id} href={`/admin/users/${user.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-muted/50"><span><span className="font-medium">{user.full_name || 'Unnamed customer'}</span><span className="ml-2 text-xs text-muted-foreground">{user.role}</span></span><span className={user.account_status === 'active' ? 'text-xs text-secondary' : 'text-xs text-destructive'}>{user.account_status}</span></Link>)}</div></section>
  </div>;
}
