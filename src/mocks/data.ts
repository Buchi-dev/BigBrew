import type {
  Branch,
  BranchProductMap,
  Category,
  OptionGroup,
  Order,
  OrderItem,
  OrderStatus,
  Product,
  User,
} from "@/types";
import milktea from "@/assets/cat-milktea.jpg";
import icedcoffee from "@/assets/cat-icedcoffee.jpg";
import hotcoffee from "@/assets/cat-hotcoffee.jpg";
import praf from "@/assets/cat-praf.jpg";
import brosty from "@/assets/cat-brosty.jpg";
import fruittea from "@/assets/cat-fruittea.jpg";
import other from "@/assets/cat-other.jpg";

export const CATEGORY_IMAGES: Record<string, string> = {
  milktea,
  icedcoffee,
  hotcoffee,
  praf,
  brosty,
  fruittea,
  other,
};

const PREP_MINUTES = [8, 10, 12, 15, 10, 9] as const;
const MANAGER_NAMES = [
  "Liza Ramos",
  "Carlo Tan",
  "Joy Mendoza",
  "Rico Bautista",
  "Ana Villanueva",
  "Mark Aquino",
] as const;
const STAFF_NAMES = [
  "Jen Flores",
  "Ken Navarro",
  "Rhea Castillo",
  "Nico Torres",
  "Pia Lim",
  "Dan Ocampo",
] as const;

export const seedBranches: Branch[] = [1, 2, 3, 4, 5, 6].map((n) => ({
  id: `b0${n}`,
  code: `B0${n}`,
  name: `Branch 0${n}`,
  address: `Demo address placeholder — Branch 0${n}`,
  openTime: n === 6 ? "10:00" : "07:00",
  closeTime: n === 6 ? "20:00" : "23:00",
  temporarilyClosed: n === 5,
  accepting: n !== 4,
  prepMinutes: PREP_MINUTES[n - 1] ?? 10,
  leadMinutes: 15,
  maxActive: 20,
  graceMinutes: 30,
}));

export const seedCategories: Category[] = [
  { id: "milktea", name: "Milk Tea", image: "milktea" },
  { id: "icedcoffee", name: "Iced Coffee", image: "icedcoffee" },
  { id: "hotcoffee", name: "Hot Coffee", image: "hotcoffee" },
  { id: "praf", name: "Praf", image: "praf" },
  { id: "brosty", name: "Brosty", image: "brosty" },
  { id: "fruittea", name: "Fruit Tea", image: "fruittea" },
  { id: "other", name: "Other Drinks", image: "other" },
];

export const optionGroups: OptionGroup[] = [
  {
    id: "sugar",
    name: "Sugar level",
    type: "single",
    required: true,
    choices: ["0%", "25%", "50%", "75%", "100%"].map((l) => ({
      id: `s${l}`,
      label: `${l} sugar`,
      price: 0,
    })),
  },
  {
    id: "ice",
    name: "Ice level",
    type: "single",
    required: true,
    choices: [
      { id: "noice", label: "No ice", price: 0 },
      { id: "lessice", label: "Less ice", price: 0 },
      { id: "regice", label: "Regular ice", price: 0 },
    ],
  },
  {
    id: "toppings",
    name: "Toppings",
    type: "multi",
    required: false,
    max: 3,
    choices: [
      { id: "pearls", label: "Pearls", price: 9 },
      { id: "creamcheese", label: "Cream cheese", price: 15 },
      { id: "nata", label: "Nata de coco", price: 9 },
      { id: "cpuff", label: "Cream puff", price: 15 },
      { id: "coffeejelly", label: "Coffee jelly", price: 9 },
    ],
  },
  {
    id: "coffeeaddons",
    name: "Coffee add-ons",
    type: "multi",
    required: false,
    max: 2,
    choices: [
      { id: "extrashot", label: "Extra espresso shot", price: 20 },
      { id: "oatmilk", label: "Oat milk", price: 25 },
      { id: "syrup", label: "Caramel syrup", price: 10 },
    ],
  },
  {
    id: "temp",
    name: "Serve",
    type: "single",
    required: true,
    choices: [
      { id: "hot", label: "Hot", price: 0 },
      { id: "extrahot", label: "Extra hot", price: 0 },
    ],
  },
];

