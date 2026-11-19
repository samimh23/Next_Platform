import { describe, expect, it } from 'vitest';
import { gapLabel, gapTone } from './cash';
import { formatDT } from './money';

describe('cash gaps', () => {
  it.each([
    [0, 'ok'],
    [-900, 'small'],
    [999, 'small'],
    [-1000, 'big'],
    [2500, 'big'],
  ] as const)('%i millimes → %s', (diff, tone) => expect(gapTone(diff)).toBe(tone));

  it('labels in French', () => {
    expect(gapLabel(0, formatDT)).toBe('Caisse juste');
    expect(gapLabel(-900, formatDT)).toBe('Il manque 0.900 DT');
    expect(gapLabel(2000, formatDT)).toBe('Excédent de 2.000 DT');
  });
});
