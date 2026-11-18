'use server';

import { refresh } from 'next/cache';
import { z } from 'zod';
import { ownerFetch } from '../backend/server';
import { messageFor } from '../backend/errors';
import type { Staff } from '../backend/types';
import type { ActionResult } from './devices';

const Uuid = z.string().uuid();
const Name = z.string().trim().min(1).max(40);
const Role = z.enum(['manager', 'cashier', 'server', 'kitchen']);
const Pin = z.string().regex(/^\d{4,6}$/);

const CreateStaff = z.object({ name: Name, role: Role, pin: Pin });
const UpdateStaff = z
  .object({ name: Name.optional(), role: Role.optional(), pin: Pin.optional(), active: z.boolean().optional() })
  .refine((p) => Object.keys(p).length > 0);

/** The backend hashes the PIN; POS get only the hash, at their next sync. */
export async function createStaffAction(
  branchId: string,
  input: { name: string; role: string; pin: string },
): Promise<ActionResult<Staff>> {
  const id = Uuid.safeParse(branchId);
  const body = CreateStaff.safeParse(input);
  if (!id.success || !body.success) return { ok: false, error: 'Certaines informations ne sont pas valides.' };
  try {
    const staff = await ownerFetch<Staff>(`/v1/owner/branches/${id.data}/staff`, { method: 'POST', body: body.data });
    refresh();
    return { ok: true, data: staff };
  } catch (e) {
    return { ok: false, error: messageFor(e) };
  }
}

/** Rename, change role or PIN, deactivate (removed from the POS at the next sync) or reactivate. */
export async function updateStaffAction(
  staffId: string,
  patch: { name?: string; role?: string; pin?: string; active?: boolean },
): Promise<ActionResult<Staff>> {
  const id = Uuid.safeParse(staffId);
  const body = UpdateStaff.safeParse(patch);
  if (!id.success || !body.success) return { ok: false, error: 'Certaines informations ne sont pas valides.' };
  try {
    const staff = await ownerFetch<Staff>(`/v1/owner/staff/${id.data}`, { method: 'PATCH', body: body.data });
    refresh();
    return { ok: true, data: staff };
  } catch (e) {
    return { ok: false, error: messageFor(e) };
  }
}
