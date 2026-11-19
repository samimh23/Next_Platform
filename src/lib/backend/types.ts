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
  /** The Hub always can; other POS only if the owner allows it. */
  canTakePayments: boolean;
  /** Hub only: "192.168.1.20:7700" on the café Wi-Fi. */
  lanAddress: string | null;
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
  /** Table name at sale time; null = counter / takeaway. */
  tableName: string | null;
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

/** A room: "Salle", "Terrasse". */
export interface Area {
  id: string;
  name: string;
  sortOrder: number;
}

export interface DiningTable {
  id: string;
  areaId: string;
  name: string;
  seats: number;
  sortOrder: number;
}

export interface Floor {
  areas: Area[];
  tables: DiningTable[];
}

/** A cash drawer's day (amounts in millimes). */
export interface CashSession {
  id: string;
  status: 'open' | 'closed';
  drawer: { id: string; code: string; name: string } | null;
  openedAt: string;
  openedBy: string | null;
  openingFloat: number;
  closedAt: string | null;
  closedBy: string | null;
  countedCash: number | null;
  expectedCash: number | null;
  /** counted − expected: negative = cash missing. */
  difference: number | null;
  cashSales: number;
  cardSales: number;
  cashIn: number;
  cashOut: number;
  ticketCount: number;
  note: string | null;
}

export interface CashSessionDetail extends CashSession {
  movements: { id: string; type: 'in' | 'out'; amount: number; reason: string; staff: string | null; createdAt: string }[];
}
