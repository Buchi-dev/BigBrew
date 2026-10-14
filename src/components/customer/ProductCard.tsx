import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import type { Product } from "@/types";
import { ProductImage } from "@/components/shared";
import { peso } from "@/lib/logic";
import { cn } from "@/lib/utils";

export function ProductCard({
  product,
  price,
  soldOut,
  categoryName,
}: {
  product: Product;
  price: number;
  soldOut: boolean;
  categoryName?: string;
}) {
  return (
    <Link
      to="/menu/$productId"
      params={{ productId: product.id }}
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border bg-card shadow-card transition hover:-translate-y-0.5 hover:border-primary focus-visible:outline-2 focus-visible:outline-ring",
        soldOut && "opacity-70",
      )}
    >
      <div className="relative">
        <ProductImage image={product.image} alt={product.name} className="aspect-square" />
        {soldOut && (
          <span className="absolute left-2 top-2 rounded-full bg-ink px-2.5 py-1 text-[11px] font-bold uppercase text-ink-foreground">
            Sold out
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-3">
        {categoryName && (
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {categoryName}
          </span>
        )}
        <h3 className="mt-0.5 line-clamp-2 text-[15px] font-bold leading-tight">{product.name}</h3>
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="text-sm font-semibold">
            <span className="text-xs font-normal text-muted-foreground">from </span>
            {peso(price)}
          </span>
          <span
            className={cn(
              "grid h-9 w-9 place-items-center rounded-full",
              soldOut
                ? "bg-muted text-muted-foreground"
                : "bg-primary text-primary-foreground group-hover:bg-primary-hover",
            )}
            aria-hidden
          >
            <Plus className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}
