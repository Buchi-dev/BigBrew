import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/RoleShells";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin - BigBrew" },
      { name: "description", content: "BigBrew demo admin overview." },
    ],
  }),
  component: AdminShell,
});
