import { matchLot, rankLots, type ConditionLabel, type LotFacts, type RequirementFacts } from "@/lib/domain/matching.ts";
import {
  LOT_TRANSITIONS,
  OFFER_TRANSITIONS,
  REQUIREMENT_TRANSITIONS,
  transitionError,
} from "@/lib/domain/status.ts";
import { mutate, nextId, nowIso, readStore, recordAudit, todayIso, type Lot, type Offer, type Order, type Requirement, type User } from "./db.ts";
import { sameOrg, userById } from "./access.ts";

export type Fail = { ok: false; error: string };
export type Result<T> = { ok: true; value: T } | Fail;

export const DISPUTE_CATEGORIES = [
  "quantity_shortfall",
  "material_below_specification",
  "moisture_disagreement",
  "pickup_delay",
  "documentation_missing",
] as const;
export type DisputeCategory = (typeof DISPUTE_CATEGORIES)[number];

function orgLots(actor: User, store = readStore()): Lot[] {
  return store.lots.filter((lot) => lot.ownerId === actor.id || sameOrg(lot.ownerId, actor));
}

export function toLotFacts(lot: Lot): LotFacts {
  return {
    id: lot.id,
    residueType: lot.residueType,
    quantity: lot.quantity,
    unit: lot.unit,
    readyDate: lot.readyDate,
    areaLabel: lot.areaLabel,
    distanceKm: lot.distanceKm,
    conditionLabel: lot.conditionLabel,
    status: lot.status,
  };
}

export function toRequirementFacts(requirement: Requirement): RequirementFacts {
  return {
    residueType: requirement.residueType,
    quantityMin: requirement.quantityMin,
    quantityMax: requirement.quantityMax,
    unit: requirement.unit,
    windowStart: requirement.windowStart,
    windowEnd: requirement.windowEnd,
    areaLabel: requirement.areaLabel,
    radiusKm: requirement.radiusKm,
    minCondition: requirement.minCondition,
  };
}

/* ---------------------------------------------------------------- requirements */

export function listRequirements(actor: User): Requirement[] {
  const store = readStore();
  return store.requirements
    .filter((requirement) => requirement.ownerId === actor.id || requirement.orgName === actor.orgName)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function requirementById(actor: User, requirementId: string): Requirement | null {
  const requirement = readStore().requirements.find((candidate) => candidate.id === requirementId);
  if (!requirement) return null;
  const owns = requirement.ownerId === actor.id || requirement.orgName === actor.orgName;
  return owns || actor.role === "admin" ? requirement : null;
}

export type RequirementInput = {
  residueType: string;
  quantityMin: string;
  quantityMax: string;
  unit: string;
  windowStart: string;
  windowEnd: string;
  areaLabel: string;
  radiusKm: string;
  minCondition: string;
  substitution: boolean;
  notes?: string;
};

function validateRequirement(input: RequirementInput): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!input.residueType.trim()) errors.residueType = "Choose the residue type";
  if (!input.areaLabel.trim()) errors.areaLabel = "Choose the search area";

  const min = Number(input.quantityMin);
  const max = Number(input.quantityMax);
  if (!Number.isFinite(min) || min <= 0) errors.quantityMin = "Minimum quantity has to be greater than zero";
  if (!Number.isFinite(max) || max <= 0) errors.quantityMax = "Maximum quantity has to be greater than zero";
  if (Number.isFinite(min) && Number.isFinite(max) && max < min) {
    errors.quantityMax = "Maximum cannot be lower than the minimum";
  }

  if (!input.windowStart) errors.windowStart = "Enter the start of the delivery window";
  if (!input.windowEnd) errors.windowEnd = "Enter the end of the delivery window";
  if (input.windowStart && input.windowEnd && input.windowEnd < input.windowStart) {
    errors.windowEnd = "Window end cannot be before the start";
  }

  const radius = Number(input.radiusKm);
  if (!Number.isFinite(radius) || radius <= 0 || radius > 500) {
    errors.radiusKm = "Radius has to be between 1 and 500 km";
  }

  return errors;
}

