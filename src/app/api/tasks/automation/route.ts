import { processDueJobs } from '@/lib/automation/engine';
import { safeCompare } from '@/lib/crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/** Cloud Tasks worker endpoint. Keep its token in Secret Manager on Cloud Run. */
export async function POST(request: Request) {
  const expected = process.env.CLOUD_TASKS_WORKER_TOKEN ?? '';
  const received = request.headers.get('x-opendm-task-token') ?? '';
  if (!expected || !received || !safeCompare(expected, received)) return Response.json({ error: 'Unauthorized task' }, { status: 401 });
  const result = await processDueJobs(1, 50_000);
  return Response.json(result);
}
