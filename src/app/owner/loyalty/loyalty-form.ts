import { formatMillimes, parseMillimes } from '@/lib/money';
import type { LoyaltyProgram, Reward } from '@/lib/backend/types';

/** One reward row as typed in the form (amount as text, e.g. "5" or "2,500"). */
export interface RewardRow {
  id?: string;
  name: string;
  points: string;
  kind: Reward['kind'];
  productId: string;
  amount: string;
}

export interface ProgramForm {
  enabled: boolean;
  pointsPerDinar: string;
  rewards: RewardRow[];
}

export const emptyReward = (): RewardRow => ({ name: '', points: '', kind: 'free_product', productId: '', amount: '' });

export const toForm = (p: LoyaltyProgram): ProgramForm => ({
  enabled: p.enabled,
  pointsPerDinar: String(p.pointsPerDinar),
  rewards: p.rewards.map((r) => ({
    id: r.id,
    name: r.name,
    points: String(r.points),
    kind: r.kind,
    productId: r.productId ?? '',
    amount: r.amount ? formatMillimes(r.amount) : '',
  })),
});

export type ProgramErrors = { pointsPerDinar?: string; rewards?: Record<number, string> };

const int = (s: string) => (/^\d+$/.test(s.trim()) ? Number(s.trim()) : NaN);

/** Checks the form and builds what the backend expects. */
export function validateProgram(f: ProgramForm): { ok: true; data: LoyaltyProgram } | { ok: false; errors: ProgramErrors } {
  const errors: ProgramErrors = {};
  const rate = int(f.pointsPerDinar);
  if (!(rate >= 1 && rate <= 100)) errors.pointsPerDinar = 'Entre 1 et 100 points par dinar';

  const rewardErrors: Record<number, string> = {};
  const rewards: Reward[] = [];
  f.rewards.forEach((r, i) => {
    const name = r.name.trim();
    const points = int(r.points);
    const amount = parseMillimes(r.amount);
    if (!name) rewardErrors[i] = 'Donnez un nom à la récompense';
    else if (name.length > 60) rewardErrors[i] = 'Nom : 60 caractères maximum';
    else if (!(points >= 1 && points <= 100_000)) rewardErrors[i] = 'Nombre de points invalide';
    else if (r.kind === 'free_product' && !r.productId) rewardErrors[i] = 'Choisissez le produit offert';
    else if (r.kind === 'amount_off' && !(amount !== null && amount > 0 && amount <= 1_000_000))
      rewardErrors[i] = 'Montant de la remise invalide (ex. 5 ou 2,500)';
    else
      rewards.push({
        id: r.id ?? '',
        name,
        points,
        kind: r.kind,
        ...(r.kind === 'free_product' ? { productId: r.productId } : { amount: amount! }),
      });
  });
  if (Object.keys(rewardErrors).length) errors.rewards = rewardErrors;
  if (errors.pointsPerDinar || errors.rewards) return { ok: false, errors };
  return { ok: true, data: { enabled: f.enabled, pointsPerDinar: rate, rewards } };
}
