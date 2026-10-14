import { createFileRoute, Link } from "@tanstack/react-router";
import { ClipboardList } from "lucide-react";
import { EmptyState, PayBadge, StatusBadge, fmtDateTime } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { peso } from "@/lib/logic";

export const Route = createFileRoute("/_customer/orders")({
  head: () => ({
    meta: [
      { title: "My orders - BigBrew" },
      { name: "description", content: "Track current and past BigBrew pickup orders." },
    ],
  }),
  component: OrdersPage,
});

function OrdersPage() {
  const { state, currentUser } = useStore();
  const orders = state.orders
    .filter((o) => o.customerId === currentUser.id || o.phone === currentUser.phone)
    .slice(0, 20);

  if (orders.length === 0) {
    return (
      <EmptyState
        icon={<ClipboardList />}
        title="No orders yet"
        body="Your pickup orders will appear here."
        action={
          <Button asChild>
            <Link to="/menu" search={{}}>
              Order drinks
            </Link>
          </Button>
        }
      />
    );
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-extrabold">My orders</h1>
      <div className="space-y-3">
        {orders.map((order) => {
          const branch = state.branches.find((b) => b.id === order.branchId);
          return (
            <Link
              key={order.id}
              to="/orders/$orderId"
              params={{ orderId: order.id }}
              className="block rounded-2xl border bg-card p-4 shadow-card transition hover:border-primary"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-bold">{order.number}</h2>
                  <p className="text-sm text-muted-foreground">
                    {branch?.name} · {fmtDateTime(order.createdAt)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge status={order.status} />
                  <PayBadge paid={order.paymentStatus === "paid"} />
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span>{order.items.reduce((sum, item) => sum + item.qty, 0)} item(s)</span>
                <span className="font-bold">{peso(order.total)}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
