/**
 * Reads the payload of a backend access token WITHOUT verifying it.
 * Only for quick routing decisions (who is logged in, which section).
 * The backend verifies the signature on every API call — that is the real check.
 */
export interface AccessClaims {
  sub: string;
  tenantId: string;
  role: 'owner' | 'manager';
  /** Expiry, seconds since epoch. */
  exp: number;
}

export function decodeAccessToken(token: string | undefined): AccessClaims | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const json = JSON.parse(atob(parts[1]!.replace(/-/g, '+').replace(/_/g, '/')));
    if (typeof json.sub !== 'string' || typeof json.exp !== 'number' || typeof json.role !== 'string') return null;
    return { sub: json.sub, tenantId: json.tenantId, role: json.role, exp: json.exp };
  } catch {
    return null;
  }
}

/** Expired, or expiring within `marginSeconds` (refresh a bit early to avoid failing mid-request). */
export function isExpired(claims: AccessClaims | null, nowMs = Date.now(), marginSeconds = 30): boolean {
  return !claims || claims.exp * 1000 - marginSeconds * 1000 <= nowMs;
}

export const isOwnerRole = (claims: AccessClaims | null) => claims?.role === 'owner' || claims?.role === 'manager';
