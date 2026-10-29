'use client';

import { LogOut } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase/client';

export function LogoutButton() {
  const logout = async () => {
    await fetch('/api/auth/session', { method: 'DELETE' });
    await signOut(getFirebaseAuth());
    window.location.assign('/login');
  };
  return <button onClick={() => void logout()} className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"><LogOut className="w-3.5 h-3.5" />Log out</button>;
}
