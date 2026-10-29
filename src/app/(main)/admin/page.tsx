import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
export default async function AdminPage() { const user = await getSessionUser(); if (!user) redirect('/login?next=%2Fadmin'); if (user.role !== 'admin') redirect('/dashboard'); return <AdminDashboard />; }
