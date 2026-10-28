/** Platform Meta configuration status (credentials are deployment secrets). */

import { getAuthenticatedUser, unauthorized } from '@/lib/auth';
import { getMetaSettings } from '@/lib/settings';
import { getAppUrl } from '@/lib/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request): Promise<Response> {
  const user = await getAuthenticatedUser(request);
  if (!user) return unauthorized();
  const settings = await getMetaSettings();
  const appUrl = getAppUrl(request);
  return Response.json({
    configured: !!settings,
    // The app ID is an OAuth client identifier, not a secret. It is returned
    // only for operational diagnostics; customer UI never edits it.
    metaAppId: settings?.metaAppId ?? null,
    webhookUrl: `${appUrl}/api/webhook`,
    oauthRedirectUri: `${appUrl}/api/instagram/callback`,
    appUrl,
  });
}
