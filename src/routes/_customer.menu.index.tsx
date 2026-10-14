import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search, SearchX, ShoppingBag } from "lucide-react";
import { useStore } from "@/lib/store";
import { useMenu } from "@/lib/hooks";
import { ProductCard } from "@/components/customer/ProductCard";
import { EmptyState } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { cartLineTotal, peso } from "@/lib/logic";
import { optionGroups } from "@/mocks/data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_customer/menu/")({
  validateSearch: (s: Record<string, unknown>): { category?: string } =>
    typeof s["category"] === "string" ? { category: s["category"] } : {},
  head: () => ({
    meta: [
      { title: "Menu — BigBrew" },
      {
        name: "description",
        content:
          "Milk tea, coffee, praf, brosty and fruit tea — browse the BigBrew menu for your branch.",
      },
      { property: "og:title", content: "Menu — BigBrew" },
      { property: "og:description", content: "Browse BigBrew drinks available at your branch." },
    ],
  }),
  component: Menu,
});

function Menu() {
  const { category } = Route.useSearch();
  const navigate = useNavigate({ from: "/menu/" });
  const { state } = useStore();
  const { products, fromPrice, soldOut, catName } = useMenu();
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 350);
    return () => clearTimeout(t);
  }, []);

  const filtered = products.filter(
    (p) =>
      (!category || p.categoryId === category) &&
      p.name.toLowerCase().includes(q.toLowerCase().trim()),
  );
  const count = state.cart.items.reduce((a, b) => a + b.qty, 0);
  const total = state.cart.items.reduce(
    (a, it) =>
      a +
      cartLineTotal(it, state.products, optionGroups, state.branchProducts, state.cart.branchId),
    0,
  );

  return (
    <div>
      <div className="sticky top-[104px] z-20 -mx-4 space-y-3 bg-background/95 px-4 pb-3 pt-1 backdrop-blur sm:top-16">
        <h1 className="text-2xl font-extrabold">Menu</h1>
        <label className="relative block">
          <span className="sr-only">Search drinks</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            type="search"
            placeholder="Search drinks…"
            className="h-12 w-full rounded-full border bg-card pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>
        <div
          className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4"
          role="tablist"
          aria-label="Categories"
        >
          {[{ id: undefined, name: "All" }, ...state.categories].map((c) => (
            <button
              key={c.id ?? "all"}
              role="tab"
              aria-selected={category === c.id}
              onClick={() => navigate({ search: c.id ? { category: c.id } : {} })}
              className={cn(
                "min-h-10 shrink-0 rounded-full border px-4 text-sm font-semibold transition",
                category === c.id
                  ? "border-ink bg-ink text-ink-foreground"
                  : "bg-card hover:border-primary",
              )}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<SearchX />}
          title="No drinks found"
          body="Try another search term or category."
          action={
            <Button
              variant="outline"
              onClick={() => {
                setQ("");
                navigate({ search: {} });
              }}
            >
              Clear filters
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              price={fromPrice(p)}
              soldOut={soldOut(p)}
              categoryName={catName(p.categoryId)}
            />
          ))}
        </div>
      )}

      {count > 0 && (
        <Link
          to="/cart"
          className="fixed inset-x-4 bottom-20 z-30 mx-auto flex max-w-md items-center justify-between rounded-2xl bg-primary px-5 py-3.5 font-semibold text-primary-foreground shadow-pop md:bottom-6"
        >
          <span className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" /> {count} item{count > 1 ? "s" : ""}
          </span>
          <span>View cart · {peso(total)}</span>
        </Link>
      )}
    </div>
  );
}
