import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { signToken } from "../lib/domain/token.ts";

/**
 * Two layers of authorization evidence.
 *
 * 1. Static invariants always run: every workspace layout guards its role, and every
 *    exported Server Action calls `guard(...)` before it touches the store.
 * 2. The live page matrix runs only when AGRILOOP_BASE_URL points at a built server,
 *    because it needs real HTTP responses and redirect headers.
 */

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const USERS = {
  "USR-0001": { role: "farmer", name: "Harpreet Kaur" },
  "USR-0002": { role: "buyer", name: "Ravi Menon" },
  "USR-0003": { role: "aggregator", name: "Simran Gill" },
  "USR-0004": { role: "admin", name: "Program Admin" },
  "USR-0005": { role: "farmer", name: "Gurpreet Singh" },
  "USR-0006": { role: "buyer", name: "Anita Sharma" },
} as const;

type UserId = keyof typeof USERS;
type Role = "farmer" | "buyer" | "aggregator" | "admin";

const WORKSPACES: Record<Role, { userId: UserId; layout: string }> = {
  farmer: { userId: "USR-0001", layout: "app/(workspace)/farmer/layout.tsx" },
  buyer: { userId: "USR-0002", layout: "app/(workspace)/buyer/layout.tsx" },
  aggregator: { userId: "USR-0003", layout: "app/(workspace)/aggregator/layout.tsx" },
  admin: { userId: "USR-0004", layout: "app/(workspace)/admin/layout.tsx" },
};
const ROLES = Object.keys(WORKSPACES) as Role[];

const ACTION_FILES: Record<Role, string> = {
  farmer: "app/(workspace)/farmer/actions.ts",
  buyer: "app/(workspace)/buyer/actions.ts",
  aggregator: "app/(workspace)/aggregator/actions.ts",
  admin: "app/(workspace)/admin/actions.ts",
};

const ROLE_PAGES: Record<Role, string[]> = {
  farmer: [
    "/farmer/dashboard",
    "/farmer/supply",
    "/farmer/supply/new",
    "/farmer/offers",
    "/farmer/collections",
    "/farmer/profile",
  ],
  buyer: [
    "/buyer/dashboard",
    "/buyer/requirements",
    "/buyer/marketplace",
    "/buyer/matches",
    "/buyer/orders",
    "/buyer/profile",
  ],
  aggregator: [
    "/aggregator/dashboard",
    "/aggregator/available-lots",
    "/aggregator/collections",
    "/aggregator/routes",
    "/aggregator/profile",
  ],
  admin: [
    "/admin/dashboard",
    "/admin/users",
    "/admin/areas",
    "/admin/grid-samples",
    "/admin/transactions",
    "/admin/data-quality",
    "/admin/audit-log",
  ],
};

const PUBLIC_PAGES = ["/", "/about", "/demo"];

test("every workspace layout guards its own role on the server", () => {
  for (const role of ROLES) {
    const source = readFileSync(join(ROOT, WORKSPACES[role].layout), "utf8");
    assert.match(
      source,
      new RegExp(`requirePageUser\\("${role}"\\)`),
      `${role} layout must call requirePageUser("${role}")`,
    );
  }
});

