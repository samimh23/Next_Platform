import { describe, expect, it } from 'vitest';
import { decodeAccessToken, isExpired, isOwnerRole } from './token';

const b64url = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
const jwt = (payload: object) => `${b64url({ alg: 'HS256' })}.${b64url(payload)}.signature`;

describe('decodeAccessToken', () => {
  it('reads sub, tenant, role and expiry', () => {
    const c = decodeAccessToken(jwt({ sub: 'u1', tenantId: 't1', role: 'owner', exp: 2_000_000_000 }));
    expect(c).toEqual({ sub: 'u1', tenantId: 't1', role: 'owner', exp: 2_000_000_000 });
  });

  it.each([undefined, '', 'not-a-jwt', 'a.b.c', jwt({ sub: 'u1' })])('returns null for %s', (t) => {
    expect(decodeAccessToken(t)).toBeNull();
  });
});

describe('isExpired', () => {
  const now = 1_700_000_000_000;
  const c = (expInSeconds: number) => ({ sub: 'u', tenantId: 't', role: 'owner' as const, exp: now / 1000 + expInSeconds });

  it('valid for 10 minutes → not expired', () => expect(isExpired(c(600), now)).toBe(false));
  it('expires in 10 s → refresh early (30 s margin)', () => expect(isExpired(c(10), now)).toBe(true));
  it('already expired', () => expect(isExpired(c(-1), now, 0)).toBe(true));
  it('no token → expired', () => expect(isExpired(null, now)).toBe(true));
});

describe('isOwnerRole', () => {
  it('owner and manager can use /owner', () => {
    expect(isOwnerRole({ sub: 'u', tenantId: 't', role: 'owner', exp: 1 })).toBe(true);
    expect(isOwnerRole({ sub: 'u', tenantId: 't', role: 'manager', exp: 1 })).toBe(true);
    expect(isOwnerRole(null)).toBe(false);
  });
});
