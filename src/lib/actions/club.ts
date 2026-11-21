'use server';

import { refresh } from 'next/cache';
import { z } from 'zod';
import { messageFor } from '../backend/errors';
import { ownerFetch } from '../backend/server';
import type { ActionResult } from './devices';

const Gift = z
  .object({
    customerIds: z.array(z.string().uuid()).min(1, 'Choisissez au moins un client').max(500),
    name: z.string().trim().min(1, 'Donnez un nom au cadeau').max(60),
    kind: z.enum(['free_product', 'amount_off']),
    productId: z.string().max(60).optional(),
    amount: z.number().int().min(1).max(1_000_000).optional(),
    validDays: z.number().int().min(1).max(90),
  })
  .refine((g) => (g.kind === 'free_product' ? !!g.productId : !!g.amount), 'Choisissez le produit ou le montant');

/** Sends a gift to the chosen club members (owner only — the backend checks it too). */
export async function sendGiftsAction(
  branchId: string,
  input: z.input<typeof Gift>,
): Promise<ActionResult<{ sent: number; skipped: number }>> {
  const id = z.string().uuid().safeParse(branchId);
  const body = Gift.safeParse(input);
  if (!id.success) return { ok: false, error: 'Demande invalide.' };
  if (!body.success) return { ok: false, error: body.error.issues[0]?.message ?? 'Cadeau invalide.' };
  try {
    const data = await ownerFetch<{ sent: number; skipped: number }>(`/v1/owner/branches/${id.data}/gifts`, {
      method: 'POST',
      body: body.data,
    });
    refresh();
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: messageFor(e) };
  }
}
