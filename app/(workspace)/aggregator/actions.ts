"use server";

import { revalidatePath } from "next/cache";
import { guard } from "@/lib/server/auth.ts";
import {
  createPlan,
  recordPickup,
  setPlanStatus,
  updatePlan,
  type PlanInput,
} from "@/lib/server/collections.ts";
import type { PickupStatus } from "@/lib/domain/status.ts";

/**
 * Every collector action returns this shape so the forms can render one message plus
 * per-field errors, and never need to guess whether a result was a success.
 */
export type FormState = {
  ok?: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
};

const PLAN_STATUSES: PickupStatus[] = [
  "PLANNED",
  "CONFIRMED",
  "IN_PROGRESS",
  "COMPLETED",
  "RESCHEDULED",
  "FAILED",
];

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "");
}

function orderIdsFrom(formData: FormData): string[] {
  return formData
    .getAll("orderIds")
    .map((value) => String(value))
    .filter(Boolean);
}

/** Paths across roles that show the same plan, stops or lots. */
function revalidatePlan(planId: string): void {
  revalidatePath("/aggregator/collections");
  revalidatePath(`/aggregator/collections/${planId}`);
  revalidatePath("/aggregator/dashboard");
  revalidatePath("/aggregator/routes");
  revalidatePath("/farmer/collections");
  revalidatePath("/farmer/dashboard");
  revalidatePath("/buyer/orders");
}

export async function createPlanAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const access = await guard("aggregator");
  if (!access.ok) return { error: access.error };

  const result = createPlan(access.user, {
    orderIds: orderIdsFrom(formData),
    plannedAt: text(formData, "plannedAt"),
    vehicleLabel: text(formData, "vehicleLabel"),
    vehicleCapacity: text(formData, "vehicleCapacity"),
    capacityUnit: text(formData, "capacityUnit") || "ton",
    note: text(formData, "note"),
  });
  if (!result.ok) return { error: result.error };

  revalidatePath("/aggregator/available-lots");
  revalidatePlan(result.value.id);
  return {
    ok: true,
    message: `Plan ${result.value.id} created with ${result.value.orderIds.length} stop(s) for ${result.value.plannedAt}.`,
  };
}

export async function updatePlanAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const access = await guard("aggregator");
  if (!access.ok) return { error: access.error };

  const planId = text(formData, "planId");
  const patch: Partial<PlanInput> = {
    plannedAt: text(formData, "plannedAt"),
    vehicleLabel: text(formData, "vehicleLabel"),
    vehicleCapacity: text(formData, "vehicleCapacity"),
  };
  const result = updatePlan(access.user, planId, patch);
  if (!result.ok) return { error: result.error };

  revalidatePlan(planId);
  return { ok: true, message: `Plan ${planId} updated.` };
}

export async function updateRouteAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const access = await guard("aggregator");
  if (!access.ok) return { error: access.error };

  const planId = text(formData, "planId");
  const orderIds = orderIdsFrom(formData);
  const result = updatePlan(access.user, planId, { orderIds, note: text(formData, "note") });
  if (!result.ok) return { error: result.error };

  revalidatePlan(planId);
  return { ok: true, message: `Route and note saved on ${planId}.` };
}

export async function setPlanStatusAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const access = await guard("aggregator");
  if (!access.ok) return { error: access.error };

  const planId = text(formData, "planId");
  const next = text(formData, "next") as PickupStatus;
  if (!PLAN_STATUSES.includes(next)) return { error: "Choose the next status for this plan" };

  const result = setPlanStatus(access.user, planId, next, text(formData, "note"));
  if (!result.ok) return { error: result.error };

  revalidatePlan(planId);
  return { ok: true, message: `Plan ${planId} is now ${next.replace(/_/g, " ").toLowerCase()}.` };
}

export async function recordPickupAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const access = await guard("aggregator");
  if (!access.ok) return { error: access.error };

  const planId = text(formData, "planId");
  const orderId = text(formData, "orderId");
  const result = recordPickup(access.user, planId, orderId, {
    actualQuantity: text(formData, "actualQuantity"),
    collectedAt: text(formData, "collectedAt"),
    evidenceRef: text(formData, "evidenceRef"),
    note: text(formData, "note"),
  });
  if (!result.ok) return { error: result.error };

  revalidatePlan(planId);
  revalidatePath("/farmer/supply");
  return { ok: true, message: `Hand-over recorded for ${orderId} on plan ${planId}.` };
}
