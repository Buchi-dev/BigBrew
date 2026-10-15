import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { FlaskConical, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ROLE_LABEL, useStore } from "@/lib/store";
import type { Role } from "@/types";
import { cn } from "@/lib/utils";
import { roleHome } from "@/lib/permissions";

export function DemoRoleSwitcher({ className }: { className?: string }) {
  const { state, currentUser, actions } = useStore();
  const [open, setOpen] = useState(false);
  const [branch, setBranch] = useState(currentUser.branchId ?? "b03");
  const navigate = useNavigate();

  const pick = (userId: string) => {
    const u = state.users.find((x) => x.id === userId)!;
    actions.switchUser(userId);
    setOpen(false);
    toast.success(`Demo: now viewing as ${u.name}`, { description: ROLE_LABEL[u.role] });
    navigate({ to: roleHome(u.role) as never });
  };

  const staff = state.users.find((u) => u.role === "staff" && u.branchId === branch && u.active);
  const mgr = state.users.find((u) => u.role === "manager" && u.branchId === branch);
  const options = [
    { role: "customer" as Role, user: state.users.find((u) => u.id === "u-cust1")! },
    { role: "staff" as Role, user: staff },
    { role: "manager" as Role, user: mgr },
    { role: "admin" as Role, user: state.users.find((u) => u.role === "admin")! },
    { role: "superadmin" as Role, user: state.users.find((u) => u.role === "superadmin")! },
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          className={cn(
            "inline-flex min-h-9 items-center gap-1.5 rounded-full border border-dashed border-caramel bg-warning-soft px-3 text-xs font-semibold text-accent-foreground transition hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring",
            className,
          )}
          aria-label="Open demo role switcher"
        >
          <FlaskConical className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Demo:</span> {ROLE_LABEL[currentUser.role]}
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full max-w-sm overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Demo role switcher</SheetTitle>
          <SheetDescription>
            This is a demo tool, not real sign-in. Switch roles to walk through the ordering flow.
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-4 px-4 pb-6">
          <label className="block text-sm font-medium">
            Branch for staff &amp; manager
            <select
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="mt-1 h-11 w-full rounded-lg border bg-card px-3"
            >
              {state.branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>
          <div className="space-y-2">
            {options.map(
              ({ role, user }) =>
                user && (
                  <button
                    key={role}
                    onClick={() => pick(user.id)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-xl border bg-card p-3 text-left transition hover:border-primary",
                      currentUser.id === user.id && "border-primary ring-2 ring-primary/20",
                    )}
                  >
                    <span>
                      <span className="block font-semibold">{ROLE_LABEL[role]}</span>
                      <span className="block text-xs text-muted-foreground">
                        {user.name}
                        {user.branchId ? ` · ${user.branchId.toUpperCase()}` : ""}
                      </span>
                    </span>
                    {currentUser.id === user.id && (
                      <span className="text-xs font-semibold text-primary">Current</span>
                    )}
                  </button>
                ),
            )}
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              actions.resetDemo();
              setOpen(false);
              toast.success("Demo data reset");
              navigate({ to: "/" });
            }}
          >
            <RotateCcw className="h-4 w-4" /> Reset demo data
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
