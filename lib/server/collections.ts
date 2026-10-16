import { LOT_TRANSITIONS, PICKUP_TRANSITIONS, transitionError } from "@/lib/domain/status.ts";
import { mutate, nextId, nowIso, readStore, recordAudit, todayIso, type Lot, type Order, type PickupPlan, type PickupRecord, type User } from "./db.ts";
import { sameOrg } from "./access.ts";
import type { Result } from "./market.ts";

export type PlanRow = {
  order: Order;
  lot: Lot;
  record: PickupRecord;
};

export type AvailableRow = { order: Order; lot: Lot };

export function availableOrders(actor: User): AvailableRow[] {
  if (actor.role !== "aggregator" && actor.role !== "admin") return [];

  const store = readStore();
  const alreadyPlanned = store.pickups
    .filter((plan) => plan.status !== "FAILED")
    .flatMap((plan) => plan.orderIds);

  return store.orders
    .filter((order) => order.status === "ACTIVE" && !alreadyPlanned.includes(order.id))
    .map((order) => {
      const lot = store.lots.find((candidate) => candidate.id === order.lotId);
      return lot && lot.status === "RESERVED" ? { order, lot } : null;
    })
    .filter((row): row is AvailableRow => row !== null);
}

export function myPlans(actor: User): PickupPlan[] {
  return readStore()
    .pickups.filter((plan) => plan.aggregatorId === actor.id || sameOrg(plan.aggregatorId, actor))
    .sort((a, b) => b.plannedAt.localeCompare(a.plannedAt));
}

export function planById(actor: User, planId: string): PickupPlan | null {
  const plan = readStore().pickups.find((candidate) => candidate.id === planId);
  if (!plan) return null;
  const visible = actor.role === "admin" || plan.aggregatorId === actor.id || sameOrg(plan.aggregatorId, actor);
  return visible ? plan : null;
}

export function planRows(plan: PickupPlan): PlanRow[] {
  const store = readStore();
  return plan.orderIds
    .map((orderId) => {
      const order = store.orders.find((candidate) => candidate.id === orderId);
      if (!order) return null;
      const lot = store.lots.find((candidate) => candidate.id === order.lotId);
      const record = store.records.find((candidate) => candidate.planId === plan.id && candidate.orderId === order.id);
      if (!lot || !record) return null;
      return { order, lot, record };
    })
    .filter((row): row is PlanRow => row !== null);
}

export type PlanInput = {
  orderIds: string[];
  plannedAt: string;
  vehicleLabel: string;
  vehicleCapacity: string;
  capacityUnit: string;
  note?: string;
};

/** Capacity is checked against the sum of planned lot quantities, per the PRD rule. */
export function plannedQuantity(orderIds: string[]): number {
  const store = readStore();
  return orderIds.reduce((total, orderId) => {
    const order = store.orders.find((candidate) => candidate.id === orderId);
    const lot = order ? store.lots.find((candidate) => candidate.id === order.lotId) : undefined;
    return total + (lot?.quantity ?? 0);
  }, 0);
}

