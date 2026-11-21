'use server';

import { refresh } from 'next/cache';
import { z } from 'zod';
import { messageFor } from '../backend/errors';
import { ownerFetch } from '../backend/server';
import type { LoyaltyProgram } from '../backend/types';
import type { ActionResult } from './devices';

const Program = z.object({
  enabled: z.boolean(),
  pointsPerDinar: z.number().int().min(1).max(100),
  rewards: z
    .array(
      z.object({
        id: z.string().max(40),
        name: z.string().trim().min(1).max(60),
        points: z.number().int().min(1).max(100_000),
        kind: z.enum(['free_product', 'amount_off']),
        productId: z.string().max(60).optional(),
        amount: z.number().int().min(1).max(1_000_000).optional(),
      }),
    )
    .max(20, '20 récompenses maximum'),
});

/** Saves the café's loyalty program (owner only — the backend checks it too). */
export async function saveLoyaltyAction(branchId: string, program: LoyaltyProgram): Promise<ActionResult<LoyaltyProgram>> {
  const id = z.string().uuid().safeParse(branchId);
  const body = Program.safeParse(program);
  if (!id.success) return { ok: false, error: 'Demande invalide.' };
  if (!body.success) return { ok: false, error: body.error.issues[0]?.message ?? 'Programme invalide.' };
  try {
    const data = await ownerFetch<LoyaltyProgram>(`/v1/owner/branches/${id.data}/loyalty`, {
      method: 'PUT',
      // New rewards have no id yet: the backend gives one.
      body: { ...body.data, rewards: body.data.rewards.map(({ id: rid, ...r }) => (rid ? { id: rid, ...r } : r)) },
    });
    refresh();
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: messageFor(e) };
  }
}