test("every exported Server Action calls guard before it runs", () => {
  for (const role of ROLES) {
    const source = readFileSync(join(ROOT, ACTION_FILES[role]), "utf8");
    const blocks = source.split(/export async function\s+/).slice(1);
    const actions = blocks.filter((block) => /^\w+Action\(/.test(block));
    assert.ok(actions.length > 0, `${ACTION_FILES[role]} should export at least one action`);
    for (const block of actions) {
      const name = block.slice(0, block.indexOf("("));
      assert.match(block, /\bguard\(/, `${role} action ${name} must call guard(...)`);
    }
  }
});

test("the signup action refuses to create admin accounts", () => {
  const source = readFileSync(join(ROOT, "app/(auth)/actions.ts"), "utf8");
  assert.match(source, /role !== "farmer" && role !== "buyer" && role !== "aggregator"/);
  assert.doesNotMatch(source, /role !== "admin"/);
});

test("server-layer mutations scope records to the owner or the organisation", () => {
  for (const file of ["lib/server/lots.ts", "lib/server/market.ts", "lib/server/collections.ts"]) {
    const source = readFileSync(join(ROOT, file), "utf8");
    assert.match(source, /sameOrg\(/, `${file} must scope by organisation`);
    assert.match(source, /actor\.id !==|\.ownerId ===|\.farmerId !==|\.buyerId ===/, `${file} must scope by owner`);
  }
});

const BASE = process.env.AGRILOOP_BASE_URL?.replace(/\/$/, "");
const SECRET = process.env.AGRILOOP_SESSION_SECRET ?? "local-demo-secret-not-for-production";

function sessionCookie(userId: UserId): string {
  const user = USERS[userId];
  const token = signToken({ sub: userId, role: user.role, name: user.name }, SECRET, 60 * 60 * 1000);
  return `agriloop_session=${token}`;
}

async function request(path: string, userId?: UserId): Promise<Response> {
  return fetch(`${BASE}${path}`, {
    redirect: "manual",
    headers: userId ? { cookie: sessionCookie(userId) } : {},
  });
}

async function body(path: string, userId?: UserId): Promise<string> {
  return (await request(path, userId)).text();
}

function locationOf(response: Response): string {
  return response.headers.get("location") ?? "";
}

test(
  "public pages open without a session",
  { skip: BASE ? false : "set AGRILOOP_BASE_URL to run the live matrix" },
  async () => {
    for (const path of PUBLIC_PAGES) {
      const response = await request(path);
      assert.equal(response.status, 200, `${path} should be public`);
      assert.equal(response.headers.get("set-cookie"), null, `${path} must not start a session`);
    }
  },
);

test(
  "anonymous visitors are sent to login from every workspace page",
  { skip: BASE ? false : "set AGRILOOP_BASE_URL to run the live matrix" },
  async () => {
    for (const role of ROLES) {
      for (const path of ROLE_PAGES[role]) {
        const response = await request(path);
        assert.equal(response.status, 307, `${path} should redirect anonymous visitors`);
        assert.match(locationOf(response), /\/login\b/, `${path} should redirect to /login`);
      }
    }
  },
);

test(
  "each role reaches its own pages and is denied the others",
  { skip: BASE ? false : "set AGRILOOP_BASE_URL to run the live matrix" },
  async () => {
    for (const role of ROLES) {
      for (const other of ROLES) {
        for (const path of ROLE_PAGES[other]) {
          const response = await request(path, WORKSPACES[role].userId);
          if (role === other) {
            assert.equal(response.status, 200, `${role} should reach ${path}`);
          } else {
            assert.equal(response.status, 307, `${role} must not open ${path}`);
            assert.match(locationOf(response), /\/denied\b/, `${role} opening ${path} should land on /denied`);
          }
        }
      }
    }
  },
);

test(
  "/app redirects a signed-in user to the dashboard for their role",
  { skip: BASE ? false : "set AGRILOOP_BASE_URL to run the live matrix" },
  async () => {
    const home: Record<Role, string> = {
      farmer: "/farmer/dashboard",
      buyer: "/buyer/dashboard",
      aggregator: "/aggregator/dashboard",
      admin: "/admin/dashboard",
    };
    for (const role of ROLES) {
      const response = await request("/app", WORKSPACES[role].userId);
      assert.equal(response.status, 307, `/app should redirect for ${role}`);
      assert.equal(locationOf(response), home[role]);
    }
  },
);

test(
  "organisations cannot see each other's lots, requirements or orders",
  { skip: BASE ? false : "set AGRILOOP_BASE_URL to run the live matrix" },
  async () => {
    const farmerOne = await body("/farmer/supply", "USR-0001");
    assert.match(farmerOne, /LOT-0001/, "the owner should see their own lots");
    assert.doesNotMatch(farmerOne, /LOT-0004/, "a farmer must not see another grower's lot");

    const farmerFive = await body("/farmer/supply", "USR-0005");
    assert.match(farmerFive, /LOT-0004/, "the second grower should see their own lot");

    const buyerTwo = await body("/buyer/requirements", "USR-0002");
    assert.match(buyerTwo, /REQ-0001/);
    assert.doesNotMatch(buyerTwo, /REQ-0002/, "a buyer must not see another organisation's requirement");

    const buyerSix = await body("/buyer/requirements", "USR-0006");
    assert.match(buyerSix, /REQ-0002/);

    const buyerOrders = await body("/buyer/orders", "USR-0002");
    assert.doesNotMatch(buyerOrders, /ORD-0001/, "a buyer must not see another organisation's order");
  },
);

test(
  "a lot detail page does not leak a lot owned by another grower",
  { skip: BASE ? false : "set AGRILOOP_BASE_URL to run the live matrix" },
  async () => {
    const otherGrower = "Gurpreet Singh";
    const detail = await body("/farmer/supply/LOT-0004", "USR-0001");
    assert.doesNotMatch(detail, new RegExp(otherGrower), "another grower's lot detail must not render");
    assert.doesNotMatch(detail, /Singh Growers Group/, "another organisation must not render");

    const owner = await body("/farmer/supply/LOT-0004", "USR-0005");
    assert.match(owner, new RegExp(otherGrower), "the owner should see their own lot detail");
  },
);
