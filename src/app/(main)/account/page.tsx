'use client';
import { FormEvent, useEffect, useState } from 'react';
import { apiClient } from '@/lib/api/client';

export default function AccountPage() {
  const [name, setName] = useState(''); const [message, setMessage] = useState<string | null>(null);
  useEffect(() => { void apiClient<{ account: { full_name: string } }>('/account').then(value => setName(value.account.full_name)).catch(() => setMessage('Unable to load account settings.')); }, []);
  const save = async (event: FormEvent) => { event.preventDefault(); try { await apiClient('/account', { method: 'PATCH', body: JSON.stringify({ fullName: name }) }); setMessage('Account settings saved.'); } catch { setMessage('Unable to save account settings.'); } };
  return <div className="max-w-xl mx-auto pb-16"><h1 className="text-xl font-semibold">Account settings</h1><p className="mt-1 text-sm text-muted-foreground">Manage your OpenDM customer account. Authentication is handled through Google.</p><form onSubmit={(event) => void save(event)} className="mt-6 space-y-4 rounded-xl border border-border bg-card p-5"><label className="block text-sm">Name<input className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3" value={name} onChange={(event) => setName(event.target.value)} /></label><button className="h-10 rounded-lg bg-foreground px-4 text-sm font-semibold text-background">Save changes</button>{message && <p className="text-sm text-muted-foreground">{message}</p>}</form></div>;
}
