'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase';
import { LogoMark, LogoWordmark } from '@/components/ui/Logo';

type Mode = 'login' | 'signup' | 'forgot';

export function CustomerAuthForm({ mode }: { mode: Mode }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    const supabase = createBrowserClient();
    const callback = `${window.location.origin}/auth/callback`;
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.assign('/dashboard');
        return;
      }
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: callback } });
        if (error) throw error;
        setMessage('Check your email to confirm your OpenDM account.');
        return;
      }
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/update-password` });
      if (error) throw error;
      setMessage('If an account exists for this email, a reset link has been sent.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const title = mode === 'login' ? 'Welcome to OpenDM' : mode === 'signup' ? 'Create your OpenDM account' : 'Reset your password';
  const button = mode === 'login' ? 'Log in' : mode === 'signup' ? 'Create account' : 'Send reset link';

  return (
    <main className="min-h-screen grid place-items-center p-5 bg-background text-foreground">
      <section className="w-full max-w-sm rounded-xl border border-border bg-card p-7 shadow-xl shadow-black/5">
        <Link href="/" className="mb-7 inline-flex items-center gap-2.5"><LogoMark className="w-8 h-8" /><LogoWordmark className="text-lg" /></Link>
        <h1 className="text-xl font-heading font-semibold">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Connect your own Instagram Professional account using OpenDM.</p>
        <form onSubmit={(event) => void submit(event)} className="mt-6 space-y-3">
          <input aria-label="Email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" />
          {mode !== 'forgot' && <input aria-label="Password" type="password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password (8+ characters)" className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" />}
          {message && <p className="text-sm text-muted-foreground" role="status">{message}</p>}
          <button disabled={busy} className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-foreground text-sm font-semibold text-background disabled:opacity-60">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}{button}
          </button>
        </form>
        <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
          {mode !== 'login' && <Link className="underline" href="/login">Log in</Link>}
          {mode !== 'signup' && <Link className="underline" href="/signup">Create account</Link>}
          {mode !== 'forgot' && <Link className="underline" href="/forgot-password">Forgot password?</Link>}
        </div>
      </section>
    </main>
  );
}
