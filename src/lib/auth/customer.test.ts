import { describe, expect, it } from 'vitest';
import { decodeCustomerToken, previewReceiptCode, safeCustomerNext } from './customer';

const b64 = (o: object) => btoa(JSON.stringify(o)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const jwt = (payload: object) => `${b64({ alg: 'HS256' })}.${b64(payload)}.sig`;

describe('customer session helpers', () => {
  it('reads customer tokens only (an owner token is not a customer session)', () => {
    expect(decodeCustomerToken(jwt({ sub: 'c1', exp: 10, iss: 'kahwti-customer' }))).toEqual({ sub: 'c1', exp: 10 });
    expect(decodeCustomerToken(jwt({ sub: 'u1', exp: 10, iss: 'pos-platform', role: 'owner' }))).toBeNull();
    expect(decodeCustomerToken('nope')).toBeNull();
    expect(decodeCustomerToken(undefined)).toBeNull();
  });

  it('after login, only goes back to customer pages', () => {
    expect(safeCustomerNext('/r/abc.def')).toBe('/r/abc.def');
    expect(safeCustomerNext('/app/cafes/1')).toBe('/app/cafes/1');
    expect(safeCustomerNext('/owner/dashboard')).toBe('/app');
    expect(safeCustomerNext('https://evil.example')).toBe('/app');
    expect(safeCustomerNext('//evil.example')).toBe('/app');
    expect(safeCustomerNext(null)).toBe('/app');
  });

  it('previews a receipt code (same format the POS prints)', () => {
    // Vector from the POS test (pos-cafe test/features/loyalty_receipt_test.dart).
    const code =
      'eyJvIjoiMDE5YTAwMDAtMDAwMC03MDAwLTgwMDAtMDAwMDAwMDAwMDAxIiwiZCI6IjAxOWEwMDAwLTAwMDAtNzAwMC04MDAwLTAwMDAwMDAwMDBkMSIsIm4iOiJUMS0wMDAwNDIiLCJ0IjoxMjUwMCwiYXQiOjE3NjM2NDcyMDB9.o1MNkjIJaP8kUpv4BRmuw_18wpIKDrA6FaEvnZYv3C_juLAI7cgk39GuM6qu2nWOCWVLkR-rqXbmERrOqaYaDg';
    expect(previewReceiptCode(code)).toEqual({ receiptNumber: 'T1-000042', total: 12500, at: new Date('2025-11-20T14:00:00Z') });
    expect(previewReceiptCode('garbage')).toBeNull();
  });
});
