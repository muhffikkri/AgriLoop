import { validateLotDraft, type LotDraftInput } from "@/lib/domain/validation.ts";
import { transitionError, LOT_TRANSITIONS } from "@/lib/domain/status.ts";
import type { ConditionLabel } from "@/lib/domain/matching.ts";
import { mutate, nextId, nowIso, readStore, recordAudit, todayIso, type Lot, type Observation, type User } from "./db.ts";
import { sameOrg } from "./access.ts";

export type LotResult = { ok: true; lot: Lot } | { ok: false; error: string; fieldErrors?: Record<string, string> };

export type LotInput = LotDraftInput & {
  crop: string;
  areaId: string;
  photoRef?: string;
};

/**
 * A farmer sees the lots they own plus lots owned by colleagues in the same organisation.
 * Buyers never reach this function; they go through `marketplaceLots`.
 */
export function listLotsForFarmer(actor: User): Lot[] {
  return readStore()
    .lots.filter((lot) => lot.ownerId === actor.id || sameOrg(lot.ownerId, actor))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getLot(lotId: string): Lot | null {
  return readStore().lots.find((lot) => lot.id === lotId) ?? null;
}

export function canFarmerEdit(user: User, lot: Lot): boolean {
  return (user.id === lot.ownerId || sameOrg(lot.ownerId, user)) && (lot.status === "DRAFT" || lot.status === "OPEN");
}

export function getOwnedLot(user: User, lotId: string): Lot | null {
  const lot = getLot(lotId);
  if (!lot) return null;
  const allowed = user.role === "admin" || user.id === lot.ownerId || sameOrg(lot.ownerId, user);
  return allowed ? lot : null;
}

export function createLot(actor: User, input: LotInput): LotResult {
  const fieldErrors = { ...validateLotDraft(input, todayIso()) };
  if (!input.crop.trim()) fieldErrors.crop = "Choose the crop";
  if (!input.areaId.trim()) fieldErrors.areaId = "Choose the area";
  if (Object.keys(fieldErrors).length) {
    return { ok: false, error: "Check the highlighted fields", fieldErrors };
  }

  const lot = mutate((store) => {
    const grid = store.grids.find((candidate) => candidate.id === input.areaId);
    const created: Lot = {
      id: nextId("LOT", store.lots.length),
      ownerId: actor.id,
      ownerName: actor.name,
      farmerOrg: actor.orgName ?? actor.name,
      residueType: input.residueType.trim(),
      crop: input.crop.trim(),
      quantity: Number(input.quantity),
      unit: input.unit,
      readyDate: input.readyDate,
      areaId: input.areaId,
      areaLabel: grid?.areaLabel ?? input.areaLabel,
      status: "DRAFT",
      harvestDate: input.harvestDate || undefined,
      storage: input.storage || undefined,
      moisturePercent: input.moisturePercent ? Number(input.moisturePercent) : undefined,
      notes: input.notes?.trim() || undefined,
      photoRef: input.photoRef?.trim() || undefined,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    store.lots.push(created);
    recordAudit(store, {
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      entityType: "lot",
      entityId: created.id,
      action: "lot.created",
      to: "DRAFT",
      detail: `${created.quantity} ${created.unit} ${created.residueType} in ${created.areaLabel}`,
    });
    return created;
  });

  return { ok: true, lot };
}

export function updateLot(actor: User, lotId: string, input: LotInput): LotResult {
  const lot = getLot(lotId);
  if (!lot) return { ok: false, error: "Lot not found" };
  if (actor.id !== lot.ownerId && !sameOrg(lot.ownerId, actor)) {
    return { ok: false, error: "This lot belongs to another account" };
  }
  if (!canFarmerEdit(actor, lot)) {
    return { ok: false, error: `A lot with status ${lot.status} can no longer be edited` };
  }

  const fieldErrors = { ...validateLotDraft(input, todayIso()) };
  if (!input.crop.trim()) fieldErrors.crop = "Choose the crop";
  if (Object.keys(fieldErrors).length) {
    return { ok: false, error: "Check the highlighted fields", fieldErrors };
  }

  const updated = mutate((store) => {
    const target = store.lots.find((candidate) => candidate.id === lotId)!;
    const grid = store.grids.find((candidate) => candidate.id === input.areaId);
    target.residueType = input.residueType.trim();
    target.crop = input.crop.trim();
    target.quantity = Number(input.quantity);
    target.unit = input.unit;
    target.readyDate = input.readyDate;
    target.areaId = input.areaId;
    target.areaLabel = grid?.areaLabel ?? target.areaLabel;
    target.harvestDate = input.harvestDate || undefined;
    target.storage = input.storage || undefined;
    target.moisturePercent = input.moisturePercent ? Number(input.moisturePercent) : undefined;
    target.notes = input.notes?.trim() || undefined;
    target.updatedAt = nowIso();
    recordAudit(store, {
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      entityType: "lot",
      entityId: target.id,
      action: "lot.updated",
      to: target.status,
      detail: "Listing details changed",
    });
    return target;
  });

  return { ok: true, lot: updated };
}

export function publishLot(actor: User, lotId: string): LotResult {
  const lot = getLot(lotId);
  if (!lot) return { ok: false, error: "Lot not found" };
  if (actor.id !== lot.ownerId && !sameOrg(lot.ownerId, actor)) {
    return { ok: false, error: "This lot belongs to another account" };
  }
  const problem = transitionError(LOT_TRANSITIONS, lot.status, "OPEN");
  if (problem) return { ok: false, error: problem };

  const published = mutate((store) => {
    const target = store.lots.find((candidate) => candidate.id === lotId)!;
    const from = target.status;
    target.status = "OPEN";
    target.updatedAt = nowIso();
    recordAudit(store, {
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      entityType: "lot",
      entityId: target.id,
      action: "lot.published",
      from,
      to: "OPEN",
      detail: `${target.quantity} ${target.unit} ${target.residueType} offered in ${target.areaLabel}`,
    });
    return target;
  });

  return { ok: true, lot: published };
}

export function withdrawLot(actor: User, lotId: string, reason: string): LotResult {
  const lot = getLot(lotId);
  if (!lot) return { ok: false, error: "Lot not found" };
  if (actor.id !== lot.ownerId && !sameOrg(lot.ownerId, actor)) {
    return { ok: false, error: "This lot belongs to another account" };
  }
  if (!reason.trim()) return { ok: false, error: "Add a short reason before withdrawing the lot" };
  const problem = transitionError(LOT_TRANSITIONS, lot.status, "CANCELLED");
  if (problem) {
    return {
      ok: false,
      error: `${problem}. A lot that already has a confirmed order needs a recorded cancellation instead.`,
    };
  }

  const withdrawn = mutate((store) => {
    const target = store.lots.find((candidate) => candidate.id === lotId)!;
    const from = target.status;
    target.status = "CANCELLED";
    target.updatedAt = nowIso();
    recordAudit(store, {
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      entityType: "lot",
      entityId: target.id,
      action: "lot.withdrawn",
      from,
      to: "CANCELLED",
      detail: reason.trim(),
    });
    return target;
  });

  return { ok: true, lot: withdrawn };
}

export type ConditionInput = {
  label: ConditionLabel;
  source: "farmer" | "enumerator";
  note?: string;
  confidence?: number;
};

/**
 * Records a tentative condition label. It is a working note for the buyer,
 * never a quality certificate.
 */
export function recordCondition(actor: User, lotId: string, input: ConditionInput) {
  const lot = getOwnedLot(actor, lotId);
  if (!lot) return { ok: false as const, error: "Lot not found for this account" };

  const updated = mutate((store) => {
    const target = store.lots.find((candidate) => candidate.id === lotId)!;
    const from = target.conditionLabel ?? "unlabelled";
    target.conditionLabel = input.label;
    target.conditionSource = input.source;
    target.conditionNote = input.note?.trim() || target.conditionNote;
    target.updatedAt = nowIso();
    recordAudit(store, {
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      entityType: "lot",
      entityId: target.id,
      action: "lot.condition_recorded",
      from,
      to: input.label,
      detail: input.note?.trim() || "Condition label updated",
    });
    return target;
  });

  return { ok: true as const, lot: updated };
}

export function addObservation(actor: User, lotId: string, input: Omit<Observation, "id" | "lotId" | "observedBy" | "createdAt">) {
  const lot = getOwnedLot(actor, lotId);
  if (!lot) return { ok: false as const, error: "Lot not found for this account" };

  const observation = mutate((store) => {
    const created: Observation = {
      ...input,
      id: nextId("OBS", store.observations.length),
      lotId,
      observedBy: actor.name,
      createdAt: nowIso(),
    };
    store.observations.push(created);
    recordAudit(store, {
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      entityType: "observation",
      entityId: created.id,
      action: "observation.recorded",
      detail: `Field observation on ${lotId}`,
    });
    return created;
  });

  return { ok: true as const, observation };
}

export function observationsFor(lotId: string): Observation[] {
  return readStore().observations.filter((entry) => entry.lotId === lotId);
}

export function lotTimeline(lotId: string) {
  return readStore()
    .audit.filter((event) => event.entityType === "lot" && event.entityId === lotId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Marketplace view: open lots only, coarse area labels, no personal contact details. */
export function marketplaceLots(): Lot[] {
  return readStore()
    .lots.filter((lot) => lot.status === "OPEN")
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function farmerSummary(actor: User) {
  const store = readStore();
  const owned = store.lots.filter((lot) => lot.ownerId === actor.id || sameOrg(lot.ownerId, actor));
  return {
    total: owned.length,
    open: owned.filter((lot) => lot.status === "OPEN").length,
    reserved: owned.filter((lot) => lot.status === "RESERVED" || lot.status === "PICKUP_SCHEDULED").length,
    closed: owned.filter((lot) => lot.status === "CLOSED" || lot.status === "ACCEPTED").length,
    pendingOffers: store.offers.filter(
      (offer) => offer.status === "PENDING" && owned.some((lot) => lot.id === offer.lotId),
    ).length,
  };
}

export function refreshLot(lot: Lot): Lot {
  return getLot(lot.id) ?? lot;
}
