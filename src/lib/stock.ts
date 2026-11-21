/** Stock quantities are whole numbers of the item's unit: grams, millilitres or pieces. */
export type StockUnit = 'g' | 'ml' | 'piece';

export const UNIT_LABEL: Record<StockUnit, string> = { g: 'Poids (g / kg)', ml: 'Volume (ml / L)', piece: 'Pièces' };

const fr = (n: number) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 3 }).format(n);

/** 1250 g → "1,25 kg", 150 ml → "150 ml", 1 → "1 pièce". */
export function formatQty(q: number, unit: StockUnit): string {
  const abs = Math.abs(q);
  if (unit === 'g') return abs >= 1000 ? `${fr(q / 1000)} kg` : `${fr(q)} g`;
  if (unit === 'ml') return abs >= 1000 ? `${fr(q / 1000)} L` : `${fr(q)} ml`;
  return `${fr(q)} pièce${abs > 1 ? 's' : ''}`;
}

const FACTORS: Record<StockUnit, Record<string, number>> = {
  g: { '': 1, g: 1, kg: 1000 },
  ml: { '': 1, ml: 1, cl: 10, l: 1000 },
  piece: { '': 1, p: 1, pc: 1, pcs: 1, piece: 1, pieces: 1, 'pièce': 1, 'pièces': 1 },
};

/**
 * What the owner types → whole units. "1,5 kg" → 1500 (g), "250" → 250, "33 cl" → 330 (ml).
 * null if it isn't a positive amount in this unit (or not a whole number of g / ml / pieces).
 */
export function parseQty(input: string, unit: StockUnit): number | null {
  const m = /^\s*(\d+(?:[.,]\d+)?)\s*([a-zà-ü]*)\s*$/i.exec(input);
  if (!m) return null;
  const factor = FACTORS[unit][m[2]!.toLowerCase()];
  if (factor === undefined) return null;
  const value = Number(m[1]!.replace(',', '.')) * factor;
  const rounded = Math.round(value);
  if (Math.abs(value - rounded) > 1e-9 || rounded > 100_000_000) return null;
  return rounded;
}

/** Placeholder hint for inputs. */
export const QTY_HINT: Record<StockUnit, string> = { g: 'ex. 1,5 kg ou 250 g', ml: 'ex. 2 L ou 150 ml', piece: 'ex. 12' };
