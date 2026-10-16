import { mutate, readStore, recordAudit, type AuditEvent, type GridSample, type Role, type User } from "./db.ts";
import { availableOrders, myPlans } from "./collections.ts";
import type { Result } from "./market.ts";

function requireAdmin(actor: User): string | null {
  return actor.role === "admin" ? null : "This area is limited to admin accounts";
}

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  role: Role;
  orgName?: string;
  status: User["status"];
  blockedReason?: string;
  createdAt: string;
  lotCount: number;
};

export function listUsers(actor: User): Result<AdminUserRow[]> {
  const denied = requireAdmin(actor);
  if (denied) return { ok: false, error: denied };

  const store = readStore();
  const rows = store.users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    orgName: user.orgName,
    status: user.status,
    blockedReason: user.blockedReason,
    createdAt: user.createdAt,
    lotCount: store.lots.filter((lot) => lot.ownerId === user.id).length,
  }));
  return { ok: true, value: rows.sort((a, b) => a.role.localeCompare(b.role)) };
}

export function setUserRole(actor: User, userId: string, role: Role): Result<AdminUserRow> {
  const denied = requireAdmin(actor);
  if (denied) return { ok: false, error: denied };
  if (userId === actor.id) return { ok: false, error: "You cannot change your own role" };

  const target = readStore().users.find((candidate) => candidate.id === userId);
  if (!target) return { ok: false, error: "User not found" };
  if (target.role === role) return { ok: false, error: `${target.name} already has the ${role} role` };

  const updated = mutate((store) => {
    const row = store.users.find((candidate) => candidate.id === userId)!;
    const from = row.role;
    row.role = role;
    recordAudit(store, {
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      entityType: "user",
      entityId: row.id,
      action: "user.role_changed",
      from,
      to: role,
      detail: `Role changed by admin, no self-service path exists for this`,
    });
    return row;
  });

  return {
    ok: true,
    value: {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      orgName: updated.orgName,
      status: updated.status,
      blockedReason: updated.blockedReason,
      createdAt: updated.createdAt,
      lotCount: readStore().lots.filter((lot) => lot.ownerId === updated.id).length,
    },
  };
}

export function setUserStatus(actor: User, userId: string, status: User["status"], reason: string): Result<AdminUserRow> {
  const denied = requireAdmin(actor);
  if (denied) return { ok: false, error: denied };
  if (userId === actor.id) return { ok: false, error: "You cannot block your own account" };
  if (status === "blocked" && !reason.trim()) return { ok: false, error: "A block needs a recorded reason" };

  const target = readStore().users.find((candidate) => candidate.id === userId);
  if (!target) return { ok: false, error: "User not found" };

  const updated = mutate((store) => {
    const row = store.users.find((candidate) => candidate.id === userId)!;
    const from = row.status;
    row.status = status;
    row.blockedReason = status === "blocked" ? reason.trim() : undefined;
    recordAudit(store, {
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      entityType: "user",
      entityId: row.id,
      action: status === "blocked" ? "user.blocked" : "user.reactivated",
      from,
      to: status,
      detail: reason.trim() || undefined,
    });
    return row;
  });

  return {
    ok: true,
    value: {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      orgName: updated.orgName,
      status: updated.status,
      blockedReason: updated.blockedReason,
      createdAt: updated.createdAt,
      lotCount: readStore().lots.filter((lot) => lot.ownerId === updated.id).length,
    },
  };
}

/* ------------------------------------------------------------------- grid samples */

export function listGridSamples(actor: User): Result<GridSample[]> {
  const denied = requireAdmin(actor);
  if (denied) return { ok: false, error: denied };
  return { ok: true, value: readStore().grids };
}

export type GridSamplePatch = {
  areaLabel?: string;
  district?: string;
  active?: boolean;
  note?: string;
};

/** Metadata only. Source rasters are never touched from the app. */
export function updateGridSample(actor: User, gridId: string, patch: GridSamplePatch): Result<GridSample> {
  const denied = requireAdmin(actor);
  if (denied) return { ok: false, error: denied };

  const grid = readStore().grids.find((candidate) => candidate.id === gridId);
  if (!grid) return { ok: false, error: "Grid sample not found" };
  if (patch.areaLabel !== undefined && !patch.areaLabel.trim()) {
    return { ok: false, error: "Area label cannot be empty" };
  }

  const updated = mutate((store) => {
    const row = store.grids.find((candidate) => candidate.id === gridId)!;
    const before = `${row.areaLabel}/${row.district}/${row.active ? "active" : "inactive"}`;
    if (patch.areaLabel !== undefined) row.areaLabel = patch.areaLabel.trim();
    if (patch.district !== undefined) row.district = patch.district.trim();
    if (patch.active !== undefined) row.active = patch.active;
    if (patch.note !== undefined) row.note = patch.note.trim() || undefined;
    recordAudit(store, {
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      entityType: "grid",
      entityId: row.id,
      action: "grid.metadata_updated",
      detail: `was ${before}, raster untouched`,
    });
    return row;
  });

  return { ok: true, value: updated };
}

