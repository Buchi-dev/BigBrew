import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
  AlertTriangle,
  BarChart3,
  ClipboardList,
  Clock,
  Coffee,
  PackageX,
  PauseCircle,
  PlayCircle,
  SlidersHorizontal,
} from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { DemoRoleSwitcher } from "@/components/DemoRoleSwitcher";
import { BranchStatus, Logo, StatusBadge } from "@/components/shared";
import { canManageBranch, useStore } from "@/lib/store";
import {
  ORDER_LANES,
  activeCapacity,
  branchAvailabilitySummary,
  branchIsOpen,
  groupActiveOrdersByStatus,
  orderUrgency,
  peso,
  STATUS_LABEL,
} from "@/lib/logic";

export const Route = createFileRoute("/branch")({
  head: () => ({
    meta: [
      { title: "Branch dashboard - BigBrew" },
      { name: "description", content: "BigBrew demo branch dashboard." },
    ],
  }),
  component: BranchRoute,
});

function BranchRoute() {
  const pathname = useRouterState({ select: (router) => router.location.pathname });
  if (pathname !== "/branch") return <Outlet />;
  return <BranchDashboard />;
}

function BranchDashboard() {
  const { state, currentUser, actions } = useStore();
  const branchId = currentUser.branchId ?? state.selectedBranchId ?? "b03";
  const branch = state.branches.find((b) => b.id === branchId) ?? state.branches[0]!;
  const orders = state.orders.filter((o) => o.branchId === branch.id);
  const lanes = groupActiveOrdersByStatus(orders);
  const active = ORDER_LANES.flatMap((status) => lanes[status]);
  const urgent = active.filter((order) => orderUrgency(order).level !== "normal");
  const capacity = activeCapacity(branch, active.length);
  const availability = branchAvailabilitySummary(state.products, state.branchProducts, branch.id);
  const open = branchIsOpen(branch, state.settings.ignoreHours);
  const manager = canManageBranch(currentUser.role);
  const todayTotal = orders
    .filter((o) => o.status === "completed")
    .reduce((sum, order) => sum + order.total, 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center gap-2 px-3 py-3 sm:px-4">
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
      <main className="mx-auto max-w-7xl space-y-4 px-3 py-4 sm:px-4 sm:py-5">
        <section className="rounded-2xl border bg-card p-4 shadow-card sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-2xl font-extrabold leading-tight sm:text-3xl">
                Branch ops dashboard
              </h1>
              <p className="text-sm text-muted-foreground">{branch.address}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <BranchStatus branch={branch} ignoreHours={state.settings.ignoreHours} />
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                {branch.name}
              </span>
            </div>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-3 sm:gap-3">
            <HealthCard
              icon={open && branch.accepting ? <PlayCircle /> : <PauseCircle />}
              label="Online intake"
              value={open && branch.accepting ? "Taking orders" : open ? "Paused" : "Closed"}
              tone={open && branch.accepting ? "success" : "warning"}
            />
            <HealthCard
              icon={<AlertTriangle />}
              label="Queue health"
              value={urgent.length ? `${urgent.length} urgent` : "On pace"}
              tone={urgent.length ? "warning" : "success"}
            />
            <HealthCard
              icon={<Clock />}
              label="Capacity"
              value={`${capacity.activeCount}/${capacity.limit} active`}
              tone={capacity.level === "ok" ? "success" : "warning"}
              detail={`${capacity.remaining} slot(s) open`}
            />
          </div>
        </section>

        <section className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-5">
          <Metric icon={<ClipboardList />} label="Active orders" value={String(active.length)} />
          {ORDER_LANES.map((status) => (
            <Metric
              key={status}
              icon={<ClipboardList />}
              label={STATUS_LABEL[status]}
              value={String(lanes[status].length)}
            />
          ))}
        </section>

        <section className="grid gap-2 sm:grid-cols-3 sm:gap-3">
          <Metric
            icon={<Coffee />}
            label="Available drinks"
            value={`${availability.available}/${availability.enabled}`}
          />
          <Metric icon={<PackageX />} label="Sold out" value={String(availability.soldOut)} />
          <Metric icon={<BarChart3 />} label="Completed sales" value={peso(todayTotal)} />
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="rounded-2xl border bg-card p-3 shadow-card sm:p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-bold">Live queue</h2>
              <Button asChild size="sm">
                <Link to="/branch/orders">Open board</Link>
              </Button>
            </div>
            <div className="space-y-2">
              {active.length === 0 && (
                <div className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">
                  No active orders
                </div>
              )}
              {active.slice(0, 6).map((order) => {
                const urgency = orderUrgency(order);
                return (
                  <Link
                    key={order.id}
                    to="/branch/orders"
                    className="flex items-center justify-between gap-3 rounded-xl border p-3 hover:border-primary"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-bold">{order.number}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {order.items.length} item(s) · {order.customerName}
                      </span>
                    </span>
                    <span className="flex shrink-0 flex-wrap justify-end gap-2">
                      {urgency.level !== "normal" && (
                        <span className="rounded-full bg-warning-soft px-2 py-0.5 text-xs font-bold text-accent-foreground">
                          {urgency.label}
                        </span>
                      )}
                      <StatusBadge status={order.status} />
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="rounded-2xl border bg-card p-3 shadow-card sm:p-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-bold">Manager tools</h2>
              <Button asChild variant="outline" size="sm">
                <Link to="/branch/orders">Ops board</Link>
              </Button>
            </div>
            {manager ? (
              <div className="mt-4 space-y-5">
                <section>
                  <div className="mb-2 flex items-center gap-2 text-sm font-bold">
                    <PauseCircle className="h-4 w-4 text-primary" /> Intake
                  </div>
                  <label className="flex min-h-16 items-center justify-between gap-3 rounded-xl border p-3 text-sm">
                    <span className="min-w-0">
                      <span className="block font-semibold">Online orders</span>
                      <span className="text-xs text-muted-foreground">
                        Pause when the counter is overloaded.
                      </span>
                    </span>
                    <Switch
                      checked={branch.accepting}
                      onCheckedChange={(accepting) =>
                        actions.updateBranch(branch.id, { accepting })
                      }
                      aria-label="Toggle online orders"
                    />
                  </label>
                </section>

                <section>
                  <div className="mb-2 flex items-center gap-2 text-sm font-bold">
                    <SlidersHorizontal className="h-4 w-4 text-primary" /> Branch settings
                  </div>
                  <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-1">
                    <NumberSetting
                      label="Prep minutes"
                      value={branch.prepMinutes}
                      onChange={(prepMinutes) => actions.updateBranch(branch.id, { prepMinutes })}
                    />
                    <NumberSetting
                      label="Lead minutes"
                      value={branch.leadMinutes}
                      onChange={(leadMinutes) => actions.updateBranch(branch.id, { leadMinutes })}
                    />
                    <NumberSetting
                      label="Max active"
                      value={branch.maxActive}
                      onChange={(maxActive) => actions.updateBranch(branch.id, { maxActive })}
                    />
                  </div>
                </section>

                <section>
                  <div className="mb-2 flex items-center gap-2 text-sm font-bold">
                    <Coffee className="h-4 w-4 text-primary" /> Drink availability
                  </div>
                  <div className="max-h-[22rem] space-y-2 overflow-auto pr-1">
                    {state.products.map((product) => {
                      const soldOut = !!state.branchProducts[branch.id]?.[product.id]?.soldOut;
                      return (
                        <label
                          key={product.id}
                          className="flex min-h-16 items-center justify-between gap-3 rounded-xl border p-3 text-sm"
                        >
                          <span className="min-w-0">
                            <span className="block truncate font-semibold">{product.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {soldOut ? "Hidden from customers" : "Available online"}
                            </span>
                          </span>
                          <Switch
                            checked={!soldOut}
                            onCheckedChange={(available) =>
                              actions.setSoldOut(branch.id, product.id, !available)
                            }
                            disabled={!product.enabled}
                            aria-label={`Toggle ${product.name} availability`}
                          />
                        </label>
                      );
                    })}
                  </div>
                </section>
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                Manager role required for availability and intake settings.
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-card p-3 shadow-card sm:p-4">
      <div className="mb-2 grid h-9 w-9 place-items-center rounded-xl bg-primary-soft text-primary sm:mb-3 sm:h-10 sm:w-10">
        {icon}
      </div>
      <p className="text-xs text-muted-foreground sm:text-sm">{label}</p>
      <p className="text-xl font-extrabold sm:text-2xl">{value}</p>
    </div>
  );
}

function HealthCard({
  icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail?: string;
  tone: "success" | "warning";
}) {
  return (
    <div className="rounded-xl border bg-background p-3">
      <div
        className={`mb-2 grid h-9 w-9 place-items-center rounded-lg ${
          tone === "success" ? "bg-success-soft text-success" : "bg-warning-soft text-warning"
        }`}
      >
        {icon}
      </div>
      <p className="text-xs font-semibold uppercase text-muted-foreground">{label}</p>
      <p className="font-extrabold">{value}</p>
      {detail && <p className="text-xs text-muted-foreground">{detail}</p>}
    </div>
  );
}

function NumberSetting({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="grid gap-1 text-xs font-semibold text-muted-foreground">
      {label}
      <Input
        type="number"
        min={1}
        value={value}
        onChange={(event) => onChange(Math.max(1, Number(event.target.value) || 1))}
        className="text-foreground"
      />
    </label>
  );
}
