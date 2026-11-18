import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { ACCESS_COOKIE } from '../auth/cookies';
import { callBackend, type MeResult } from './client';
import { BackendError } from './errors';

/**
 * Backend call from a Server Component with the logged-in owner's token.
 * The proxy has already refreshed the token if needed; if the backend still
 * says 401, the session is over → back to login.
 */
export async function ownerFetch<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) redirect('/login');
  try {
    return await callBackend<T>(path, { ...init, accessToken: token });
  } catch (e) {
    if (e instanceof BackendError && e.status === 401) redirect('/login');
    throw e;
  }
}

/** Current owner + business + branches. Cached for one request (layout + page share it). */
export const getMe = cache(() => ownerFetch<MeResult>('/v1/auth/me'));
