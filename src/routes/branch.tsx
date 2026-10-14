import { createFileRoute, Link } from "@tanstack/react-router";
import { BarChart3, ClipboardList, Coffee, Settings, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DemoRoleSwitcher } from "@/components/DemoRoleSwitcher";
import { BranchStatus, Logo, StatusBadge } from "@/components/shared";
import { useStore } from "@/lib/store";
import { ACTIVE, peso } from "@/lib/logic";

export const Route = createFileRoute("/branch")({
  head: () => ({
    meta: [
      { title: "Branch dashboard - BigBrew" },
      { name: "description", content: "BigBrew demo branch dashboard." },
    ],
  }),
  component: BranchDashboard,
});

function BranchDashboard() {
  const { state, currentUser } = useStore();
  const branchId = currentUser.branchId ?? state.selectedBranchId ?? "b03";
  const branch = state.branches.find((b) => b.id === branchId) ?? state.branches[0]!;
  const orders = state.orders.filter((o) => o.branchId === branch.id);
  const active = orders.filter((o) => ACTIVE.includes(o.status));
  const todayTotal = orders
    .filter((o) => o.status === "completed")
    .reduce((sum, order) => sum + order.total, 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
          <Logo />
          <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-bold text-primary-hover">
            Branch
          </span>
          <div className="ml-auto flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/branch/orders">Order board</Link>
            </Button>
            <DemoRoleSwitcher />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl space-y-5 px-4 py-5">
        <section className="rounded-3xl border bg-card p-5 shadow-card">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-3xl font-extrabold">{branch.name}</h1>
              <p className="text-sm text-muted-foreground">{branch.address}</p>
            </div>
            <BranchStatus branch={branch} ignoreHours={state.settings.ignoreHours} />
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-3">
          <Metric icon={<ClipboardList />} label="Active orders" value={String(active.length)} />
          <Metric
            icon={<Coffee />}
            label="Available drinks"
            value={String(
              state.products.filter(
                (p) => p.enabled && !state.branchProducts[branch.id]?.[p.id]?.soldOut,
              ).length,
            )}
          />
          <Metric icon={<BarChart3 />} label="Completed sales" value={peso(todayTotal)} />
        </section>

        <section className="grid gap-4 lg:grid-cols-[1fr_20rem]">
          <div className="rounded-2xl border bg-card p-4 shadow-card">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-bold">Live queue</h2>
              <Button asChild size="sm">
                <Link to="/branch/orders">Open board</Link>
              </Button>
            </div>
            <div className="space-y-2">
              {active.slice(0, 6).map((order) => (
                <Link
                  key={order.id}
                  to="/branch/orders"
                  className="flex items-center justify-between rounded-xl border p-3 hover:border-primary"
                >
                  <span>
                    <span className="block font-bold">{order.number}</span>
                    <span className="text-xs text-muted-foreground">
                      {order.items.length} item(s) · {order.customerName}
                    </span>
                  </span>
                  <StatusBadge status={order.status} />
                </Link>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border bg-card p-4 shadow-card">
            <h2 className="font-bold">Manager tools</h2>
            <div className="mt-3 space-y-2 text-sm">
              <Tool icon={<Coffee />} label="Drink availability" />
              <Tool icon={<Settings />} label="Branch settings" />
              <Tool icon={<Users />} label="Staff roster" />
            </div>
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

function Tool({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border p-3">
      <span className="text-primary">{icon}</span>
      <span className="font-semibold">{label}</span>
      <span className="ml-auto rounded-full bg-warning-soft px-2 py-0.5 text-[11px] font-bold text-accent-foreground">
        Next
      </span>
    </div>
  );
}
