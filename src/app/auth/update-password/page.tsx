'use client';

import { FormEvent, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase';

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const { error } = await createBrowserClient().auth.updateUser({ password });
    if (error) return setMessage(error.message);
    window.location.assign('/dashboard');
  };

  return <main className="min-h-screen grid place-items-center p-5 bg-background"><form onSubmit={(event) => void submit(event)} className="w-full max-w-sm space-y-4 rounded-xl border border-border bg-card p-7"><h1 className="text-xl font-semibold">Set a new password</h1><input aria-label="New password" className="h-10 w-full rounded-lg border border-border bg-background px-3" type="password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} /><button className="h-10 w-full rounded-lg bg-foreground text-background font-semibold">Save password</button>{message && <p className="text-sm text-destructive">{message}</p>}</form></main>;
}
