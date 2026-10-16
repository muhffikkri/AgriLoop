import { test } from "node:test";
import assert from "node:assert/strict";
import { aoiBounds, projectPoint, ringToBounds } from "../lib/domain/grid-extent.ts";

const ring: Array<[number, number]> = [
  [75.84, 30.96],
  [75.92, 30.96],
  [75.92, 30.88],
  [75.84, 30.88],
  [75.84, 30.96],
];

test("ringToBounds derives a bounding box from a GeoJSON ring", () => {
  assert.deepEqual(ringToBounds(ring), { west: 75.84, east: 75.92, south: 30.88, north: 30.96 });
});

test("aoiBounds spans every ring passed in", () => {
  const other: Array<[number, number]> = [
    [76.36, 30.38],
    [76.44, 30.3],
  ];
  assert.deepEqual(aoiBounds([ring, other]), { west: 75.84, east: 76.44, south: 30.3, north: 30.96 });
});

test("projectPoint maps the north-west corner to the origin", () => {
  const bounds = { west: 75.84, east: 75.92, south: 30.88, north: 30.96 };
  assert.deepEqual(projectPoint([75.84, 30.96], bounds, 200, 100), { x: 0, y: 0 });
});

test("projectPoint maps the south-east corner to the far corner", () => {
  const bounds = { west: 75.84, east: 75.92, south: 30.88, north: 30.96 };
  assert.deepEqual(projectPoint([75.92, 30.88], bounds, 200, 100), { x: 200, y: 100 });
});

test("projectPoint degrades to the origin for a zero-width extent", () => {
  const bounds = { west: 75.84, east: 75.84, south: 30.88, north: 30.88 };
  assert.deepEqual(projectPoint([75.84, 30.88], bounds, 200, 100), { x: 0, y: 0 });
});
