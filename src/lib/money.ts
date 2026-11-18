/**
 * Money in Tunisian dinars. The backend and the POS store integer **millimes**
 * (1 DT = 1000). Same parsing/formatting rules as the POS (Pos_Cafe lib/core/money).
 */

const PATTERN = /^(-?)(\d+)(?:\.(\d{1,3}))?$/;

/** "4.5", "4,500", "12", "4.5 DT" → 4500, 4500, 12000, 4500. Returns null if invalid. */
export function parseMillimes(input: string): number | null {
  const s = input.replace(/\s*(DT|TND)\s*$/i, '').trim().replace(',', '.');
  const m = PATTERN.exec(s);
  if (!m) return null;
  const value = Number(m[2]) * 1000 + Number((m[3] ?? '').padEnd(3, '0'));
  return m[1] === '-' ? -value : value;
}

/** 4500 → "4.500" */
export function formatMillimes(millimes: number): string {
  const abs = Math.abs(millimes);
  const s = `${Math.floor(abs / 1000)}.${String(abs % 1000).padStart(3, '0')}`;
  return millimes < 0 ? `-${s}` : s;
}

/** 4500 → "4.500 DT" */
export const formatDT = (millimes: number) => `${formatMillimes(millimes)} DT`;

/** Tunisian VAT rates, basis points. */
export const VAT_RATES = [
  { bp: 1900, label: '19 %' },
  { bp: 1300, label: '13 %' },
  { bp: 700, label: '7 %' },
  { bp: 0, label: '0 %' },
] as const;
