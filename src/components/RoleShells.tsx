import type { ReactNode } from "react";
import { Link, Outlet, useLocation } from "@tanstack/react-router";
import {
  Activity,
  BarChart3,
  BookOpen,
  Building2,
  ClipboardList,
  Coffee,
  FileClock,
  Gauge,
  Menu,
  Settings2,
  ShieldCheck,
  Users,
} from "lucide-react";
import { DemoRoleSwitcher } from "@/components/DemoRoleSwitcher";
import { Logo } from "@/components/shared";
import { ROLE_LABEL, useStore } from "@/lib/store";
import { canAccess } from "@/lib/permissions";
import type { Resource, Action } from "@/lib/permissions";
import type { Role } from "@/types";
import { cn } from "@/lib/utils";

type NavItem = { to: string; label: string; icon: typeof Gauge; resource?: Resource; action?: Action };

const managerNav: NavItem[] = [
  { to: "/manager", label: "Dashboard", icon: Gauge },
  { to: "/branch/orders", label: "Order board", icon: ClipboardList, resource: "orders", action: "manage" },
  { to: "/manager/availability", label: "Availability", icon: Coffee, resource: "availability", action: "manage" },
  { to: "/manager/settings", label: "Branch settings", icon: Settings2, resource: "branch-settings", action: "manage" },
  { to: "/manager/staff", label: "Staff", icon: Users, resource: "staff" },
  { to: "/manager/reports", label: "Reports", icon: BarChart3, resource: "reports" },
];

const adminNav: NavItem[] = [
  { to: "/admin", label: "Overview", icon: Gauge },
  { to: "/admin/branches", label: "Branches", icon: Building2, resource: "branches" },
  { to: "/admin/orders", label: "Orders", icon: ClipboardList, resource: "orders" },
  { to: "/admin/catalog", label: "Products & categories", icon: Coffee, resource: "catalog" },
  { to: "/admin/users", label: "Users & roles", icon: Users, resource: "users" },
  { to: "/admin/reports", label: "Reports", icon: BarChart3, resource: "reports" },
];

const superNav: NavItem[] = [
  ...adminNav,
  { to: "/superadmin/permissions", label: "Permissions", icon: ShieldCheck, resource: "permissions", action: "manage" },
  { to: "/superadmin/audit", label: "Audit logs", icon: FileClock, resource: "audit" },
  { to: "/superadmin/settings", label: "System settings", icon: Settings2, resource: "system-settings", action: "manage" },
];

export function AccessDenied({ role, title = "Access restricted" }: { role: Role; title?: string }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md rounded-3xl border bg-card p-8 text-center shadow-card">
        <ShieldCheck className="mx-auto h-10 w-10 text-primary" />
        <h1 className="mt-4 text-2xl font-extrabold">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The {ROLE_LABEL[role]} role does not have access to this workspace.
        </p>
        <Link to={role === "customer" ? "/" : role === "staff" ? "/branch" : role === "manager" ? "/manager" : role === "superadmin" ? "/superadmin" : "/admin"} className="mt-5 inline-flex min-h-11 items-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground">
          Return to workspace
        </Link>
      </div>
    </div>
  );
}

export function RoleGuard({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { currentUser } = useStore();
  return roles.includes(currentUser.role) ? <>{children}</> : <AccessDenied role={currentUser.role} />;
}

function AccountSummary() {
  const { currentUser } = useStore();
  return (
    <div className="hidden min-w-0 items-center gap-2 sm:flex">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary-soft text-sm font-extrabold text-primary">
        {currentUser.name.slice(0, 1)}
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs font-bold">{currentUser.name}</p>
        <p className="truncate text-[11px] text-muted-foreground">{ROLE_LABEL[currentUser.role]}</p>
      </div>
    </div>
  );
}

function navFor(role: Role) {
  return role === "manager" ? managerNav : role === "superadmin" ? superNav : adminNav;
}

export function OperationsShell() {
  const { currentUser, state } = useStore();
  const { pathname } = useLocation();
  const branch = state.branches.find((item) => item.id === (currentUser.branchId ?? state.selectedBranchId));
  const items = managerNav.filter((item) => !item.resource || canAccess(currentUser.role, item.resource, item.action));
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-card/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center gap-3 px-3 py-3 sm:px-4">
          <Logo to={currentUser.role === "manager" ? "/manager" : "/branch"} />
          <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-bold text-primary-hover">{ROLE_LABEL[currentUser.role]}</span>
          <div className="ml-auto flex items-center gap-3"><AccountSummary /><DemoRoleSwitcher /></div>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-3 pb-2 sm:px-4" aria-label="Operations">
          {items.map((item) => <NavLink key={item.to} item={item} active={pathname === item.to || pathname.startsWith(`${item.to}/`)} />)}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-3 py-4 sm:px-4 sm:py-5"><Outlet /></main>
    </div>
  );
}

