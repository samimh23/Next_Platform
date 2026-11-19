/**
 * Café days in Tunisia time (UTC+1 all year, no daylight saving) — same rule as the backend.
 * Dates are "YYYY-MM-DD" strings.
 */
const TUNIS_OFFSET_MS = 60 * 60 * 1000;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export const isDate = (s: unknown): s is string => typeof s === 'string' && DATE.test(s);

export function tunisToday(nowMs: number): string {
  return new Date(nowMs + TUNIS_OFFSET_MS).toISOString().slice(0, 10);
}

/** "2026-11-18", -1 → "2026-11-17" */
export function shiftDate(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** "mardi 18 novembre" */
export function formatDayFr(date: string): string {
  return new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(
    new Date(`${date}T12:00:00Z`),
  );
}

/** ISO instant → "14:05" in Tunisia time. */
export function formatTimeTunis(iso: string): string {
  return new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Tunis' }).format(new Date(iso));
}

export const PAYMENT_LABEL: Record<string, string> = { cash: 'Espèces', card: 'Carte', mixed: 'Mixte' };

/** Why a discount was given (same codes as the POS). */
export const DISCOUNT_REASON: Record<string, string> = {
  geste: 'Geste commercial',
  staff: 'Personnel',
  error: 'Erreur',
  complaint: 'Réclamation client',
  other: 'Autre',
};

/** Why something sent was cancelled, or a ticket refunded (same codes as the POS). */
export const CANCEL_REASON: Record<string, string> = {
  changed_mind: 'Le client a changé d’avis',
  error: 'Erreur de saisie',
  quality: 'Problème de qualité',
  other: 'Autre',
};
