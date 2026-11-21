'use server';

import { z } from 'zod';
import { callBackend } from '../backend/client';
import { messageFor } from '../backend/errors';

export interface PasswordFormState {
  error?: string;
  done?: boolean;
  email?: string;
}

const Email = z.string().trim().email('Email invalide');

async function forgot(prefix: string, formData: FormData): Promise<PasswordFormState> {
  const email = Email.safeParse(formData.get('email'));
  if (!email.success) return { error: email.error.issues[0]!.message, email: String(formData.get('email') ?? '') };
  try {
    await callBackend(`${prefix}/password/forgot`, { method: 'POST', body: { email: email.data } });
  } catch (e) {
    return { error: messageFor(e), email: email.data };
  }
  // Same answer whether the account exists or not.
  return { done: true, email: email.data };
}

async function reset(prefix: string, min: number, formData: FormData): Promise<PasswordFormState> {
  const token = String(formData.get('token') ?? '');
  const password = String(formData.get('password') ?? '');
  if (password.length < min) return { error: `Au moins ${min} caractères.` };
  if (password !== String(formData.get('confirm') ?? '')) return { error: 'Les deux mots de passe ne sont pas pareils.' };
  try {
    await callBackend(`${prefix}/password/reset`, { method: 'POST', body: { token, password } });
  } catch (e) {
    return { error: messageFor(e) };
  }
  return { done: true };
}

export async function ownerForgotAction(_: PasswordFormState, formData: FormData) {
  return forgot('/v1/auth', formData);
}
export async function ownerResetAction(_: PasswordFormState, formData: FormData) {
  return reset('/v1/auth', 10, formData);
}
export async function customerForgotAction(_: PasswordFormState, formData: FormData) {
  return forgot('/v1/customer/auth', formData);
}
export async function customerResetAction(_: PasswordFormState, formData: FormData) {
  return reset('/v1/customer/auth', 8, formData);
}
