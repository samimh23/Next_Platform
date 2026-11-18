import { describe, expect, it } from 'vitest';
import { formatDT, formatMillimes, parseMillimes } from './money';

/** Same vectors as the POS and backend tests. */
describe('money', () => {
  it.each([
    [4500, '4.500'],
    [0, '0.000'],
    [-1250, '-1.250'],
    [5, '0.005'],
    [1234567, '1234.567'],
  ])('format %i → %s', (m, text) => expect(formatMillimes(m)).toBe(text));

  it.each([
    ['4.5', 4500],
    ['4,500', 4500],
    ['12', 12000],
    ['0.005', 5],
    ['-1.25', -1250],
    ['4.5 DT', 4500],
    [' 1.200 ', 1200],
  ])('parse "%s" → %i', (text, m) => expect(parseMillimes(text)).toBe(m));

  it.each(['', 'abc', '1.2345', '1.2.3'])('parse invalid "%s" → null', (text) => expect(parseMillimes(text)).toBeNull());

  it('formatDT', () => expect(formatDT(1200)).toBe('1.200 DT'));
});
