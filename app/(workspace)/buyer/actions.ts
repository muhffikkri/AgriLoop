"use server";

import { revalidatePath } from "next/cache";
import { guard } from "@/lib/server/auth.ts";
import {
  closeOrder,
  confirmAgreement,
  createOffer,
  createRequirement,
  recordReceipt,
  setRequirementStatus,
  updateRequirement,
  validateRequirement,
  type RequirementInput,
} from "@/lib/server/market.ts";

/**
 * Every buyer action returns this shape so the forms can render one message plus
 * per-field errors, and never need to guess whether a result was a success.
 */
export type FormState = {
  ok?: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
};

function requirementInputFrom(formData: FormData): RequirementInput {
  return {
    residueType: String(formData.get("residueType") ?? ""),
    quantityMin: String(formData.get("quantityMin") ?? ""),
    quantityMax: String(formData.get("quantityMax") ?? ""),
    unit: String(formData.get("unit") ?? "ton"),
    windowStart: String(formData.get("windowStart") ?? ""),
    windowEnd: String(formData.get("windowEnd") ?? ""),
    areaLabel: String(formData.get("areaLabel") ?? ""),
    radiusKm: String(formData.get("radiusKm") ?? ""),
    minCondition: String(formData.get("minCondition") ?? "buyer_review"),
    substitution: String(formData.get("substitution") ?? "") === "on",
    notes: String(formData.get("notes") ?? ""),
  };
}

export async function createRequirementAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const access = await guard("buyer");
  if (!access.ok) return { error: access.error };

  const input = requirementInputFrom(formData);
  const errors = validateRequirement(input);
  if (Object.keys(errors).length) return { error: "Check the highlighted fields", fieldErrors: errors };

  const publish = String(formData.get("intent") ?? "publish") === "publish";
  const result = createRequirement(access.user, input, publish);
  if (!result.ok) return { error: result.error };

  revalidatePath("/buyer/requirements");
  revalidatePath("/buyer/dashboard");
  revalidatePath("/buyer/matches");
  revalidatePath("/buyer/marketplace");
  return {
    ok: true,
    message: publish
      ? `Requirement ${result.value.id} is open. Lots are now ranked against it with their reasons.`
      : `Saved ${result.value.id} as a draft. Publish it once the details are right.`,
  };
}

export async function updateRequirementAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const access = await guard("buyer");
  if (!access.ok) return { error: access.error };

  const requirementId = String(formData.get("requirementId") ?? "");
  const input = requirementInputFrom(formData);
  const errors = validateRequirement(input);
  if (Object.keys(errors).length) return { error: "Check the highlighted fields", fieldErrors: errors };

  const result = updateRequirement(access.user, requirementId, input);
  if (!result.ok) return { error: result.error, fieldErrors: result.fieldErrors };

  revalidatePath(`/buyer/requirements/${requirementId}`);
  revalidatePath("/buyer/requirements");
  revalidatePath("/buyer/dashboard");
  revalidatePath("/buyer/matches");
  return { ok: true, message: "Changes saved." };
}

export async function publishRequirementAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const access = await guard("buyer");
  if (!access.ok) return { error: access.error };

  const requirementId = String(formData.get("requirementId") ?? "");
  const result = setRequirementStatus(access.user, requirementId, "OPEN");
  if (!result.ok) return { error: result.error };

  revalidatePath("/buyer/requirements");
  revalidatePath(`/buyer/requirements/${requirementId}`);
  revalidatePath("/buyer/dashboard");
  revalidatePath("/buyer/matches");
  return { ok: true, message: `Requirement ${requirementId} is open and can be matched against lots.` };
}

export async function cancelRequirementAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const access = await guard("buyer");
  if (!access.ok) return { error: access.error };

  const requirementId = String(formData.get("requirementId") ?? "");
  const reason = String(formData.get("reason") ?? "");
  const result = setRequirementStatus(access.user, requirementId, "CANCELLED", reason);
  if (!result.ok) return { error: result.error };

  revalidatePath("/buyer/requirements");
  revalidatePath(`/buyer/requirements/${requirementId}`);
  revalidatePath("/buyer/dashboard");
  revalidatePath("/buyer/matches");
  return { ok: true, message: `${requirementId} cancelled, with your reason on the record.` };
}

export async function createOfferAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const access = await guard("buyer");
  if (!access.ok) return { error: access.error };

  const result = createOffer(access.user, {
    requirementId: String(formData.get("requirementId") ?? ""),
    lotId: String(formData.get("lotId") ?? ""),
    quantity: String(formData.get("quantity") ?? ""),
    terms: String(formData.get("terms") ?? ""),
    expiresAt: String(formData.get("expiresAt") ?? ""),
  });
  if (!result.ok) return { error: result.error };

  revalidatePath("/buyer/marketplace");
  revalidatePath("/buyer/orders");
  revalidatePath("/buyer/dashboard");
  revalidatePath("/farmer/offers");
  revalidatePath("/farmer/supply");
  return {
    ok: true,
    message: `Offer ${result.value.id} sent on lot ${result.value.lotId}. It stays pending until the farmer answers.`,
  };
}

export async function confirmAgreementAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const access = await guard("buyer");
  if (!access.ok) return { error: access.error };

  const orderId = String(formData.get("orderId") ?? "");
  const result = confirmAgreement(access.user, orderId);
  if (!result.ok) return { error: result.error };

  revalidatePath("/buyer/orders");
  revalidatePath("/buyer/dashboard");
  revalidatePath("/farmer/collections");
  revalidatePath("/aggregator/available-lots");
  return { ok: true, message: `Agreement confirmed on ${orderId}. A collector can now plan the pickup.` };
}

export async function recordReceiptAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const access = await guard("buyer");
  if (!access.ok) return { error: access.error };

  const orderId = String(formData.get("orderId") ?? "");
  const accepted = String(formData.get("decision") ?? "accept") === "accept";
  const result = recordReceipt(access.user, orderId, {
    receivedQuantity: String(formData.get("receivedQuantity") ?? ""),
    accepted,
    category: accepted ? undefined : String(formData.get("category") ?? "") || undefined,
    reason: String(formData.get("reason") ?? ""),
  });
  if (!result.ok) return { error: result.error };

  revalidatePath("/buyer/orders");
  revalidatePath("/buyer/dashboard");
  revalidatePath("/farmer/supply");
  revalidatePath("/farmer/collections");
  return {
    ok: true,
    message: accepted
      ? `Receipt recorded on ${orderId}. The delivered material is accepted.`
      : `A dispute was opened on ${orderId}. An admin reviews it with the reason you gave.`,
  };
}

export async function closeOrderAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const access = await guard("buyer");
  if (!access.ok) return { error: access.error };

  const orderId = String(formData.get("orderId") ?? "");
  const result = closeOrder(access.user, orderId);
  if (!result.ok) return { error: result.error };

  revalidatePath("/buyer/orders");
  revalidatePath("/buyer/dashboard");
  revalidatePath("/farmer/supply");
  return { ok: true, message: `${orderId} closed. Both sides have finished this transaction.` };
}
