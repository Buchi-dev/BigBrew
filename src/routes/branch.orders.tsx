import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, ClipboardList, KeyRound, Wallet } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DemoRoleSwitcher } from "@/components/DemoRoleSwitcher";
import { Logo, PayBadge, StatusBadge, fmtTime } from "@/components/shared";
import { useStore } from "@/lib/store";
import {
  ORDER_LANES,
  STATUS_LABEL,
  canTransition,
  changeDue,
  groupActiveOrdersByStatus,
  orderUrgency,
  peso,
} from "@/lib/logic";
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
  const lanes = groupActiveOrdersByStatus(state.orders, branch.id);
  const activeCount = ORDER_LANES.reduce((sum, status) => sum + lanes[status].length, 0);
  const firstActiveLane = ORDER_LANES.find((status) => lanes[status].length > 0) ?? ORDER_LANES[0]!;
  const [mobileLane, setMobileLane] = useState<OrderStatus>(firstActiveLane);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center gap-2 px-3 py-3 sm:px-4">
          <Logo />
          <div className="ml-auto flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/branch">Dashboard</Link>
            </Button>
            <DemoRoleSwitcher />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-3 py-4 sm:px-4 sm:py-5">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3 sm:mb-4">
          <div>
            <h1 className="text-2xl font-extrabold leading-tight">Order board</h1>
            <p className="text-sm text-muted-foreground">
              {branch.name} · {activeCount} active order(s)
            </p>
          </div>
        </div>

        {activeCount === 0 ? (
          <div className="rounded-2xl border border-dashed bg-card p-8 text-center shadow-card sm:p-10">
            <ClipboardList className="mx-auto h-10 w-10 text-muted-foreground" />
            <h2 className="mt-3 font-bold">No active orders</h2>
            <p className="mt-1 text-sm text-muted-foreground">The board is clear for now.</p>
          </div>
        ) : (
          <>
            <Tabs
              value={mobileLane}
              onValueChange={(value) => setMobileLane(value as OrderStatus)}
              className="md:hidden"
            >
              <TabsList
                aria-label="Order status lanes"
                className="grid h-auto w-full grid-cols-2 gap-1 rounded-xl p-1"
              >
                {ORDER_LANES.map((status) => (
                  <TabsTrigger key={status} value={status} className="min-h-11 gap-2 px-2">
                    <span className="truncate">{mobileLaneLabel(status)}</span>
                    <span className="rounded-full bg-background px-2 py-0.5 text-[11px] font-bold text-foreground">
                      {lanes[status].length}
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>
              {ORDER_LANES.map((status) => (
                <TabsContent key={status} value={status} className="mt-3">
                  <OrderLane
                    status={status}
                    orderIds={lanes[status].map((order) => order.id)}
                    onTransition={actions.transition}
                    onPay={actions.recordPayment}
                    onVerify={actions.verifyPickup}
                  />
                </TabsContent>
              ))}
            </Tabs>

            <div className="hidden items-start gap-3 md:grid md:grid-cols-2 xl:grid-cols-4">
              {ORDER_LANES.map((status) => (
                <OrderLane
                  key={status}
                  status={status}
                  orderIds={lanes[status].map((order) => order.id)}
                  onTransition={actions.transition}
                  onPay={actions.recordPayment}
                  onVerify={actions.verifyPickup}
                  desktop
                />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function OrderLane({
  status,
  orderIds,
  onTransition,
  onPay,
  onVerify,
  desktop,
}: {
  status: OrderStatus;
  orderIds: string[];
  onTransition: (orderId: string, to: OrderStatus) => string | null;
  onPay: (orderId: string, amount: number) => void;
  onVerify: (orderId: string, code: string) => boolean;
  desktop?: boolean;
}) {
  return (
    <section className="rounded-2xl border bg-card p-3 shadow-card">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="truncate font-bold">{STATUS_LABEL[status]}</h2>
          <p className="text-xs text-muted-foreground">{orderIds.length} order(s)</p>
        </div>
        <StatusBadge status={status} className="shrink-0" />
      </div>
      <div
        className={desktop ? "max-h-[calc(100vh-14rem)] space-y-3 overflow-auto pr-1" : "space-y-3"}
      >
        {orderIds.map((orderId) => (
          <OrderCard
            key={orderId}
            orderId={orderId}
            onTransition={onTransition}
            onPay={onPay}
            onVerify={onVerify}
          />
        ))}
        {orderIds.length === 0 && (
          <div className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">
            Lane clear
          </div>
        )}
      </div>
    </section>
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
  const urgency = orderUrgency(order);
  const nextActions = nextStatuses(order.status);
  const primaryAction = nextActions[0];
  const secondaryActions = nextActions.slice(1);
  const extraItems = Math.max(0, order.items.length - 1);

  const move = (to: OrderStatus) => {
    const error = onTransition(order.id, to);
    if (error) toast.error(error);
    else toast.success(`${order.number} moved to ${to}`);
  };

  return (
    <article className="rounded-xl border bg-background p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-lg font-extrabold leading-tight">{order.number}</h3>
          <p className="truncate text-sm text-muted-foreground">{order.customerName}</p>
          <p className="text-sm font-semibold text-foreground">
            Pickup {fmtTime(order.pickupTime)}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {urgency.level !== "normal" && (
            <span
              className={
                urgency.level === "late"
                  ? "rounded-full bg-danger-soft px-2.5 py-0.5 text-xs font-semibold text-destructive"
                  : "rounded-full bg-warning-soft px-2.5 py-0.5 text-xs font-semibold text-accent-foreground"
              }
            >
              {urgency.label}
            </span>
          )}
          <PayBadge paid={order.paymentStatus === "paid"} />
        </div>
      </div>

      <div className="mt-3 space-y-1 text-sm">
        {order.items.slice(0, 1).map((item, index) => (
          <p key={`${item.productId}-${index}`} className="leading-snug">
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
        {extraItems > 0 && (
          <p className="text-xs font-semibold text-muted-foreground">
            +{extraItems} more item{extraItems === 1 ? "" : "s"}
          </p>
        )}
      </div>

      <div className="mt-3 rounded-xl bg-muted p-3">
        <div className="flex items-center justify-between font-bold">
          <span>Total</span>
          <span>{peso(order.total)}</span>
        </div>
        {order.paymentStatus === "unpaid" && (
          <div className="mt-3 grid gap-2">
            <Input
              value={cash}
              onChange={(e) => setCash(e.target.value)}
              inputMode="decimal"
              aria-label="Cash received"
              className="h-11"
            />
            <Button
              type="button"
              className="min-h-11"
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
            className="h-11"
          />
          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            onClick={() => {
              const ok = onVerify(order.id, code);
              toast[ok ? "success" : "error"](ok ? "Pickup code verified" : "Wrong pickup code");
            }}
          >
            <KeyRound /> Verify
          </Button>
        </div>
      )}

      <div className="mt-3 grid gap-2">
        {primaryAction && <ActionButton status={primaryAction} orderId={order.id} move={move} />}
        {secondaryActions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {secondaryActions.map((status) => (
              <ActionButton key={status} status={status} orderId={order.id} move={move} secondary />
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

function ActionButton({
  status,
  orderId,
  move,
  secondary,
}: {
  status: OrderStatus;
  orderId: string;
  move: (to: OrderStatus) => void;
  secondary?: boolean;
}) {
  const { state } = useStore();
  const order = state.orders.find((o) => o.id === orderId);
  if (!order) return null;
  const check = canTransition(order, status);
  return (
    <Button
      type="button"
      size={secondary ? "sm" : "default"}
      variant={status === "completed" ? "success" : secondary ? "outline" : "default"}
      disabled={!check.ok}
      title={check.reason}
      className={secondary ? "" : "min-h-11 w-full"}
      onClick={() => move(status)}
    >
      {status === "completed" && <CheckCircle2 />} {actionLabel(status)}
    </Button>
  );
}

function nextStatuses(status: OrderStatus): OrderStatus[] {
  if (status === "pending") return ["accepted", "rejected"];
  if (status === "accepted") return ["preparing", "cancelled"];
  if (status === "preparing") return ["ready"];
  if (status === "ready") return ["completed", "noshow"];
  return [];
}

function actionLabel(status: OrderStatus) {
  if (status === "accepted") return "Accept";
  if (status === "preparing") return "Start prep";
  if (status === "ready") return "Mark ready";
  if (status === "completed") return "Complete";
  if (status === "rejected") return "Reject";
  if (status === "cancelled") return "Cancel";
  if (status === "noshow") return "No-show";
  return STATUS_LABEL[status];
}

function mobileLaneLabel(status: OrderStatus) {
  if (status === "ready") return "Ready";
  return STATUS_LABEL[status];
}
