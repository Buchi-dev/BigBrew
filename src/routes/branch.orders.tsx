import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, ClipboardList, KeyRound, Wallet } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DemoRoleSwitcher } from "@/components/DemoRoleSwitcher";
import { Logo, PayBadge, StatusBadge, fmtTime } from "@/components/shared";
import { useStore } from "@/lib/store";
import { ACTIVE, canTransition, changeDue, peso } from "@/lib/logic";
import type { OrderStatus } from "@/types";

export const Route = createFileRoute("/branch/orders")({
  head: () => ({
    meta: [
      { title: "Order board - BigBrew" },
      { name: "description", content: "BigBrew branch order board demo." },
    ],
  }),
  component: BranchOrders,
});

function BranchOrders() {
  const { state, currentUser, actions } = useStore();
  const branchId = currentUser.branchId ?? state.selectedBranchId ?? "b03";
  const branch = state.branches.find((b) => b.id === branchId) ?? state.branches[0]!;
  const orders = state.orders.filter((o) => o.branchId === branch.id && ACTIVE.includes(o.status));

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
          <Logo />
          <Button asChild variant="ghost" size="sm">
            <Link to="/branch">Dashboard</Link>
          </Button>
          <div className="ml-auto">
            <DemoRoleSwitcher />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-5">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold">Order board</h1>
            <p className="text-sm text-muted-foreground">
              {branch.name} · {orders.length} active order(s)
            </p>
          </div>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              orderId={order.id}
              onTransition={actions.transition}
              onPay={actions.recordPayment}
              onVerify={actions.verifyPickup}
            />
          ))}
        </div>
        {orders.length === 0 && (
          <div className="rounded-2xl border border-dashed bg-card p-10 text-center">
            <ClipboardList className="mx-auto h-10 w-10 text-muted-foreground" />
            <h2 className="mt-3 font-bold">No active orders</h2>
          </div>
        )}
      </main>
    </div>
  );
}

function OrderCard({
  orderId,
  onTransition,
  onPay,
  onVerify,
}: {
  orderId: string;
  onTransition: (orderId: string, to: OrderStatus) => string | null;
  onPay: (orderId: string, amount: number) => void;
  onVerify: (orderId: string, code: string) => boolean;
}) {
  const { state } = useStore();
  const order = state.orders.find((o) => o.id === orderId)!;
  const [cash, setCash] = useState(String(Math.ceil(order.total / 50) * 50));
  const [code, setCode] = useState("");
  const due = changeDue(order.total, Number(cash));

  const move = (to: OrderStatus) => {
    const error = onTransition(order.id, to);
    if (error) toast.error(error);
    else toast.success(`${order.number} moved to ${to}`);
  };

  return (
    <article className="rounded-2xl border bg-card p-4 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold">{order.number}</h2>
          <p className="text-sm text-muted-foreground">
            {order.customerName} · Pickup {fmtTime(order.pickupTime)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={order.status} />
          <PayBadge paid={order.paymentStatus === "paid"} />
        </div>
      </div>

      <div className="mt-3 space-y-1 text-sm">
        {order.items.map((item, index) => (
          <p key={`${item.productId}-${index}`}>
            <span className="font-semibold">
              {item.qty}x {item.name}
            </span>
            <span className="text-muted-foreground">
              {" "}
              · {item.sizeLabel}
              {item.options.length ? ` · ${item.options.join(", ")}` : ""}
            </span>
          </p>
        ))}
      </div>

      <div className="mt-4 rounded-xl bg-muted p-3">
        <div className="flex items-center justify-between font-bold">
          <span>Total</span>
          <span>{peso(order.total)}</span>
        </div>
        {order.paymentStatus === "unpaid" && (
          <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
            <Input
              value={cash}
              onChange={(e) => setCash(e.target.value)}
              inputMode="decimal"
              aria-label="Cash received"
            />
            <Button
              type="button"
              onClick={() => {
                onPay(order.id, Number(cash));
                toast.success(
                  due !== null ? `Payment recorded. Change: ${peso(due)}` : "Payment recorded",
                );
              }}
              disabled={due === null}
            >
              <Wallet /> Record cash
            </Button>
          </div>
        )}
      </div>

      {!order.pickupVerified && (
        <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Pickup code"
            inputMode="numeric"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const ok = onVerify(order.id, code);
              toast[ok ? "success" : "error"](ok ? "Pickup code verified" : "Wrong pickup code");
            }}
          >
            <KeyRound /> Verify
          </Button>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {(["accepted", "preparing", "ready", "completed"] as OrderStatus[]).map((status) => (
          <Button
            key={status}
            type="button"
            size="sm"
            variant={status === "completed" ? "success" : "outline"}
            disabled={!canTransition(order, status).ok}
            onClick={() => move(status)}
          >
            {status === "completed" && <CheckCircle2 />} {status}
          </Button>
        ))}
      </div>
    </article>
  );
}
