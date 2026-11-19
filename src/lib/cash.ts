/** A gap of 1 DT or more is flagged (same threshold as on the POS). */
export const BIG_GAP_MILLIMES = 1000;

export type GapTone = 'ok' | 'small' | 'big';

/** counted − expected: 0 = ok, under 1 DT = small, 1 DT or more = big. */
export function gapTone(difference: number): GapTone {
  if (difference === 0) return 'ok';
  return Math.abs(difference) >= BIG_GAP_MILLIMES ? 'big' : 'small';
}

export const GAP_CLASS: Record<GapTone, string> = {
  ok: 'text-green-700 dark:text-green-400',
  small: 'text-amber-700 dark:text-amber-400',
  big: 'text-destructive font-semibold',
};

/** "Il manque 0.900 DT" / "Excédent de 2.000 DT" / "Caisse juste". */
export function gapLabel(difference: number, format: (m: number) => string): string {
  if (difference === 0) return 'Caisse juste';
  return difference < 0 ? `Il manque ${format(-difference)}` : `Excédent de ${format(difference)}`;
}
