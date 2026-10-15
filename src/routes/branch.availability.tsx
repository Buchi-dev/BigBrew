import { createFileRoute, Link } from "@tanstack/react-router";
import { Coffee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DemoRoleSwitcher } from "@/components/DemoRoleSwitcher";
import { Logo } from "@/components/shared";
import { DataCard, PageHeader, RoleGuard } from "@/components/RoleShells";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/branch/availability")({
  head: () => ({
    meta: [
      { title: "Drink availability - BigBrew" },
      { name: "description", content: "Manage drink availability for the active BigBrew branch." },
    ],
  }),
  component: BranchAvailability,
});

function BranchAvailability() {
  const { state, currentUser, actions } = useStore();
  const branchId = currentUser.branchId ?? state.selectedBranchId ?? "b03";

  return (
    <RoleGuard roles={["staff", "manager", "admin", "superadmin"]}>
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center gap-2 px-3 py-3 sm:px-4">
            <Logo />
            <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-bold text-primary-hover">
              Branch
            </span>
            <div className="ml-auto flex items-center gap-2">
              <Button asChild variant="outline" size="sm">
                <Link to="/branch">Dashboard</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link to="/branch/orders">Order board</Link>
              </Button>
              <DemoRoleSwitcher />
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-3 py-4 sm:px-4 sm:py-5">
          <PageHeader
            title="Drink availability"
            description="Mark products in or out of stock for the active branch."
          />
          <DataCard title="Branch catalog">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {state.products.map((product) => {
                const soldOut = state.branchProducts[branchId]?.[product.id]?.soldOut ?? false;
                return (
                  <button
                    key={product.id}
                    onClick={() => actions.setSoldOut(branchId, product.id, !soldOut)}
                    className="flex min-h-14 items-center justify-between gap-3 rounded-xl border p-3 text-left transition hover:border-primary hover:bg-primary-soft/30"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <Coffee className="h-4 w-4 shrink-0 text-primary" />
                      <span className="truncate font-semibold">{product.name}</span>
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${
                        soldOut ? "bg-danger-soft text-destructive" : "bg-success-soft text-success"
                      }`}
                    >
                      {soldOut ? "Sold out" : "In stock"}
                    </span>
                  </button>
                );
              })}
            </div>
          </DataCard>
        </main>
      </div>
    </RoleGuard>
  );
}
