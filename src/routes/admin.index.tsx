import { createFileRoute, Link } from "@tanstack/react-router";
import { BarChart3, Building2, ClipboardList, Coffee, Users } from "lucide-react";
import { DataCard, PageHeader, RoleGuard, StatCard } from "@/components/RoleShells";
import { useStore } from "@/lib/store";
import { peso } from "@/lib/logic";

export const Route = createFileRoute("/admin/")({ component: AdminOverview });

function AdminOverview() {
  const { state } = useStore();
  const sales = state.orders.filter((o) => o.status === "completed").reduce((sum, order) => sum + order.total, 0);
  return <RoleGuard roles={["admin", "superadmin"]}><PageHeader title="Admin overview" description="Company-wide visibility for branches, orders, catalog, people, and performance." /><section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><StatCard icon={Building2} label="Branches" value={String(state.branches.length)} /><StatCard icon={Coffee} label="Products" value={String(state.products.length)} /><StatCard icon={ClipboardList} label="Orders" value={String(state.orders.length)} /><StatCard icon={BarChart3} label="Completed sales" value={peso(sales)} /></section><section className="mt-5 grid gap-4 xl:grid-cols-[1fr_22rem]"><DataCard title="Branch performance"><div className="space-y-3">{state.branches.map((branch) => { const orders = state.orders.filter((o) => o.branchId === branch.id); const branchSales = orders.filter((o) => o.status === "completed").reduce((sum, order) => sum + order.total, 0); return <div key={branch.id} className="rounded-xl border p-3"><div className="flex justify-between text-sm font-semibold"><span>{branch.name}</span><span>{peso(branchSales)}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary" style={{ width: `${Math.min(100, orders.length * 8)}%` }} /></div></div>; })}</div></DataCard><DataCard title="Quick access"><div className="space-y-2">{[["/admin/branches", "Branches", Building2], ["/admin/orders", "Orders", ClipboardList], ["/admin/catalog", "Products & categories", Coffee], ["/admin/users", "Users & roles", Users]].map(([to, label, Icon]) => { const I = Icon as typeof Users; return <Link key={String(to)} to={to as never} className="flex items-center gap-2 rounded-xl border p-3 text-sm font-semibold hover:border-primary"><I className="h-4 w-4 text-primary" />{String(label)}</Link>; })}</div></DataCard></section></RoleGuard>;
}
