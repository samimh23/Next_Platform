/** Shapes returned by the backend owner endpoints. Amounts are millimes. */

export type DeviceRole = 'hub' | 'pos' | 'kds';

export interface Device {
  id: string;
  /** T1, T2… */
  code: string;
  name: string;
  role: DeviceRole;
  disabled: boolean;
  /** Synced in the last 60 seconds. */
  online: boolean;
  lastSeenAt: string | null;
  /** Events received from this POS. */
  lastSeq: number;
  pairedAt: string;
}

export interface PairingCode {
  code: string;
  role: DeviceRole;
  expiresAt: string;
}

export interface Category {
  id: string;
  name: string;
  color: string | null;
  sortOrder: number;
}

export interface ModifierOption {
  id: string;
  name: string;
  /** Millimes per unit. */
  extraPrice: number;
}

export interface ModifierGroup {
  id: string;
  name: string;
  minSelect: number;
  maxSelect: number;
  modifiers: ModifierOption[];
}

export type Station = 'bar' | 'kitchen' | 'none';

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  /** TTC, millimes. */
  price: number;
  vatRateBp: number;
  station: Station;
  modifierGroups: ModifierGroup[];
  available: boolean;
  sortOrder: number;
}

export interface Menu {
  categories: Category[];
  products: Product[];
}
