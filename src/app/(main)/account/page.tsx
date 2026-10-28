'use client';

import { FormEvent, useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase';

export default function AccountPage() {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  useEffect(() => { const load = async () => { const db = createBrowserClient(); const { data: { user } } = await db.auth.getUser(); if (!user) return; const { data } = await db.from('profiles').select('full_name').eq('id', user.id).maybeSingle(); setName(data?.full_name ?? ''); }; void load(); }, []);
  const save = async (event: FormEvent) => { event.preventDefault(); const db = createBrowserClient(); const { data: { user } } = await db.auth.getUser(); if (!user) return; const { error } = await db.from('profiles').update({ full_name: name }).eq('id', user.id); if (error) return setMessage(error.message); if (password) { const { error: passwordError } = await db.auth.updateUser({ password }); if (passwordError) return setMessage(passwordError.message); } setPassword(''); setMessage('Account settings saved.'); };
  return <div className="max-w-xl mx-auto pb-16"><h1 className="text-xl font-semibold">Account settings</h1><p className="mt-1 text-sm text-muted-foreground">Manage your OpenDM customer account.</p><form onSubmit={(event) => void save(event)} className="mt-6 space-y-4 rounded-xl border border-border bg-card p-5"><label className="block text-sm">Name<input className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3" value={name} onChange={(event) => setName(event.target.value)} /></label><label className="block text-sm">New password<input className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3" type="password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Leave blank to keep current password" /></label><button className="h-10 rounded-lg bg-foreground px-4 text-sm font-semibold text-background">Save changes</button>{message && <p className="text-sm text-muted-foreground">{message}</p>}</form></div>;
}
