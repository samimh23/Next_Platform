import { BACKEND_URL } from '../config';
import { BackendError } from './errors';

/**
 * Low-level call to the backend. Works on the server (Server Actions, Server
 * Components, proxy). Throws BackendError with the backend's error code.
 */
export async function callBackend<T>(
  path: string,
  init: { method?: string; body?: unknown; accessToken?: string } = {},
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BACKEND_URL}${path}`, {
      method: init.method ?? 'GET',
      headers: {
        ...(init.body !== undefined && { 'content-type': 'application/json' }),
        ...(init.accessToken && { authorization: `Bearer ${init.accessToken}` }),
      },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      cache: 'no-store',
    });
  } catch {
    throw new BackendError('NETWORK', 'Backend unreachable', 0);
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = data?.error ?? {};
    throw new BackendError(err.code ?? `HTTP_${res.status}`, err.message ?? res.statusText, res.status);
  }
  return data as T;
}

// ── Shapes returned by the backend (subset we use) ──

export interface MeResult {
  user: { id: string; email: string; name: string; role: 'owner' | 'manager' };
  tenant: { id: string; name: string; taxId: string | null };
  branches: { id: string; name: string; type: string }[];
}

export interface AuthResult extends MeResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
