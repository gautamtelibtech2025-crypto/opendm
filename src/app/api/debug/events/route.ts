/**
 * Debug panel API - recent automation events.
 * GET    → newest 200 events
 * DELETE → clear the log
 *
 * Auth-gated (your own instance, your own logs) and additionally hidden in
 * the UI unless NEXT_PUBLIC_DEBUG=true.
 */

import { getAuthenticatedUser, requireAdmin, unauthorized, forbidden } from '@/lib/auth';
import { createFirestoreService as createServiceClient } from '@/lib/firebase/service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request): Promise<Response> {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorized();

  const db = createServiceClient();
  let query = db
    .from('debug_events')
    .select('id, created_at, service, level, event_type, status, message, metadata')
    .order('created_at', { ascending: false })
    .limit(200);
  // Platform events are not tenant-neutral. Customers receive only events
  // explicitly tagged with their userId; administrators may inspect all.
  if (user.role !== 'admin') query = query.eq('metadata->>userId', user.id);
  const { data, error } = await query;

  if (error) {
    return Response.json({ error: 'Failed to fetch debug events' }, { status: 500 });
  }
  return Response.json({ events: data ?? [] });
}

export async function DELETE(request: Request): Promise<Response> {
  if (!await requireAdmin(request)) return forbidden();

  const db = createServiceClient();
  const { error } = await db.from('debug_events').delete().gte('created_at', '1970-01-01');
  if (error) {
    return Response.json({ error: 'Failed to clear debug events' }, { status: 500 });
  }
  return Response.json({ success: true });
}
