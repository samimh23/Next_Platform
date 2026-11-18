'use server';

import { refresh } from 'next/cache';
import { z } from 'zod';
import { ownerFetch } from '../backend/server';
import { messageFor } from '../backend/errors';
import type { Device, PairingCode } from '../backend/types';

const Uuid = z.string().uuid();
const Role = z.enum(['hub', 'pos']);

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

/** "Ajouter une caisse": one-time code valid 15 minutes. */
export async function createPairingCodeAction(branchId: string, role: 'hub' | 'pos'): Promise<ActionResult<PairingCode>> {
  const input = z.object({ branchId: Uuid, role: Role }).safeParse({ branchId, role });
  if (!input.success) return { ok: false, error: 'Demande invalide.' };
  try {
    const code = await ownerFetch<PairingCode>(`/v1/owner/branches/${input.data.branchId}/pairing-codes`, {
      method: 'POST',
      body: { role: input.data.role },
    });
    refresh();
    return { ok: true, data: code };
  } catch (e) {
    return { ok: false, error: messageFor(e) };
  }
}

/** Disable a lost/stolen POS (locked on its next sync) or enable it again. */
export async function setDeviceDisabledAction(deviceId: string, disabled: boolean): Promise<ActionResult<Device>> {
  const input = z.object({ deviceId: Uuid, disabled: z.boolean() }).safeParse({ deviceId, disabled });
  if (!input.success) return { ok: false, error: 'Demande invalide.' };
  try {
    const device = await ownerFetch<Device>(`/v1/owner/devices/${input.data.deviceId}`, {
      method: 'PATCH',
      body: { disabled: input.data.disabled },
    });
    refresh();
    return { ok: true, data: device };
  } catch (e) {
    return { ok: false, error: messageFor(e) };
  }
}

/** Let a server POS take payments (e.g. a terrace POS with its own cash drawer), or not. */
export async function setDevicePaymentsAction(deviceId: string, allowed: boolean): Promise<ActionResult<Device>> {
  const input = z.object({ deviceId: Uuid, allowed: z.boolean() }).safeParse({ deviceId, allowed });
  if (!input.success) return { ok: false, error: 'Demande invalide.' };
  try {
    const device = await ownerFetch<Device>(`/v1/owner/devices/${input.data.deviceId}`, {
      method: 'PATCH',
      body: { canTakePayments: input.data.allowed },
    });
    refresh();
    return { ok: true, data: device };
  } catch (e) {
    return { ok: false, error: messageFor(e) };
  }
}

export async function renameDeviceAction(deviceId: string, name: string): Promise<ActionResult<Device>> {
  const input = z.object({ deviceId: Uuid, name: z.string().trim().min(1).max(60) }).safeParse({ deviceId, name });
  if (!input.success) return { ok: false, error: 'Le nom doit faire entre 1 et 60 caractères.' };
  try {
    const device = await ownerFetch<Device>(`/v1/owner/devices/${input.data.deviceId}`, {
      method: 'PATCH',
      body: { name: input.data.name },
    });
    refresh();
    return { ok: true, data: device };
  } catch (e) {
    return { ok: false, error: messageFor(e) };
  }
}
