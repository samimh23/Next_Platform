import type { StaffRole } from '@/lib/backend/types';

export const ROLE_LABEL: Record<StaffRole, string> = {
  manager: 'Gérant',
  cashier: 'Caissier',
  server: 'Serveur',
  kitchen: 'Cuisine',
};
export const ROLES = Object.keys(ROLE_LABEL) as StaffRole[];

export interface StaffFormValues {
  name: string;
  role: string;
  pin: string;
  pinConfirm: string;
}

export type StaffFormErrors = Partial<Record<keyof StaffFormValues, string>>;

export type StaffFormResult =
  | { ok: true; data: { name: string; role: StaffRole; pin?: string } }
  | { ok: false; errors: StaffFormErrors };

/**
 * Checks the "Ajouter / Modifier" form. When editing, an empty PIN means
 * "keep the current PIN".
 */
export function validateStaffForm(v: StaffFormValues, { pinRequired }: { pinRequired: boolean }): StaffFormResult {
  const errors: StaffFormErrors = {};
  const name = v.name.trim();
  if (name.length < 1 || name.length > 40) errors.name = 'Le nom doit faire entre 1 et 40 caractères.';
  if (!ROLES.includes(v.role as StaffRole)) errors.role = 'Choisissez un rôle.';

  const pin = v.pin.trim();
  if (pin || pinRequired) {
    const pinError = checkPin(pin);
    if (pinError) errors.pin = pinError;
    else if (v.pinConfirm.trim() !== pin) errors.pinConfirm = 'Les deux codes ne sont pas identiques.';
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, data: { name, role: v.role as StaffRole, ...(pin ? { pin } : {}) } };
}

/** 4 to 6 digits, and not trivially guessable (0000, 1234, 9876…). */
export function checkPin(pin: string): string | null {
  if (!/^\d{4,6}$/.test(pin)) return 'Le code fait 4 à 6 chiffres.';
  const d = [...pin].map(Number);
  const same = d.every((x) => x === d[0]);
  const up = d.every((x, i) => i === 0 || x === d[i - 1]! + 1);
  const down = d.every((x, i) => i === 0 || x === d[i - 1]! - 1);
  if (same || up || down) return 'Code trop simple (ex. 0000 ou 1234). Choisissez-en un autre.';
  return null;
}
