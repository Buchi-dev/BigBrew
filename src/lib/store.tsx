import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  AuditLog,
  Branch,
  BranchProductMap,
  Cart,
  CartItem,
  Category,
  Order,
  OrderStatus,
  Product,
  Role,
  User,
} from "@/types";
import {
  generateSeedOrders,
  optionGroups,
  seedBranches,
  seedBranchProducts,
  seedCategories,
  seedProducts,
  seedUsers,
} from "@/mocks/data";
import {
  ACTIVE,
  branchPriceDelta,
  canTransition,
  describeSelections,
  getGroups,
  isSoldOut,
  unitPrice,
} from "./logic";

/**
 * Mock data service. All state lives in the browser (localStorage).
 * Swap these actions for API calls when a real backend exists.
 */
const KEY = "bigbrew-demo-v1";

interface Settings {
  ignoreHours: boolean;
  sound: boolean;
}

export interface AppState {
  branches: Branch[];
  categories: Category[];
  products: Product[];
  branchProducts: BranchProductMap;
  users: User[];
  orders: Order[];
  cart: Cart;
  selectedBranchId: string | null;
  session: { userId: string };
  settings: Settings;
  audit: AuditLog[];
}

function seedState(): AppState {
  return {
    branches: seedBranches,
    categories: seedCategories,
    products: seedProducts,
    branchProducts: seedBranchProducts,
    users: seedUsers,
    orders: generateSeedOrders(),
    cart: { branchId: null, items: [] },
    selectedBranchId: "b03",
    session: { userId: "u-cust1" },
    settings: { ignoreHours: true, sound: true },
    audit: [
      { id: "a0", at: new Date().toISOString(), actor: "System", action: "Demo data seeded" },
    ],
  };
}

const uid = () => Math.random().toString(36).slice(2, 10);

export interface PlaceOrderInput {
  customerName: string;
  phone: string;
  notes?: string;
  pickupType: "asap" | "scheduled";
  pickupTime: string;
}

