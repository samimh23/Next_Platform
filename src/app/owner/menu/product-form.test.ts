import { describe, expect, it } from 'vitest';
import type { Product } from '@/lib/backend/types';
import { emptyGroup, formFromProduct, toProductInput, type ProductFormState } from './product-form';

const base = (): ProductFormState => ({
  name: ' Cappuccino ',
  categoryId: '01a1e67d-1f72-7497-8d0d-ef03e441c778',
  price: '3.5',
  vatRateBp: 1900,
  station: 'bar',
  available: true,
  groups: [],
});

describe('toProductInput', () => {
  it('converts the typed price to millimes and trims the name', () => {
    const r = toProductInput(base());
    expect(r).toEqual({ ok: true, input: expect.objectContaining({ name: 'Cappuccino', price: 3500, modifierGroups: [] }) });
  });

  it.each(['', 'abc', '1.2345', '-1'])('refuses price "%s"', (price) => {
    const r = toProductInput({ ...base(), price });
    expect(r.ok).toBe(false);
  });

  it('options: required → min 1, empty extra price → 0, max capped to option count', () => {
    const g = { ...emptyGroup(), name: 'Taille', required: true, maxSelect: 5 };
    g.options = [
      { key: 'a', name: 'Normal', extraPrice: '' },
      { key: 'b', name: 'Grand', extraPrice: '0.5' },
    ];
    const r = toProductInput({ ...base(), groups: [g] });
    if (!r.ok) throw new Error(r.error);
    expect(r.input.modifierGroups).toEqual([
      {
        name: 'Taille',
        minSelect: 1,
        maxSelect: 2,
        modifiers: [
          { name: 'Normal', extraPrice: 0 },
          { name: 'Grand', extraPrice: 500 },
        ],
      },
    ]);
  });

  it('a group or option without a name is refused with a clear message', () => {
    expect(toProductInput({ ...base(), groups: [{ ...emptyGroup(), name: '' }] })).toEqual({
      ok: false,
      error: expect.stringContaining('groupe'),
    });
    const g = { ...emptyGroup(), name: 'Extras' };
    expect(toProductInput({ ...base(), groups: [g] })).toEqual({ ok: false, error: expect.stringContaining('Extras') });
  });
});

describe('formFromProduct → toProductInput round trip keeps ids', () => {
  it('editing a product keeps group and option ids (the POS matches on them)', () => {
    const product: Product = {
      id: 'p1',
      categoryId: '01a1e67d-1f72-7497-8d0d-ef03e441c778',
      name: 'Cappuccino',
      price: 3500,
      vatRateBp: 1900,
      station: 'bar',
      available: true,
      sortOrder: 0,
      modifierGroups: [
        {
          id: '01a1e67d-0000-7000-8000-000000000001',
          name: 'Taille',
          minSelect: 1,
          maxSelect: 1,
          modifiers: [
            { id: '01a1e67d-0000-7000-8000-000000000002', name: 'Normal', extraPrice: 0 },
            { id: '01a1e67d-0000-7000-8000-000000000003', name: 'Grand', extraPrice: 500 },
          ],
        },
      ],
    };
    const form = formFromProduct(product, 'x');
    expect(form.price).toBe('3.500');
    const r = toProductInput(form);
    if (!r.ok) throw new Error(r.error);
    expect(r.input.modifierGroups).toEqual([
      {
        id: product.modifierGroups[0]!.id,
        name: 'Taille',
        minSelect: 1,
        maxSelect: 1,
        modifiers: product.modifierGroups[0]!.modifiers,
      },
    ]);
  });
});
