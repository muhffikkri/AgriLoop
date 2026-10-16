import { test } from "node:test";
import assert from "node:assert/strict";
import { matchLot, type LotFacts, type RequirementFacts } from "../lib/domain/matching.ts";

const requirement: RequirementFacts = {
  residueType: "wheat straw",
  quantityMin: 5,
  quantityMax: 20,
  unit: "ton",
  windowStart: "2026-03-25",
  windowEnd: "2026-04-20",
  areaLabel: "Ludhiana North",
  radiusKm: 50,
  minCondition: "buyer_review",
};

const lot: LotFacts = {
  id: "LOT-SIM-104",
  residueType: "wheat straw",
  quantity: 12,
  unit: "ton",
  readyDate: "2026-04-02",
  areaLabel: "Ludhiana North",
  distanceKm: 18,
  conditionLabel: "buyer_review",
  status: "OPEN",
};

test("matchLot accepts a lot that satisfies every core criterion", () => {
  const result = matchLot(lot, requirement);
  assert.equal(result.eligible, true);
  assert.deepEqual(result.blockers, []);
  assert.ok(result.score >= 80, `score was ${result.score}`);
  assert.ok(result.reasons.some((r) => r.includes("wheat straw")));
});

test("matchLot blocks a different residue type", () => {
  const result = matchLot({ ...lot, residueType: "rice straw" }, requirement);
  assert.equal(result.eligible, false);
  assert.ok(result.blockers.some((b) => b.includes("residue type")));
});

test("matchLot blocks quantity below the window", () => {
  const result = matchLot({ ...lot, quantity: 2 }, requirement);
  assert.equal(result.eligible, false);
  assert.ok(result.blockers.some((b) => b.includes("below")));
});

test("matchLot blocks a ready date outside the delivery window", () => {
  const result = matchLot({ ...lot, readyDate: "2026-05-02" }, requirement);
  assert.equal(result.eligible, false);
  assert.ok(result.blockers.some((b) => b.includes("window")));
});

test("matchLot drops the score when distance exceeds the radius", () => {
  const result = matchLot({ ...lot, distanceKm: 120 }, requirement);
  assert.equal(result.eligible, true);
  assert.ok(result.reasons.some((r) => r.includes("outside")));
  assert.ok(result.score < 80);
});

test("matchLot flags a condition that still needs inspection", () => {
  const result = matchLot({ ...lot, conditionLabel: "needs_inspection" }, requirement);
  assert.ok(result.reasons.some((r) => r.includes("inspection")));
});

test("matchLot refuses lots that are not open", () => {
  const result = matchLot({ ...lot, status: "DRAFT" }, requirement);
  assert.equal(result.eligible, false);
  assert.ok(result.blockers.some((b) => b.includes("OPEN")));
});
