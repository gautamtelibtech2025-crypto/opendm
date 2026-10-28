'use client';

import { Loader2, ShieldCheck, TriangleAlert } from 'lucide-react';
import { useSetupStatus } from '@/hooks/useSetup';

/** Customer-safe platform connection status. No shared app secret is editable here. */
export default function SetupPage() {
  const { data, isLoading } = useSetupStatus();
  if (isLoading) return <div className="py-24 flex justify-center"><Loader2 className="w-5 h-5 animate-spin" /></div>;
  return <div className="max-w-2xl mx-auto space-y-4 pb-16">
    <div><h1 className="text-xl font-heading font-semibold">OpenDM platform connection</h1><p className="mt-1 text-sm text-muted-foreground">OpenDM securely operates one shared Meta app. You only authorize your own Instagram Professional account.</p></div>
    <section className="rounded-xl border border-border bg-card p-5">
      {data?.configured ? <><div className="flex items-center gap-2 font-semibold"><ShieldCheck className="w-5 h-5 text-secondary" /> Meta OAuth is configured</div><p className="mt-2 text-sm text-muted-foreground">Continue to Settings and connect your Instagram account. OpenDM never exposes the platform app secret or asks you to create a Meta app.</p></> : <><div className="flex items-center gap-2 font-semibold"><TriangleAlert className="w-5 h-5 text-amber-500" /> Platform configuration pending</div><p className="mt-2 text-sm text-muted-foreground">An OpenDM administrator must configure the shared Meta app server environment before Instagram connections can begin.</p></>}
    </section>
  </div>;
}
