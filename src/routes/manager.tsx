import { createFileRoute } from "@tanstack/react-router";
import { OperationsShell } from "@/components/RoleShells";
export const Route = createFileRoute("/manager")({ component: OperationsShell });
