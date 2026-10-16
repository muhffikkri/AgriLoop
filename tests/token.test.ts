import { test } from "node:test";
import assert from "node:assert/strict";
import { signToken, verifyToken } from "../lib/domain/token.ts";

const secret = "test-secret";
const payload = { sub: "usr_1", role: "farmer" as const, name: "Test Farmer" };

test("verifyToken returns the payload for a freshly signed token", () => {
  const token = signToken(payload, secret, 60_000);
  assert.deepEqual(verifyToken(token, secret), { ...payload, exp: verifyToken(token, secret)!.exp });
});

test("verifyToken rejects a tampered payload", () => {
  const token = signToken(payload, secret, 60_000);
  const [body, sig] = token.split(".");
  const forged = Buffer.from(
    JSON.stringify({ sub: "usr_2", role: "admin", exp: Date.now() + 60_000 }),
  ).toString("base64url");
  assert.equal(verifyToken(`${forged}.${sig}`, secret), null);
});

test("verifyToken rejects a token signed with another secret", () => {
  const token = signToken(payload, secret, 60_000);
  assert.equal(verifyToken(token, "other-secret"), null);
});

test("verifyToken rejects an expired token", () => {
  const token = signToken(payload, secret, -1);
  assert.equal(verifyToken(token, secret), null);
});

test("verifyToken rejects garbage input", () => {
  assert.equal(verifyToken("", secret), null);
  assert.equal(verifyToken("nodot", secret), null);
});
