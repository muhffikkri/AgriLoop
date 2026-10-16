import { test } from "node:test";
import assert from "node:assert/strict";
import { hashPassword, verifyPassword } from "../lib/domain/password.ts";

test("verifyPassword accepts the correct password", () => {
  const stored = hashPassword("demo1234");
  assert.equal(verifyPassword("demo1234", stored), true);
});

test("verifyPassword rejects the wrong password", () => {
  const stored = hashPassword("demo1234");
  assert.equal(verifyPassword("demo1235", stored), false);
});

test("hashing the same password twice gives different salts", () => {
  assert.notEqual(hashPassword("demo1234"), hashPassword("demo1234"));
});

test("verifyPassword rejects malformed stored values", () => {
  assert.equal(verifyPassword("demo1234", ""), false);
  assert.equal(verifyPassword("demo1234", "plain$demo1234"), false);
  assert.equal(verifyPassword("demo1234", "scrypt$nosalt$nohash"), false);
});
