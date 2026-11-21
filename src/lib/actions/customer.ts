'use server';

import { cookies } from 'next/headers';
import { refresh } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import {
  CUSTOMER_ACCESS_COOKIE,
  CUSTOMER_REFRESH_COOKIE,
  clearedCustomerCookies,
  customerCookies,
  safeCustomerNext,
} from '../auth/customer';
import { callBackend } from '../backend/client';
import { BackendError, messageFor } from '../backend/errors';
import type { ClaimResult, CustomerAuthResult } from '../backend/types';
import type { FormState } from './auth';

const LoginSchema = z.object({
  email: z.string().trim().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});

const SignupSchema = z.object({
  name: z.string().trim().min(1, 'Votre prénom est requis').max(80),
  email: z.string().trim().email('Email invalide'),
  password: z.string().min(8, 'Au moins 8 caractères').max(128),
});

function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) out[String(issue.path[0])] ??= issue.message;
  return out;
}

async function startSession(r: CustomerAuthResult) {
  const store = await cookies();
  for (const c of customerCookies(r)) store.set(c);
}

export async function customerLoginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = { email: String(formData.get('email') ?? '') };
  const parsed = LoginSchema.safeParse({ email: formData.get('email'), password: formData.get('password') });
  if (!parsed.success) return { fields: fieldErrors(parsed.error), values };
  try {
    await startSession(await callBackend<CustomerAuthResult>('/v1/customer/auth/login', { method: 'POST', body: parsed.data }));
  } catch (e) {
    return { error: messageFor(e), values };
  }
  redirect(safeCustomerNext(formData.get('next')));
}

export async function customerSignupAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const raw = { name: formData.get('name'), email: formData.get('email'), password: formData.get('password') };
  const values = { name: String(raw.name ?? ''), email: String(raw.email ?? '') };
  const parsed = SignupSchema.safeParse(raw);
  if (!parsed.success) return { fields: fieldErrors(parsed.error), values };
  try {
    await startSession(await callBackend<CustomerAuthResult>('/v1/customer/auth/signup', { method: 'POST', body: parsed.data }));
  } catch (e) {
    return { error: messageFor(e), values };
  }
  redirect(safeCustomerNext(formData.get('next')));
}

export async function customerLogoutAction(): Promise<void> {
  const store = await cookies();
  const refreshToken = store.get(CUSTOMER_REFRESH_COOKIE)?.value;
  if (refreshToken) {
    await callBackend('/v1/customer/auth/logout', { method: 'POST', body: { refreshToken } }).catch(() => undefined);
  }
  for (const c of clearedCustomerCookies()) store.set(c);
  redirect('/app/login');
}

export type ClaimState = { result?: ClaimResult; error?: string };

/** "Récupérer mes points" on the page the receipt QR opens. */
export async function claimAction(_prev: ClaimState, formData: FormData): Promise<ClaimState> {
  const code = String(formData.get('code') ?? '');
  const optIn = formData.get('optIn') === 'on';
  const token = (await cookies()).get(CUSTOMER_ACCESS_COOKIE)?.value;
  if (!token) redirect(`/app/login?next=${encodeURIComponent(`/r/${code}`)}`);
  try {
    return {
      result: await callBackend<ClaimResult>('/v1/customer/claims', {
        method: 'POST',
        body: { code, ...(optIn && { optIn: true }) },
        accessToken: token,
      }),
    };
  } catch (e) {
    if (e instanceof BackendError && e.status === 401) redirect(`/app/login?next=${encodeURIComponent(`/r/${code}`)}`);
    return { error: messageFor(e) };
  }
}

export interface RedemptionCode {
  code: string;
  expiresAt: string;
  rewardName: string;
  points: number;
}

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

async function asCustomer<T>(path: string, init: { method: string; body?: unknown }): Promise<Result<T>> {
  const token = (await cookies()).get(CUSTOMER_ACCESS_COOKIE)?.value;
  if (!token) redirect('/app/login');
  try {
    return { ok: true, data: await callBackend<T>(path, { ...init, accessToken: token }) };
  } catch (e) {
    if (e instanceof BackendError && e.status === 401) redirect('/app/login');
    return { ok: false, error: messageFor(e) };
  }
}

/** "Utiliser" on a reward: a 6-digit code for the cashier. Points are spent when the POS validates it. */
export async function createRedemptionAction(cafeId: string, rewardId: string): Promise<Result<RedemptionCode>> {
  if (!z.string().uuid().safeParse(cafeId).success || !z.string().min(1).max(40).safeParse(rewardId).success) {
    return { ok: false, error: 'Demande invalide.' };
  }
  return asCustomer(`/v1/customer/points/${cafeId}/redemptions`, { method: 'POST', body: { rewardId } });
}

/** "Utiliser" on a gift from the café: same 6-digit code, no points. */
export async function createGiftCodeAction(giftId: string): Promise<Result<RedemptionCode>> {
  if (!z.string().uuid().safeParse(giftId).success) return { ok: false, error: 'Demande invalide.' };
  return asCustomer(`/v1/customer/gifts/${giftId}/code`, { method: 'POST' });
}

/** Join or leave a café's club (shares first name and visits, receives its gifts). */
export async function setClubAction(cafeId: string, optIn: boolean): Promise<Result<{ optIn: boolean }>> {
  if (!z.string().uuid().safeParse(cafeId).success) return { ok: false, error: 'Demande invalide.' };
  const r = await asCustomer<{ optIn: boolean }>(`/v1/customer/cafes/${cafeId}/club`, { method: 'PUT', body: { optIn } });
  if (r.ok) refresh();
  return r;
}
