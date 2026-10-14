import { useStore } from "./store";
import { branchPriceDelta, isSoldOut } from "./logic";
import type { Product } from "@/types";

/** Menu helpers scoped to the customer's selected branch. */
export function useMenu() {
  const { state } = useStore();
  const branchId = state.selectedBranchId;
  const visible = state.products.filter(
    (p) => p.enabled && state.categories.some((c) => c.id === p.categoryId),
  );
  const fromPrice = (p: Product) =>
    Math.min(...p.sizes.map((s) => s.price)) +
    branchPriceDelta(state.branchProducts, branchId, p.id);
  const soldOut = (p: Product) => isSoldOut(state.branchProducts, branchId, p);
  const catName = (id: string) => state.categories.find((c) => c.id === id)?.name ?? "";
  return { products: visible, fromPrice, soldOut, catName, branchId };
}
