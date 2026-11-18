import { describe, expect, it } from 'vitest';
import { checkPin, validateStaffForm, type StaffFormValues } from './staff-form';

const form = (over: Partial<StaffFormValues> = {}): StaffFormValues => ({
  name: ' Ahmed ',
  role: 'server',
  pin: '2580',
  pinConfirm: '2580',
  ...over,
});

describe('validateStaffForm', () => {
  it('new staff: trims the name, keeps role and PIN', () => {
    expect(validateStaffForm(form(), { pinRequired: true })).toEqual({
      ok: true,
      data: { name: 'Ahmed', role: 'server', pin: '2580' },
    });
  });

  it('new staff: PIN is required', () => {
    const r = validateStaffForm(form({ pin: '', pinConfirm: '' }), { pinRequired: true });
    expect(r).toEqual({ ok: false, errors: { pin: 'Le code fait 4 à 6 chiffres.' } });
  });

  it('edit: empty PIN keeps the current one (no pin sent)', () => {
    expect(validateStaffForm(form({ pin: '', pinConfirm: '' }), { pinRequired: false })).toEqual({
      ok: true,
      data: { name: 'Ahmed', role: 'server' },
    });
  });

  it('PIN confirmation must match', () => {
    const r = validateStaffForm(form({ pinConfirm: '2581' }), { pinRequired: true });
    expect(r.ok === false && r.errors.pinConfirm).toBe('Les deux codes ne sont pas identiques.');
  });

  it('rejects empty name and unknown role', () => {
    const r = validateStaffForm(form({ name: '  ', role: 'chef' }), { pinRequired: true });
    expect(r.ok === false && Object.keys(r.errors).sort()).toEqual(['name', 'role']);
  });
});

describe('checkPin', () => {
  it.each(['2580', '7391', '104729', '1357'])('accepts %s', (pin) => expect(checkPin(pin)).toBeNull());
  it.each(['123', '1234567', '12a4', ''])('rejects the shape of %j', (pin) =>
    expect(checkPin(pin)).toBe('Le code fait 4 à 6 chiffres.'),
  );
  it.each(['0000', '1111', '1234', '123456', '9876', '3456'])('rejects too simple %s', (pin) =>
    expect(checkPin(pin)).toMatch(/trop simple/),
  );
});
