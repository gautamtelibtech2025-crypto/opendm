import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { AdminUserDetail } from '@/components/admin/AdminUserDetail';
export default async function AdminUserPage({ params }: { params: Promise<{ id: string }> }) { const user = await getSessionUser(); if (!user) redirect('/login?next=%2Fadmin'); if (user.role !== 'admin') redirect('/dashboard'); const { id } = await params; return <AdminUserDetail userId={id} />; }
