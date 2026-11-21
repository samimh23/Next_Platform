import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { CUSTOMER_ACCESS_COOKIE, decodeCustomerToken } from '../auth/customer';
import { callBackend } from './client';
import { BackendError } from './errors';
import type { CustomerView } from './types';

/** Backend call with the logged-in customer's token; 401 → customer login. */
export async function customerFetch<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const token = (await cookies()).get(CUSTOMER_ACCESS_COOKIE)?.value;
  if (!token) redirect('/app/login');
  try {
    return await callBackend<T>(path, { ...init, accessToken: token });
  } catch (e) {
    if (e instanceof BackendError && e.status === 401) redirect('/app/login');
    throw e;
  }
}

/** Is a customer logged in? (cookie present and readable; the backend still checks it). */
export async function hasCustomerSession(): Promise<boolean> {
  return decodeCustomerToken((await cookies()).get(CUSTOMER_ACCESS_COOKIE)?.value) !== null;
}

/** The logged-in customer, or null. Cached for one request. */
export const getCustomer = cache(async (): Promise<CustomerView | null> => {
  if (!(await hasCustomerSession())) return null;
  return customerFetch<CustomerView>('/v1/customer/me');
});

/** Public endpoints (café directory): no token. */
export const publicFetch = <T>(path: string) => callBackend<T>(path);
