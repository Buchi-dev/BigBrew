import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Clock, MapPin, Timer } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useStore } from "@/lib/store";
import { BranchStatus, DemoTag } from "@/components/shared";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_customer/branches")({
  head: () => ({
    meta: [
      { title: "Choose a pickup branch — BigBrew" },
      {
        name: "description",
        content: "Pick one of six BigBrew demo branches for your pickup order.",
      },
      { property: "og:title", content: "Choose a pickup branch — BigBrew" },
      { property: "og:description", content: "Pick your BigBrew pickup branch." },
    ],
  }),
  component: Branches,
});

function Branches() {
  const { state, actions } = useStore();
  const navigate = useNavigate();
  const [pending, setPending] = useState<string | null>(null);

  const choose = (id: string) => {
    if (id === state.selectedBranchId) return navigate({ to: "/menu", search: {} });
    if (state.cart.items.length > 0) return setPending(id);
    confirm(id);
  };
  const confirm = (id: string) => {
    const before = state.cart.items.length;
    actions.selectBranch(id);
    const name = state.branches.find((b) => b.id === id)?.name;
    toast.success(`Pickup branch set to ${name}`);
    if (before)
      toast.message("Cart checked for this branch", {
        description: "Sold-out items were removed and prices updated.",
      });
    setPending(null);
    navigate({ to: "/menu", search: {} });
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-extrabold">Choose your pickup branch</h1>
        <DemoTag>Fictional branches</DemoTag>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {state.branches.map((b) => {
          const selected = b.id === state.selectedBranchId;
          return (
            <article
              key={b.id}
              className={cn(
                "flex flex-col rounded-2xl border bg-card p-4 shadow-card",
                selected && "border-primary ring-2 ring-primary/20",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-lg font-bold">{b.name}</h2>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    {b.address}
                  </p>
                </div>
                <BranchStatus branch={b} ignoreHours={state.settings.ignoreHours} />
              </div>
              <div className="mt-3 flex gap-4 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {b.openTime}–{b.closeTime}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Timer className="h-4 w-4" />~{b.prepMinutes} min
                </span>
              </div>
              <Button
                className="mt-4"
                variant={selected ? "outline" : "default"}
                onClick={() => choose(b.id)}
              >
                {selected ? (
                  <>
                    <Check /> Selected — view menu
                  </>
                ) : (
                  "Select branch"
                )}
              </Button>
            </article>
          );
        })}
      </div>

      <AlertDialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change pickup branch?</AlertDialogTitle>
            <AlertDialogDescription>
              Your cart has items. Prices and availability may differ at the new branch — items sold
              out there will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep current branch</AlertDialogCancel>
            <AlertDialogAction onClick={() => pending && confirm(pending)}>
              Change branch
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