const M = (m: number, l: number) => [
  { id: "m", label: "Medium", price: m },
  { id: "l", label: "Large", price: l },
];

const raw: [string, string, string, number, number, string[], boolean?][] = [
  [
    "Wintermelon Milk Tea",
    "milktea",
    "Our caramel-sweet wintermelon classic, shaken with creamy milk tea.",
    39,
    49,
    ["sugar", "ice", "toppings"],
    true,
  ],
  [
    "Okinawa Milk Tea",
    "milktea",
    "Roasted brown sugar notes with a smooth tea finish.",
    39,
    49,
    ["sugar", "ice", "toppings"],
    true,
  ],
  [
    "Taro Milk Tea",
    "milktea",
    "Nutty, velvety taro blended with milk tea.",
    39,
    49,
    ["sugar", "ice", "toppings"],
  ],
  [
    "Matcha Milk Tea",
    "milktea",
    "Earthy green matcha with fresh milk.",
    44,
    54,
    ["sugar", "ice", "toppings"],
  ],
  [
    "Cookies & Cream Milk Tea",
    "milktea",
    "Crushed cookie bits in a creamy milk tea base.",
    44,
    54,
    ["sugar", "ice", "toppings"],
    true,
  ],
  [
    "Red Velvet Milk Tea",
    "milktea",
    "Cocoa and vanilla in a rosy red velvet cup.",
    44,
    54,
    ["sugar", "ice", "toppings"],
  ],
  [
    "Iced Americano",
    "icedcoffee",
    "Bold espresso over ice. Clean and strong.",
    39,
    49,
    ["sugar", "ice", "coffeeaddons"],
  ],
  [
    "Iced Caramel Macchiato",
    "icedcoffee",
    "Milk, espresso and caramel drizzle, layered.",
    49,
    59,
    ["sugar", "ice", "coffeeaddons"],
    true,
  ],
  [
    "Iced Spanish Latte",
    "icedcoffee",
    "Sweetened condensed milk meets espresso.",
    49,
    59,
    ["sugar", "ice", "coffeeaddons"],
  ],
  [
    "Iced Mocha",
    "icedcoffee",
    "Chocolate and espresso, shaken cold.",
    49,
    59,
    ["sugar", "ice", "coffeeaddons"],
  ],
  [
    "Hot Americano",
    "hotcoffee",
    "Freshly pulled espresso with hot water.",
    39,
    49,
    ["temp", "sugar", "coffeeaddons"],
  ],
  [
    "Hot Cappuccino",
    "hotcoffee",
    "Espresso crowned with silky milk foam.",
    49,
    59,
    ["temp", "sugar", "coffeeaddons"],
  ],
  [
    "Hot Caramel Latte",
    "hotcoffee",
    "Warm latte with a caramel twist.",
    49,
    59,
    ["temp", "sugar", "coffeeaddons"],
  ],
  [
    "Coffee Praf",
    "praf",
    "Blended iced coffee frappe topped with cream.",
    59,
    69,
    ["sugar", "toppings"],
    true,
  ],
  [
    "Mocha Praf",
    "praf",
    "Chocolatey coffee frappe, whipped and drizzled.",
    59,
    69,
    ["sugar", "toppings"],
  ],
  [
    "Cookies & Cream Praf",
    "praf",
    "Creamy frappe loaded with cookie crumbs.",
    59,
    69,
    ["sugar", "toppings"],
  ],
  ["Strawberry Praf", "praf", "Strawberry cream frappe, no coffee.", 59, 69, ["sugar", "toppings"]],
  ["Mango Brosty", "brosty", "Icy mango slush — bright and cold.", 49, 59, ["sugar"], true],
  ["Strawberry Brosty", "brosty", "Strawberry slush for hot afternoons.", 49, 59, ["sugar"]],
  ["Blue Lemonade Brosty", "brosty", "Tangy blue lemonade, frozen.", 49, 59, ["sugar"]],
  [
    "Passion Fruit Tea",
    "fruittea",
    "Green tea with passion fruit and lemon.",
    39,
    49,
    ["sugar", "ice", "toppings"],
  ],
  [
    "Lychee Fruit Tea",
    "fruittea",
    "Floral lychee over jasmine tea.",
    39,
    49,
    ["sugar", "ice", "toppings"],
  ],
  [
    "Lemon Yakult Tea",
    "fruittea",
    "Zesty lemon meets cultured milk drink.",
    44,
    54,
    ["sugar", "ice"],
  ],
  [
    "Iced Chocolate",
    "other",
    "Rich cocoa with fresh milk, over ice.",
    44,
    54,
    ["sugar", "ice", "toppings"],
  ],
  [
    "Strawberry Milk",
    "other",
    "Creamy strawberry milk, caffeine-free.",
    44,
    54,
    ["sugar", "ice", "toppings"],
  ],
  ["Hot Chocolate", "other", "Warm, comforting cocoa.", 44, 54, ["temp", "sugar"]],
];

