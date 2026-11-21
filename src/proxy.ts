import { NextResponse, type NextRequest } from 'next/server';
import { ACCESS_COOKIE, REFRESH_COOKIE, clearedCookies, sessionCookies, type Tokens } from './lib/auth/cookies';
import {
  CUSTOMER_ACCESS_COOKIE,
  CUSTOMER_REFRESH_COOKIE,
  clearedCustomerCookies,
  customerCookies,
  decodeCustomerToken,
  type CustomerTokens,
} from './lib/auth/customer';
import { decodeAccessToken, isExpired, isOwnerRole } from './lib/auth/token';
import { BACKEND_URL } from './lib/config';

/**
 * Runs before every page:
 * 1. Refreshes the 15-minute access token when it's expired (using the refresh cookie).
 * 2. Optimistic route guard: /owner needs an owner/manager session; logged-in users skip /login.
 * The real authorization is still done by the backend on every API call.
 */
export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  if (path === '/app' || path.startsWith('/app/') || path.startsWith('/r/')) return customerProxy(req, path);
  let claims = decodeAccessToken(req.cookies.get(ACCESS_COOKIE)?.value);
  const refreshToken = req.cookies.get(REFRESH_COOKIE)?.value;
  let setCookies: ReturnType<typeof sessionCookies> | null = null;

  // Never refresh on a prefetch: parallel prefetches would reuse the same refresh token,
  // which the backend treats as theft and closes every session.
  const isPrefetch = req.headers.get('next-router-prefetch') === '1';

  if (isExpired(claims) && refreshToken && !isPrefetch) {
    const tokens = await refresh(refreshToken);
    if (tokens) {
      setCookies = sessionCookies(tokens);
      claims = decodeAccessToken(tokens.accessToken);
      // Let Server Components of THIS request see the new token too.
      req.cookies.set(ACCESS_COOKIE, tokens.accessToken);
      req.cookies.set(REFRESH_COOKIE, tokens.refreshToken);
    } else {
      setCookies = clearedCookies();
      claims = null;
    }
  }

  const loggedInOwner = !isExpired(claims, Date.now(), 0) && isOwnerRole(claims);
  let res: NextResponse;

  if (path.startsWith('/owner') && !loggedInOwner) {
    const login = new URL('/login', req.nextUrl);
    login.searchParams.set('next', path);
    res = NextResponse.redirect(login);
  } else if ((path === '/login' || path === '/signup') && loggedInOwner) {
    res = NextResponse.redirect(new URL('/owner/dashboard', req.nextUrl));
  } else {
    res = NextResponse.next({ request: { headers: req.headers } });
  }

  for (const c of setCookies ?? []) res.cookies.set(c);
  return res;
}

/**
 * The customer app (/app, and /r/… opened by the receipt QR): same idea with the customer
 * cookies. Only "Mes points" needs a session; cafés can be browsed without an account.
 */
async function customerProxy(req: NextRequest, path: string) {
  const exp = (t: string | undefined) => decodeCustomerToken(t);
  let claims = exp(req.cookies.get(CUSTOMER_ACCESS_COOKIE)?.value);
  const refreshToken = req.cookies.get(CUSTOMER_REFRESH_COOKIE)?.value;
  let setCookies: ReturnType<typeof customerCookies> | null = null;
  const expired = (c: typeof claims, margin = 30) => !c || c.exp * 1000 - margin * 1000 <= Date.now();

  if (expired(claims) && refreshToken && req.headers.get('next-router-prefetch') !== '1') {
    const tokens = await refresh<CustomerTokens>(refreshToken, '/v1/customer/auth/refresh');
    if (tokens) {
      setCookies = customerCookies(tokens);
      claims = exp(tokens.accessToken);
      req.cookies.set(CUSTOMER_ACCESS_COOKIE, tokens.accessToken);
      req.cookies.set(CUSTOMER_REFRESH_COOKIE, tokens.refreshToken);
    } else {
      setCookies = clearedCustomerCookies();
      claims = null;
    }
  }

  const loggedIn = !expired(claims, 0);
  let res: NextResponse;
  if (path === '/app' && !loggedIn) {
    res = NextResponse.redirect(new URL('/app/login', req.nextUrl));
  } else if ((path === '/app/login' || path === '/app/signup') && loggedIn) {
    res = NextResponse.redirect(new URL('/app', req.nextUrl));
  } else {
    res = NextResponse.next({ request: { headers: req.headers } });
  }
  for (const c of setCookies ?? []) res.cookies.set(c);
  return res;
}

async function refresh<T = Tokens>(refreshToken: string, path = '/v1/auth/refresh'): Promise<T | null> {
  try {
    const r = await fetch(`${BACKEND_URL}${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
      cache: 'no-store',
    });
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch {
    return null; // backend down: keep going as logged out
  }
}

export const config = {
  // Pages only — not static files or images.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|svg|ico|jpg|webp)$).*)'],
};
