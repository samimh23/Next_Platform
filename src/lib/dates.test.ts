import { describe, expect, it } from 'vitest';
import { formatTimeTunis, isDate, shiftDate, tunisToday } from './dates';

describe('dates (Tunisia, UTC+1)', () => {
  it('23:30 UTC is already the next day in Tunis', () => {
    expect(tunisToday(Date.parse('2026-11-18T23:30:00Z'))).toBe('2026-11-19');
    expect(tunisToday(Date.parse('2026-11-18T22:30:00Z'))).toBe('2026-11-18');
  });
  it('shiftDate crosses months and years', () => {
    expect(shiftDate('2026-03-01', -1)).toBe('2026-02-28');
    expect(shiftDate('2026-12-31', 1)).toBe('2027-01-01');
  });
  it('time shown in Tunisia time', () => expect(formatTimeTunis('2026-11-18T08:05:00Z')).toBe('09:05'));
  it('isDate', () => {
    expect(isDate('2026-11-18')).toBe(true);
    expect(isDate('18/11/2026')).toBe(false);
    expect(isDate(undefined)).toBe(false);
  });
});
