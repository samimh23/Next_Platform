/** Cookie names and options for the backend tokens. Shared by Server Actions and the proxy. */
export const ACCESS_COOKIE = 'pos_at';
export const REFRESH_COOKIE = 'pos_rt';

const REFRESH_MAX_AGE = 30 * 24 * 3600; // backend REFRESH_TOKEN_TTL_DAYS

export interface Tokens {
  accessToken: string;
  refreshToken: string;
  /** Seconds the access token is valid. */
  expiresIn: number;
}

/** httpOnly: page scripts can't read them. SameSite=Lax: not sent by other sites' forms. */
const base = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
};

export function sessionCookies(t: Tokens) {
  return [
    { name: ACCESS_COOKIE, value: t.accessToken, ...base, maxAge: t.expiresIn },
    { name: REFRESH_COOKIE, value: t.refreshToken, ...base, maxAge: REFRESH_MAX_AGE },
  ];
}

export function clearedCookies() {
  return [
    { name: ACCESS_COOKIE, value: '', ...base, maxAge: 0 },
    { name: REFRESH_COOKIE, value: '', ...base, maxAge: 0 },
  ];
}
