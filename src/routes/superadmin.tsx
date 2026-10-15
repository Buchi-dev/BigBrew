import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/RoleShells";
export const Route = createFileRoute("/superadmin")({ component: AdminShell });
