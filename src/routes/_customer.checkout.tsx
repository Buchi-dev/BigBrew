import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CalendarClock, PackageCheck } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/shared";
import { useStore } from "@/lib/store";
import { canCheckout, cartLineTotal, peso, pickupSlots } from "@/lib/logic";
import { optionGroups } from "@/mocks/data";

export const Route = createFileRoute("/_customer/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout - BigBrew" },
      { name: "description", content: "Confirm your BigBrew pickup order." },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { state, currentUser, actions, activeCountFor } = useStore();
  const navigate = useNavigate();
  const branch = state.branches.find((b) => b.id === state.cart.branchId);
  const slots = useMemo(
    () => (branch ? pickupSlots(branch, state.settings.ignoreHours, state.orders) : []),
    [branch, state.orders, state.settings.ignoreHours],
  );
  const [name, setName] = useState(currentUser.name);
  const [phone, setPhone] = useState(currentUser.phone);
  const [notes, setNotes] = useState("");
  const [pickupType, setPickupType] = useState<"asap" | "scheduled">("asap");
  const [pickupTime, setPickupTime] = useState(
    slots[0]?.toISOString() ?? new Date(Date.now() + 20 * 60000).toISOString(),
  );
  const total = state.cart.items.reduce(
    (sum, item) =>
      sum +
      cartLineTotal(item, state.products, optionGroups, state.branchProducts, state.cart.branchId),
    0,
  );

  if (!branch || state.cart.items.length === 0) {
    return (
      <EmptyState
        icon={<PackageCheck />}
        title="No order to checkout"
        body="Add drinks to your cart before checking out."
        action={
          <Button asChild>
            <Link to="/menu" search={{}}>
              Browse menu
            </Link>
          </Button>
        }
      />
    );
  }

  const check = canCheckout(branch, state.settings.ignoreHours, activeCountFor(branch.id));

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!check.ok) {
      toast.error(check.reason);
      return;
    }
    const order = actions.placeOrder({
      customerName: name.trim(),
      phone: phone.trim(),
      ...(notes.trim() ? { notes: notes.trim() } : {}),
      pickupType,
      pickupTime: pickupType === "asap" ? (slots[0]?.toISOString() ?? pickupTime) : pickupTime,
    });
    toast.success(`Order ${order.number} placed`);
    navigate({ to: "/orders/$orderId", params: { orderId: order.id } });
  };

  return (
    <form onSubmit={submit} className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <section className="space-y-5">
        <div>
          <h1 className="text-2xl font-extrabold">Checkout</h1>
          <p className="text-sm text-muted-foreground">
            Confirm your pickup details for {branch.name}.
          </p>
        </div>

        <div className="grid gap-3 rounded-2xl border bg-card p-4 shadow-card sm:grid-cols-2">
          <label className="text-sm font-semibold">
            Name
            <Input
              className="mt-1 h-11"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <label className="text-sm font-semibold">
            Phone
            <Input
              className="mt-1 h-11"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </label>
          <label className="sm:col-span-2 text-sm font-semibold">
            Notes
            <Textarea
              className="mt-1"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Less sweet, call on arrival, etc."
            />
          </label>
        </div>

        <div className="rounded-2xl border bg-card p-4 shadow-card">
          <h2 className="font-bold">Pickup time</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setPickupType("asap")}
              className={`rounded-xl border p-3 text-left ${pickupType === "asap" ? "border-primary ring-2 ring-primary/20" : ""}`}
            >
              <span className="block font-bold">As soon as possible</span>
              <span className="text-sm text-muted-foreground">
                Usually {branch.prepMinutes}-{branch.prepMinutes + 10} minutes
              </span>
            </button>
            <button
              type="button"
              onClick={() => setPickupType("scheduled")}
              className={`rounded-xl border p-3 text-left ${pickupType === "scheduled" ? "border-primary ring-2 ring-primary/20" : ""}`}
            >
              <span className="block font-bold">Schedule pickup</span>
              <span className="text-sm text-muted-foreground">Pick a 15-minute slot</span>
            </button>
          </div>
          {pickupType === "scheduled" && (
            <label className="mt-3 block text-sm font-semibold">
              Available slot
              <select
                value={pickupTime}
                onChange={(e) => setPickupTime(e.target.value)}
                className="mt-1 h-11 w-full rounded-md border bg-card px-3"
              >
                {slots.map((slot) => (
                  <option key={slot.toISOString()} value={slot.toISOString()}>
                    {slot.toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" })}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      </section>

      <aside className="h-fit rounded-2xl border bg-card p-4 shadow-card">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <CalendarClock className="h-5 w-5 text-primary" /> Summary
        </h2>
        <div className="mt-4 space-y-2 text-sm">
          {state.cart.items.map((item) => {
            const product = state.products.find((p) => p.id === item.productId);
            return (
              <div key={item.id} className="flex justify-between gap-3">
                <span>
                  {item.qty}x {product?.name ?? "Drink"}
                </span>
                <span className="font-semibold">
                  {peso(
                    cartLineTotal(
                      item,
                      state.products,
                      optionGroups,
                      state.branchProducts,
                      state.cart.branchId,
                    ),
                  )}
                </span>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex justify-between border-t pt-4 font-extrabold">
          <span>Total</span>
          <span>{peso(total)}</span>
        </div>
        {!check.ok && (
          <p className="mt-3 rounded-xl bg-danger-soft p-3 text-sm font-medium text-destructive">
            {check.reason}
          </p>
        )}
        <Button
          className="mt-5 w-full"
          size="lg"
          disabled={!check.ok || !name.trim() || !phone.trim()}
        >
          Place order
        </Button>
      </aside>
    </form>
  );
}
