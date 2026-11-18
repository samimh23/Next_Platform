'use server';

import { refresh } from 'next/cache';
import { z } from 'zod';
import { BackendError, messageFor } from '../backend/errors';
import { ownerFetch } from '../backend/server';
import type { Area, DiningTable } from '../backend/types';
import type { ActionResult } from './devices';

const Uuid = z.string().uuid();
const AreaName = z.string().trim().min(1, 'Nom requis').max(40, '40 caractères maximum');
const TableName = z.string().trim().min(1).max(20);
const Seats = z.number().int().min(1, 'Au moins 1 place').max(50, '50 places maximum');

const invalid = (e: z.ZodError) => ({ ok: false as const, error: e.issues[0]?.message ?? 'Informations invalides.' });

/** Calls the backend, refreshes the page, maps errors to French messages. */
async function run<T>(call: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    const data = await call();
    refresh();
    return { ok: true, data };
  } catch (e) {
    // "Table name already used in this branch: 2, 3" → name the tables in French.
    if (e instanceof BackendError && e.code === 'TABLE_NAME_TAKEN') {
      const names = e.message.split(': ')[1];
      if (names) return { ok: false, error: `Ces tables existent déjà : ${names}.` };
    }
    return { ok: false, error: messageFor(e) };
  }
}

// ── Rooms ───────────────────────────────────────────────────────

export async function createAreaAction(branchId: string, name: string): Promise<ActionResult<Area>> {
  const id = Uuid.safeParse(branchId);
  const n = AreaName.safeParse(name);
  if (!id.success) return { ok: false, error: 'Demande invalide.' };
  if (!n.success) return invalid(n.error);
  return run(() => ownerFetch<Area>(`/v1/owner/branches/${id.data}/areas`, { method: 'POST', body: { name: n.data } }));
}

export async function renameAreaAction(areaId: string, name: string): Promise<ActionResult<Area>> {
  const id = Uuid.safeParse(areaId);
  const n = AreaName.safeParse(name);
  if (!id.success) return { ok: false, error: 'Demande invalide.' };
  if (!n.success) return invalid(n.error);
  return run(() => ownerFetch<Area>(`/v1/owner/areas/${id.data}`, { method: 'PATCH', body: { name: n.data } }));
}

export async function deleteAreaAction(areaId: string): Promise<ActionResult<null>> {
  const id = Uuid.safeParse(areaId);
  if (!id.success) return { ok: false, error: 'Demande invalide.' };
  return run(async () => {
    await ownerFetch(`/v1/owner/areas/${id.data}`, { method: 'DELETE' });
    return null;
  });
}

// ── Tables ──────────────────────────────────────────────────────

/** Several tables at once — names already expanded from "1-12" by the form. */
export async function createTablesAction(
  branchId: string,
  input: { areaId: string; names: string[]; seats: number },
): Promise<ActionResult<DiningTable[]>> {
  const id = Uuid.safeParse(branchId);
  const body = z
    .object({ areaId: Uuid, names: z.array(TableName).min(1).max(100), seats: Seats })
    .safeParse(input);
  if (!id.success) return { ok: false, error: 'Demande invalide.' };
  if (!body.success) return invalid(body.error);
  return run(() =>
    ownerFetch<DiningTable[]>(`/v1/owner/branches/${id.data}/tables`, { method: 'POST', body: body.data }),
  );
}

export async function updateTableAction(
  tableId: string,
  input: { name: string; seats: number; areaId: string },
): Promise<ActionResult<DiningTable>> {
  const id = Uuid.safeParse(tableId);
  const body = z
    .object({ name: TableName, seats: Seats, areaId: Uuid })
    .safeParse(input);
  if (!id.success) return { ok: false, error: 'Demande invalide.' };
  if (!body.success) return invalid(body.error);
  return run(() => ownerFetch<DiningTable>(`/v1/owner/tables/${id.data}`, { method: 'PATCH', body: body.data }));
}

export async function deleteTableAction(tableId: string): Promise<ActionResult<null>> {
  const id = Uuid.safeParse(tableId);
  if (!id.success) return { ok: false, error: 'Demande invalide.' };
  return run(async () => {
    await ownerFetch(`/v1/owner/tables/${id.data}`, { method: 'DELETE' });
    return null;
  });
}
