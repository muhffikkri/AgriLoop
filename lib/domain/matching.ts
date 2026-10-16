export type LotFacts = {
  id: string;
  residueType: string;
  quantity: number;
  unit: string;
  readyDate: string;
  areaLabel: string;
  distanceKm?: number;
  conditionLabel?: ConditionLabel;
  status: string;
};

export type RequirementFacts = {
  residueType: string;
  quantityMin: number;
  quantityMax: number;
  unit: string;
  windowStart: string;
  windowEnd: string;
  areaLabel: string;
  radiusKm: number;
  minCondition?: ConditionLabel;
};

/** Ordinal labels agreed with a pilot partner. They are a scheme example, not an industry grade. */
export type ConditionLabel = "buyer_review" | "needs_inspection" | "off_spec";

export type MatchResult = {
  eligible: boolean;
  score: number;
  /** Facts that support the recommendation, phrased for a buyer to read. */
  reasons: string[];
  /** Facts that stop the lot from being offered at all. */
  blockers: string[];
};

const CONDITION_RANK: Record<ConditionLabel, number> = {
  buyer_review: 2,
  needs_inspection: 1,
  off_spec: 0,
};

const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/**
 * Scores one lot against one buyer requirement.
 * Pure on purpose: the buyer page renders the reasons verbatim, so ranking stays explainable.
 */
export function matchLot(lot: LotFacts, requirement: RequirementFacts): MatchResult {
  const reasons: string[] = [];
  const blockers: string[] = [];
  let score = 100;

  if (lot.status !== "OPEN") {
    blockers.push(`Lot status ${lot.status} is not OPEN, so it cannot be offered`);
  }

  if (!same(lot.residueType, requirement.residueType)) {
    blockers.push(`residue type ${lot.residueType} does not match ${requirement.residueType}`);
  } else {
    reasons.push(`Residue type matches ${requirement.residueType}`);
  }

  if (!same(lot.unit, requirement.unit)) {
    blockers.push(`Unit ${lot.unit} cannot be compared with requirement unit ${requirement.unit}`);
  } else if (lot.quantity < requirement.quantityMin) {
    blockers.push(`${lot.quantity} ${lot.unit} is below the ${requirement.quantityMin} ${requirement.unit} minimum`);
  } else if (lot.quantity > requirement.quantityMax) {
    blockers.push(`${lot.quantity} ${lot.unit} is above the ${requirement.quantityMax} ${requirement.unit} maximum`);
  } else {
    reasons.push(`Quantity ${lot.quantity} ${lot.unit} sits inside the ${requirement.quantityMin}-${requirement.quantityMax} ${requirement.unit} window`);
  }

  if (lot.readyDate < requirement.windowStart || lot.readyDate > requirement.windowEnd) {
    blockers.push(`Ready date ${lot.readyDate} falls outside the delivery window ${requirement.windowStart} to ${requirement.windowEnd}`);
  } else {
    reasons.push(`Ready date ${lot.readyDate} falls inside the delivery window`);
  }

  if (typeof lot.distanceKm === "number") {
    if (lot.distanceKm > requirement.radiusKm) {
      score -= 25;
      reasons.push(`Pickup distance ${lot.distanceKm} km is outside the ${requirement.radiusKm} km radius`);
    } else {
      reasons.push(`Pickup distance ${lot.distanceKm} km is inside the ${requirement.radiusKm} km radius`);
    }
  }

  const condition = lot.conditionLabel ?? "needs_inspection";
  const required = CONDITION_RANK[requirement.minCondition ?? "buyer_review"];
  if (condition === "off_spec") {
    blockers.push("Condition label says the material is off the buyer specification");
  } else if (CONDITION_RANK[condition] < required) {
    score -= 10;
    reasons.push(`Condition is ${condition.replace("_", " ")}, so the buyer still has to inspect it`);
  } else {
    reasons.push("Condition label is ready for buyer review");
  }

  const eligible = blockers.length === 0;
  return { eligible, score: eligible ? score : 0, reasons, blockers };
}

export function rankLots(lots: LotFacts[], requirement: RequirementFacts): Array<MatchResult & { lotId: string }> {
  return lots
    .map((lot) => ({ lotId: lot.id, ...matchLot(lot, requirement) }))
    .sort((a, b) => Number(b.eligible) - Number(a.eligible) || b.score - a.score);
}
