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
  /** "Remises & offerts" on paid tickets. */
  discounts: { amount: number; lines: number; freeItems: number };
  /** Tickets refunded after payment (out of revenue). */
  refunds: { count: number; amount: number };
  byPaymentMethod: { method: string; amount: number; count: number }[];
  /** Tunisia hour 0–23, only hours with sales. */
  byHour: { hour: number; revenue: number; tickets: number }[];
  topProducts: { productId: string; name: string; qty: number; revenue: number }[];
  vat: VatLine[];
}

export type OrderStatus = 'open' | 'paid' | 'cancelled' | 'refunded';

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
  refundedAt: string | null;
  refundReason: string | null;
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
    /** Discount on the line (millimes), its type and reason. */
    discount: number;
    discountType: 'free' | 'percent' | 'amount' | null;
    discountReason: string | null;
    /** Why it was removed after "Envoyer". */
    voidReason: string | null;
    /** After discount. */
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

/** The café's details printed on receipts. */
export interface Business {
  businessName: string;
  /** Matricule fiscal. */
  taxId: string | null;
  branchName: string;
  address: string | null;
  phone: string | null;
  receiptFooter: string | null;
  /** Shown in the Kahwti customer app (search). */
  listed: boolean;
  city: string | null;
  loyaltyEnabled: boolean;
}

// ── Loyalty (customer app + owner Fidélité page) ──

export interface Reward {
  id: string;
  name: string;
  /** Points it costs. */
  points: number;
  kind: 'free_product' | 'amount_off';
  productId?: string;
  /** Millimes off (amount_off). */
  amount?: number;
}

export interface LoyaltyProgram {
  enabled: boolean;
  pointsPerDinar: number;
  rewards: Reward[];
}

export interface CustomerView {
  id: string;
  email: string;
  name: string;
}

export interface CustomerAuthResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  customer: CustomerView;
}

export interface CafeSummary {
  id: string;
  name: string;
  businessName: string;
  city: string | null;
  address: string | null;
  loyalty: boolean;
  pointsPerDinar: number;
}

export interface CafeDetail extends CafeSummary {
  phone: string | null;
  rewards: Reward[];
}

export interface MyCafe extends CafeDetail {
  balance: number;
  history: { points: number; kind: 'earn' | 'redeem' | 'refund'; receiptNumber: string | null; rewardName: string | null; at: string }[];
}

export interface PointsBalance {
  cafeId: string;
  cafeName: string;
  city: string | null;
  balance: number;
  rewardsAvailable: number;
}

export interface ClaimResult {
  cafeId: string;
  cafeName: string;
  receiptNumber: string;
  points: number;
  balance: number;
}

// ── Stock ──

export interface StockItem {
  id: string;
  name: string;
  unit: 'g' | 'ml' | 'piece';
  /** Whole grams / millilitres / pieces; can be below 0. */
  quantity: number;
  lowThreshold: number | null;
  low: boolean;
  archived: boolean;
}

export interface Recipe {
  productId: string;
  lines: { stockItemId: string; qty: number }[];
}

export interface StockView {
  items: StockItem[];
  recipes: Recipe[];
}

export interface StockMovement {
  kind: 'sale' | 'delivery' | 'waste' | 'count';
  delta: number;
  quantityAfter: number;
  note: string | null;
  orderId: string | null;
  at: string;
}
