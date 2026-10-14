import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, ProductImage } from "@/components/shared";
import { useStore } from "@/lib/store";
import { cartLineTotal, peso } from "@/lib/logic";
import { optionGroups } from "@/mocks/data";

export const Route = createFileRoute("/_customer/cart")({
  head: () => ({
    meta: [
      { title: "Cart - BigBrew" },
      { name: "description", content: "Review your BigBrew demo order before checkout." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { state, actions } = useStore();
  const branch = state.branches.find(
    (b) => b.id === state.cart.branchId || b.id === state.selectedBranchId,
  );
  const total = state.cart.items.reduce(
    (sum, item) =>
      sum +
      cartLineTotal(item, state.products, optionGroups, state.branchProducts, state.cart.branchId),
    0,
  );

  if (state.cart.items.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingBag />}
        title="Your cart is empty"
        body="Add drinks from the menu to start a pickup order."
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

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <section>
        <div className="mb-4">
          <h1 className="text-2xl font-extrabold">Cart</h1>
          <p className="text-sm text-muted-foreground">
            Pickup branch: {branch?.name ?? "Choose branch"}
          </p>
        </div>
        <div className="space-y-3">
          {state.cart.items.map((item) => {
            const product = state.products.find((p) => p.id === item.productId);
            if (!product) return null;
            const line = cartLineTotal(
              item,
              state.products,
              optionGroups,
              state.branchProducts,
              state.cart.branchId,
            );
            const opts = optionGroups.flatMap((g) =>
              (item.selections[g.id] ?? [])
                .map((id) => g.choices.find((c) => c.id === id)?.label)
                .filter(Boolean),
            );
            return (
              <article
                key={item.id}
                className="grid grid-cols-[5rem_1fr] gap-3 rounded-2xl border bg-card p-3 shadow-card"
              >
                <ProductImage image={product.image} alt="" className="aspect-square rounded-xl" />
                <div className="min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="font-bold">{product.name}</h2>
                      <p className="text-xs text-muted-foreground">
                        {product.sizes.find((s) => s.id === item.sizeId)?.label}
                        {opts.length ? ` · ${opts.join(", ")}` : ""}
                      </p>
                    </div>
                    <button
                      onClick={() => actions.removeCartItem(item.id)}
                      className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-danger-soft hover:text-destructive"
                      aria-label="Remove item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center rounded-full border">
                      <button
                        className="grid h-9 w-9 place-items-center"
                        onClick={() =>
                          actions.updateCartItem(item.id, { qty: Math.max(1, item.qty - 1) })
                        }
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-8 text-center text-sm font-bold">{item.qty}</span>
                      <button
                        className="grid h-9 w-9 place-items-center"
                        onClick={() =>
                          actions.updateCartItem(item.id, { qty: Math.min(20, item.qty + 1) })
                        }
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="font-bold">{peso(line)}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <aside className="h-fit rounded-2xl border bg-card p-4 shadow-card">
        <h2 className="text-lg font-bold">Order summary</h2>
        <div className="mt-4 flex justify-between text-sm">
          <span>Subtotal</span>
          <span className="font-bold">{peso(total)}</span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Cash payment is collected at the branch when your order is ready.
        </p>
        <Button asChild className="mt-5 w-full" size="lg">
          <Link to="/checkout">Checkout</Link>
        </Button>
        <Button variant="ghost" className="mt-2 w-full" onClick={() => actions.clearCart()}>
          Clear cart
        </Button>
      </aside>
    </div>
  );
}
