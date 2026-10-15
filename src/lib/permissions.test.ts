import { describe, expect, it } from "vitest";
import { canAccess, permissionScope, roleHome } from "./permissions";

describe("role permissions", () => {
  it("routes each role to its own workspace", () => {
    expect(roleHome("customer")).toBe("/");
    expect(roleHome("staff")).toBe("/branch");
    expect(roleHome("manager")).toBe("/manager");
    expect(roleHome("admin")).toBe("/admin");
    expect(roleHome("superadmin")).toBe("/superadmin");
  });

  it("limits staff to assigned branch operations", () => {
    expect(canAccess("staff", "orders", "manage")).toBe(true);
    expect(canAccess("staff", "availability", "manage")).toBe(true);
    expect(canAccess("staff", "branch-settings", "manage")).toBe(false);
    expect(canAccess("staff", "users", "view")).toBe(false);
    expect(permissionScope("staff", "orders")).toBe("assigned-branch");
  });

  it("keeps platform governance exclusive to Super Admin", () => {
    expect(canAccess("admin", "permissions", "view")).toBe(false);
    expect(canAccess("admin", "system-settings", "manage")).toBe(false);
    expect(canAccess("superadmin", "permissions", "manage")).toBe(true);
    expect(canAccess("superadmin", "audit", "view")).toBe(true);
    expect(permissionScope("superadmin", "system-settings")).toBe("platform");
  });
});