export const seedProducts: Product[] = raw.map(([name, cat, desc, m, l, groups, popular], i) => ({
  id: `p${String(i + 1).padStart(2, "0")}`,
  name,
  categoryId: cat,
  description: desc,
  image: cat,
  sizes: M(m, l),
  optionGroupIds: groups,
  enabled: true,
  popular: !!popular,
}));

export const seedBranchProducts: BranchProductMap = {
  b01: { p04: { soldOut: true } },
  b02: { p08: { priceDelta: 5 }, p09: { priceDelta: 5 } },
  b03: { p06: { soldOut: true }, p20: { soldOut: true } },
  b04: {},
  b05: {},
  b06: { p14: { priceDelta: 10 }, p15: { soldOut: true } },
};

export const seedUsers: User[] = [
  {
    id: "u-cust1",
    name: "Andrea Santos",
    role: "customer",
    phone: "0917 555 0142",
    email: "andrea@example.com",
    active: true,
    branchId: "b03",
  },
  {
    id: "u-cust2",
    name: "Miguel Reyes",
    role: "customer",
    phone: "0918 555 0199",
    email: "miguel@example.com",
    active: true,
  },
  {
    id: "u-cust3",
    name: "Bea Cruz",
    role: "customer",
    phone: "0919 555 0123",
    email: "bea@example.com",
    active: true,
  },
  {
    id: "u-cust4",
    name: "Paolo Garcia",
    role: "customer",
    phone: "0920 555 0176",
    email: "paolo@example.com",
    active: true,
  },
  {
    id: "u-cust5",
    name: "Kim Dizon",
    role: "customer",
    phone: "0921 555 0111",
    email: "kim@example.com",
    active: true,
  },
  ...[1, 2, 3, 4, 5, 6].flatMap((n): User[] => [
    {
      id: `u-mgr${n}`,
      name: MANAGER_NAMES[n - 1] ?? `Manager ${n}`,
      role: "manager",
      branchId: `b0${n}`,
      phone: `0917 600 00${n}0`,
      email: `manager.b0${n}@demo.bigbrew`,
      active: true,
    },
    {
      id: `u-staff${n}`,
      name: STAFF_NAMES[n - 1] ?? `Staff ${n}`,
      role: "staff",
      branchId: `b0${n}`,
      phone: `0917 700 00${n}0`,
      email: `staff.b0${n}@demo.bigbrew`,
      active: true,
    },
  ]),
  {
    id: "u-staff3b",
    name: "Vince Pascual",
    role: "staff",
    branchId: "b03",
    phone: "0917 700 0031",
    email: "staff2.b03@demo.bigbrew",
    active: false,
  },
  {
    id: "u-admin",
    name: "Grace Lopez",
    role: "admin",
    phone: "0917 800 0001",
    email: "admin@demo.bigbrew",
    active: true,
  },
  {
    id: "u-super",
    name: "Ramon Dela Cruz",
    role: "superadmin",
    phone: "0917 900 0001",
    email: "superadmin@demo.bigbrew",
    active: true,
  },
];

