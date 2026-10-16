import { test } from "node:test";
import assert from "node:assert/strict";
import { validateLotDraft, validateQuantity } from "../lib/domain/validation.ts";

const today = "2026-03-10";

const base = {
  residueType: "wheat straw",
  quantity: "12",
  unit: "ton",
  readyDate: "2026-04-02",
  areaLabel: "Ludhiana North",
  harvestDate: "2026-03-28",
  moisturePercent: "14",
  notes: "",
};

test("validateLotDraft accepts a complete draft", () => {
  assert.deepEqual(validateLotDraft(base, today), {});
});

test("validateQuantity rejects zero, negative and text", () => {
  assert.ok(validateQuantity("0"));
  assert.ok(validateQuantity("-4"));
  assert.ok(validateQuantity("twelve"));
  assert.deepEqual(validateQuantity("0.5"), {});
});

test("validateLotDraft requires residue type and area", () => {
  const errors = validateLotDraft({ ...base, residueType: "", areaLabel: "   " }, today);
  assert.ok(errors.residueType);
  assert.ok(errors.areaLabel);
});

test("validateLotDraft blocks a ready date in the past", () => {
  assert.ok(validateLotDraft({ ...base, readyDate: "2026-03-09" }, today).readyDate);
});

test("validateLotDraft blocks harvest date after ready date", () => {
  assert.ok(validateLotDraft({ ...base, readyDate: "2026-03-20", harvestDate: "2026-03-25" }, today).harvestDate);
});

test("validateLotDraft blocks moisture outside 0-100", () => {
  assert.ok(validateLotDraft({ ...base, moisturePercent: "140" }, today).moisturePercent);
});

test("validateLotDraft allows an empty moisture value", () => {
  assert.deepEqual(validateLotDraft({ ...base, moisturePercent: "" }, today), {});
});
