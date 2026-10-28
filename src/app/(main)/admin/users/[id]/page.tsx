import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createServerClient } from '@/lib/supabase';
import { AdminUserDetail } from '@/components/admin/AdminUserDetail';

export default async function AdminUserPage({ params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = user ? await supabase.from('profiles').select('role, account_status').eq('id', user.id).maybeSingle() : { data: null };
  if (!profile || profile.role !== 'admin' || profile.account_status !== 'active') redirect('/dashboard');
  const { id } = await params;
  return <AdminUserDetail userId={id} />;
}
