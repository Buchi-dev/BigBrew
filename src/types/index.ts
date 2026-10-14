export type Role = "customer" | "staff" | "manager" | "admin" | "superadmin";

export interface Branch {
  id: string;
  code: string;
  name: string;
  address: string;
  openTime: string; // "HH:mm"
  closeTime: string;
  temporarilyClosed: boolean;
  accepting: boolean;
  prepMinutes: number;
  leadMinutes: number;
  maxActive: number;
  graceMinutes: number;
}

export interface Category {
  id: string;
  name: string;
  image: string;
}

export interface OptionChoice {
  id: string;
  label: string;
  price: number;
}

export interface OptionGroup {
  id: string;
  name: string;
  type: "single" | "multi";
  required: boolean;
  max?: number;
  choices: OptionChoice[];
}

export interface SizeVariant {
  id: string;
  label: string;
  price: number;
}

export interface Product {
  id: string;
  name: string;
  categoryId: string;
  description: string;
  image: string;
  sizes: SizeVariant[];
  optionGroupIds: string[];
  enabled: boolean;
  popular?: boolean;
}

export interface BranchProductSetting {
  soldOut?: boolean;
  priceDelta?: number;
}

/** branchId -> productId -> settings */
export type BranchProductMap = Record<string, Record<string, BranchProductSetting>>;

export type Selections = Record<string, string[]>;

export interface CartItem {
  id: string;
  productId: string;
  sizeId: string;
  selections: Selections;
  qty: number;
}

export interface Cart {
  branchId: string | null;
  items: CartItem[];
}

export type OrderStatus =
  | "pending"
  | "accepted"
  | "preparing"
  | "ready"
  | "completed"
  | "rejected"
  | "cancelled"
  | "expired"
  | "noshow";

export type PaymentStatus = "unpaid" | "paid";

export interface OrderItem {
  productId: string;
  name: string;
  sizeLabel: string;
  options: string[];
  qty: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  number: string;
  branchId: string;
  customerId: string;
  customerName: string;
  phone: string;
  notes?: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  amountReceived?: number;
  pickupType: "asap" | "scheduled";
  pickupTime: string; // ISO
  pickupCode: string;
  pickupVerified: boolean;
  createdAt: string;
  history: { status: OrderStatus; at: string }[];
}

export interface User {
  id: string;
  name: string;
  role: Role;
  branchId?: string;
  phone: string;
  email: string;
  active: boolean;
}

export interface AuditLog {
  id: string;
  at: string;
  actor: string;
  action: string;
}
