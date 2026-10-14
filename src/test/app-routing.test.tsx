import { QueryClient } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRouter,
  rootRouteId,
  RouterProvider,
} from "@tanstack/react-router";
import { render, screen, waitFor } from "@testing-library/react";
import { act } from "react";
import { beforeEach, describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";

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
    expect(screen.getByRole("heading", { name: "Pending" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Accepted" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Preparing" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Ready for pickup" })).toBeInTheDocument();
  });
});
