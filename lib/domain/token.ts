import { createHmac, timingSafeEqual } from "node:crypto";

export type SessionClaims = {
  sub: string;
  role: "farmer" | "buyer" | "aggregator" | "admin";
  name: string;
  org?: string;
};

export type VerifiedClaims = SessionClaims & { exp: number };

const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");

function signature(body: string, secret: string) {
  return createHmac("sha256", secret).update(body).digest("base64url");
}

export function signToken(claims: SessionClaims, secret: string, ttlMs: number): string {
  const body = encode({ ...claims, exp: Date.now() + ttlMs });
  return `${body}.${signature(body, secret)}`;
}

/**
 * Verifies signature and expiry. Returns null for any malformed, forged or stale token,
 * so callers only ever branch on "signed in" or "not signed in".
 */
export function verifyToken(token: string, secret: string): VerifiedClaims | null {
  const parts = token.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  const [body, provided] = parts;

  const expected = signature(body, secret);
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as VerifiedClaims;
    if (!parsed || typeof parsed.sub !== "string" || typeof parsed.exp !== "number") return null;
    if (parsed.exp < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}
