import { describe, expect, it } from "vitest";
import {
  activeCapacity,
  branchAvailabilitySummary,
  canCheckout,
  canTransition,
  changeDue,
  groupActiveOrdersByStatus,
  orderUrgency,
  unitPrice,
  validateSelections,
} from "./logic";
import { optionGroups, seedBranches, seedBranchProducts, seedProducts } from "@/mocks/data";
import type { Order } from "@/types";

const wintermelon = seedProducts.find((p) => p.name === "Wintermelon Milk Tea")!;
const baseOrder: Order = {
  id: "x",
  number: "B03-0001",
  branchId: "b03",
  customerId: "c",
  customerName: "A",
  phone: "1",
  items: [],
  total: 100,
  status: "ready",
  paymentStatus: "unpaid",
  pickupType: "asap",
  pickupTime: new Date().toISOString(),
  pickupCode: "123456",
  pickupVerified: false,
  createdAt: new Date().toISOString(),
  history: [],
};

describe("pricing", () => {
  it("adds topping surcharges and branch delta to size price", () => {
    expect(
      unitPrice(wintermelon, "l", { toppings: ["pearls", "creamcheese"] }, optionGroups, 5),
    ).toBe(49 + 9 + 15 + 5);
  });
  it("requires sugar and ice for milk tea", () => {
    expect(validateSelections(wintermelon, "m", {}, optionGroups).length).toBe(2);
    expect(
      validateSelections(wintermelon, "m", { sugar: ["s50%"], ice: ["lessice"] }, optionGroups),
    ).toEqual([]);
  });
  it("limits toppings to three", () => {
    const errs = validateSelections(
      wintermelon,
      "m",
      { sugar: ["s50%"], ice: ["regice"], toppings: ["pearls", "nata", "cpuff", "creamcheese"] },
      optionGroups,
    );
    expect(errs.length).toBe(1);
  });
});

describe("order rules", () => {
  it("unpaid orders cannot be completed", () => {
    expect(canTransition({ ...baseOrder, pickupVerified: true }, "completed").ok).toBe(false);
  });
  it("unverified pickups cannot be completed", () => {
    expect(canTransition({ ...baseOrder, paymentStatus: "paid" }, "completed").ok).toBe(false);
  });
  it("paid and verified ready orders can be completed", () => {
    expect(
      canTransition({ ...baseOrder, paymentStatus: "paid", pickupVerified: true }, "completed").ok,
    ).toBe(true);
  });
  it("pending orders cannot skip to ready", () => {
    expect(canTransition({ ...baseOrder, status: "pending" }, "ready").ok).toBe(false);
  });
  it("calculates change and rejects underpayment", () => {
    expect(changeDue(98, 100)).toBe(2);
    expect(changeDue(98, 50)).toBeNull();
  });
  it("closed or paused branches cannot accept checkout", () => {
    expect(canCheckout(seedBranches[4]!, true, 0).ok).toBe(false); // temporarily closed
    expect(canCheckout(seedBranches[3]!, true, 0).ok).toBe(false); // paused
    expect(canCheckout(seedBranches[2]!, true, 0).ok).toBe(true);
  });
});

describe("branch ops selectors", () => {
  it("groups active orders into status lanes sorted by pickup time", () => {
    const later = {
      ...baseOrder,
      id: "later",
      status: "pending" as const,
      pickupTime: "2026-10-14T02:30:00.000Z",
    };
    const earlier = {
      ...baseOrder,
      id: "earlier",
      status: "pending" as const,
      pickupTime: "2026-10-14T02:00:00.000Z",
    };
    const done = {
      ...baseOrder,
      id: "done",
      status: "completed" as const,
      pickupTime: "2026-10-14T01:00:00.000Z",
    };

    const grouped = groupActiveOrdersByStatus([later, done, earlier], "b03");

    expect(grouped.pending.map((o) => o.id)).toEqual(["earlier", "later"]);
    expect(grouped.ready).toEqual([]);
  });

  it("labels late and urgent pickup times", () => {
    const now = new Date("2026-10-14T02:00:00.000Z");

    expect(orderUrgency({ ...baseOrder, pickupTime: "2026-10-14T01:54:00.000Z" }, now).level).toBe(
      "late",
    );
    expect(orderUrgency({ ...baseOrder, pickupTime: "2026-10-14T02:04:00.000Z" }, now).level).toBe(
      "urgent",
    );
  });

  it("summarizes capacity and branch availability", () => {
    expect(activeCapacity({ ...seedBranches[2]!, maxActive: 10 }, 8)).toMatchObject({
      percent: 80,
      level: "warning",
      remaining: 2,
    });
    expect(branchAvailabilitySummary(seedProducts, seedBranchProducts, "b03")).toMatchObject({
      enabled: seedProducts.length,
      available: seedProducts.length - 2,
      soldOut: 2,
    });
  });
});
