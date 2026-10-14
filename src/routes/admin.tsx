import { createFileRoute, Link } from "@tanstack/react-router";
import { BarChart3, Building2, ClipboardList, Coffee, Users } from "lucide-react";
import { DemoRoleSwitcher } from "@/components/DemoRoleSwitcher";
import { Logo } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { peso } from "@/lib/logic";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin - BigBrew" },
      { name: "description", content: "BigBrew demo admin overview." },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { state } = useStore();
  const completed = state.orders.filter((o) => o.status === "completed");
  const sales = completed.reduce((sum, order) => sum + order.total, 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
          <Logo />
          <span className="rounded-full bg-ink px-3 py-1 text-xs font-bold text-ink-foreground">
            Admin
          </span>
          <div className="ml-auto">
            <DemoRoleSwitcher />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl space-y-5 px-4 py-5">
        <section>
          <h1 className="text-3xl font-extrabold">Admin overview</h1>
          <p className="text-sm text-muted-foreground">
            Charts and management screens are sketched here while the operational flow is being
            built.
          </p>
        </section>
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric icon={<Building2 />} label="Branches" value={String(state.branches.length)} />
          <Metric icon={<Coffee />} label="Products" value={String(state.products.length)} />
          <Metric icon={<ClipboardList />} label="Orders" value={String(state.orders.length)} />
          <Metric icon={<BarChart3 />} label="Completed sales" value={peso(sales)} />
        </section>
        <section className="grid gap-4 lg:grid-cols-[1fr_20rem]">
          <div className="rounded-2xl border bg-card p-4 shadow-card">
            <h2 className="font-bold">Branch performance</h2>
            <div className="mt-4 space-y-3">
              {state.branches.map((branch) => {
                const branchOrders = state.orders.filter((o) => o.branchId === branch.id);
                const branchSales = branchOrders
                  .filter((o) => o.status === "completed")
                  .reduce((sum, order) => sum + order.total, 0);
                return (
                  <div key={branch.id} className="rounded-xl border p-3">
                    <div className="flex justify-between text-sm font-semibold">
                      <span>{branch.name}</span>
                      <span>{peso(branchSales)}</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${Math.min(100, branchOrders.length * 8)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="rounded-2xl border bg-card p-4 shadow-card">
            <h2 className="font-bold">Admin modules</h2>
            <div className="mt-3 space-y-2">
              {["Products & categories", "Branches", "Users & roles", "Audit logs"].map((label) => (
                <div
                  key={label}
                  className="flex items-center rounded-xl border p-3 text-sm font-semibold"
                >
                  <Users className="mr-2 h-4 w-4 text-primary" />
                  {label}
                  <span className="ml-auto rounded-full bg-warning-soft px-2 py-0.5 text-[11px] font-bold text-accent-foreground">
                    Next
                  </span>
                </div>
              ))}
            </div>
            <Button asChild className="mt-4 w-full">
              <Link to="/branch">Open branch demo</Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-card">
      <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary">
        {icon}
      </div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-extrabold">{value}</p>
    </div>
  );
}
