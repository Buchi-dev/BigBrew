import type {
  Branch,
  BranchProductMap,
  CartItem,
  OptionGroup,
  Order,
  OrderStatus,
  Product,
  Selections,
} from "@/types";

export const peso = (n: number) =>
  `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

export function getGroups(product: Product, groups: OptionGroup[]) {
  return product.optionGroupIds
    .map((id) => groups.find((g) => g.id === id))
    .filter(Boolean) as OptionGroup[];
}

export function branchPriceDelta(
  map: BranchProductMap,
  branchId: string | null,
  productId: string,
) {
  if (!branchId) return 0;
  return map[branchId]?.[productId]?.priceDelta ?? 0;
}

export function isSoldOut(map: BranchProductMap, branchId: string | null, product: Product) {
  if (!product.enabled) return true;
  if (!branchId) return false;
  return !!map[branchId]?.[product.id]?.soldOut;
}

/** Unit price = size price + branch delta + selected option surcharges. */
export function unitPrice(
  product: Product,
  sizeId: string,
  selections: Selections,
  groups: OptionGroup[],
  delta = 0,
) {
  const size = product.sizes.find((s) => s.id === sizeId);
  if (!size) return 0;
  let total = size.price + delta;
  for (const g of getGroups(product, groups)) {
    for (const cid of selections[g.id] ?? []) {
      total += g.choices.find((c) => c.id === cid)?.price ?? 0;
    }
  }
  return total;
}

/** Returns a list of human readable validation errors (empty = valid). */
export function validateSelections(
  product: Product,
  sizeId: string | null,
  selections: Selections,
  groups: OptionGroup[],
) {
  const errors: string[] = [];
  if (!sizeId || !product.sizes.some((s) => s.id === sizeId)) errors.push("Choose a size");
  for (const g of getGroups(product, groups)) {
    const sel = selections[g.id] ?? [];
    if (g.required && sel.length === 0) errors.push(`Choose a ${g.name.toLowerCase()}`);
    if (g.type === "single" && sel.length > 1)
      errors.push(`Only one ${g.name.toLowerCase()} allowed`);
    if (g.max && sel.length > g.max) errors.push(`Up to ${g.max} ${g.name.toLowerCase()}`);
    if (sel.some((id) => !g.choices.some((c) => c.id === id)))
      errors.push(`Invalid ${g.name.toLowerCase()}`);
  }
  return errors;
}

export function describeSelections(
  product: Product,
  selections: Selections,
  groups: OptionGroup[],
) {
  const out: string[] = [];
  for (const g of getGroups(product, groups)) {
    for (const cid of selections[g.id] ?? []) {
      const c = g.choices.find((x) => x.id === cid);
      if (c) out.push(c.label);
    }
  }
  return out;
}

export function cartLineTotal(
  item: CartItem,
  products: Product[],
  groups: OptionGroup[],
  map: BranchProductMap,
  branchId: string | null,
) {
  const p = products.find((x) => x.id === item.productId);
  if (!p) return 0;
  return (
    unitPrice(p, item.sizeId, item.selections, groups, branchPriceDelta(map, branchId, p.id)) *
    item.qty
  );
}

// ---------- Branch hours ----------
const toMin = (hhmm: string) => {
  const [h = 0, m = 0] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

export function isWithinHours(branch: Branch, date = new Date()) {
  const m = date.getHours() * 60 + date.getMinutes();
  return m >= toMin(branch.openTime) && m < toMin(branch.closeTime);
}

export function branchIsOpen(branch: Branch, ignoreHours: boolean, date = new Date()) {
  if (branch.temporarilyClosed) return false;
  return ignoreHours || isWithinHours(branch, date);
}

export function canCheckout(
  branch: Branch,
  ignoreHours: boolean,
  activeCount: number,
  date = new Date(),
) {
  if (!branchIsOpen(branch, ignoreHours, date))
    return { ok: false, reason: "This branch is closed right now." };
  if (!branch.accepting) return { ok: false, reason: "This branch has paused online orders." };
  if (activeCount >= branch.maxActive)
    return { ok: false, reason: "This branch is at maximum order capacity. Try again shortly." };
  return { ok: true as const, reason: "" };
}

/** 15-minute pickup slots between (now + lead) and close, skipping full slots. */
export function pickupSlots(
  branch: Branch,
  ignoreHours: boolean,
  orders: Order[],
  now = new Date(),
  perSlotCap = 6,
) {
  const step = 15;
  const start = new Date(now.getTime() + Math.max(branch.leadMinutes, branch.prepMinutes) * 60000);
  start.setSeconds(0, 0);
  start.setMinutes(Math.ceil(start.getMinutes() / step) * step);
  const end = new Date(now);
  if (ignoreHours) end.setTime(start.getTime() + 4 * 3600000);
  else {
    end.setHours(0, 0, 0, 0);
    end.setMinutes(toMin(branch.closeTime));
  }
  const open = new Date(now);
  open.setHours(0, 0, 0, 0);
  open.setMinutes(toMin(branch.openTime));
  const slots: Date[] = [];
  for (let t = start.getTime(); t < end.getTime(); t += step * 60000) {
    const d = new Date(t);
    if (!ignoreHours && d < open) continue;
    const taken = orders.filter(
      (o) =>
        o.branchId === branch.id &&
        ACTIVE.includes(o.status) &&
        Math.abs(new Date(o.pickupTime).getTime() - t) < (step * 60000) / 2,
    ).length;
    if (taken < perSlotCap) slots.push(d);
  }
  return slots;
}

// ---------- Order state machine ----------
export const ACTIVE: OrderStatus[] = ["pending", "accepted", "preparing", "ready"];
export const ORDER_LANES: OrderStatus[] = ["pending", "accepted", "preparing", "ready"];

const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["accepted", "rejected", "cancelled"],
  accepted: ["preparing", "cancelled"],
  preparing: ["ready"],
  ready: ["completed", "noshow"],
  completed: [],
  rejected: [],
  cancelled: [],
  expired: [],
  noshow: [],
};

export function canTransition(order: Order, to: OrderStatus): { ok: boolean; reason?: string } {
  if (!TRANSITIONS[order.status].includes(to))
    return {
      ok: false,
      reason: `Cannot move from ${STATUS_LABEL[order.status]} to ${STATUS_LABEL[to]}.`,
    };
  if (to === "completed") {
    if (order.paymentStatus !== "paid") return { ok: false, reason: "Record cash payment first." };
    if (!order.pickupVerified) return { ok: false, reason: "Verify the pickup code first." };
  }
  return { ok: true };
}

export function changeDue(amountDue: number, received: number) {
  if (!Number.isFinite(received) || received < amountDue) return null;
  return Math.round((received - amountDue) * 100) / 100;
}

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pending",
  accepted: "Accepted",
  preparing: "Preparing",
  ready: "Ready for pickup",
  completed: "Completed",
  rejected: "Rejected",
  cancelled: "Cancelled",
  expired: "Expired",
  noshow: "No-show",
};

export type UrgencyLevel = "late" | "urgent" | "soon" | "normal";

export function sortOrdersByPickup(a: Order, b: Order) {
  const pickup = new Date(a.pickupTime).getTime() - new Date(b.pickupTime).getTime();
  if (pickup !== 0) return pickup;
  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
}

export function groupActiveOrdersByStatus(orders: Order[], branchId?: string) {
  const grouped = Object.fromEntries(ORDER_LANES.map((status) => [status, []])) as Record<
    (typeof ORDER_LANES)[number],
    Order[]
  >;
  for (const order of orders) {
    if (branchId && order.branchId !== branchId) continue;
    if (!ACTIVE.includes(order.status)) continue;
    grouped[order.status].push(order);
  }
  for (const status of ORDER_LANES) grouped[status].sort(sortOrdersByPickup);
  return grouped;
}

export function orderUrgency(order: Order, now = new Date()) {
  const minutes = Math.round((new Date(order.pickupTime).getTime() - now.getTime()) / 60000);
  if (minutes < 0) return { level: "late" as const, label: `${Math.abs(minutes)}m late`, minutes };
  if (minutes <= 5) return { level: "urgent" as const, label: "Due now", minutes };
  if (minutes <= 15) return { level: "soon" as const, label: `${minutes}m`, minutes };
  return { level: "normal" as const, label: `${minutes}m`, minutes };
}

export function activeCapacity(branch: Branch, activeCount: number) {
  const limit = Math.max(1, branch.maxActive);
  const percent = Math.min(100, Math.round((activeCount / limit) * 100));
  const remaining = Math.max(0, limit - activeCount);
  const level = activeCount >= limit ? "full" : percent >= 80 ? "warning" : "ok";
  const label =
    level === "full" ? "At capacity" : level === "warning" ? "Near capacity" : "Capacity healthy";
  return { activeCount, limit, percent, remaining, level, label };
}

export function branchAvailabilitySummary(
  products: Product[],
  map: BranchProductMap,
  branchId: string,
) {
  const enabled = products.filter((p) => p.enabled);
  const soldOut = enabled.filter((p) => !!map[branchId]?.[p.id]?.soldOut);
  return {
    total: products.length,
    enabled: enabled.length,
    available: enabled.length - soldOut.length,
    soldOut: soldOut.length,
    disabled: products.length - enabled.length,
  };
}
