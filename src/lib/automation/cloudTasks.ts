/** Cloud Tasks bridge. Queue/worker settings are optional for local development. */
import { CloudTasksClient } from '@google-cloud/tasks';
import type { AutoDmJobPayload } from '@/lib/types';

export async function enqueueAutomationTask(jobId: string, payload: AutoDmJobPayload): Promise<void> {
  const project = process.env.GOOGLE_CLOUD_PROJECT; const location = process.env.CLOUD_TASKS_LOCATION; const queue = process.env.CLOUD_TASKS_QUEUE; const workerUrl = process.env.CLOUD_TASKS_WORKER_URL; const workerToken = process.env.CLOUD_TASKS_WORKER_TOKEN;
  if (!project || !location || !queue || !workerUrl || !workerToken) return; // Local cron fallback; deployment must set all values.
  const client = new CloudTasksClient(); const parent = client.queuePath(project, location, queue);
  await client.createTask({ parent, task: { name: client.taskPath(project, location, queue, `opendm-${jobId}`.slice(0, 500)), httpRequest: { httpMethod: 'POST', url: workerUrl, headers: { 'Content-Type': 'application/json', 'x-opendm-task-token': workerToken }, body: Buffer.from(JSON.stringify({ jobId, payload })).toString('base64') }, dispatchDeadline: { seconds: 60 } } });
}
