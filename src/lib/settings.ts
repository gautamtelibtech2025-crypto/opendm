/**
 * OpenDM's shared Meta application configuration.
 *
 * The credentials belong to the platform, not to a customer. They are read
 * only on the server from deployment secrets and are never sent to browser
 * code, stored in a tenant row, or accepted from a customer-facing form.
 */

import { getEnv } from '@/lib/env';

export interface MetaSettings {
  metaAppId: string;
  metaAppSecret: string;
  metaFbAppSecret: string | null;
  webhookVerifyToken: string;
  setupCompleted: true;
}

export async function getMetaSettings(): Promise<MetaSettings | null> {
  try {
    const env = getEnv();
    return {
      metaAppId: env.META_INSTAGRAM_APP_ID,
      metaAppSecret: env.META_INSTAGRAM_APP_SECRET,
      metaFbAppSecret: env.META_FACEBOOK_APP_SECRET ?? null,
      webhookVerifyToken: env.META_WEBHOOK_VERIFY_TOKEN,
      setupCompleted: true,
    };
  } catch {
    // Allows a clear configuration response without exposing validation details
    // or crashing public auth and callback routes before deployment is ready.
    return null;
  }
}

/** @deprecated Shared Meta settings are deployment configuration, not DB data. */
export async function saveMetaSettings(): Promise<never> {
  throw new Error('Shared Meta app settings must be configured as deployment environment variables.');
}

export function invalidateSettingsCache(): void {
  // Kept as a harmless compatibility export for existing callers.
}