export function createPlan(actor: User, input: PlanInput): Result<PickupPlan> {
  if (actor.role !== "aggregator" && actor.role !== "admin") {
    return { ok: false, error: "Pickup plans are created by aggregator accounts" };
  }
  if (!input.orderIds.length) return { ok: false, error: "Select at least one order to collect" };
  if (!input.vehicleLabel.trim()) return { ok: false, error: "Name the vehicle" };
  if (!input.plannedAt || input.plannedAt < todayIso()) {
    return { ok: false, error: "Pick a pickup date that is today or later" };
  }

  const capacity = Number(input.vehicleCapacity);
  if (!Number.isFinite(capacity) || capacity <= 0) {
    return { ok: false, error: "Enter the vehicle capacity" };
  }

  const store = readStore();
  for (const orderId of input.orderIds) {
    const order = store.orders.find((candidate) => candidate.id === orderId);
    if (!order) return { ok: false, error: `Order ${orderId} not found` };
    if (order.status !== "ACTIVE") return { ok: false, error: `Order ${orderId} is ${order.status} and cannot be collected` };
    const lot = store.lots.find((candidate) => candidate.id === order.lotId);
    if (!lot) return { ok: false, error: `Lot for order ${orderId} not found` };
    if (lot.unit !== input.capacityUnit) {
      return { ok: false, error: `Capacity is recorded in ${input.capacityUnit} but lot ${lot.id} is measured in ${lot.unit}` };
    }
    const problem = transitionError(LOT_TRANSITIONS, lot.status, "PICKUP_SCHEDULED");
    if (problem) return { ok: false, error: `Lot ${lot.id}: ${problem}` };
  }

  const total = plannedQuantity(input.orderIds);
  if (total > capacity) {
    return {
      ok: false,
      error: `Planned ${total} ${input.capacityUnit} exceeds the ${capacity} ${input.capacityUnit} vehicle capacity`,
    };
  }

  const plan = mutate((store) => {
    const created: PickupPlan = {
      id: nextId("PICK", store.pickups.length),
      aggregatorId: actor.id,
      aggregatorOrg: actor.orgName ?? actor.name,
      orderIds: input.orderIds,
      vehicleLabel: input.vehicleLabel.trim(),
      vehicleCapacity: capacity,
      capacityUnit: input.capacityUnit,
      plannedAt: input.plannedAt,
      status: "PLANNED",
      stopOrder: input.orderIds,
      note: input.note?.trim() || undefined,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    store.pickups.push(created);

    for (const orderId of input.orderIds) {
      const order = store.orders.find((candidate) => candidate.id === orderId)!;
      const lot = store.lots.find((candidate) => candidate.id === order.lotId)!;
      const fromLot = lot.status;
      lot.status = "PICKUP_SCHEDULED";
      lot.updatedAt = nowIso();
      const record: PickupRecord = {
        id: nextId("REC", store.records.length),
        planId: created.id,
        orderId: order.id,
        lotId: lot.id,
        actualQuantity: 0,
        unit: lot.unit,
        collectedAt: "",
        readyConfirmed: false,
        createdAt: nowIso(),
      };
      store.records.push(record);
      recordAudit(store, {
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        entityType: "lot",
        entityId: lot.id,
        action: "lot.pickup_scheduled",
        from: fromLot,
        to: "PICKUP_SCHEDULED",
        detail: `${created.vehicleLabel} on ${created.plannedAt}`,
      });
    }

    recordAudit(store, {
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      entityType: "pickup",
      entityId: created.id,
      action: "pickup.planned",
      to: "PLANNED",
      detail: `${created.orderIds.length} stop(s), ${capacity} ${input.capacityUnit} capacity, ${created.plannedAt}`,
    });
    return created;
  });

  return { ok: true, value: plan };
}

export function updatePlan(actor: User, planId: string, input: Partial<PlanInput>): Result<PickupPlan> {
  const plan = planById(actor, planId);
  if (!plan) return { ok: false, error: "Pickup plan not found for this account" };
  if (plan.status === "COMPLETED" || plan.status === "FAILED") {
    return { ok: false, error: `Plan is ${plan.status} and can no longer change` };
  }

  const capacity = input.vehicleCapacity ? Number(input.vehicleCapacity) : plan.vehicleCapacity;
  if (input.vehicleCapacity && (!Number.isFinite(capacity) || capacity <= 0)) {
    return { ok: false, error: "Enter a valid vehicle capacity" };
  }
  const total = plannedQuantity(plan.orderIds);
  if (total > capacity) {
    return { ok: false, error: `Planned ${total} ${plan.capacityUnit} exceeds the new ${capacity} ${plan.capacityUnit} capacity` };
  }
  if (input.plannedAt && input.plannedAt < todayIso()) {
    return { ok: false, error: "Pickup date cannot be in the past" };
  }

  const updated = mutate((store) => {
    const target = store.pickups.find((candidate) => candidate.id === planId)!;
    const before = { plannedAt: target.plannedAt, vehicleLabel: target.vehicleLabel, vehicleCapacity: target.vehicleCapacity };
    if (input.plannedAt) target.plannedAt = input.plannedAt;
    if (input.vehicleLabel) target.vehicleLabel = input.vehicleLabel.trim();
    if (input.vehicleCapacity) target.vehicleCapacity = capacity;
    if (input.capacityUnit) target.capacityUnit = input.capacityUnit;
    if (input.note !== undefined) target.note = input.note.trim() || undefined;
    if (input.orderIds?.length) target.stopOrder = input.orderIds;
    target.updatedAt = nowIso();
    recordAudit(store, {
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      entityType: "pickup",
      entityId: target.id,
      action: "pickup.updated",
      detail: `was ${before.plannedAt}, ${before.vehicleLabel} ${before.vehicleCapacity} ${target.capacityUnit}`,
    });
    return target;
  });

  return { ok: true, value: updated };
}

export function setPlanStatus(
  actor: User,
  planId: string,
  next: PickupPlan["status"],
  note: string,
): Result<PickupPlan> {
  const plan = planById(actor, planId);
  if (!plan) return { ok: false, error: "Pickup plan not found for this account" };
  const problem = transitionError(PICKUP_TRANSITIONS, plan.status, next);
  if (problem) return { ok: false, error: problem };
  if ((next === "RESCHEDULED" || next === "FAILED") && !note.trim()) {
    return { ok: false, error: `A ${next.toLowerCase()} plan needs a reason` };
  }
  if (next === "COMPLETED") {
    const rows = planRows(plan);
    const missing = rows.filter((row) => !row.record.collectedAt);
    if (missing.length) {
      return { ok: false, error: `Record the actual quantity for ${missing.length} stop(s) before completing the plan` };
    }
  }

  const updated = mutate((store) => {
    const target = store.pickups.find((candidate) => candidate.id === planId)!;
    const from = target.status;
    target.status = next;
    target.updatedAt = nowIso();

    if (next === "FAILED") {
      for (const orderId of target.orderIds) {
        const order = store.orders.find((candidate) => candidate.id === orderId);
        const lot = order ? store.lots.find((candidate) => candidate.id === order.lotId) : undefined;
        if (lot && lot.status === "PICKUP_SCHEDULED") {
          lot.status = "RESERVED";
          lot.updatedAt = nowIso();
          recordAudit(store, {
            actorId: actor.id,
            actorName: actor.name,
            actorRole: actor.role,
            entityType: "lot",
            entityId: lot.id,
            action: "lot.pickup_failed",
            from: "PICKUP_SCHEDULED",
            to: "RESERVED",
            detail: note.trim(),
          });
        }
      }
    }

    recordAudit(store, {
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      entityType: "pickup",
      entityId: target.id,
      action: `pickup.${next.toLowerCase()}`,
      from,
      to: next,
      detail: note.trim() || undefined,
    });
    return target;
  });

  return { ok: true, value: updated };
}

export function confirmReadiness(actor: User, planId: string, orderId: string): Result<PickupRecord> {
  const plan = readStore().pickups.find((candidate) => candidate.id === planId);
  if (!plan) return { ok: false, error: "Pickup plan not found" };
  const order = readStore().orders.find((candidate) => candidate.id === orderId);
  if (!order) return { ok: false, error: "Order not found" };
  if (order.farmerId !== actor.id && !sameOrg(order.farmerId, actor)) {
    return { ok: false, error: "Only the farmer holding the lot can confirm readiness" };
  }

  const record = mutate((store) => {
    const target = store.records.find((candidate) => candidate.planId === planId && candidate.orderId === orderId)!;
    target.readyConfirmed = true;
    recordAudit(store, {
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      entityType: "pickup",
      entityId: plan.id,
      action: "pickup.ready_confirmed",
      detail: `${order.id} ready for the ${plan.vehicleLabel} on ${plan.plannedAt}`,
    });
    return target;
  });

  return { ok: true, value: record };
}

export type PickupRecordInput = {
  actualQuantity: string;
  collectedAt: string;
  evidenceRef?: string;
  note?: string;
};

export function recordPickup(
  actor: User,
  planId: string,
  orderId: string,
  input: PickupRecordInput,
): Result<PickupRecord> {
  const plan = planById(actor, planId);
  if (!plan) return { ok: false, error: "Pickup plan not found for this account" };
  if (plan.status === "FAILED") return { ok: false, error: "A failed plan cannot record a pickup" };

  const quantity = Number(input.actualQuantity);
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return { ok: false, error: "Enter the weighed quantity, it has to be greater than zero" };
  }
  if (!input.collectedAt) return { ok: false, error: "Enter the time the material was collected" };
  if (!input.evidenceRef?.trim()) {
    return { ok: false, error: "Add the hand-over reference (weighbridge slip or photo id)" };
  }

  const store = readStore();
  const order = store.orders.find((candidate) => candidate.id === orderId && plan.orderIds.includes(candidate.id));
  if (!order) return { ok: false, error: "That order is not part of this plan" };
  const lot = store.lots.find((candidate) => candidate.id === order.lotId);
  if (!lot) return { ok: false, error: "Lot not found" };

  const problem = transitionError(LOT_TRANSITIONS, lot.status, "PICKED_UP");
  if (problem && lot.status !== "PICKED_UP") return { ok: false, error: `Lot ${lot.id}: ${problem}` };

  const record = mutate((store) => {
    const target = store.records.find((candidate) => candidate.planId === planId && candidate.orderId === orderId)!;
    target.actualQuantity = quantity;
    target.unit = lot.unit;
    target.collectedAt = input.collectedAt;
    target.evidenceRef = input.evidenceRef?.trim();
    target.note = input.note?.trim() || undefined;
    target.readyConfirmed = true;

    const lotRow = store.lots.find((candidate) => candidate.id === order.lotId)!;
    if (lotRow.status === "PICKUP_SCHEDULED") {
      lotRow.status = "PICKED_UP";
      lotRow.updatedAt = nowIso();
      recordAudit(store, {
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        entityType: "lot",
        entityId: lotRow.id,
        action: "lot.picked_up",
        from: "PICKUP_SCHEDULED",
        to: "PICKED_UP",
        detail: `${quantity} ${lotRow.unit} weighed, evidence ${target.evidenceRef}`,
      });
    }

    recordAudit(store, {
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      entityType: "pickup",
      entityId: planId,
      action: "pickup.recorded",
      detail: `${order.id}: ${quantity} ${lotRow.unit} against ${order.agreedQuantity} ${order.unit} agreed`,
    });
    return target;
  });

  return { ok: true, value: record };
}

