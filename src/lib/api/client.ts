/**
 * Typed API client for the app's own /api routes (same origin).
 * Attaches the current Firebase ID token as a Bearer token.
 */

import { getFirebaseAuth } from '@/lib/firebase/client';

const API_URL = '/api';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: { error?: string; message?: string; details?: unknown }
  ) {
    super(body.message ?? body.error ?? `API error ${status}`);
    this.name = 'ApiError';
  }
}

export async function apiClient<T>(path: string, options?: RequestInit & { skipAuth?: boolean }): Promise<T> {
  const headers: Record<string, string> = {
    // Content-Type only when a body exists - bodyless requests with a JSON
    // Content-Type can confuse some runtimes into parsing an empty body.
    ...(options?.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    ...(options?.headers as Record<string, string> | undefined),
  };

  if (!options?.skipAuth) {
    const user = getFirebaseAuth().currentUser;
    if (user) headers['Authorization'] = `Bearer ${await user.getIdToken()}`;
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    let body: { error?: string; message?: string } = {};
    try {
      body = (await res.json()) as { error?: string; message?: string };
    } catch {
      // ignore parse errors
    }
    throw new ApiError(res.status, body);
  }

  return res.json() as Promise<T>;
}
