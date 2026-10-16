"use server";

import { revalidatePath } from "next/cache";
import { guard } from "@/lib/server/auth.ts";
import { setUserRole, setUserStatus, updateGridSample, type GridSamplePatch } from "@/lib/server/admin.ts";
import type { Role } from "@/lib/server/db.ts";

/**
 * Every admin action returns this shape so the forms can render one message plus
 * per-field errors, and never need to guess whether a result was a success.
 */
export type FormState = {
  ok?: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
};

const ROLES: Role[] = ["farmer", "buyer", "aggregator", "admin"];

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "");
}

/**
 * Data touched by a role or status change: the admin lists, the dashboard counters and
 * the audit trail. The target account's own workspace resolves its role from the store
 * on every request, so no other role route needs invalidating here.
 */
function revalidateAccountViews(): void {
  revalidatePath("/admin/users");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/audit-log");
  revalidatePath("/app");
}

export async function setUserRoleAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const access = await guard("admin");
  if (!access.ok) return { error: access.error };

  const userId = text(formData, "userId");
  const role = text(formData, "role") as Role;
  if (!ROLES.includes(role)) return { error: "Choose the role this account should hold" };

  const result = setUserRole(access.user, userId, role);
  if (!result.ok) return { error: result.error };

  revalidateAccountViews();
  return {
    ok: true,
    message: `${result.value.name} now holds the ${role} role. The change is on the audit log.`,
  };
}

export async function setUserStatusAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const access = await guard("admin");
  if (!access.ok) return { error: access.error };

  const userId = text(formData, "userId");
  const decision = text(formData, "decision");
  if (decision !== "block" && decision !== "reactivate") {
    return { error: "Choose whether to block or reactivate this account" };
  }

  const status = decision === "block" ? "blocked" : "active";
  const reason = text(formData, "reason");
  const result = setUserStatus(access.user, userId, status, reason);
  if (!result.ok) return { error: result.error };

  revalidateAccountViews();
  return {
    ok: true,
    message:
      status === "blocked"
        ? `${result.value.name} is blocked. The reason is on the audit log.`
        : `${result.value.name} can sign in again.`,
  };
}

export async function updateGridSampleAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const access = await guard("admin");
  if (!access.ok) return { error: access.error };

  const gridId = text(formData, "gridId");
  if (!gridId) return { error: "Grid cell id is missing" };

  // Metadata only. The source rasters under public/satellite/** are never touched, and
  // no tonnage or grade is derived from imagery anywhere in this action.
  const patch: GridSamplePatch = {
    areaLabel: text(formData, "areaLabel"),
    district: text(formData, "district"),
    active: text(formData, "active") === "on",
    note: text(formData, "note"),
  };

  const result = updateGridSample(access.user, gridId, patch);
  if (!result.ok) return { error: result.error };

  // Grid metadata is read by the admin views, the public demo and the lot area pickers.
  revalidatePath("/admin/grid-samples");
  revalidatePath("/admin/areas");
  revalidatePath("/admin/audit-log");
  revalidatePath("/demo");
  revalidatePath("/farmer/supply/new");
  return { ok: true, message: `Metadata for ${result.value.id} saved. The raster is untouched.` };
}
