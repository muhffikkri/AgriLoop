"use server";

import { revalidatePath } from "next/cache";
import { guard } from "@/lib/server/auth.ts";
import {
  addObservation,
  createLot,
  publishLot,
  recordCondition,
  updateLot,
  withdrawLot,
  type LotInput,
} from "@/lib/server/lots.ts";
import { respondToOffer } from "@/lib/server/market.ts";
import { confirmReadiness } from "@/lib/server/collections.ts";
import type { ConditionLabel } from "@/lib/domain/matching.ts";

/**
 * Every farmer action returns this shape so the forms can render one message plus
 * per-field errors, and never need to guess whether a result was a success.
 */
export type FormState = {
  ok?: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
};

function lotInputFrom(formData: FormData): LotInput {
  return {
    residueType: String(formData.get("residueType") ?? ""),
    crop: String(formData.get("crop") ?? ""),
    quantity: String(formData.get("quantity") ?? ""),
    unit: String(formData.get("unit") ?? "ton"),
    readyDate: String(formData.get("readyDate") ?? ""),
    areaId: String(formData.get("areaId") ?? ""),
    areaLabel: String(formData.get("areaLabel") ?? ""),
    harvestDate: String(formData.get("harvestDate") ?? ""),
    storage: String(formData.get("storage") ?? ""),
    moisturePercent: String(formData.get("moisturePercent") ?? ""),
    notes: String(formData.get("notes") ?? ""),
    photoRef: String(formData.get("photoRef") ?? ""),
  };
}

export async function createLotAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const access = await guard("farmer");
  if (!access.ok) return { error: access.error };

  const result = createLot(access.user, lotInputFrom(formData));
  if (!result.ok) return { error: result.error, fieldErrors: result.fieldErrors };

  revalidatePath("/farmer/supply");
  revalidatePath("/farmer/dashboard");
  return {
    ok: true,
    message: `Saved ${result.lot.id} as a draft. Publish it once the details are right.`,
  };
}

export async function updateLotAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const access = await guard("farmer");
  if (!access.ok) return { error: access.error };

  const lotId = String(formData.get("lotId") ?? "");
  const result = updateLot(access.user, lotId, lotInputFrom(formData));
  if (!result.ok) return { error: result.error, fieldErrors: result.fieldErrors };

  revalidatePath(`/farmer/supply/${lotId}`);
  revalidatePath("/farmer/supply");
  return { ok: true, message: "Changes saved." };
}

export async function publishLotAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const access = await guard("farmer");
  if (!access.ok) return { error: access.error };

  const lotId = String(formData.get("lotId") ?? "");
  const result = publishLot(access.user, lotId);
  if (!result.ok) return { error: result.error };

  revalidatePath("/farmer/supply");
  revalidatePath(`/farmer/supply/${lotId}`);
  revalidatePath("/buyer/marketplace");
  return { ok: true, message: `Lot ${lotId} is open and can be matched by buyers.` };
}

export async function withdrawLotAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const access = await guard("farmer");
  if (!access.ok) return { error: access.error };

  const lotId = String(formData.get("lotId") ?? "");
  const reason = String(formData.get("reason") ?? "");
  const result = withdrawLot(access.user, lotId, reason);
  if (!result.ok) return { error: result.error };

  revalidatePath("/farmer/supply");
  revalidatePath(`/farmer/supply/${lotId}`);
  return { ok: true, message: `${lotId} withdrawn, with your reason on the record.` };
}

export async function recordConditionAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const access = await guard("farmer");
  if (!access.ok) return { error: access.error };

  const lotId = String(formData.get("lotId") ?? "");
  const label = String(formData.get("label") ?? "") as ConditionLabel;
  const source = String(formData.get("source") ?? "farmer") === "enumerator" ? "enumerator" : "farmer";
  const note = String(formData.get("note") ?? "");

  if (label !== "buyer_review" && label !== "needs_inspection" && label !== "off_spec") {
    return { error: "Choose a condition label" };
  }

  const result = recordCondition(access.user, lotId, { label, source, note });
  if (!result.ok) return { error: result.error };

  revalidatePath(`/farmer/supply/${lotId}`);
  return { ok: true, message: "Condition note saved as a working note, not a certificate." };
}

export async function addObservationAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const access = await guard("farmer", "aggregator");
  if (!access.ok) return { error: access.error };

  const lotId = String(formData.get("lotId") ?? "");
  const moisture = String(formData.get("moisturePercent") ?? "");
  const result = addObservation(access.user, lotId, {
    harvestDate: String(formData.get("harvestDate") ?? "") || undefined,
    storage: String(formData.get("storage") ?? "") || undefined,
    rainExposure: String(formData.get("rainExposure") ?? "") || undefined,
    moisturePercent: moisture ? Number(moisture) : undefined,
    measureMethod: String(formData.get("measureMethod") ?? "") || undefined,
    imageQuality: String(formData.get("imageQuality") ?? "") || undefined,
    note: String(formData.get("note") ?? "") || undefined,
  });
  if (!result.ok) return { error: result.error };

  revalidatePath(`/farmer/supply/${lotId}`);
  return { ok: true, message: "Field observation added to the lot record." };
}

export async function respondOfferAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const access = await guard("farmer");
  if (!access.ok) return { error: access.error };

  const offerId = String(formData.get("offerId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  if (decision !== "accept" && decision !== "reject" && decision !== "counter") {
    return { error: "Choose accept, reject or ask for a change" };
  }

  const result = respondToOffer(access.user, offerId, decision, String(formData.get("note") ?? ""));
  if (!result.ok) return { error: result.error };

  revalidatePath("/farmer/offers");
  revalidatePath("/farmer/supply");
  revalidatePath("/farmer/dashboard");
  revalidatePath("/buyer/orders");
  return { ok: true, message: `Offer ${offerId} updated.` };
}

export async function confirmReadinessAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const access = await guard("farmer");
  if (!access.ok) return { error: access.error };

  const result = confirmReadiness(
    access.user,
    String(formData.get("planId") ?? ""),
    String(formData.get("orderId") ?? ""),
  );
  if (!result.ok) return { error: result.error };

  revalidatePath("/farmer/collections");
  revalidatePath("/aggregator/collections");
  return { ok: true, message: "Readiness confirmed for this pickup stop." };
}
