/**
 * Customer (loyalty app) session: its own cookies and its own tokens, separate from the
 * owner area. A phone can be logged in as a customer and as an owner at the same time.
 */
export const CUSTOMER_ACCESS_COOKIE = 'kw_cat';
export const CUSTOMER_REFRESH_COOKIE = 'kw_rt';

const REFRESH_MAX_AGE = 30 * 24 * 3600; // backend REFRESH_TOKEN_TTL_DAYS

export interface CustomerTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

const base = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
};

export function customerCookies(t: CustomerTokens) {
  return [
    { name: CUSTOMER_ACCESS_COOKIE, value: t.accessToken, ...base, maxAge: t.expiresIn },
    { name: CUSTOMER_REFRESH_COOKIE, value: t.refreshToken, ...base, maxAge: REFRESH_MAX_AGE },
  ];
}

export function clearedCustomerCookies() {
  return [
    { name: CUSTOMER_ACCESS_COOKIE, value: '', ...base, maxAge: 0 },
    { name: CUSTOMER_REFRESH_COOKIE, value: '', ...base, maxAge: 0 },
  ];
}

export interface CustomerClaims {
  sub: string;
  exp: number;
}

/** Reads a customer token WITHOUT verifying it (routing only; the backend checks it). */
export function decodeCustomerToken(token: string | undefined): CustomerClaims | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const json = JSON.parse(atob(parts[1]!.replace(/-/g, '+').replace(/_/g, '/')));
    if (json.iss !== 'kahwti-customer' || typeof json.sub !== 'string' || typeof json.exp !== 'number') return null;
    return { sub: json.sub, exp: json.exp };
  } catch {
    return null;
  }
}

/** Where to go after login: only our customer pages (no open redirect). */
export function safeCustomerNext(next: unknown): string {
  const s = typeof next === 'string' ? next : '';
  return (s === '/app' || s.startsWith('/app/') || s.startsWith('/r/')) && !s.startsWith('//') ? s : '/app';
}

/** The receipt QR "<payload>.<signature>": shows what it is before claiming (not verified here). */
export interface ReceiptPreview {
  receiptNumber: string;
  /** Millimes. */
  total: number;
  at: Date;
}

export function previewReceiptCode(code: string): ReceiptPreview | null {
  const [payload, sig, extra] = code.split('.');
  if (!payload || !sig || extra !== undefined) return null;
  try {
    const j = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    if (typeof j.n !== 'string' || !Number.isInteger(j.t) || typeof j.at !== 'number') return null;
    return { receiptNumber: j.n, total: j.t, at: new Date(j.at * 1000) };
  } catch {
    return null;
  }
}
