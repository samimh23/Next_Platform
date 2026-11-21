import { describe, expect, it } from 'vitest';
import { formatQty, parseQty } from './stock';

describe('stock quantities', () => {
  it('formats in the unit people use', () => {
    expect(formatQty(1250, 'g')).toBe('1,25 kg');
    expect(formatQty(250, 'g')).toBe('250 g');
    expect(formatQty(-40, 'g')).toBe('-40 g');
    expect(formatQty(1500, 'ml')).toBe('1,5 L');
    expect(formatQty(150, 'ml')).toBe('150 ml');
    expect(formatQty(1, 'piece')).toBe('1 pièce');
    expect(formatQty(12, 'piece')).toBe('12 pièces');
  });

  it('reads what the owner types', () => {
    expect(parseQty('1,5 kg', 'g')).toBe(1500);
    expect(parseQty('1.5kg', 'g')).toBe(1500);
    expect(parseQty('250', 'g')).toBe(250);
    expect(parseQty(' 250 g ', 'g')).toBe(250);
    expect(parseQty('2 L', 'ml')).toBe(2000);
    expect(parseQty('33 cl', 'ml')).toBe(330);
    expect(parseQty('12', 'piece')).toBe(12);
    expect(parseQty('0', 'piece')).toBe(0);
  });

  it('refuses what does not fit the unit', () => {
    expect(parseQty('2 L', 'g')).toBeNull();
    expect(parseQty('1 kg', 'ml')).toBeNull();
    expect(parseQty('1,5', 'piece')).toBeNull();
    expect(parseQty('0,0005 kg', 'g')).toBeNull();
    expect(parseQty('-3', 'g')).toBeNull();
    expect(parseQty('', 'g')).toBeNull();
    expect(parseQty('abc', 'g')).toBeNull();
  });
});
