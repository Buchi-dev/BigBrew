import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, ClipboardCheck, Clock, Wallet } from "lucide-react";
import { EmptyState, PayBadge, StatusBadge, fmtDateTime, fmtTime } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { ACTIVE, STATUS_LABEL, peso } from "@/lib/logic";

export const Route = createFileRoute("/_customer/orders/$orderId")({
  head: () => ({
    meta: [
      { title: "Order tracking - BigBrew" },
      { name: "description", content: "Track a BigBrew pickup order." },
    ],
  }),
  component: OrderTrackingPage,
});

function OrderTrackingPage() {
  const { orderId } = Route.useParams();
  const { state } = useStore();
  const order = state.orders.find((o) => o.id === orderId);

  if (!order) {
    return (
      <EmptyState
        icon={<ClipboardCheck />}
        title="Order not found"
        body="The order may have been reset from the demo data."
        action={
          <Button asChild>
            <Link to="/orders">Back to orders</Link>
          </Button>
        }
      />
    );
  }

  const branch = state.branches.find((b) => b.id === order.branchId);
  const steps = ["pending", "accepted", "preparing", "ready", "completed"] as const;
  const currentIndex = steps.indexOf(order.status as (typeof steps)[number]);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <section className="rounded-3xl border bg-card p-5 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-muted-foreground">{branch?.name}</p>
            <h1 className="text-3xl font-extrabold">{order.number}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Pickup around {fmtTime(order.pickupTime)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={order.status} />
            <PayBadge paid={order.paymentStatus === "paid"} />
          </div>
        </div>
        {ACTIVE.includes(order.status) && (
          <div className="mt-5 rounded-2xl bg-primary-soft p-4">
            <p className="text-sm font-semibold text-primary-hover">Pickup code</p>
            <p className="mt-1 font-display text-4xl font-extrabold tracking-widest">
              {order.pickupCode}
            </p>
          </div>
        )}
      </section>

      <section className="rounded-2xl border bg-card p-4 shadow-card">
        <h2 className="font-bold">Progress</h2>
        <div className="mt-4 space-y-3">
          {steps.map((step, index) => {
            const done = currentIndex >= index || order.history.some((h) => h.status === step);
            return (
              <div key={step} className="flex items-center gap-3">
                <span
                  className={`grid h-9 w-9 place-items-center rounded-full ${done ? "bg-success-soft text-success" : "bg-muted text-muted-foreground"}`}
                >
                  {done ? <CheckCircle2 className="h-5 w-5" /> : <Clock className="h-4 w-4" />}
                </span>
                <div>
                  <p className="font-semibold">{STATUS_LABEL[step]}</p>
                  <p className="text-xs text-muted-foreground">
                    {order.history.find((h) => h.status === step)?.at
                      ? fmtDateTime(order.history.find((h) => h.status === step)!.at)
                      : "Waiting"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-4 shadow-card">
        <h2 className="mb-3 font-bold">Items</h2>
        <div className="space-y-2">
          {order.items.map((item, index) => (
            <div key={`${item.productId}-${index}`} className="flex justify-between gap-3 text-sm">
              <span>
                {item.qty}x {item.name}
                <span className="text-muted-foreground">
                  {" "}
                  · {item.sizeLabel}
                  {item.options.length ? ` · ${item.options.join(", ")}` : ""}
                </span>
              </span>
              <span className="font-semibold">{peso(item.unitPrice * item.qty)}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-between border-t pt-4 font-extrabold">
          <span>Total</span>
          <span>{peso(order.total)}</span>
        </div>
        <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Wallet className="h-4 w-4" /> Pay cash at the branch when your drink is ready.
        </p>
      </section>
    </div>
  );
}
