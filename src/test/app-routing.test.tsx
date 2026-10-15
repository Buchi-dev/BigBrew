import { QueryClient } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRouter,
  rootRouteId,
  RouterProvider,
} from "@tanstack/react-router";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { act } from "react";
import { beforeEach, describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";
import type { Order } from "@/types";

const testOrder: Order = {
  id: "flow-test",
  number: "B03-FLOW",
  branchId: "b03",
  customerId: "u-cust1",
  customerName: "Flow customer",
  phone: "1",
  total: 68,
  status: "pending",
  paymentStatus: "unpaid",
  pickupType: "asap",
  pickupTime: new Date().toISOString(),
  pickupCode: "123456",
  pickupVerified: false,
  createdAt: new Date().toISOString(),
  history: [{ status: "pending", at: new Date().toISOString() }],
  items: [
    {
      productId: "first",
      name: "Matcha",
      sizeLabel: "Medium",
      options: ["Pearls"],
      qty: 1,
      unitPrice: 34,
    },
    {
      productId: "second",
      name: "Extra drink",
      sizeLabel: "Large",
      options: [],
      qty: 1,
      unitPrice: 34,
    },
  ],
};

function seedOrder(overrides: Partial<Order> = {}) {
  window.localStorage.setItem(
    "bigbrew-demo-v1",
    JSON.stringify({
      orders: [{ ...testOrder, ...overrides }],
      session: { userId: "u-staff3" },
    }),
  );
}

function card() {
  const headings = screen.getAllByRole("heading", { name: testOrder.number });
  return within(headings.at(-1)!.closest("article")!);
}

function savedOrder(): Order {
  return JSON.parse(window.localStorage.getItem("bigbrew-demo-v1")!).orders[0];
}

async function renderPath(path: string) {
  const router = createRouter({
    routeTree,
    context: { queryClient: new QueryClient() },
    history: createMemoryHistory({ initialEntries: [path] }),
  });

  await act(() => router.load());
  render(<RouterProvider router={router} />);
}

// Match routes without running loaders or rendering: loaders may need a server or
// network the test run lacks, and jsdom never loads the stylesheets React waits on.
describe("App routing", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("matches a page for / instead of falling back to not found", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

    const matches = router.matchRoutes("/");

    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
  });

  it("renders the branch ops dashboard core states", async () => {
    window.localStorage.setItem(
      "bigbrew-demo-v1",
      JSON.stringify({ session: { userId: "u-mgr3" } }),
    );
    await renderPath("/branch");

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: /branch ops dashboard/i })).toBeInTheDocument(),
    );
    expect(screen.getByText(/Queue health/i)).toBeInTheDocument();
    expect(screen.getByText(/Online intake/i)).toBeInTheDocument();
    expect(screen.getByText(/Drink availability/i)).toBeInTheDocument();
  });

  it("renders the branch order board lanes", async () => {
    await renderPath("/branch/orders");

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: /order board/i })).toBeInTheDocument(),
    );
    expect(screen.getByRole("tablist", { name: /order status lanes/i })).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { name: "Pending" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("heading", { name: "Accepted" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("heading", { name: "Preparing" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("heading", { name: "Ready for pickup" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: /accept/i }).length).toBeGreaterThan(0);
  });

  it.each(["Order board", "Open board", "Ops board"])(
    "opens the order board by clicking %s on the dashboard and returns",
    async (linkName) => {
      seedOrder();
      await renderPath("/branch");
      await waitFor(() =>
        expect(screen.getByRole("heading", { name: "Branch ops dashboard" })).toBeInTheDocument(),
      );
      fireEvent.click(screen.getByRole("link", { name: linkName, exact: true }));
      await waitFor(() =>
        expect(
          screen.getByRole("heading", { name: "Order board", exact: true }),
        ).toBeInTheDocument(),
      );
      expect(
        screen.queryByRole("heading", { name: "Branch ops dashboard" }),
      ).not.toBeInTheDocument();
      expect(card().getByRole("button", { name: "Accept" })).toBeInTheDocument();
      fireEvent.click(screen.getByRole("link", { name: "Dashboard", exact: true }));
      await waitFor(() =>
        expect(screen.getByRole("heading", { name: "Branch ops dashboard" })).toBeInTheDocument(),
      );
    },
  );

  it("reveals only the current action throughout the order journey and resumes after reload", async () => {
    seedOrder();
    await renderPath("/branch/orders");
    await waitFor(() => expect(card().getByRole("button", { name: "Accept" })).toBeInTheDocument());
    expect(card().queryByLabelText("Cash received")).not.toBeInTheDocument();
    expect(card().queryByLabelText("Pickup code")).not.toBeInTheDocument();
    expect(card().queryByText(/Extra drink/)).not.toBeInTheDocument();
    fireEvent.click(card().getByRole("button", { name: /more item/ }));
    expect(card().getByText(/Extra drink/)).toBeInTheDocument();
    fireEvent.click(card().getByRole("button", { name: "Accept" }));
    expect(card().queryByLabelText("Cash received")).not.toBeInTheDocument();
    expect(card().getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    fireEvent.click(card().getByRole("button", { name: "Start prep" }));
    expect(card().queryByLabelText("Pickup code")).not.toBeInTheDocument();
    expect(card().queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
    fireEvent.click(card().getByRole("button", { name: "Mark ready" }));
    expect(card().getByRole("button", { name: "No-show" })).toBeInTheDocument();
    expect(card().queryByLabelText("Pickup code")).not.toBeInTheDocument();
    expect(card().queryByRole("button", { name: "Complete" })).not.toBeInTheDocument();
    for (const value of ["", "abc", "Infinity", "-1", "67"]) {
      fireEvent.change(card().getByLabelText("Cash received"), { target: { value } });
      expect(card().getByRole("button", { name: /Record cash/ })).toBeDisabled();
      fireEvent.submit(card().getByLabelText("Cash received").closest("form")!);
      expect(savedOrder().paymentStatus).toBe("unpaid");
    }
    fireEvent.change(card().getByLabelText("Cash received"), { target: { value: "100" } });
    expect(card().getByText("Change due: ₱32")).toBeInTheDocument();
    fireEvent.click(card().getByRole("button", { name: /Record cash/ }));
    expect(card().queryByLabelText("Cash received")).not.toBeInTheDocument();
    expect(card().getByText("Cash received: ₱100")).toBeInTheDocument();
    expect(card().getByRole("button", { name: /Verify/ })).toBeDisabled();
    fireEvent.change(card().getByLabelText("Pickup code"), { target: { value: "000000" } });
    fireEvent.click(card().getByRole("button", { name: /Verify/ }));
    expect(card().getByRole("alert")).toHaveTextContent("Wrong pickup code");
    expect(savedOrder().pickupVerified).toBe(false);
    expect(card().queryByRole("button", { name: "Complete" })).not.toBeInTheDocument();
    cleanup();
    await renderPath("/branch/orders");
    await waitFor(() => expect(card().getByLabelText("Pickup code")).toBeInTheDocument());
    expect(card().queryByLabelText("Cash received")).not.toBeInTheDocument();
    fireEvent.change(card().getByLabelText("Pickup code"), { target: { value: "123456" } });
    fireEvent.click(card().getByRole("button", { name: /Verify/ }));
    expect(card().getByText("Pickup code verified")).toBeInTheDocument();
    cleanup();
    await renderPath("/branch/orders");
    await waitFor(() => expect(card().getByRole("button", { name: "Complete" })).toBeEnabled());
    expect(card().queryByLabelText("Pickup code")).not.toBeInTheDocument();
    fireEvent.click(card().getByRole("button", { name: "Complete" }));
    expect(screen.getByRole("heading", { name: "No active orders" })).toBeInTheDocument();
    expect(savedOrder().history.map((entry) => entry.status)).toEqual([
      "pending",
      "accepted",
      "preparing",
      "ready",
      "completed",
    ]);
  }, 15000);

  it.each([
    ["pending", "Reject", "rejected"],
    ["accepted", "Cancel", "cancelled"],
    ["ready", "No-show", "noshow"],
  ] as const)("removes a %s order using %s", async (status, action, result) => {
    seedOrder({ status });
    await renderPath("/branch/orders");
    await waitFor(() => expect(card().getByRole("button", { name: action })).toBeInTheDocument());
    fireEvent.click(card().getByRole("button", { name: action }));
    expect(screen.getByRole("heading", { name: "No active orders" })).toBeInTheDocument();
    expect(savedOrder().status).toBe(result);
  });

  it("collects payment for an existing verified but unpaid order before completion", async () => {
    seedOrder({ status: "ready", pickupVerified: true });
    await renderPath("/branch/orders");
    await waitFor(() => expect(card().getByLabelText("Cash received")).toBeInTheDocument());
    expect(card().queryByRole("button", { name: "Complete" })).not.toBeInTheDocument();
    fireEvent.click(card().getByRole("button", { name: /Record cash/ }));
    expect(card().getByRole("button", { name: "Complete" })).toBeEnabled();
    expect(card().queryByLabelText("Pickup code")).not.toBeInTheDocument();
  });

  it("renders one clean empty state for an empty branch order board", async () => {
    window.localStorage.setItem(
      "bigbrew-demo-v1",
      JSON.stringify({ orders: [], session: { userId: "u-staff3" } }),
    );
    await renderPath("/branch/orders");

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: /no active orders/i })).toBeInTheDocument(),
    );
    expect(screen.queryByText("Lane clear")).not.toBeInTheDocument();
  });
});
