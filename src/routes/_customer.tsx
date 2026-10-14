import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { ClipboardList, Home, MapPin, ShoppingBag, User, CupSoda, ChevronDown } from "lucide-react";
import { useStore } from "@/lib/store";
import { DemoRoleSwitcher } from "@/components/DemoRoleSwitcher";
import { Logo, PageLoader } from "@/components/shared";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_customer")({
  component: CustomerLayout,
});

const tabs = [
  { to: "/", label: "Home", icon: Home },
  { to: "/menu", label: "Menu", icon: CupSoda },
  { to: "/orders", label: "Orders", icon: ClipboardList },
  { to: "/profile", label: "Profile", icon: User },
] as const;

function CustomerLayout() {
  const { state, ready } = useStore();
  const { pathname } = useLocation();
  const branch = state.branches.find((b) => b.id === state.selectedBranchId);
  const count = state.cart.items.reduce((a, b) => a + b.qty, 0);
  const isActive = (to: string) => (to === "/" ? pathname === "/" : pathname.startsWith(to));
  const hideTabs = pathname.startsWith("/menu/") || pathname === "/checkout";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
          <Logo />
          <nav className="ml-6 hidden items-center gap-1 md:flex" aria-label="Main">
            {tabs.map((t) => (
              <Link
                key={t.to}
                to={t.to}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-semibold transition hover:bg-accent",
                  isActive(t.to) ? "bg-primary-soft text-primary-hover" : "text-muted-foreground",
                )}
              >
                {t.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Link
              to="/branches"
              className="hidden min-h-10 items-center gap-1.5 rounded-full border bg-card px-3 text-sm font-semibold hover:border-primary sm:inline-flex"
            >
              <MapPin className="h-4 w-4 text-primary" /> {branch?.name ?? "Choose branch"}{" "}
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </Link>
            <DemoRoleSwitcher />
            <Link
              to="/cart"
              className="relative grid h-11 w-11 place-items-center rounded-full bg-ink text-ink-foreground hover:bg-ink/90"
              aria-label={`Cart, ${count} items`}
            >
              <ShoppingBag className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[11px] font-bold text-primary-foreground">
                  {count}
                </span>
              )}
            </Link>
          </div>
        </div>
        <Link
          to="/branches"
          className="flex items-center gap-1.5 border-t bg-card px-4 py-2 text-sm font-semibold sm:hidden"
        >
          <MapPin className="h-4 w-4 text-primary" /> Pickup at{" "}
          <span className="text-primary-hover">{branch?.name ?? "choose a branch"}</span>
          <ChevronDown className="ml-auto h-4 w-4 text-muted-foreground" />
        </Link>
      </header>

      <main className={cn("mx-auto max-w-6xl px-4 pt-4", hideTabs ? "pb-10" : "pb-28 md:pb-12")}>
        {ready ? <Outlet /> : <PageLoader />}
      </main>

      {!hideTabs && (
        <nav
          className="fixed inset-x-0 bottom-0 z-30 border-t bg-card/95 pb-safe backdrop-blur md:hidden"
          aria-label="Tabs"
        >
          <div className="grid grid-cols-4">
            {tabs.map((t) => (
              <Link
                key={t.to}
                to={t.to}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold",
                  isActive(t.to) ? "text-primary" : "text-muted-foreground",
                )}
                aria-current={isActive(t.to) ? "page" : undefined}
              >
                <t.icon className="h-5 w-5" />
                {t.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}
