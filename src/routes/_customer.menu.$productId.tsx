import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ProductImage } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { branchPriceDelta, peso, unitPrice, validateSelections } from "@/lib/logic";
import { optionGroups } from "@/mocks/data";
import type { Selections } from "@/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_customer/menu/$productId")({
  head: () => ({
    meta: [
      { title: "Customize drink - BigBrew" },
      { name: "description", content: "Customize a BigBrew drink and add it to your cart." },
    ],
  }),
  component: ProductDetail,
});

function ProductDetail() {
  const { productId } = Route.useParams();
  const navigate = useNavigate();
  const { state, actions, groupsFor } = useStore();
  const product = state.products.find((p) => p.id === productId);
  const branch = state.branches.find((b) => b.id === state.selectedBranchId);
  const groups = product ? groupsFor(product) : [];
  const [sizeId, setSizeId] = useState(product?.sizes[0]?.id ?? "");
  const [qty, setQty] = useState(1);
  const [selections, setSelections] = useState<Selections>(() =>
    Object.fromEntries(
      groups.filter((g) => g.required).map((g) => [g.id, [g.choices[0]?.id ?? ""]]),
    ),
  );

  const price = useMemo(() => {
    if (!product) return 0;
    return unitPrice(
      product,
      sizeId,
      selections,
      optionGroups,
      branchPriceDelta(state.branchProducts, state.selectedBranchId, product.id),
    );
  }, [product, selections, sizeId, state.branchProducts, state.selectedBranchId]);

  if (!product) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border bg-card p-6 text-center">
        <h1 className="text-xl font-bold">Drink not found</h1>
        <Button asChild className="mt-4">
          <Link to="/menu" search={{}}>
            Back to menu
          </Link>
        </Button>
      </div>
    );
  }

  const errors = validateSelections(product, sizeId, selections, optionGroups);
  const soldOut =
    !!state.branchProducts[state.selectedBranchId ?? ""]?.[product.id]?.soldOut || !product.enabled;

  const toggleChoice = (
    groupId: string,
    choiceId: string,
    type: "single" | "multi",
    max?: number,
  ) => {
    setSelections((current) => {
      const selected = current[groupId] ?? [];
      if (type === "single") return { ...current, [groupId]: [choiceId] };
      const next = selected.includes(choiceId)
        ? selected.filter((id) => id !== choiceId)
        : [...selected, choiceId].slice(0, max ?? 99);
      return { ...current, [groupId]: next };
    });
  };

  const add = () => {
    if (!branch) {
      toast.error("Choose a pickup branch first");
      navigate({ to: "/branches" });
      return;
    }
    if (errors.length || soldOut) return;
    actions.addToCart({ productId: product.id, sizeId, selections, qty });
    toast.success(`${product.name} added to cart`);
    navigate({ to: "/cart" });
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <ProductImage
        image={product.image}
        alt={product.name}
        eager
        className="aspect-square rounded-3xl border shadow-card"
      />
      <section className="space-y-5">
        <div>
          <Link
            to="/menu"
            search={{ category: product.categoryId }}
            className="text-sm font-semibold text-primary hover:underline"
          >
            Back to menu
          </Link>
          <h1 className="mt-2 text-3xl font-extrabold">{product.name}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{product.description}</p>
          {branch && (
            <p className="mt-2 text-xs font-semibold text-muted-foreground">
              Pickup at {branch.name}
            </p>
          )}
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Size</h2>
          <div className="grid grid-cols-2 gap-2">
            {product.sizes.map((s) => (
              <button
                key={s.id}
                onClick={() => setSizeId(s.id)}
                className={cn(
                  "rounded-xl border bg-card p-3 text-left transition hover:border-primary",
                  sizeId === s.id && "border-primary ring-2 ring-primary/20",
                )}
              >
                <span className="block font-bold">{s.label}</span>
                <span className="text-sm text-muted-foreground">{peso(s.price)}</span>
              </button>
            ))}
          </div>
        </div>

        {groups.map((g) => (
          <div key={g.id} className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
                {g.name}
              </h2>
              <span className="text-xs text-muted-foreground">
                {g.required ? "Required" : `Optional${g.max ? `, up to ${g.max}` : ""}`}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {g.choices.map((c) => {
                const selected = selections[g.id]?.includes(c.id);
                return (
                  <button
                    key={c.id}
                    onClick={() => toggleChoice(g.id, c.id, g.type, g.max)}
                    className={cn(
                      "min-h-10 rounded-full border bg-card px-4 text-sm font-semibold transition hover:border-primary",
                      selected && "border-ink bg-ink text-ink-foreground",
                    )}
                  >
                    {c.label}
                    {c.price ? ` +${peso(c.price)}` : ""}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <div className="sticky bottom-0 -mx-4 border-t bg-background/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:rounded-2xl sm:border sm:bg-card">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Item total</p>
              <p className="text-2xl font-extrabold">{peso(price * qty)}</p>
            </div>
            <div className="flex items-center rounded-full border bg-card">
              <button
                className="grid h-10 w-10 place-items-center"
                onClick={() => setQty((n) => Math.max(1, n - 1))}
                aria-label="Decrease quantity"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-8 text-center font-bold">{qty}</span>
              <button
                className="grid h-10 w-10 place-items-center"
                onClick={() => setQty((n) => Math.min(20, n + 1))}
                aria-label="Increase quantity"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
          {errors.length > 0 && (
            <p className="mb-2 text-sm font-medium text-destructive">{errors[0]}</p>
          )}
          <Button
            className="w-full"
            size="lg"
            onClick={add}
            disabled={soldOut || errors.length > 0}
          >
            <ShoppingBag /> {soldOut ? "Sold out" : "Add to cart"}
          </Button>
        </div>
      </section>
    </div>
  );
}
