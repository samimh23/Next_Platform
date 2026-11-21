import { describe, expect, it } from 'vitest';
import type { ClubMember } from '@/lib/backend/types';
import { daysSince, filterClients } from './clients';

const now = Date.parse('2026-11-21T12:00:00Z');
const m = (name: string, spent: number, visits: number, daysAgo: number | null): ClubMember => ({
  id: name,
  name,
  spent,
  visits,
  points: 0,
  lastVisit: daysAgo === null ? null : new Date(now - daysAgo * 86_400_000).toISOString(),
});
const members = [m('Ali', 5000, 1, 2), m('Leila', 90_000, 12, 1), m('Karim', 20_000, 4, 45), m('Sana', 1000, 1, 60), m('Omar', 40_000, 6, 10)];

describe('client filters', () => {
  it('all: best spenders first', () => {
    expect(filterClients(members, 'all', now).map((x) => x.name)).toEqual(['Leila', 'Omar', 'Karim', 'Ali', 'Sana']);
  });
  it('best: the top fifth (at least one)', () => {
    expect(filterClients(members, 'best', now).map((x) => x.name)).toEqual(['Leila']);
  });
  it('inactive: not seen for 30 days', () => {
    expect(filterClients(members, 'inactive', now).map((x) => x.name)).toEqual(['Karim', 'Sana']);
    expect(daysSince(members[2]!, now)).toBe(45);
  });
  it('new: one visit', () => {
    expect(filterClients(members, 'new', now).map((x) => x.name)).toEqual(['Ali', 'Sana']);
  });
});
