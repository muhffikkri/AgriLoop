import fs from "node:fs";
import path from "node:path";
import type { LotStatus, OfferStatus, PickupStatus, RequirementStatus } from "@/lib/domain/status.ts";
import type { ConditionLabel } from "@/lib/domain/matching.ts";
import { createSeed } from "./seed.ts";

export type Role = "farmer" | "buyer" | "aggregator" | "admin";

export type User = {
  id: string;
  role: Role;
  name: string;
  email: string;
  passwordHash: string;
  orgName?: string;
  status: "active" | "blocked";
  blockedReason?: string;
  createdAt: string;
};

export type Lot = {
  id: string;
  ownerId: string;
  ownerName: string;
  farmerOrg: string;
  residueType: string;
  crop: string;
  quantity: number;
  unit: string;
  readyDate: string;
  areaId: string;
  areaLabel: string;
  status: LotStatus;
  conditionLabel?: ConditionLabel;
  conditionSource?: "farmer" | "enumerator";
  conditionNote?: string;
  harvestDate?: string;
  storage?: string;
  moisturePercent?: number;
  notes?: string;
  photoRef?: string;
  distanceKm?: number;
  createdAt: string;
  updatedAt: string;
};

export type Observation = {
  id: string;
  lotId: string;
  observedBy: string;
  harvestDate?: string;
  storage?: string;
  rainExposure?: string;
  moisturePercent?: number;
  measureMethod?: string;
  imageQuality?: string;
  confidence?: number;
  note?: string;
  createdAt: string;
};

export type Requirement = {
  id: string;
  ownerId: string;
  orgName: string;
  residueType: string;
  quantityMin: number;
  quantityMax: number;
  unit: string;
  windowStart: string;
  windowEnd: string;
  areaLabel: string;
  radiusKm: number;
  minCondition: ConditionLabel;
  substitution: boolean;
  notes?: string;
  status: RequirementStatus;
  createdAt: string;
  updatedAt: string;
};

export type Offer = {
  id: string;
  lotId: string;
  requirementId: string;
  buyerId: string;
  buyerOrg: string;
  quantity: number;
  unit: string;
  terms?: string;
  expiresAt: string;
  status: OfferStatus;
  responseNote?: string;
  createdAt: string;
  updatedAt: string;
};

export type Order = {
  id: string;
  lotId: string;
  offerId: string;
  buyerId: string;
  buyerOrg: string;
  farmerId: string;
  farmerOrg: string;
  agreedQuantity: number;
  unit: string;
  status: "AWAITING_BUYER" | "ACTIVE" | "RECEIVED" | "DISPUTED" | "CLOSED";
  receivedQuantity?: number;
  disputeCategory?: string;
  disputeReason?: string;
  createdAt: string;
  updatedAt: string;
};

export type PickupPlan = {
  id: string;
  aggregatorId: string;
  aggregatorOrg: string;
  orderIds: string[];
  vehicleLabel: string;
  vehicleCapacity: number;
  capacityUnit: string;
  plannedAt: string;
  status: PickupStatus;
  stopOrder: string[];
  note?: string;
  createdAt: string;
  updatedAt: string;
};

export type PickupRecord = {
  id: string;
  planId: string;
  orderId: string;
  lotId: string;
  actualQuantity: number;
  unit: string;
  collectedAt: string;
  receivedAt?: string;
  evidenceRef?: string;
  note?: string;
  /** Farmer declared the lot is ready for hand-over. */
  readyConfirmed?: boolean;
  createdAt: string;
};

export type GridSample = {
  id: string;
  areaLabel: string;
  district: string;
  /** Plain bounding box in WGS84; East, North, West, South. */
  bounds: { east: number; north: number; west: number; south: number };
  isSimulated: boolean;
  active: boolean;
  note?: string;
};

export type AuditEvent = {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: Role;
  entityType: "lot" | "offer" | "order" | "pickup" | "requirement" | "user" | "grid" | "observation";
  entityId: string;
  action: string;
  from?: string;
  to?: string;
  detail?: string;
  createdAt: string;
};

export type Store = {
  /** The bundled dataset is invented for the walkthrough and stays labelled as such. */
  simulated: boolean;
  users: User[];
  lots: Lot[];
  observations: Observation[];
  requirements: Requirement[];
  offers: Offer[];
  orders: Order[];
  pickups: PickupPlan[];
  records: PickupRecord[];
  grids: GridSample[];
  audit: AuditEvent[];
};

const STORE_FILE = path.join(process.cwd(), "data", "store", "db.json");

let cache: Store | null = null;

export function nowIso(): string {
  return new Date().toISOString();
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function nextId(prefix: string, existing: number): string {
  return `${prefix}-${String(existing + 1).padStart(4, "0")}`;
}

function seed(): Store {
  return createSeed();
}

export function readStore(): Store {
  if (cache) return cache;
  try {
    cache = JSON.parse(fs.readFileSync(STORE_FILE, "utf8")) as Store;
  } catch {
    cache = seed();
    persist(cache);
  }
  return cache;
}

function persist(store: Store): void {
  fs.mkdirSync(path.dirname(STORE_FILE), { recursive: true });
  fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), "utf8");
}

export function commit(store: Store): void {
  store.audit = store.audit.slice(-2000);
  persist(store);
}

/** Reads the store, hands it to `change`, then persists. One process, so no locking. */
export function mutate<T>(change: (store: Store) => T): T {
  const store = readStore();
  const result = change(store);
  commit(store);
  return result;
}

export function recordAudit(
  store: Store,
  event: Omit<AuditEvent, "id" | "createdAt">,
): AuditEvent {
  const entry: AuditEvent = {
    ...event,
    id: nextId("AUD", store.audit.length),
    createdAt: nowIso(),
  };
  store.audit.push(entry);
  return entry;
}
