import type { Role } from "@/types";

export type Resource =
  | "orders"
  | "availability"
  | "branch-settings"
  | "staff"
  | "reports"
  | "branches"
  | "catalog"
  | "users"
  | "permissions"
  | "audit"
  | "system-settings";

export type Action = "view" | "manage";
export type Scope = "own" | "assigned-branch" | "all-branches" | "platform";

const matrix: Record<Role, Partial<Record<Resource, { action: Action; scope: Scope }>>> = {
  customer: { orders: { action: "view", scope: "own" } },
  staff: {
    orders: { action: "manage", scope: "assigned-branch" },
    availability: { action: "manage", scope: "assigned-branch" },
  },
  manager: {
    orders: { action: "manage", scope: "assigned-branch" },
    availability: { action: "manage", scope: "assigned-branch" },
    "branch-settings": { action: "manage", scope: "assigned-branch" },
    staff: { action: "view", scope: "assigned-branch" },
    reports: { action: "view", scope: "assigned-branch" },
  },
  admin: {
    orders: { action: "manage", scope: "all-branches" },
    branches: { action: "manage", scope: "all-branches" },
    catalog: { action: "manage", scope: "all-branches" },
    users: { action: "manage", scope: "all-branches" },
    reports: { action: "view", scope: "all-branches" },
    audit: { action: "view", scope: "all-branches" },
  },
  superadmin: {
    orders: { action: "manage", scope: "platform" },
    branches: { action: "manage", scope: "platform" },
    catalog: { action: "manage", scope: "platform" },
    users: { action: "manage", scope: "platform" },
    reports: { action: "view", scope: "platform" },
    permissions: { action: "manage", scope: "platform" },
    audit: { action: "view", scope: "platform" },
    "system-settings": { action: "manage", scope: "platform" },
  },
};

export function canAccess(role: Role, resource: Resource, action: Action = "view") {
  const grant = matrix[role][resource];
  return !!grant && (action === "view" || grant.action === "manage");
}

export function permissionScope(role: Role, resource: Resource): Scope | null {
  return matrix[role][resource]?.scope ?? null;
}

export function roleHome(role: Role) {
  if (role === "customer") return "/";
  if (role === "staff") return "/branch";
  if (role === "manager") return "/manager";
  if (role === "superadmin") return "/superadmin";
  return "/admin";
}
