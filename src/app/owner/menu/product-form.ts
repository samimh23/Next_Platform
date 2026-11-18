import type { ProductInput } from '@/lib/actions/menu';
import type { Product, Station } from '@/lib/backend/types';
import { formatMillimes, parseMillimes } from '@/lib/money';

/** What the product form edits (prices as typed text, e.g. "1.200"). */
export interface ProductFormState {
  name: string;
  categoryId: string;
  price: string;
  vatRateBp: number;
  station: Station;
  available: boolean;
  groups: GroupFormState[];
}

export interface GroupFormState {
  key: string;
  id?: string;
  name: string;
  /** The cashier must pick at least one. */
  required: boolean;
  /** How many options can be picked. */
  maxSelect: number;
  options: OptionFormState[];
}

export interface OptionFormState {
  key: string;
  id?: string;
  name: string;
  extraPrice: string;
}

let n = 0;
export const newKey = () => `k${++n}`;

export function emptyGroup(): GroupFormState {
  return { key: newKey(), name: '', required: false, maxSelect: 1, options: [emptyOption()] };
}
export function emptyOption(): OptionFormState {
  return { key: newKey(), name: '', extraPrice: '' };
}

export function formFromProduct(p: Product | undefined, defaultCategoryId: string): ProductFormState {
  if (!p) return { name: '', categoryId: defaultCategoryId, price: '', vatRateBp: 1900, station: 'bar', available: true, groups: [] };
  return {
    name: p.name,
    categoryId: p.categoryId,
    price: formatMillimes(p.price),
    vatRateBp: p.vatRateBp,
    station: p.station,
    available: p.available,
    groups: p.modifierGroups.map((g) => ({
      key: newKey(),
      id: g.id,
      name: g.name,
      required: g.minSelect > 0,
      maxSelect: g.maxSelect,
      options: g.modifiers.map((m) => ({
        key: newKey(),
        id: m.id,
        name: m.name,
        extraPrice: m.extraPrice ? formatMillimes(m.extraPrice) : '',
      })),
    })),
  };
}

/** Form → API payload, with French error messages. Ids are kept so the POS keeps matching options. */
export function toProductInput(f: ProductFormState): { ok: true; input: ProductInput } | { ok: false; error: string } {
  if (!f.name.trim()) return { ok: false, error: 'Le nom du produit est requis.' };
  const price = parseMillimes(f.price);
  if (price === null || price < 0) return { ok: false, error: 'Prix invalide. Exemple : 1.200' };

  const groups: ProductInput['modifierGroups'] = [];
  for (const g of f.groups) {
    if (!g.name.trim()) return { ok: false, error: 'Chaque groupe d’options a besoin d’un nom (ex. « Taille »).' };
    const options = [];
    for (const o of g.options) {
      if (!o.name.trim()) return { ok: false, error: `${g.name} : chaque option a besoin d’un nom.` };
      const extra = o.extraPrice.trim() === '' ? 0 : parseMillimes(o.extraPrice);
      if (extra === null || extra < 0) return { ok: false, error: `${g.name} / ${o.name} : supplément invalide.` };
      options.push({ ...(o.id && { id: o.id }), name: o.name.trim(), extraPrice: extra });
    }
    if (options.length === 0) return { ok: false, error: `${g.name} : ajoutez au moins une option.` };
    groups.push({
      ...(g.id && { id: g.id }),
      name: g.name.trim(),
      minSelect: g.required ? 1 : 0,
      maxSelect: Math.max(1, Math.min(g.maxSelect, options.length)),
      modifiers: options,
    });
  }

  return {
    ok: true,
    input: {
      categoryId: f.categoryId,
      name: f.name.trim(),
      price,
      vatRateBp: f.vatRateBp as ProductInput['vatRateBp'],
      station: f.station,
      available: f.available,
      modifierGroups: groups,
    },
  };
}
