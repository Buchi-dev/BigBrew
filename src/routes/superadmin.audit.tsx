import { createFileRoute } from "@tanstack/react-router";
import { AdminResourcePage, DataCard } from "@/components/RoleShells";
import { useStore } from "@/lib/store";
import { fmtDateTime } from "@/components/shared";
export const Route = createFileRoute("/superadmin/audit")({ component: AuditPage });
function AuditPage() { const { state } = useStore(); return <AdminResourcePage roles={["superadmin"]} title="Audit logs" description="Review immutable platform activity by actor, timestamp, and action."><DataCard title={`${state.audit.length} recent event(s)`}><div className="space-y-2">{state.audit.map((event) => <div key={event.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3 text-sm"><div><p className="font-semibold">{event.action}</p><p className="text-xs text-muted-foreground">{event.actor}</p></div><time className="text-xs text-muted-foreground">{fmtDateTime(event.at)}</time></div>)}</div></DataCard></AdminResourcePage>; }