/* ----------------------------------------------------------------- monitoring */

export function adminSummary(actor: User) {
  const store = readStore();
  return {
    users: store.users.length,
    farmers: store.users.filter((user) => user.role === "farmer").length,
    buyers: store.users.filter((user) => user.role === "buyer").length,
    aggregators: store.users.filter((user) => user.role === "aggregator").length,
    blocked: store.users.filter((user) => user.status === "blocked").length,
    lots: store.lots.length,
    openLots: store.lots.filter((lot) => lot.status === "OPEN").length,
    pendingOffers: store.offers.filter((offer) => offer.status === "PENDING").length,
    activeOrders: store.orders.filter((order) => order.status === "ACTIVE" || order.status === "AWAITING_BUYER").length,
    disputed: store.orders.filter((order) => order.status === "DISPUTED").length,
    openPickups: store.pickups.filter((plan) => plan.status !== "COMPLETED" && plan.status !== "FAILED").length,
    availableWork: availableOrders(actor).length,
    auditEvents: store.audit.length,
  };
}

export type TransactionRow = {
  orderId: string;
  lotId: string;
  residueType: string;
  quantity: number;
  unit: string;
  buyerOrg: string;
  farmerOrg: string;
  status: string;
  disputeCategory?: string;
  disputeReason?: string;
  pickupStatus?: string;
  actualQuantity?: number;
  updatedAt: string;
};

/**
 * Admin monitoring view. Organisation names only: no farmer contact details and no
 * exact coordinates, because monitoring does not need them.
 */
export function transactionRows(actor: User): Result<TransactionRow[]> {
  const denied = requireAdmin(actor);
  if (denied) return { ok: false, error: denied };

  const store = readStore();
  const rows = store.orders.map((order) => {
    const lot = store.lots.find((candidate) => candidate.id === order.lotId);
    const plan = store.pickups.find((candidate) => candidate.orderIds.includes(order.id));
    const record = store.records.find((candidate) => candidate.orderId === order.id);
    return {
      orderId: order.id,
      lotId: order.lotId,
      residueType: lot?.residueType ?? "unknown",
      quantity: order.agreedQuantity,
      unit: order.unit,
      buyerOrg: order.buyerOrg,
      farmerOrg: order.farmerOrg,
      status: order.status,
      disputeCategory: order.disputeCategory,
      disputeReason: order.disputeReason,
      pickupStatus: plan?.status,
      actualQuantity: record?.actualQuantity || undefined,
      updatedAt: order.updatedAt,
    };
  });
  return { ok: true, value: rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)) };
}

export type DataQuality = {
  lotsWithoutCondition: number;
  lotsWithoutMoisture: number;
  lotsWithoutPhoto: number;
  staleOffers: number;
  awaitingBuyer: number;
  openDisputes: number;
  blockedAccounts: number;
  estimateRows: Array<{ orderId: string; agreed: number; actual: number; unit: string; variancePercent: number }>;
};

export function dataQuality(actor: User): Result<DataQuality> {
  const denied = requireAdmin(actor);
  if (denied) return { ok: false, error: denied };

  const store = readStore();
  const staleCutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const estimateRows = store.orders
    .map((order) => {
      const record = store.records.find((candidate) => candidate.orderId === order.id);
      if (!record || !record.actualQuantity) return null;
      return {
        orderId: order.id,
        agreed: order.agreedQuantity,
        actual: record.actualQuantity,
        unit: order.unit,
        variancePercent: Math.round(((record.actualQuantity - order.agreedQuantity) / order.agreedQuantity) * 1000) / 10,
      };
    })
    .filter((row): row is DataQuality["estimateRows"][number] => row !== null);

  return {
    ok: true,
    value: {
      lotsWithoutCondition: store.lots.filter((lot) => !lot.conditionLabel).length,
      lotsWithoutMoisture: store.lots.filter((lot) => lot.moisturePercent === undefined).length,
      lotsWithoutPhoto: store.lots.filter((lot) => !lot.photoRef).length,
      staleOffers: store.offers.filter((offer) => offer.status === "PENDING" && offer.createdAt < staleCutoff).length,
      awaitingBuyer: store.orders.filter((order) => order.status === "AWAITING_BUYER").length,
      openDisputes: store.orders.filter((order) => order.status === "DISPUTED").length,
      blockedAccounts: store.users.filter((user) => user.status === "blocked").length,
      estimateRows,
    },
  };
}

export function auditTrail(actor: User, filter?: { entityType?: AuditEvent["entityType"]; entityId?: string }): Result<AuditEvent[]> {
  const denied = requireAdmin(actor);
  if (denied) return { ok: false, error: denied };

  const events = readStore()
    .audit.filter((event) => (filter?.entityType ? event.entityType === filter.entityType : true))
    .filter((event) => (filter?.entityId ? event.entityId === filter.entityId : true))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 200);

  return { ok: true, value: events };
}

export function activePlanCount(actor: User): number {
  return myPlans(actor).filter((plan) => plan.status !== "COMPLETED" && plan.status !== "FAILED").length;
}
