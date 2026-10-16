import { test } from "node:test";
import assert from "node:assert/strict";
import {
  LOT_TRANSITIONS,
  OFFER_TRANSITIONS,
  PICKUP_TRANSITIONS,
  REQUIREMENT_TRANSITIONS,
  canTransition,
  transitionError,
} from "../lib/domain/status.ts";

test("canTransition allows OPEN -> RESERVED", () => {
  assert.equal(canTransition(LOT_TRANSITIONS, "OPEN", "RESERVED"), true);
});

test("canTransition rejects DRAFT -> CLOSED", () => {
  assert.equal(canTransition(LOT_TRANSITIONS, "DRAFT", "CLOSED"), false);
});

test("terminal lot statuses allow no transition", () => {
  for (const terminal of ["CLOSED", "CANCELLED", "EXPIRED", "REJECTED"] as const) {
    assert.equal(LOT_TRANSITIONS[terminal].length, 0);
  }
});

test("DISPUTED lot can be resolved", () => {
  assert.equal(canTransition(LOT_TRANSITIONS, "DISPUTED", "ACCEPTED"), true);
});

test("requirement machine rejects OPEN -> PICKED_UP style jumps", () => {
  assert.equal(canTransition(REQUIREMENT_TRANSITIONS, "OPEN", "DRAFT"), false);
});

test("offer cannot skip PENDING", () => {
  assert.equal(canTransition(OFFER_TRANSITIONS, "EXPIRED", "ACCEPTED"), false);
});

test("pickup requires CONFIRMED before IN_PROGRESS", () => {
  assert.equal(canTransition(PICKUP_TRANSITIONS, "PLANNED", "IN_PROGRESS"), false);
  assert.equal(canTransition(PICKUP_TRANSITIONS, "CONFIRMED", "IN_PROGRESS"), true);
});

test("transitionError explains illegal status change", () => {
  assert.equal(transitionError(LOT_TRANSITIONS, "DRAFT", "CLOSED"), "Status change DRAFT -> CLOSED is not allowed");
  assert.equal(transitionError(LOT_TRANSITIONS, "OPEN", "OPEN"), "OPEN is already the current status");
  assert.equal(transitionError(LOT_TRANSITIONS, "OPEN", "RESERVED"), null);
});
