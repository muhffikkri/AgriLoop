import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { hashPassword, verifyPassword } from "@/lib/domain/password.ts";
import { signToken, verifyToken, type SessionClaims } from "@/lib/domain/token.ts";
import { mutate, nowIso, readStore, recordAudit, type Role, type User } from "./db.ts";

const COOKIE_NAME = "agriloop_session";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

/**
 * Session secret comes from the environment in any real deployment.
 * The fallback keeps local demo runs working and is deliberately obvious in logs.
 */
function sessionSecret(): string {
  const fromEnv = process.env.AGRILOOP_SESSION_SECRET;
  if (fromEnv) return fromEnv;
  return "local-demo-secret-not-for-production";
}

export function homeFor(role: Role): string {
  switch (role) {
    case "farmer":
      return "/farmer/dashboard";
    case "buyer":
      return "/buyer/dashboard";
    case "aggregator":
      return "/aggregator/dashboard";
    default:
      return "/admin/dashboard";
  }
}

export async function getSession(): Promise<SessionClaims | null> {
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  return verifyToken(raw, sessionSecret());
}

export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession();
  if (!session) return null;
  const user = readStore().users.find((candidate) => candidate.id === session.sub);
  if (!user || user.status !== "active") return null;
  return user;
}

export async function startSession(user: User): Promise<void> {
  const store = await cookies();
  store.set(
    COOKIE_NAME,
    signToken(
      { sub: user.id, role: user.role, name: user.name, org: user.orgName },
      sessionSecret(),
      SESSION_TTL_MS,
    ),
    {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_TTL_MS / 1000,
      secure: process.env.NODE_ENV === "production",
    },
  );
}

export async function endSession(): Promise<void> {
  (await cookies()).delete(COOKIE_NAME);
}

export function findUserByCredentials(email: string, password: string): User | null {
  const normalised = email.trim().toLowerCase();
  const user = readStore().users.find((candidate) => candidate.email.toLowerCase() === normalised);
  if (!user) return null;
  if (user.status !== "active") return null;
  if (!verifyPassword(password, user.passwordHash)) return null;
  return user;
}

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
  role: "farmer" | "buyer" | "aggregator";
  orgName?: string;
}): Promise<{ ok: true; user: User } | { ok: false; error: string }> {
  const email = input.email.trim().toLowerCase();
  if (!input.name.trim()) return { ok: false, error: "Enter a name" };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "Enter a valid email address" };
  if (input.password.length < 8) return { ok: false, error: "Password needs at least 8 characters" };

  const alreadyUsed = readStore().users.some((candidate) => candidate.email.toLowerCase() === email);
  if (alreadyUsed) return { ok: false, error: "That email is already registered" };

  const { hashPassword } = await import("@/lib/domain/password.ts");
  const user = mutate((store) => {
    const created: User = {
      id: `USR-${String(store.users.length + 1).padStart(4, "0")}`,
      role: input.role,
      name: input.name.trim(),
      email,
      passwordHash: hashPassword(input.password),
      orgName: input.orgName?.trim() || undefined,
      status: "active",
      createdAt: nowIso(),
    };
    store.users.push(created);
    recordAudit(store, {
      actorId: created.id,
      actorName: created.name,
      actorRole: created.role,
      entityType: "user",
      entityId: created.id,
      action: "user.registered",
      to: "active",
      detail: `Public signup as ${created.role}`,
    });
    return created;
  });

  return { ok: true, user };
}

/** Page-level guard: anonymous visitors land on login, wrong roles land on the denied page. */
export async function requirePageUser(...roles: Role[]): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (roles.length && !roles.includes(user.role)) redirect("/denied");
  return user;
}

export type Guard = { ok: true; user: User } | { ok: false; error: string };

/**
 * Mutation guard for Server Actions. Returns a result instead of redirecting so the
 * caller can render the failure next to the form.
 */
export async function guard(...roles: Role[]): Promise<Guard> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Your session ended. Sign in again." };
  if (roles.length && !roles.includes(user.role)) {
    return { ok: false, error: `This action is limited to ${roles.join(", ")} accounts.` };
  }
  return { ok: true, user };
}
