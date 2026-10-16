export const LOT_STATUS = [
  "DRAFT",
  "OPEN",
  "RESERVED",
  "PICKUP_SCHEDULED",
  "PICKED_UP",
  "ACCEPTED",
  "CLOSED",
  "REJECTED",
  "CANCELLED",
  "EXPIRED",
  "DISPUTED",
] as const;
export type LotStatus = (typeof LOT_STATUS)[number];

export const REQUIREMENT_STATUS = [
  "DRAFT",
  "OPEN",
  "PARTIALLY_MATCHED",
  "FULFILLED",
  "CLOSED",
  "CANCELLED",
] as const;
export type RequirementStatus = (typeof REQUIREMENT_STATUS)[number];

export const OFFER_STATUS = [
  "PENDING",
  "ACCEPTED",
  "REJECTED",
  "COUNTERED",
  "EXPIRED",
] as const;
export type OfferStatus = (typeof OFFER_STATUS)[number];

export const PICKUP_STATUS = [
  "PLANNED",
  "CONFIRMED",
  "IN_PROGRESS",
  "COMPLETED",
  "RESCHEDULED",
  "FAILED",
] as const;
export type PickupStatus = (typeof PICKUP_STATUS)[number];

export const LOT_TRANSITIONS: Record<LotStatus, LotStatus[]> = {
  DRAFT: ["OPEN", "CANCELLED"],
  OPEN: ["RESERVED", "EXPIRED", "CANCELLED"],
  RESERVED: ["PICKUP_SCHEDULED", "CANCELLED", "DISPUTED"],
  PICKUP_SCHEDULED: ["PICKED_UP", "RESERVED", "CANCELLED", "DISPUTED"],
  PICKED_UP: ["ACCEPTED", "REJECTED", "DISPUTED"],
  ACCEPTED: ["CLOSED", "DISPUTED"],
  CLOSED: [],
  REJECTED: [],
  CANCELLED: [],
  EXPIRED: [],
  DISPUTED: ["ACCEPTED", "CLOSED", "CANCELLED"],
};

export const REQUIREMENT_TRANSITIONS: Record<RequirementStatus, RequirementStatus[]> = {
  DRAFT: ["OPEN", "CANCELLED"],
  OPEN: ["PARTIALLY_MATCHED", "FULFILLED", "CLOSED", "CANCELLED"],
  PARTIALLY_MATCHED: ["FULFILLED", "OPEN", "CLOSED", "CANCELLED"],
  FULFILLED: ["CLOSED"],
  CLOSED: [],
  CANCELLED: [],
};

export const OFFER_TRANSITIONS: Record<OfferStatus, OfferStatus[]> = {
  PENDING: ["ACCEPTED", "REJECTED", "COUNTERED", "EXPIRED"],
  ACCEPTED: ["REJECTED"],
  REJECTED: [],
  COUNTERED: ["PENDING", "ACCEPTED", "REJECTED", "EXPIRED"],
  EXPIRED: [],
};

export const PICKUP_TRANSITIONS: Record<PickupStatus, PickupStatus[]> = {
  PLANNED: ["CONFIRMED", "RESCHEDULED", "FAILED"],
  CONFIRMED: ["IN_PROGRESS", "RESCHEDULED", "FAILED"],
  IN_PROGRESS: ["COMPLETED", "FAILED"],
  COMPLETED: [],
  RESCHEDULED: ["PLANNED", "CONFIRMED", "FAILED"],
  FAILED: [],
};

export function canTransition<T extends string>(
  table: Record<T, T[]>,
  from: T,
  to: T,
): boolean {
  const allowed = table[from];
  return Array.isArray(allowed) && allowed.includes(to);
}

export function transitionError<T extends string>(
  table: Record<T, T[]>,
  from: T,
  to: T,
): string | null {
  if (from === to) return `${from} is already the current status`;
  return canTransition(table, from, to)
    ? null
    : `Status change ${from} -> ${to} is not allowed`;
}

/** ponytail: one flat table per machine, no event objects; add per-event guards only if rules grow. */