function useStoreValue() {
  const [state, setState] = useState<AppState>(() => seedState());
  const [ready, setReady] = useState(false);
  const skipSave = useRef(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setState({ ...seedState(), ...JSON.parse(raw) });
    } catch {
      /* corrupted storage: keep seed */
    }
    setReady(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY && e.newValue) {
        skipSave.current = true;
        setState(JSON.parse(e.newValue));
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (skipSave.current) {
      skipSave.current = false;
      return;
    }
    localStorage.setItem(KEY, JSON.stringify(state));
  }, [state, ready]);

  const currentUser = currentUserOf(state);

  const log = (s: AppState, action: string): AuditLog[] => {
    const actor = currentUserOf(s);
    return [
      {
        id: uid(),
        at: new Date().toISOString(),
        actor: `${actor.name} (${actor.role})`,
        action,
      },
      ...s.audit,
    ].slice(0, 300);
  };

  const patch = useCallback((fn: (s: AppState) => AppState) => setState(fn), []);

  const actions = useMemo(
    () => ({
      switchUser(userId: string) {
        patch((s) => ({ ...s, session: { userId } }));
      },
      selectBranch(branchId: string) {
        patch((s) => {
          // Revalidate cart: drop sold-out items when branch changes.
          const items = s.cart.items.filter((it) => {
            const p = s.products.find((x) => x.id === it.productId);
            return p && !isSoldOut(s.branchProducts, branchId, p);
          });
          return {
            ...s,
            selectedBranchId: branchId,
            cart: { branchId: items.length ? branchId : null, items },
          };
        });
      },
      addToCart(item: Omit<CartItem, "id">) {
        patch((s) => ({
          ...s,
          cart: { branchId: s.selectedBranchId, items: [...s.cart.items, { ...item, id: uid() }] },
        }));
      },
      updateCartItem(id: string, p: Partial<CartItem>) {
        patch((s) => ({
          ...s,
          cart: { ...s.cart, items: s.cart.items.map((i) => (i.id === id ? { ...i, ...p } : i)) },
        }));
      },
      removeCartItem(id: string) {
        patch((s) => {
          const items = s.cart.items.filter((i) => i.id !== id);
          return { ...s, cart: { branchId: items.length ? s.cart.branchId : null, items } };
        });
      },
      clearCart() {
        patch((s) => ({ ...s, cart: { branchId: null, items: [] } }));
      },
      placeOrder(input: PlaceOrderInput): Order {
        const s = stateRef.current;
        const branch = s.branches.find((b) => b.id === s.cart.branchId);
        if (!branch || s.cart.items.length === 0) throw new Error("Cart is not ready for checkout");
        const items = s.cart.items.map((it) => {
          const p = s.products.find((x) => x.id === it.productId);
          if (!p) throw new Error(`Missing product ${it.productId}`);
          return {
            productId: p.id,
            name: p.name,
            sizeLabel: p.sizes.find((z) => z.id === it.sizeId)?.label ?? "",
            options: describeSelections(p, it.selections, optionGroups),
            qty: it.qty,
            unitPrice: unitPrice(
              p,
              it.sizeId,
              it.selections,
              optionGroups,
              branchPriceDelta(s.branchProducts, branch.id, p.id),
            ),
          };
        });
        const count = s.orders.filter((o) => o.branchId === branch.id).length + 101;
        const now = new Date().toISOString();
        const created: Order = {
          id: `o-${uid()}`,
          number: `${branch.code}-${String(count).padStart(4, "0")}`,
          branchId: branch.id,
          customerId: currentUserOf(s).id,
          customerName: input.customerName,
          phone: input.phone,
          ...(input.notes ? { notes: input.notes } : {}),
          items,
          total: items.reduce((a, b) => a + b.unitPrice * b.qty, 0),
          status: "pending",
          paymentStatus: "unpaid",
          pickupType: input.pickupType,
          pickupTime: input.pickupTime,
          pickupCode: String(100000 + Math.floor(Math.random() * 900000)),
          pickupVerified: false,
          createdAt: now,
          history: [{ status: "pending", at: now }],
        };
        const next = {
          ...s,
          orders: [created, ...s.orders],
          cart: { branchId: null, items: [] },
          audit: log(s, `Placed demo order ${created.number}`),
        };
        stateRef.current = next;
        setState(next);
        return created;
      },
      transition(orderId: string, to: OrderStatus): string | null {
        const cur = stateRef.current.orders.find((x) => x.id === orderId);
        if (!cur) return "Order not found";
        const check = canTransition(cur, to);
        if (!check.ok) return check.reason ?? "Invalid";
        setState((s) => {
          const o = s.orders.find((x) => x.id === orderId);
          if (!o || !canTransition(o, to).ok) return s;
          const at = new Date().toISOString();
          return {
            ...s,
            orders: s.orders.map((x) =>
              x.id === orderId
                ? { ...x, status: to, history: [...x.history, { status: to, at }] }
                : x,
            ),
            audit: log(s, `Order ${o.number} → ${to}`),
          };
        });
        return null;
      },
      recordPayment(orderId: string, amount: number) {
        patch((s) => {
          const o = s.orders.find((x) => x.id === orderId);
          if (!o || o.paymentStatus === "paid" || amount < o.total) return s;
          return {
            ...s,
            orders: s.orders.map((x) =>
              x.id === orderId ? { ...x, paymentStatus: "paid", amountReceived: amount } : x,
            ),
            audit: log(s, `Recorded cash payment for ${o.number}`),
          };
        });
      },
      verifyPickup(orderId: string, code: string): boolean {
        const o = stateRef.current.orders.find((x) => x.id === orderId);
        if (!o || o.pickupCode !== code.trim()) return false;
        patch((s) => ({
          ...s,
          orders: s.orders.map((x) => (x.id === orderId ? { ...x, pickupVerified: true } : x)),
          audit: log(s, `Verified pickup for ${o.number}`),
        }));
        return true;
      },
      updateBranch(id: string, p: Partial<Branch>) {
        patch((s) => ({
          ...s,
          branches: s.branches.map((b) => (b.id === id ? { ...b, ...p } : b)),
          audit: log(
            s,
            `Updated ${s.branches.find((b) => b.id === id)?.name}: ${Object.keys(p).join(", ")}`,
          ),
        }));
      },
      setSoldOut(branchId: string, productId: string, soldOut: boolean) {
        patch((s) => ({
          ...s,
          branchProducts: {
            ...s.branchProducts,
            [branchId]: {
              ...(s.branchProducts[branchId] ?? {}),
              [productId]: { ...s.branchProducts[branchId]?.[productId], soldOut },
            },
          },
          audit: log(
            s,
            `${soldOut ? "Sold out" : "Restocked"} ${s.products.find((p) => p.id === productId)?.name} at ${branchId.toUpperCase()}`,
          ),
        }));
      },
      upsertProduct(p: Product) {
        patch((s) => {
          const exists = s.products.some((x) => x.id === p.id);
          return {
            ...s,
            products: exists ? s.products.map((x) => (x.id === p.id ? p : x)) : [...s.products, p],
            audit: log(s, `${exists ? "Edited" : "Added"} product ${p.name}`),
          };
        });
      },
      upsertCategory(c: Category) {
        patch((s) => {
          const exists = s.categories.some((x) => x.id === c.id);
          return {
            ...s,
            categories: exists
              ? s.categories.map((x) => (x.id === c.id ? c : x))
              : [...s.categories, c],
            audit: log(s, `${exists ? "Renamed" : "Added"} category ${c.name}`),
          };
        });
      },
      removeCategory(id: string) {
        patch((s) => ({
          ...s,
          categories: s.categories.filter((c) => c.id !== id),
          audit: log(s, `Removed category ${id}`),
        }));
      },
      upsertUser(u: User) {
        patch((s) => {
          const exists = s.users.some((x) => x.id === u.id);
          return {
            ...s,
            users: exists ? s.users.map((x) => (x.id === u.id ? u : x)) : [...s.users, u],
            audit: log(s, `${exists ? "Updated" : "Added"} user ${u.name}`),
          };
        });
      },
      setSettings(p: Partial<Settings>) {
        patch((s) => ({ ...s, settings: { ...s.settings, ...p } }));
      },
      resetDemo() {
        setState(seedState());
      },
    }),
    [patch],
  );

  const activeCountFor = (branchId: string) =>
    state.orders.filter((o) => o.branchId === branchId && ACTIVE.includes(o.status)).length;

  return {
    state,
    ready,
    currentUser,
    actions,
    activeCountFor,
    groupsFor: (p: Product) => getGroups(p, optionGroups),
  };
}

function currentUserOf(s: AppState): User {
  return (
    s.users.find((u) => u.id === s.session.userId) ??
    s.users.find((u) => u.role === "customer") ??
    seedUsers[0]!
  );
}

type Store = ReturnType<typeof useStoreValue>;
const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const value = useStoreValue();
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore must be used within StoreProvider");
  return v;
}

export const ROLE_LABEL: Record<Role, string> = {
  customer: "Customer",
  staff: "Branch Staff",
  manager: "Branch Manager",
  admin: "Administrator",
  superadmin: "Super Admin",
};

export const isAdmin = (r: Role) => r === "admin" || r === "superadmin";
export const isBranchRole = (r: Role) => r === "staff" || r === "manager" || isAdmin(r);
export const canManageBranch = (r: Role) => r === "manager" || isAdmin(r);
