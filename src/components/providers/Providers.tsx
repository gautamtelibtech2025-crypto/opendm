'use client';

/**
 * AppProviders - wraps the app with all client-side providers.
 *
 * Providers included:
 *   1. ThemeProvider - existing dark/light mode provider (unchanged)
 *   2. QueryClientProvider - TanStack Query for server state caching
 *   3. Firebase auth listener - keeps Zustand store in sync with session
 *
 * This is a Client Component because it sets up listeners and providers that
 * require browser APIs. The children (which may be Server Components) are
 * passed through unaffected.
 */

import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './ThemeProvider';
import { onAuthStateChanged } from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase/client';
import { useAuthStore } from '@/lib/store';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 60 seconds
      retry: 1,
    },
  },
});

function AuthListener() {
  const { setAuth, clearAuth } = useAuthStore();

  useEffect(() => {
    return onAuthStateChanged(getFirebaseAuth(), async user => {
      if (user) setAuth(user, { access_token: await user.getIdToken() });
      else clearAuth();
    });
  }, [setAuth, clearAuth]);

  return null;
}

interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <AuthListener />
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
}