/** Deterministic pseudo-random for stable seed orders. */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function generateSeedOrders(now = Date.now()): Order[] {
  const r = rng(42);
  const customers = seedUsers.filter((u) => u.role === "customer");
  const orders: Order[] = [];
  const counters: Record<string, number> = {};
  const histStatuses: OrderStatus[] = [
    "completed",
    "completed",
    "completed",
    "completed",
    "completed",
    "completed",
    "cancelled",
    "noshow",
    "rejected",
  ];
  const total = 42;
  for (let i = 0; i < total; i++) {
    const branch = seedBranches[Math.floor(r() * seedBranches.length)] ?? seedBranches[0]!;
    const isActive = i >= total - 8;
    const daysAgo = isActive ? 0 : Math.floor(r() * 13) + 1;
    const created = new Date(
      now - daysAgo * 86400000 - Math.floor(r() * 6 * 3600000) - (isActive ? 0 : 0),
    );
    if (isActive) created.setTime(now - (total - i) * 6 * 60000);
    const activeStatuses: OrderStatus[] = [
      "pending",
      "pending",
      "accepted",
      "preparing",
      "preparing",
      "ready",
      "ready",
      "pending",
    ];
    const status: OrderStatus = isActive
      ? (activeStatuses[i - (total - 8)] ?? "pending")
      : (histStatuses[Math.floor(r() * histStatuses.length)] ?? "completed");
    const nItems = 1 + Math.floor(r() * 3);
    const items: OrderItem[] = [];
    for (let k = 0; k < nItems; k++) {
      const p = seedProducts[Math.floor(r() * seedProducts.length)] ?? seedProducts[0]!;
      const size = p.sizes[Math.floor(r() * p.sizes.length)] ?? p.sizes[0]!;
      const opts: string[] = [];
      if (p.optionGroupIds.includes("sugar"))
        opts.push(
          ["25% sugar", "50% sugar", "75% sugar", "100% sugar"][Math.floor(r() * 4)] ?? "50% sugar",
        );
      if (p.optionGroupIds.includes("ice"))
        opts.push(["Less ice", "Regular ice"][Math.floor(r() * 2)] ?? "Regular ice");
      let price = size.price;
      if (p.optionGroupIds.includes("toppings") && r() > 0.5) {
        opts.push("Pearls");
        price += 9;
      }
      items.push({
        productId: p.id,
        name: p.name,
        sizeLabel: size.label,
        options: opts,
        qty: 1 + Math.floor(r() * 2),
        unitPrice: price,
      });
    }
    counters[branch.id] = (counters[branch.id] ?? 100) + 1;
    const cust = customers[Math.floor(r() * customers.length)] ?? customers[0]!;
    const totalAmt = items.reduce((s, it) => s + it.unitPrice * it.qty, 0);
    const paid = status === "completed";
    const flow: OrderStatus[] = ["pending", "accepted", "preparing", "ready", "completed"];
    let history: { status: OrderStatus; at: string }[];
    const stepIdx = flow.indexOf(status);
    if (stepIdx >= 0)
      history = flow.slice(0, stepIdx + 1).map((s, j) => ({
        status: s,
        at: new Date(created.getTime() + j * 4 * 60000).toISOString(),
      }));
    else if (status === "noshow")
      history = [...flow.slice(0, 4), "noshow" as OrderStatus].map((s, j) => ({
        status: s,
        at: new Date(created.getTime() + j * 5 * 60000).toISOString(),
      }));
    else
      history = [
        { status: "pending", at: created.toISOString() },
        { status, at: new Date(created.getTime() + 3 * 60000).toISOString() },
      ];
    orders.push({
      id: `o-seed-${i}`,
      number: `${branch.code}-${String(counters[branch.id]).padStart(4, "0")}`,
      branchId: branch.id,
      customerId: cust.id,
      customerName: cust.name,
      phone: cust.phone,
      items,
      total: totalAmt,
      status,
      paymentStatus: paid ? "paid" : "unpaid",
      ...(paid ? { amountReceived: Math.ceil(totalAmt / 50) * 50 } : {}),
      pickupType: "asap",
      pickupTime: new Date(
        created.getTime() + branch.prepMinutes * 60000 + 10 * 60000,
      ).toISOString(),
      pickupCode: String(100000 + Math.floor(r() * 899999)),
      pickupVerified: paid,
      createdAt: created.toISOString(),
      history,
    });
  }
  return orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
