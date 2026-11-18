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

// ── Sales (amounts in millimes) ────────────────────────────

export interface VatLine {
  rateBp: number;
  ttc: number;
  ht: number;
  vat: number;
}

export interface SalesSummary {
  date: string;
  revenue: number;
  ticketCount: number;
  averageTicket: number;
  itemCount: number;
  cancelledCount: number;
  openCount: number;
  byPaymentMethod: { method: string; amount: number; count: number }[];
  /** Tunisia hour 0–23, only hours with sales. */
  byHour: { hour: number; revenue: number; tickets: number }[];
  topProducts: { productId: string; name: string; qty: number; revenue: number }[];
  vat: VatLine[];
}

export type OrderStatus = 'open' | 'paid' | 'cancelled';

export interface OrderView {
  id: string;
  status: OrderStatus;
  type: string;
  receiptNumber: string | null;
  openedAt: string;
  closedAt: string | null;
  total: number;
  itemCount: number;
  paymentMethod: string | null;
  deviceCode: string | null;
}

export interface OrderDetail extends OrderView {
  lines: {
    id: string;
    productId: string;
    name: string;
    unitPrice: number;
    modifiersPrice: number;
    modifiers: { id?: string; name: string; extraPrice?: number }[];
    qty: number;
    vatRateBp: number;
    voided: boolean;
    total: number;
  }[];
  payments: { method: string; amount: number; tendered: number; changeGiven: number }[];
  vat: VatLine[];
}

export type StaffRole = 'manager' | 'cashier' | 'server' | 'kitchen';

/** A staff member (the PIN hash never leaves the backend except to paired POS). */
export interface Staff {
  id: string;
  name: string;
  role: StaffRole;
  active: boolean;
}
