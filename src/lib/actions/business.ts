'use server';

import { refresh } from 'next/cache';
import { z } from 'zod';
import { messageFor } from '../backend/errors';
import { ownerFetch } from '../backend/server';
import type { Business } from '../backend/types';
import type { ActionResult } from './devices';

const Uuid = z.string().uuid();
const optional = (max: number, label: string) => z.string().trim().max(max, `${label} : ${max} caractères maximum`);

const BusinessInput = z.object({
  businessName: z.string().trim().min(1, 'Le nom est requis').max(80),
  taxId: optional(40, 'Matricule fiscal'),
  branchName: z.string().trim().min(1, 'Le nom de l’établissement est requis').max(80),
  address: optional(160, 'Adresse'),
  phone: optional(30, 'Téléphone'),
  receiptFooter: optional(120, 'Message'),
});
export type BusinessInput = z.input<typeof BusinessInput>;

/** Saves what the receipts print. Empty fields are removed from the receipt. */
export async function updateBusinessAction(branchId: string, input: BusinessInput): Promise<ActionResult<Business>> {
  const id = Uuid.safeParse(branchId);
  const body = BusinessInput.safeParse(input);
  if (!id.success) return { ok: false, error: 'Demande invalide.' };
  if (!body.success) return { ok: false, error: body.error.issues[0]?.message ?? 'Informations invalides.' };
  const empty = (s: string) => (s === '' ? null : s);
  try {
    const data = await ownerFetch<Business>(`/v1/owner/branches/${id.data}/business`, {
      method: 'PATCH',
      body: {
        ...body.data,
        taxId: empty(body.data.taxId),
        address: empty(body.data.address),
        phone: empty(body.data.phone),
        receiptFooter: empty(body.data.receiptFooter),
      },
    });
    refresh();
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: messageFor(e) };
  }
}
