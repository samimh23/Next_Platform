'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { REFRESH_COOKIE, clearedCookies, sessionCookies } from '../auth/cookies';
import { callBackend, type AuthResult } from '../backend/client';
import { messageFor } from '../backend/errors';

export interface FormState {
  error?: string;
  /** Per-field messages. */
  fields?: Record<string, string>;
  /** Values to put back in the form after an error. */
  values?: Record<string, string>;
}

const LoginSchema = z.object({
  email: z.string().trim().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});

const SignupSchema = z.object({
  name: z.string().trim().min(1, 'Votre nom est requis').max(80),
  businessName: z.string().trim().min(1, 'Le nom du café est requis').max(80),
  email: z.string().trim().email('Email invalide'),
  password: z.string().min(10, 'Au moins 10 caractères').max(128),
  taxId: z.string().trim().max(40).optional(),
});

function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) out[String(issue.path[0])] ??= issue.message;
  return out;
}

async function startSession(result: AuthResult) {
  const store = await cookies();
  for (const c of sessionCookies(result)) store.set(c);
}

/** Only allow redirects to our own pages (no open redirect to another site). */
function safeNext(next: FormDataEntryValue | null): string {
  const s = typeof next === 'string' ? next : '';
  return s.startsWith('/owner') ? s : '/owner/dashboard';
}

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = { email: String(formData.get('email') ?? '') };
  const parsed = LoginSchema.safeParse({ email: formData.get('email'), password: formData.get('password') });
  if (!parsed.success) return { fields: fieldErrors(parsed.error), values };

  try {
    await startSession(await callBackend<AuthResult>('/v1/auth/login', { method: 'POST', body: parsed.data }));
  } catch (e) {
    return { error: messageFor(e), values };
  }
  redirect(safeNext(formData.get('next')));
}

export async function signupAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const raw = {
    name: formData.get('name'),
    businessName: formData.get('businessName'),
    email: formData.get('email'),
    password: formData.get('password'),
    taxId: formData.get('taxId') || undefined,
  };
  const values = Object.fromEntries(
    Object.entries(raw).filter(([k, v]) => k !== 'password' && typeof v === 'string') as [string, string][],
  );
  const parsed = SignupSchema.safeParse(raw);
  if (!parsed.success) return { fields: fieldErrors(parsed.error), values };

  try {
    await startSession(await callBackend<AuthResult>('/v1/auth/signup', { method: 'POST', body: parsed.data }));
  } catch (e) {
    return { error: messageFor(e), values };
  }
  redirect('/owner/dashboard');
}

export async function logoutAction(): Promise<void> {
  const store = await cookies();
  const refreshToken = store.get(REFRESH_COOKIE)?.value;
  if (refreshToken) {
    // Revoke the session on the backend too; ignore errors (we log out locally anyway).
    await callBackend('/v1/auth/logout', { method: 'POST', body: { refreshToken } }).catch(() => undefined);
  }
  for (const c of clearedCookies()) store.set(c);
  redirect('/login');
}
