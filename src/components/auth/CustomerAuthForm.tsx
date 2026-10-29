'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { signInWithPopup } from 'firebase/auth';
import { getFirebaseAuth, googleProvider } from '@/lib/firebase/client';
import { LogoMark, LogoWordmark } from '@/components/ui/Logo';

async function establishSession() {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error('Google sign-in did not complete.');
  const response = await fetch('/api/auth/session', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken: await user.getIdToken(true) }),
  });
  if (!response.ok) throw new Error('Google sign-in worked, but the secure server session could not be created.');
}

export function CustomerAuthForm() {
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState<string | null>(null);
  const google = async () => {
    setBusy(true); setMessage(null);
    try { await signInWithPopup(getFirebaseAuth(), googleProvider); await establishSession(); window.location.assign('/dashboard'); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Google sign-in could not be completed.'); }
    finally { setBusy(false); }
  };
  return <main className="min-h-screen grid place-items-center p-5 bg-background text-foreground"><section className="w-full max-w-sm rounded-xl border border-border bg-card p-7 shadow-xl shadow-black/5"><Link href="/" className="mb-7 inline-flex items-center gap-2.5"><LogoMark className="w-8 h-8" /><LogoWordmark className="text-lg" /></Link><h1 className="text-xl font-heading font-semibold">Welcome to OpenDM</h1><p className="mt-1 text-sm text-muted-foreground">Continue securely with your Google account.</p><button onClick={() => void google()} disabled={busy} className="mt-6 flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-border text-sm font-semibold disabled:opacity-60">{busy && <Loader2 className="h-4 w-4 animate-spin" />}Continue with Google</button>{message && <p className="mt-3 text-sm text-muted-foreground" role="status">{message}</p>}</section></main>;
}
