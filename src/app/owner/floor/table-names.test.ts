import { describe, expect, it } from 'vitest';
import { parseTableNames } from './table-names';

const names = (input: string) => {
  const r = parseTableNames(input);
  if (!r.ok) throw new Error(r.error);
  return r.names;
};
const error = (input: string) => {
  const r = parseTableNames(input);
  return r.ok ? null : r.error;
};

describe('parseTableNames', () => {
  it('ranges', () => {
    expect(names('1-4')).toEqual(['1', '2', '3', '4']);
    expect(names('1 à 3')).toEqual(['1', '2', '3']);
    expect(names('5 – 6')).toEqual(['5', '6']);
    expect(names('T1-T3')).toEqual(['T1', 'T2', 'T3']);
    expect(names('T1-3')).toEqual(['T1', 'T2', 'T3']);
  });

  it('lists and single names, trimmed', () => {
    expect(names(' 1-2, Bar ; Terrasse 2\n7 ')).toEqual(['1', '2', 'Bar', 'Terrasse 2', '7']);
    expect(names('12')).toEqual(['12']);
  });

  it('a range with different prefixes is a plain name', () => {
    expect(names('A1-B3')).toEqual(['A1-B3']);
  });

  it('errors in French', () => {
    expect(error('  ')).toMatch(/au moins une table/);
    expect(error('9-3')).toMatch(/plus petit/);
    expect(error('1-500')).toMatch(/Maximum 100/);
    expect(error('1-3, 2')).toBe('« 2 » apparaît deux fois.');
    expect(error('t1, T1')).toBe('« T1 » apparaît deux fois.');
    expect(error('Table de la grande terrasse')).toMatch(/trop long/);
  });
});