export function AdminShell() {
  const { currentUser } = useStore();
  const { pathname } = useLocation();
  const items = navFor(currentUser.role).filter((item) => !item.resource || canAccess(currentUser.role, item.resource, item.action));
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card lg:hidden">
        <div className="flex min-h-16 items-center gap-3 px-4"><Logo to={currentUser.role === "superadmin" ? "/superadmin" : "/admin"} /><span className="rounded-full bg-ink px-3 py-1 text-xs font-bold text-ink-foreground">{ROLE_LABEL[currentUser.role]}</span><div className="ml-auto"><DemoRoleSwitcher /></div></div>
      </header>
      <div className="mx-auto flex min-h-screen max-w-[1440px]">
        <aside className="hidden w-64 shrink-0 border-r bg-sidebar px-4 py-5 text-sidebar-foreground lg:block">
          <Logo to={currentUser.role === "superadmin" ? "/superadmin" : "/admin"} dark />
          <p className="mt-8 px-3 text-[11px] font-bold uppercase tracking-[0.18em] text-sidebar-foreground/60">Workspace</p>
          <nav className="mt-3 space-y-1" aria-label="Administration">
            {items.map((item) => <NavLink key={item.to} item={item} active={pathname === item.to || pathname.startsWith(`${item.to}/`)} dark />)}
          </nav>
          <div className="mt-8 border-t border-sidebar-border pt-4"><AccountSummary /><div className="mt-3"><DemoRoleSwitcher className="w-full justify-center" /></div></div>
        </aside>
        <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 lg:px-8"><Outlet /></main>
      </div>
    </div>
  );
}

function NavLink({ item, active, dark }: { item: NavItem; active: boolean; dark?: boolean }) {
  const Icon = item.icon;
  return <Link to={item.to} className={cn("flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-3 text-sm font-semibold transition", dark ? "text-sidebar-foreground hover:bg-sidebar-accent" : "text-muted-foreground hover:bg-accent", active && (dark ? "bg-sidebar-primary text-sidebar-primary-foreground" : "bg-primary-soft text-primary-hover"))}><Icon className="h-4 w-4" />{item.label}</Link>;
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-2xl font-extrabold sm:text-3xl">{title}</h1>{description && <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{description}</p>}</div>{actions}</div>;
}

export function StatCard({ label, value, detail, icon: Icon = Activity }: { label: string; value: string; detail?: string; icon?: typeof Activity }) {
  return <div className="rounded-2xl border bg-card p-4 shadow-card"><div className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary"><Icon className="h-5 w-5" /></div><p className="mt-3 text-sm text-muted-foreground">{label}</p><p className="text-2xl font-extrabold">{value}</p>{detail && <p className="mt-1 text-xs text-muted-foreground">{detail}</p>}</div>;
}

export function DataCard({ title, children }: { title: string; children: ReactNode }) {
  return <section className="rounded-2xl border bg-card p-4 shadow-card sm:p-5"><h2 className="font-bold">{title}</h2><div className="mt-4">{children}</div></section>;
}

export function AdminResourcePage({ title, description, roles, children }: { title: string; description: string; roles: Role[]; children: ReactNode }) {
  return <RoleGuard roles={roles}><PageHeader title={title} description={description} />{children}</RoleGuard>;
}