export function createRequirement(actor: User, input: RequirementInput, publish: boolean): Result<Requirement> {
  const errors = validateRequirement(input);
  if (Object.keys(errors).length) return { ok: false, error: Object.values(errors)[0] };

  const requirement = mutate((store) => {
    const created: Requirement = {
      id: nextId("REQ", store.requirements.length),
      ownerId: actor.id,
      orgName: actor.orgName ?? actor.name,
      residueType: input.residueType.trim(),
      quantityMin: Number(input.quantityMin),
      quantityMax: Number(input.quantityMax),
      unit: input.unit,
      windowStart: input.windowStart,
      windowEnd: input.windowEnd,
      areaLabel: input.areaLabel.trim(),
      radiusKm: Number(input.radiusKm),
      minCondition: input.minCondition as ConditionLabel,
      substitution: input.substitution,
      notes: input.notes?.trim() || undefined,
      status: publish ? "OPEN" : "DRAFT",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    store.requirements.push(created);
    recordAudit(store, {
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      entityType: "requirement",
      entityId: created.id,
      action: publish ? "requirement.published" : "requirement.drafted",
      to: created.status,
      detail: `${created.quantityMin}-${created.quantityMax} ${created.unit} ${created.residueType} within ${created.radiusKm} km of ${created.areaLabel}`,
    });
    return created;
  });

  return { ok: true, value: requirement };
}

export function setRequirementStatus(actor: User, requirementId: string, next: Requirement["status"], reason?: string): Result<Requirement> {
  const requirement = requirementById(actor, requirementId);
  if (!requirement) return { ok: false, error: "Requirement not found for this account" };
  if (actor.id !== requirement.ownerId && requirement.orgName !== actor.orgName) {
    return { ok: false, error: "Only the owning organisation can change this requirement" };
  }
  if (next === "CANCELLED" && !reason?.trim()) {
    return { ok: false, error: "Add a short reason before cancelling" };
  }
  const problem = transitionError(REQUIREMENT_TRANSITIONS, requirement.status, next);
  if (problem) return { ok: false, error: problem };

  const updated = mutate((store) => {
    const target = store.requirements.find((candidate) => candidate.id === requirementId)!;
    const from = target.status;
    target.status = next;
    target.updatedAt = nowIso();
    recordAudit(store, {
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      entityType: "requirement",
      entityId: target.id,
      action: `requirement.${next.toLowerCase()}`,
      from,
      to: next,
      detail: reason?.trim(),
    });
    return target;
  });

  return { ok: true, value: updated };
}

export type MatchRow = {
  lot: Lot;
  eligible: boolean;
  score: number;
  reasons: string[];
  blockers: string[];
};

export function matchesForRequirement(actor: User, requirementId: string): Result<{ requirement: Requirement; rows: MatchRow[] }> {
  const requirement = requirementById(actor, requirementId);
  if (!requirement) return { ok: false, error: "Requirement not found for this account" };

  const candidates = readStore().lots.filter(
    (lot) => lot.status === "OPEN" && lot.residueType.toLowerCase() === requirement.residueType.toLowerCase(),
  );

  const ranked = rankLots(candidates.map(toLotFacts), toRequirementFacts(requirement));
  const rows: MatchRow[] = ranked
    .map((result) => {
      const lot = candidates.find((candidate) => candidate.id === result.lotId)!;
      return { lot, eligible: result.eligible, score: result.score, reasons: result.reasons, blockers: result.blockers };
    })
    .filter((row) => row.eligible || row.blockers.length < 3)
    .slice(0, 12);

  return { ok: true, value: { requirement, rows } };
}

export function openRequirementsFor(actor: User): Requirement[] {
  return readStore().requirements.filter(
    (requirement) => requirement.status === "OPEN" && (requirement.ownerId === actor.id || requirement.orgName === actor.orgName),
  );
}

/* ---------------------------------------------------------------------- offers */

export type OfferInput = {
  requirementId: string;
  lotId: string;
  quantity: string;
  terms?: string;
  expiresAt: string;
};

export function createOffer(actor: User, input: OfferInput): Result<Offer> {
  const requirement = requirementById(actor, input.requirementId);
  if (!requirement) return { ok: false, error: "Pick one of your own requirements" };
  if (requirement.status === "CANCELLED" || requirement.status === "CLOSED") {
    return { ok: false, error: `Requirement ${requirement.id} is ${requirement.status} and cannot take new offers` };
  }

  const store = readStore();
  const lot = store.lots.find((candidate) => candidate.id === input.lotId);
  if (!lot) return { ok: false, error: "Lot not found" };
  if (lot.status !== "OPEN") return { ok: false, error: `Lot ${lot.id} is ${lot.status} and cannot take new offers` };

  const quantity = Number(input.quantity);
  if (!Number.isFinite(quantity) || quantity <= 0) return { ok: false, error: "Enter a quantity greater than zero" };
  if (quantity > lot.quantity) {
    return { ok: false, error: `Offer cannot exceed the ${lot.quantity} ${lot.unit} on the lot` };
  }
  if (!input.expiresAt || input.expiresAt < todayIso()) {
    return { ok: false, error: "Offer needs a validity date that is today or later" };
  }

  const created = mutate((store) => {
    const offer: Offer = {
      id: nextId("OFF", store.offers.length),
      lotId: lot.id,
      requirementId: requirement.id,
      buyerId: actor.id,
      buyerOrg: actor.orgName ?? actor.name,
      quantity,
      unit: lot.unit,
      terms: input.terms?.trim() || undefined,
      expiresAt: input.expiresAt,
      status: "PENDING",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    store.offers.push(offer);
    const lotRow = store.lots.find((candidate) => candidate.id === lot.id)!;
    lotRow.updatedAt = nowIso();
    recordAudit(store, {
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      entityType: "offer",
      entityId: offer.id,
      action: "offer.sent",
      to: "PENDING",
      detail: `${offer.quantity} ${offer.unit} on ${lot.id}, valid until ${offer.expiresAt}`,
    });
    return offer;
  });

  return { ok: true, value: created };
}

export function offersForFarmer(actor: User): Offer[] {
  const owned = orgLots(actor).map((lot) => lot.id);
  return readStore()
    .offers.filter((offer) => owned.includes(offer.lotId))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function offersForBuyer(actor: User): Offer[] {
  return readStore()
    .offers.filter((offer) => offer.buyerId === actor.id || offer.buyerOrg === actor.orgName)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function offerById(id: string): Offer | null {
  return readStore().offers.find((offer) => offer.id === id) ?? null;
}

export function respondToOffer(
  actor: User,
  offerId: string,
  decision: "accept" | "reject" | "counter",
  note: string,
): Result<Offer> {
  const offer = offerById(offerId);
  if (!offer) return { ok: false, error: "Offer not found" };

  const lot = readStore().lots.find((candidate) => candidate.id === offer.lotId);
  if (!lot) return { ok: false, error: "The lot behind this offer disappeared" };
  if (lot.ownerId !== actor.id && !sameOrg(lot.ownerId, actor)) {
    return { ok: false, error: "Only the farmer who owns the lot can answer this offer" };
  }

  const next = decision === "accept" ? "ACCEPTED" : decision === "reject" ? "REJECTED" : "COUNTERED";
  const problem = transitionError(OFFER_TRANSITIONS, offer.status, next);
  if (problem) return { ok: false, error: problem };
  if (decision !== "accept" && !note.trim()) {
    return { ok: false, error: decision === "reject" ? "A rejection needs a reason" : "Say what you want to change" };
  }
  if (decision === "accept") {
    const lotProblem = transitionError(LOT_TRANSITIONS, lot.status, "RESERVED");
    if (lotProblem) return { ok: false, error: `Lot ${lot.id}: ${lotProblem}` };
  }

  const updated = mutate((store) => {
    const target = store.offers.find((candidate) => candidate.id === offerId)!;
    const lotRow = store.lots.find((candidate) => candidate.id === offer.lotId)!;
    const from = target.status;
    target.status = next;
    target.responseNote = note.trim() || "Accepted for pickup planning";
    target.updatedAt = nowIso();
    recordAudit(store, {
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      entityType: "offer",
      entityId: target.id,
      action: `offer.${next.toLowerCase()}`,
      from,
      to: next,
      detail: target.responseNote,
    });

    if (next === "ACCEPTED") {
      const lotFrom = lotRow.status;
      lotRow.status = "RESERVED";
      lotRow.updatedAt = nowIso();
      const order: Order = {
        id: nextId("ORD", store.orders.length),
        lotId: lotRow.id,
        offerId: target.id,
        buyerId: target.buyerId,
        buyerOrg: target.buyerOrg,
        farmerId: lotRow.ownerId,
        farmerOrg: lotRow.farmerOrg,
        agreedQuantity: target.quantity,
        unit: target.unit,
        status: "AWAITING_BUYER",
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      store.orders.push(order);
      recordAudit(store, {
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        entityType: "lot",
        entityId: lotRow.id,
        action: "lot.reserved",
        from: lotFrom,
        to: "RESERVED",
        detail: `Reserved for ${target.buyerOrg} through ${target.id}`,
      });
      recordAudit(store, {
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        entityType: "order",
        entityId: order.id,
        action: "order.created",
        to: "AWAITING_BUYER",
        detail: `Waiting for ${target.buyerOrg} to confirm the agreement`,
      });
    }
    return target;
  });

  return { ok: true, value: updated };
}

/* ---------------------------------------------------------------------- orders */

export function ordersForBuyer(actor: User): Order[] {
  return readStore()
    .orders.filter((order) => order.buyerId === actor.id || order.buyerOrg === actor.orgName)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function ordersForFarmer(actor: User): Order[] {
  return readStore()
    .orders.filter((order) => order.farmerId === actor.id || sameOrg(order.farmerId, actor))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function orderById(actor: User, orderId: string): Order | null {
  const order = readStore().orders.find((candidate) => candidate.id === orderId);
  if (!order) return null;
  const visible =
    actor.role === "admin" ||
    order.buyerId === actor.id ||
    order.buyerOrg === actor.orgName ||
    order.farmerId === actor.id ||
    sameOrg(order.farmerId, actor) ||
    readStore().pickups.some((plan) => plan.orderIds.includes(order.id) && (plan.aggregatorId === actor.id || plan.aggregatorOrg === actor.orgName));
  return visible ? order : null;
}

export function confirmAgreement(actor: User, orderId: string): Result<Order> {
  const order = orderById(actor, orderId);
  if (!order) return { ok: false, error: "Order not found for this account" };
  if (order.buyerId !== actor.id && order.buyerOrg !== actor.orgName) {
    return { ok: false, error: "Only the buying organisation can confirm the agreement" };
  }
  if (order.status !== "AWAITING_BUYER") {
    return { ok: false, error: `Order is ${order.status}, so there is nothing to confirm` };
  }

  const updated = mutate((store) => {
    const target = store.orders.find((candidate) => candidate.id === orderId)!;
    target.status = "ACTIVE";
    target.updatedAt = nowIso();
    recordAudit(store, {
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      entityType: "order",
      entityId: target.id,
      action: "order.confirmed",
      from: "AWAITING_BUYER",
      to: "ACTIVE",
      detail: "Agreement confirmed, pickup can be planned",
    });
    return target;
  });

  return { ok: true, value: updated };
}

export function recordReceipt(
  actor: User,
  orderId: string,
  input: { receivedQuantity: string; accepted: boolean; category?: string; reason?: string },
): Result<Order> {
  const order = orderById(actor, orderId);
  if (!order) return { ok: false, error: "Order not found for this account" };
  if (order.buyerId !== actor.id && order.buyerOrg !== actor.orgName) {
    return { ok: false, error: "Only the buying organisation can record receipt" };
  }
  if (order.status !== "ACTIVE") return { ok: false, error: `Order is ${order.status}, receipt is already recorded` };

  const quantity = Number(input.receivedQuantity);
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return { ok: false, error: "Enter the quantity that actually arrived" };
  }

  const store = readStore();
  const lot = store.lots.find((candidate) => candidate.id === order.lotId);
  if (!lot) return { ok: false, error: "The lot behind this order disappeared" };
  if (lot.status !== "PICKED_UP") {
    return { ok: false, error: `Lot ${lot.id} is still ${lot.status}. Receipt can be recorded after pickup.` };
  }

  if (!input.accepted) {
    if (!input.category) return { ok: false, error: "Pick a dispute category" };
    if (!input.reason?.trim()) return { ok: false, error: "Describe what was wrong with the delivery" };
    const lotProblem = transitionError(LOT_TRANSITIONS, lot.status, "DISPUTED");
    if (lotProblem) return { ok: false, error: lotProblem };
  } else if (!input.reason?.trim()) {
    return { ok: false, error: "Add a short note about the delivered condition" };
  }

  const updated = mutate((store) => {
    const target = store.orders.find((candidate) => candidate.id === orderId)!;
    const lotRow = store.lots.find((candidate) => candidate.id === order.lotId)!;
    const from = target.status;
    target.receivedQuantity = quantity;
    target.updatedAt = nowIso();

    if (input.accepted) {
      target.status = "RECEIVED";
      target.disputeCategory = undefined;
      target.disputeReason = input.reason?.trim();
      lotRow.status = "ACCEPTED";
    } else {
      target.status = "DISPUTED";
      target.disputeCategory = input.category;
      target.disputeReason = input.reason?.trim();
      lotRow.status = "DISPUTED";
    }
    lotRow.updatedAt = nowIso();

    recordAudit(store, {
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      entityType: "order",
      entityId: target.id,
      action: input.accepted ? "order.received" : "order.disputed",
      from,
      to: target.status,
      detail: input.accepted
        ? `${quantity} ${target.unit} accepted. ${input.reason?.trim()}`
        : `${input.category}: ${input.reason?.trim()}`,
    });
    recordAudit(store, {
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      entityType: "lot",
      entityId: lotRow.id,
      action: input.accepted ? "lot.accepted" : "lot.disputed",
      to: lotRow.status,
      detail: input.accepted ? "Buyer accepted the delivered material" : "Buyer opened a dispute",
    });
    return target;
  });

  return { ok: true, value: updated };
}

export function closeOrder(actor: User, orderId: string): Result<Order> {
  const order = orderById(actor, orderId);
  if (!order) return { ok: false, error: "Order not found for this account" };
  const isBuyer = order.buyerId === actor.id || order.buyerOrg === actor.orgName;
  const isFarmer = order.farmerId === actor.id || sameOrg(order.farmerId, actor);
  if (!isBuyer && !isFarmer && actor.role !== "admin") {
    return { ok: false, error: "Only the trading parties can close this order" };
  }
  if (order.status !== "RECEIVED") return { ok: false, error: `Order is ${order.status} and cannot be closed yet` };

  const store = readStore();
  const lot = store.lots.find((candidate) => candidate.id === order.lotId);
  if (lot) {
    const problem = transitionError(LOT_TRANSITIONS, lot.status, "CLOSED");
    if (problem) return { ok: false, error: problem };
  }

  const updated = mutate((store) => {
    const target = store.orders.find((candidate) => candidate.id === orderId)!;
    target.status = "CLOSED";
    target.updatedAt = nowIso();
    const lotRow = store.lots.find((candidate) => candidate.id === order.lotId);
    if (lotRow) {
      lotRow.status = "CLOSED";
      lotRow.updatedAt = nowIso();
      recordAudit(store, {
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        entityType: "lot",
        entityId: lotRow.id,
        action: "lot.closed",
        to: "CLOSED",
        detail: "Order closed after receipt",
      });
    }
    recordAudit(store, {
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      entityType: "order",
      entityId: target.id,
      action: "order.closed",
      from: "RECEIVED",
      to: "CLOSED",
      detail: "Both parties finished the transaction",
    });
    return target;
  });

  return { ok: true, value: updated };
}

export function resolveDispute(actor: User, orderId: string, resolution: "accept" | "cancel", note: string): Result<Order> {
  if (actor.role !== "admin") return { ok: false, error: "Disputes are resolved by an admin account" };
  if (!note.trim()) return { ok: false, error: "Record why the dispute was resolved this way" };

  const order = readStore().orders.find((candidate) => candidate.id === orderId);
  if (!order) return { ok: false, error: "Order not found" };
  if (order.status !== "DISPUTED") return { ok: false, error: `Order is ${order.status}, nothing to resolve` };

  const store = readStore();
  const lot = store.lots.find((candidate) => candidate.id === order.lotId);
  const nextLot = resolution === "accept" ? "ACCEPTED" : "CANCELLED";
  if (lot) {
    const problem = transitionError(LOT_TRANSITIONS, lot.status, nextLot);
    if (problem) return { ok: false, error: problem };
  }

  const updated = mutate((store) => {
    const target = store.orders.find((candidate) => candidate.id === orderId)!;
    const from = target.status;
    target.status = resolution === "accept" ? "RECEIVED" : "CLOSED";
    target.updatedAt = nowIso();
    const lotRow = store.lots.find((candidate) => candidate.id === order.lotId);
    if (lotRow) {
      lotRow.status = nextLot;
      lotRow.updatedAt = nowIso();
    }
    recordAudit(store, {
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      entityType: "order",
      entityId: target.id,
      action: `dispute.${resolution}`,
      from,
      to: target.status,
      detail: note.trim(),
    });
    return target;
  });

  return { ok: true, value: updated };
}

export function buyerSummary(actor: User) {
  const store = readStore();
  const requirements = store.requirements.filter(
    (requirement) => requirement.ownerId === actor.id || requirement.orgName === actor.orgName,
  );
  const orders = store.orders.filter(
    (order) => order.buyerId === actor.id || order.buyerOrg === actor.orgName,
  );
  return {
    openRequirements: requirements.filter((requirement) => requirement.status === "OPEN").length,
    totalRequirements: requirements.length,
    activeOrders: orders.filter((order) => order.status === "ACTIVE" || order.status === "AWAITING_BUYER").length,
    disputes: orders.filter((order) => order.status === "DISPUTED").length,
    pendingOfferResponses: store.offers.filter(
      (offer) => offer.status === "PENDING" && (offer.buyerId === actor.id || offer.buyerOrg === actor.orgName),
    ).length,
  };
}

export function buyerVisibleLot(actor: User, lotId: string): Lot | null {
  const lot = readStore().lots.find((candidate) => candidate.id === lotId);
  if (!lot) return null;
  if (lot.status === "DRAFT" && lot.ownerId !== actor.id && !sameOrg(lot.ownerId, actor)) return null;
  return lot;
}

export function matchPreview(lot: Lot, requirement: Requirement) {
  return matchLot(toLotFacts(lot), toRequirementFacts(requirement));
}

export function offersForLot(lotId: string): Offer[] {
  return readStore().offers.filter((offer) => offer.lotId === lotId);
}

export function buyerNameFor(offer: Offer): string {
  return userById(offer.buyerId)?.orgName ?? offer.buyerOrg;
}
