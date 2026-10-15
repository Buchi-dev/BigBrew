import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, ClipboardList } from "lucide-react";
import { AdminResourcePage, DataCard, StatCard } from "@/components/RoleShells";
import { useStore } from "@/lib/store";
import { peso } from "@/lib/logic";
export const Route = createFileRoute("/admin/reports")({ component: AdminReports });
function AdminReports() { const { state } = useStore(); const sales = state.orders.filter((o) => o.status === "completed").reduce((sum, o) => sum + o.total, 0); return <AdminResourcePage roles={["admin", "superadmin"]} title="Company reports" description="Compare sales, order completion, and product performance across branches."><section className="grid gap-3 sm:grid-cols-2"><StatCard icon={BarChart3} label="Completed sales" value={peso(sales)} /><StatCard icon={ClipboardList} label="Completed orders" value={String(state.orders.filter((o) => o.status === "completed").length)} /></section><div className="mt-5"><DataCard title="Branch comparison"><div className="space-y-2">{state.branches.map((branch) => <div key={branch.id} className="flex items-center justify-between rounded-xl border p-3 text-sm"><span className="font-semibold">{branch.name}</span><span>{state.orders.filter((o) => o.branchId === branch.id && o.status === "completed").length} completed order(s)</span></div>)}</div></DataCard></div></AdminResourcePage>; }
