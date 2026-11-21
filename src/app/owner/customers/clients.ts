import type { ClubMember } from '@/lib/backend/types';

export type ClientFilter = 'all' | 'best' | 'inactive' | 'new';

export const FILTER_LABEL: Record<ClientFilter, string> = {
  all: 'Tous',
  best: 'Meilleurs clients',
  inactive: 'Pas venus depuis 30 jours',
  new: 'Nouveaux (1 visite)',
};

const DAY = 86_400_000;

/** Days since the last visit, or null if never. */
export const daysSince = (m: ClubMember, nowMs: number) =>
  m.lastVisit ? Math.floor((nowMs - new Date(m.lastVisit).getTime()) / DAY) : null;

/** The list for one filter, in its natural order. */
export function filterClients(members: ClubMember[], filter: ClientFilter, nowMs: number): ClubMember[] {
  const bySpent = [...members].sort((a, b) => b.spent - a.spent || a.name.localeCompare(b.name, 'fr'));
  switch (filter) {
    case 'all':
      return bySpent;
    case 'best':
      // The top fifth by spending (at least 1, at most 50).
      return bySpent.slice(0, Math.min(50, Math.max(1, Math.ceil(members.length / 5))));
    case 'inactive':
      return bySpent.filter((m) => (daysSince(m, nowMs) ?? Infinity) >= 30);
    case 'new':
      return bySpent.filter((m) => m.visits === 1);
  }
}