export type FarmerStop = { plan: PickupPlan; order: Order; lot: Lot; record: PickupRecord };

/** Pickup stops a farmer has to prepare for, across every plan that includes their orders. */
export function stopsForFarmer(actor: User): FarmerStop[] {
  const store = readStore();
  const myOrderIds = new Set(
    store.orders.filter((order) => order.farmerId === actor.id || sameOrg(order.farmerId, actor)).map((order) => order.id),
  );
  return store.pickups
    .filter((plan) => plan.orderIds.some((id) => myOrderIds.has(id)))
    .sort((a, b) => a.plannedAt.localeCompare(b.plannedAt))
    .flatMap((plan) =>
      planRows(plan)
        .filter((row) => myOrderIds.has(row.order.id))
        .map((row) => ({ plan, ...row })),
    );
}

export function aggregatorSummary(actor: User) {
  const plans = myPlans(actor);
  const store = readStore();
  const records = store.records.filter((record) => plans.some((plan) => plan.id === record.planId));
  const plannedTotal = plans.flatMap((plan) => plan.orderIds).reduce((total, orderId) => total + plannedQuantity([orderId]), 0);
  const actualTotal = records.reduce((total, record) => total + record.actualQuantity, 0);
  return {
    plans: plans.length,
    open: plans.filter((plan) => plan.status === "PLANNED" || plan.status === "CONFIRMED" || plan.status === "IN_PROGRESS").length,
    completed: plans.filter((plan) => plan.status === "COMPLETED").length,
    availableOrders: availableOrders(actor).length,
    plannedTotal,
    actualTotal,
    variance: plannedTotal === 0 ? 0 : Math.round(((actualTotal - plannedTotal) / plannedTotal) * 1000) / 10,
  };
}
