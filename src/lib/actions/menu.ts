'use server';

import { refresh } from 'next/cache';
import { z } from 'zod';
import { messageFor } from '../backend/errors';
import { ownerFetch } from '../backend/server';
import type { Category, Product } from '../backend/types';
import type { ActionResult } from './devices';

const Uuid = z.string().uuid();
const Color = z.string().regex(/^#[0-9A-Fa-f]{6}$/);
const Price = z.number().int().min(0).max(10_000_000);

const CategoryInput = z.object({
  name: z.string().trim().min(1, 'Nom requis').max(60),
  color: Color.nullable().optional(),
});

const OptionInput = z.object({
  id: Uuid.optional(),
  name: z.string().trim().min(1, 'Nom de l’option requis').max(40),
  extraPrice: Price,
});

const GroupInput = z
  .object({
    id: Uuid.optional(),
    name: z.string().trim().min(1, 'Nom du groupe requis').max(40),
    minSelect: z.number().int().min(0).max(20),
    maxSelect: z.number().int().min(1).max(20),
    modifiers: z.array(OptionInput).min(1, 'Au moins une option par groupe').max(30),
  })
  .refine((g) => g.minSelect <= g.maxSelect, { message: 'Minimum plus grand que le maximum' });

const ProductSchema = z.object({
  categoryId: Uuid,
  name: z.string().trim().min(1, 'Nom requis').max(80),
  price: Price,
  vatRateBp: z.union([z.literal(1900), z.literal(1300), z.literal(700), z.literal(0)]),
  station: z.enum(['bar', 'kitchen', 'none']),
  available: z.boolean(),
  modifierGroups: z.array(GroupInput).max(10),
});
export type ProductInput = z.infer<typeof ProductSchema>;

const firstIssue = (e: z.ZodError) => e.issues[0]?.message ?? 'Informations invalides.';

/** Calls the backend, refreshes the page, maps errors to French messages. */
async function run<T>(call: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    const data = await call();
    refresh();
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: messageFor(e) };
  }
}

// ── Categories ────────────────────────────────────────────

export async function createCategoryAction(branchId: string, input: { name: string; color?: string | null }) {
  const b = Uuid.safeParse(branchId);
  const c = CategoryInput.safeParse(input);
  if (!b.success || !c.success) return { ok: false as const, error: c.success ? 'Demande invalide.' : firstIssue(c.error) };
  return run(() => ownerFetch<Category>(`/v1/owner/branches/${b.data}/categories`, { method: 'POST', body: c.data }));
}

export async function updateCategoryAction(id: string, input: { name: string; color?: string | null }) {
  const i = Uuid.safeParse(id);
  const c = CategoryInput.safeParse(input);
  if (!i.success || !c.success) return { ok: false as const, error: c.success ? 'Demande invalide.' : firstIssue(c.error) };
  return run(() => ownerFetch<Category>(`/v1/owner/categories/${i.data}`, { method: 'PATCH', body: c.data }));
}

export async function deleteCategoryAction(id: string) {
  const i = Uuid.safeParse(id);
  if (!i.success) return { ok: false as const, error: 'Demande invalide.' };
  return run(() => ownerFetch<{ ok: true }>(`/v1/owner/categories/${i.data}`, { method: 'DELETE' }));
}

// ── Products ──────────────────────────────────────────────

export async function createProductAction(branchId: string, input: ProductInput) {
  const b = Uuid.safeParse(branchId);
  const p = ProductSchema.safeParse(input);
  if (!b.success || !p.success) return { ok: false as const, error: p.success ? 'Demande invalide.' : firstIssue(p.error) };
  return run(() => ownerFetch<Product>(`/v1/owner/branches/${b.data}/products`, { method: 'POST', body: p.data }));
}

export async function updateProductAction(id: string, input: ProductInput) {
  const i = Uuid.safeParse(id);
  const p = ProductSchema.safeParse(input);
  if (!i.success || !p.success) return { ok: false as const, error: p.success ? 'Demande invalide.' : firstIssue(p.error) };
  return run(() => ownerFetch<Product>(`/v1/owner/products/${i.data}`, { method: 'PATCH', body: p.data }));
}

/** Quick "out of stock" toggle — the POS hides it on its next sync. */
export async function setProductAvailableAction(id: string, available: boolean) {
  const i = Uuid.safeParse(id);
  if (!i.success) return { ok: false as const, error: 'Demande invalide.' };
  return run(() => ownerFetch<Product>(`/v1/owner/products/${i.data}`, { method: 'PATCH', body: { available } }));
}

export async function deleteProductAction(id: string) {
  const i = Uuid.safeParse(id);
  if (!i.success) return { ok: false as const, error: 'Demande invalide.' };
  return run(() => ownerFetch<{ ok: true }>(`/v1/owner/products/${i.data}`, { method: 'DELETE' }));
}
