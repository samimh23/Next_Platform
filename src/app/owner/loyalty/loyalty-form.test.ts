import { describe, expect, it } from 'vitest';
import { emptyReward, toForm, validateProgram } from './loyalty-form';

describe('loyalty program form', () => {
  it('builds the program: product reward, DT amount reward', () => {
    const r = validateProgram({
      enabled: true,
      pointsPerDinar: '2',
      rewards: [
        { ...emptyReward(), name: ' Un express offert ', points: '10', productId: 'p-express' },
        { ...emptyReward(), name: 'Remise', points: '50', kind: 'amount_off', amount: '2,500', productId: 'ignored' },
      ],
    });
    expect(r).toEqual({
      ok: true,
      data: {
        enabled: true,
        pointsPerDinar: 2,
        rewards: [
          { id: '', name: 'Un express offert', points: 10, kind: 'free_product', productId: 'p-express' },
          { id: '', name: 'Remise', points: 50, kind: 'amount_off', amount: 2500 },
        ],
      },
    });
  });

  it('explains what is wrong, per reward', () => {
    const r = validateProgram({
      enabled: true,
      pointsPerDinar: '0',
      rewards: [
        { ...emptyReward(), name: '', points: '10' },
        { ...emptyReward(), name: 'Café', points: 'dix' },
        { ...emptyReward(), name: 'Café', points: '10' },
        { ...emptyReward(), name: 'Remise', points: '10', kind: 'amount_off', amount: 'abc' },
      ],
    });
    expect(r).toEqual({
      ok: false,
      errors: {
        pointsPerDinar: 'Entre 1 et 100 points par dinar',
        rewards: {
          0: 'Donnez un nom à la récompense',
          1: 'Nombre de points invalide',
          2: 'Choisissez le produit offert',
          3: 'Montant de la remise invalide (ex. 5 ou 2,500)',
        },
      },
    });
  });

  it('round-trips a saved program back into the form', () => {
    const form = toForm({
      enabled: true,
      pointsPerDinar: 1,
      rewards: [{ id: 'r1', name: 'Remise', points: 50, kind: 'amount_off', amount: 5000 }],
    });
    expect(form.rewards[0]).toMatchObject({ id: 'r1', amount: '5.000', points: '50' });
    expect(validateProgram(form)).toMatchObject({ ok: true, data: { rewards: [{ id: 'r1', amount: 5000 }] } });
  });
});
