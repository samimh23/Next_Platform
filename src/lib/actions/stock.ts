'use server';

import { refresh } from 'next/cache';
import { z } from 'zod';
import { messageFor } from '../backend/errors';
import { ownerFetch } from '../backend/server';
import type { StockItem, StockMovement } from '../backend/types';
import type { ActionResult } from './devices';

const Uuid = z.string().uuid();
const Qty = z.number().int().min(0).max(100_000_000);

async function run<T>(f: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    const data = await f();
    refresh();
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: messageFor(e) };
  }
}

const CreateItem = z.object({
  name: z.string().trim().min(1, 'Le nom est requis').max(60),
  unit: z.enum(['g', 'ml', 'piece']),
  quantity: Qty.optional(),
  lowThreshold: Qty.nullable().optional(),
});

export async function createStockItemAction(branchId: string, input: z.input<typeof CreateItem>): Promise<ActionResult<StockItem>> {
  const id = Uuid.safeParse(branchId);
  const body = CreateItem.safeParse(input);
  if (!id.success) return { ok: false, error: 'Demande invalide.' };
  if (!body.success) return { ok: false, error: body.error.issues[0]?.message ?? 'Informations invalides.' };
  return run(() => ownerFetch<StockItem>(`/v1/owner/branches/${id.data}/stock/items`, { method: 'POST', body: body.data }));
}

const UpdateItem = z
  .object({ name: z.string().trim().min(1, 'Le nom est requis').max(60).optional(), lowThreshold: Qty.nullable().optional(), archived: z.boolean().optional() })
  .refine((p) => Object.keys(p).length > 0);

export async function updateStockItemAction(itemId: string, input: z.input<typeof UpdateItem>): Promise<ActionResult<StockItem>> {
  const id = Uuid.safeParse(itemId);
  const body = UpdateItem.safeParse(input);
  if (!id.success || !body.success) return { ok: false, error: body.error?.issues[0]?.message ?? 'Demande invalide.' };
  return run(() => ownerFetch<StockItem>(`/v1/owner/stock/items/${id.data}`, { method: 'PATCH', body: body.data }));
}

const Move = z.object({ kind: z.enum(['delivery', 'waste', 'count']), quantity: Qty, note: z.string().trim().max(120).optional() });

/** Réception (+), Perte (−) or Inventaire (sets the counted quantity). */
export async function moveStockAction(itemId: string, input: z.input<typeof Move>): Promise<ActionResult<StockItem>> {
  const id = Uuid.safeParse(itemId);
  const body = Move.safeParse(input);
  if (!id.success || !body.success) return { ok: false, error: 'Quantité invalide.' };
  return run(() =>
    ownerFetch<StockItem>(`/v1/owner/stock/items/${id.data}/movements`, {
      method: 'POST',
      body: { ...body.data, note: body.data.note || undefined },
    }),
  );
}

export async function stockHistoryAction(itemId: string): Promise<ActionResult<StockMovement[]>> {
  const id = Uuid.safeParse(itemId);
  if (!id.success) return { ok: false, error: 'Demande invalide.' };
  try {
    return { ok: true, data: await ownerFetch<StockMovement[]>(`/v1/owner/stock/items/${id.data}/movements`) };
  } catch (e) {
    return { ok: false, error: messageFor(e) };
  }
}

const Recipe = z
  .array(z.object({ stockItemId: Uuid, qty: z.number().int().min(1).max(100_000) }))
  .max(20)
  .refine((ls) => new Set(ls.map((l) => l.stockItemId)).size === ls.length, 'Un ingrédient est en double');

/** What one unit of the product uses. Empty = nothing. */
export async function setRecipeAction(
  productId: string,
  lines: { stockItemId: string; qty: number }[],
): Promise<ActionResult<{ productId: string; lines: { stockItemId: string; qty: number }[] }>> {
  const id = Uuid.safeParse(productId);
  const body = Recipe.safeParse(lines);
  if (!id.success) return { ok: false, error: 'Demande invalide.' };
  if (!body.success) return { ok: false, error: body.error.issues[0]?.message ?? 'Recette invalide.' };
  return run(() => ownerFetch(`/v1/owner/products/${id.data}/recipe`, { method: 'PUT', body: { lines: body.data } }));
}
