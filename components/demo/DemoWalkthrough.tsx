"use client";

import { useEffect, useMemo, useState } from "react";
import { SimBadge } from "@/components/ui/badges.tsx";
import { FieldError } from "@/components/ui/FormFeedback.tsx";
import { RESIDUE_TYPES, STORAGE_OPTIONS } from "@/lib/domain/catalog.ts";
import { matchLot, type ConditionLabel, type LotFacts, type RequirementFacts } from "@/lib/domain/matching.ts";
import { hasErrors, validateLotDraft } from "@/lib/domain/validation.ts";
import type { GridPatch } from "@/components/demo/SatelliteGridDemo.tsx";

/**
 * The walkthrough reuses the same pure rules as the workspaces, so the numbers a
 * visitor sees here are produced by the shipping logic rather than a mock-up.
 * Every record is held in this browser only.
 */
export type DemoPersona = "farmer" | "buyer" | "aggregator" | "admin";

export type DemoLotFixture = {
  id: string;
  residueType: string;
  crop: string;
  quantity: number;
  unit: string;
  areaId: string;
  areaLabel: string;
  readyDate: string;
  harvestDate?: string;
  storage?: string;
  conditionLabel?: ConditionLabel;
  conditionNote?: string;
  status: string;
};

export type DemoRequirementFixture = {
  id: string;
  orgName: string;
  residueType: string;
  quantityMin: number;
  quantityMax: number;
  unit: string;
  windowStart: string;
  windowEnd: string;
  areaLabel: string;
  radiusKm: number;
  minCondition?: ConditionLabel;
  note?: string;
};

export type DemoStepFixture = { persona: DemoPersona; title: string; body: string };

export type DemoFixtures = {
  isDemo: boolean;
  note: string;
  storageKey: string;
  lots: DemoLotFixture[];
  requirements: DemoRequirementFixture[];
  steps: DemoStepFixture[];
};

/** The demo runs on a fixed date so the fixtures stay reproducible. */
const DEMO_TODAY = "2026-03-15";

const PERSONA_LABEL: Record<DemoPersona, string> = {
  farmer: "Farmer",
  buyer: "Buyer",
  aggregator: "Collector",
  admin: "Programme admin",
};

type LotState = {
  id: string;
  residueType: string;
  quantity: number;
  unit: "ton";
  readyDate: string;
  areaId: string;
  areaLabel: string;
  storage: string;
  notes: string;
};

type OfferState = { pricePerTonne: number; availableFrom: string; note: string; requirementId: string };
type PlanState = { pickupDate: string; vehicleLabel: string; capacity: number };
type HandoverState = { weighed: number; evidenceRef: string; note: string; collectedAt: string };
type ReviewState = { note: string };

type LogEntry = { at: string; persona: DemoPersona; action: string };

type DemoState = {
  persona: DemoPersona;
  viewed: number;
  lot: LotState | null;
  offer: OfferState | null;
  plan: PlanState | null;
  handover: HandoverState | null;
  review: ReviewState | null;
  log: LogEntry[];
};

const initialState: DemoState = {
  persona: "farmer",
  viewed: 0,
  lot: null,
  offer: null,
  plan: null,
  handover: null,
  review: null,
  log: [],
};

export function DemoWalkthrough({ fixtures, grids }: { fixtures: DemoFixtures; grids: GridPatch[] }) {
  const [state, setState] = useState<DemoState>(initialState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(fixtures.storageKey);
      if (raw) setState({ ...initialState, ...(JSON.parse(raw) as Partial<DemoState>) });
    } catch {
      // A blocked or corrupt store just means the walkthrough starts empty.
    }
    setReady(true);
  }, [fixtures.storageKey]);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(fixtures.storageKey, JSON.stringify(state));
    } catch {
      // Private browsing modes can refuse writes; the walkthrough still works in memory.
    }
  }, [ready, state, fixtures.storageKey]);

  const steps = fixtures.steps;
  const done = [Boolean(state.lot), Boolean(state.offer), Boolean(state.plan), Boolean(state.handover), Boolean(state.review)];

  const personaOrder = useMemo(() => {
    const seen: DemoPersona[] = [];
    for (const step of steps) if (!seen.includes(step.persona)) seen.push(step.persona);
    return seen;
  }, [steps]);

  function log(persona: DemoPersona, action: string, current: LogEntry[]): LogEntry[] {
    return [...current, { at: new Date().toISOString(), persona, action }];
  }

  function advance(index: number, patch: Partial<DemoState>, entry: string): void {
    setState((current) => {
      const next = Math.min(index + 1, steps.length - 1);
      return {
        ...current,
        ...patch,
        persona: steps[next].persona,
        viewed: next,
        log: log(steps[index].persona, entry, current.log),
      };
    });
  }

  function jumpTo(persona: DemoPersona): void {
    const owned = steps.map((step, index) => ({ step, index })).filter((entry) => entry.step.persona === persona);
    if (!owned.length) return;
    const next = owned.find((entry) => !done[entry.index]) ?? owned[owned.length - 1];
    setState((current) => ({ ...current, persona, viewed: next.index }));
  }

  function reset(): void {
    try {
      window.localStorage.removeItem(fixtures.storageKey);
    } catch {
      // Nothing to clean up if the store was never writable.
    }
    setState(initialState);
  }

  const activeStep = steps[state.viewed] ?? steps[0];

  return (
    <div className="stack">
      <div className="card">
        <div className="card-title">
          <div>
            <h3 style={{ margin: 0 }}>Persona walkthrough</h3>
            <p className="small muted" style={{ margin: "4px 0 0" }}>
              Pick a persona to jump to its step. Each completed step hands off to the next persona in the chain.
            </p>
          </div>
          <SimBadge />
        </div>

        <div className="chips" role="group" aria-label="Choose a persona">
          {personaOrder.map((persona) => (
            <button
              key={persona}
              type="button"
              className="chip"
              aria-pressed={state.persona === persona}
              onClick={() => jumpTo(persona)}
            >
              {PERSONA_LABEL[persona]}
            </button>
          ))}
          <button type="button" className="btn btn-ghost btn-sm" onClick={reset} style={{ marginLeft: "auto" }}>
            Reset walkthrough
          </button>
        </div>

        <ol className="demo-rail" style={{ listStyle: "none", padding: 0, margin: "16px 0 0", display: "grid", gap: 8 }}>
          {steps.map((step, index) => {
            const reachable = index <= done.findIndex((value) => !value) || done.every(Boolean);
            return (
              <li key={step.title}>
                <button
                  type="button"
                  className="chip"
                  aria-pressed={state.viewed === index}
                  disabled={!reachable}
                  onClick={() => setState((current) => ({ ...current, viewed: index, persona: step.persona }))}
                  style={{ width: "100%", justifyContent: "flex-start", textAlign: "left", opacity: reachable ? 1 : 0.55 }}
                >
                  <span className="mono" style={{ marginRight: 8 }}>
                    {done[index] ? "done" : index === 0 || done[index - 1] ? "next" : "locked"}
                  </span>
                  <span>{`${index + 1}. ${step.title}`}</span>
                  <span className="muted" style={{ marginLeft: "auto", paddingLeft: 12 }}>
                    {PERSONA_LABEL[step.persona]}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="card">
        <div className="card-title">
          <h3 style={{ margin: 0 }}>
            Step {state.viewed + 1}: {activeStep.title}
          </h3>
          <span className="badge">{PERSONA_LABEL[activeStep.persona]}</span>
        </div>
        <p className="small muted">{activeStep.body}</p>

        {state.viewed === 0 ? (
          <PublishStep
            fixtures={fixtures}
            grids={grids}
            existing={state.lot}
            onPublish={(lot) => advance(0, { lot }, `Published ${lot.id} with ${lot.quantity} ton of ${lot.residueType}`)}
          />
        ) : null}

        {state.viewed === 1 ? (
          <MatchStep
            fixtures={fixtures}
            lot={state.lot}
            existing={state.offer}
            onOffer={(offer) => advance(1, { offer }, `Sent an offer of ₹${offer.pricePerTonne} per ton`)}
          />
        ) : null}

        {state.viewed === 2 ? (
          <PlanStep
            lot={state.lot}
            offer={state.offer}
            existing={state.plan}
            onPlan={(plan) =>
              advance(
                2,
                { plan },
                `Planned ${plan.vehicleLabel} (${plan.capacity} ton capacity) for ${plan.pickupDate}`,
              )
            }
          />
        ) : null}

        {state.viewed === 3 ? (
          <HandoverStep
            lot={state.lot}
            plan={state.plan}
            existing={state.handover}
            onHandover={(handover) =>
              advance(
                3,
                { handover },
                `Recorded ${handover.weighed} ton moved against a ${state.plan?.capacity ?? 0} ton plan`,
              )
            }
          />
        ) : null}

        {state.viewed === 4 ? (
          <ReviewStep
            state={state}
            existing={state.review}
            onReview={(review) => advance(4, { review }, "Acknowledged the pilot record and its data-quality flags")}
          />
        ) : null}

        {activeStep.persona !== state.persona ? (
          <p className="alert alert-info small" style={{ marginTop: 14 }}>
            This step belongs to the {PERSONA_LABEL[activeStep.persona].toLowerCase()}. Switch persona or open the
            step from the rail above to act as them.
          </p>
        ) : null}
      </div>

      {state.review ? (
        <p className="alert alert-info small" role="status">
          Walkthrough complete. Resetting clears only this browser copy; it never touched a workspace account or the
          server store.
        </p>
      ) : null}
    </div>
  );
}

function PublishStep({
  fixtures,
  grids,
  existing,
  onPublish,
}: {
  fixtures: DemoFixtures;
  grids: GridPatch[];
  existing: LotState | null;
  onPublish: (lot: LotState) => void;
}) {
  const suggestion = fixtures.lots[0];
  const [residueType, setResidueType] = useState(existing?.residueType ?? suggestion?.residueType ?? RESIDUE_TYPES[0]);
  const [quantity, setQuantity] = useState(String(existing?.quantity ?? suggestion?.quantity ?? 12));
  const [readyDate, setReadyDate] = useState(existing?.readyDate ?? suggestion?.readyDate ?? "2026-04-06");
  const [areaId, setAreaId] = useState(existing?.areaId ?? grids[0]?.id ?? "");
  const [storage, setStorage] = useState(existing?.storage ?? suggestion?.storage ?? "covered");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [touched, setTouched] = useState(false);

  const areaLabel = grids.find((grid) => grid.id === areaId)?.areaLabel ?? grids[0]?.areaLabel ?? "";
  const errors = validateLotDraft(
    { residueType, quantity, unit: "ton", readyDate, areaLabel, storage, notes },
    DEMO_TODAY,
  );
  const shown = touched ? errors : {};

  function publish(): void {
    setTouched(true);
    if (hasErrors(errors)) return;
    onPublish({
      id: "LOT-DEMO-01",
      residueType,
      quantity: Number(quantity),
      unit: "ton",
      readyDate,
      areaId,
      areaLabel,
      storage,
      notes,
    });
  }

  return (
    <div className="stack">
      <p className="small muted" style={{ margin: 0 }}>
        The form runs the same checks as the farmer workspace. A lot starts with no condition label, so buyers are
        told they still have to inspect it.
      </p>
      <div className="form-grid form-grid-2">
        <div className="field">
          <label htmlFor="demo-residue">Residue type</label>
          <select
            className={`select${shown.residueType ? " input-invalid" : ""}`}
            id="demo-residue"
            value={residueType}
            onChange={(event) => setResidueType(event.target.value)}
          >
            {RESIDUE_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <FieldError id="demo-err-residue" message={shown.residueType} />
        </div>

        <div className="field">
          <label htmlFor="demo-quantity">Quantity you expect (ton)</label>
          <input
            className={`input${shown.quantity ? " input-invalid" : ""}`}
            id="demo-quantity"
            type="number"
            min="0"
            step="0.1"
            inputMode="decimal"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
          />
          {shown.quantity ? (
            <FieldError id="demo-err-quantity" message={shown.quantity} />
          ) : (
            <p className="help">An estimate. It is compared with the weighed figure at the end of the chain.</p>
          )}
        </div>

        <div className="field">
          <label htmlFor="demo-ready">Ready from</label>
          <input
            className={`input${shown.readyDate ? " input-invalid" : ""}`}
            id="demo-ready"
            type="date"
            min={DEMO_TODAY}
            value={readyDate}
            onChange={(event) => setReadyDate(event.target.value)}
          />
          <FieldError id="demo-err-ready" message={shown.readyDate} />
        </div>

        <div className="field">
          <label htmlFor="demo-area">Area or grid cell</label>
          <select className="select" id="demo-area" value={areaId} onChange={(event) => setAreaId(event.target.value)}>
            {grids.map((grid) => (
              <option key={grid.id} value={grid.id}>
                {grid.areaLabel} ({grid.id})
              </option>
            ))}
          </select>
          <p className="help">A coarse cell label, not a field boundary.</p>
        </div>

        <div className="field">
          <label htmlFor="demo-storage">How it is stored</label>
          <select className="select" id="demo-storage" value={storage} onChange={(event) => setStorage(event.target.value)}>
            {STORAGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="demo-notes">Access notes (optional)</label>
          <input
            className="input"
            id="demo-notes"
            type="text"
            value={notes}
            maxLength={500}
            onChange={(event) => setNotes(event.target.value)}
          />
        </div>
      </div>

      <div className="btn-row">
        <button type="button" className="btn btn-primary" onClick={publish}>
          {existing ? "Replace the draft lot" : "Publish the lot"}
        </button>
      </div>
    </div>
  );
}

function MatchStep({
  fixtures,
  lot,
  existing,
  onOffer,
}: {
  fixtures: DemoFixtures;
  lot: LotState | null;
  existing: OfferState | null;
  onOffer: (offer: OfferState) => void;
}) {
  const requirements = fixtures.requirements;
  const [requirementId, setRequirementId] = useState(existing?.requirementId ?? requirements[0]?.id ?? "");
  const requirement = requirements.find((entry) => entry.id === requirementId) ?? requirements[0];

  const [price, setPrice] = useState(String(existing?.pricePerTonne ?? 4300));
  const [availableFrom, setAvailableFrom] = useState(existing?.availableFrom ?? requirement?.windowStart ?? DEMO_TODAY);
  const [note, setNote] = useState(existing?.note ?? "");
  const [touched, setTouched] = useState(false);

  if (!lot) {
    return (
      <p className="alert alert-warn small" style={{ margin: 0 }}>
        Publish a lot as the farmer first. The rail marks that step as next.
      </p>
    );
  }

  const match = matchLot(toLotFacts(lot), toRequirementFacts(requirement));

  const priceNumber = Number(price);
  const priceError = !price.trim()
    ? "Enter a price per tonne"
    : !Number.isFinite(priceNumber) || priceNumber <= 0
      ? "Price has to be a number greater than zero"
      : undefined;
  const dateError = !/^\d{4}-\d{2}-\d{2}$/.test(availableFrom)
    ? "Enter the earliest date you can collect"
    : availableFrom < DEMO_TODAY
      ? "The earliest date cannot be in the past"
      : undefined;

  function send(): void {
    setTouched(true);
    if (priceError || dateError) return;
    onOffer({ pricePerTonne: priceNumber, availableFrom, note, requirementId });
  }

  return (
    <div className="stack">
      <div>
        <p className="field-label">Buyer requirement to check against</p>
        <div className="chips" role="group" aria-label="Choose a requirement">
          {requirements.map((entry) => (
            <button
              key={entry.id}
              type="button"
              className="chip"
              aria-pressed={entry.id === requirementId}
              onClick={() => setRequirementId(entry.id)}
            >
              {entry.id} · {entry.residueType}
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ background: "var(--surface-alt)" }}>
        <div className="card-title">
          <h4 style={{ margin: 0 }}>
            {requirement.orgName} asks for {requirement.quantityMin}-{requirement.quantityMax} {requirement.unit} of{" "}
            {requirement.residueType}
          </h4>
          <span className={`badge badge-solid ${match.eligible ? "b-green" : "b-red"}`}>
            {match.eligible ? `Match score ${match.score}` : "Not eligible"}
          </span>
        </div>
        <ul className="meta-list" style={{ marginTop: 8 }}>
          <li>
            <span className="k">Delivery window</span>
            <span className="mono">
              {requirement.windowStart} to {requirement.windowEnd}
            </span>
          </li>
          <li>
            <span className="k">Pickup radius</span>
            <span className="mono">{requirement.radiusKm} km around {requirement.areaLabel}</span>
          </li>
          <li>
            <span className="k">Lowest condition label accepted</span>
            <span>{conditionText(requirement.minCondition)}</span>
          </li>
        </ul>
        <p className="small muted" style={{ marginTop: 8 }}>
          {requirement.note}
        </p>
      </div>

      <div className="grid-2">
        <div className="card">
          <h4 style={{ marginTop: 0 }}>Why this lot {match.eligible ? "can be offered" : "is held back"}</h4>
          <ul className="small" style={{ margin: 0, paddingLeft: 18 }}>
            {match.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
          {match.blockers.length ? (
            <ul className="small" style={{ margin: "8px 0 0", paddingLeft: 18, color: "var(--danger)" }}>
              {match.blockers.map((blocker) => (
                <li key={blocker}>{blocker}</li>
              ))}
            </ul>
          ) : null}
          <p className="small muted" style={{ marginTop: 10 }}>
            The score ranks lots against this requirement. It reads the facts you entered; it is not a judgement about
            the material's quality.
          </p>
        </div>

        <div className="card">
          <h4 style={{ marginTop: 0 }}>Send an offer</h4>
          <div className="field">
            <label htmlFor="demo-price">Price per tonne (₹)</label>
            <input
              className={`input${touched && priceError ? " input-invalid" : ""}`}
              id="demo-price"
              type="number"
              min="0"
              step="1"
              inputMode="decimal"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
            />
            <FieldError id="demo-err-price" message={touched ? priceError : undefined} />
          </div>
          <div className="field">
            <label htmlFor="demo-from">Earliest collection date</label>
            <input
              className={`input${touched && dateError ? " input-invalid" : ""}`}
              id="demo-from"
              type="date"
              min={DEMO_TODAY}
              value={availableFrom}
              onChange={(event) => setAvailableFrom(event.target.value)}
            />
            <FieldError id="demo-err-from" message={touched ? dateError : undefined} />
          </div>
          <div className="field">
            <label htmlFor="demo-offer-note">Note (optional)</label>
            <input
              className="input"
              id="demo-offer-note"
              type="text"
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </div>
          <button type="button" className="btn btn-primary" onClick={send}>
            {existing ? "Update the offer" : "Send the offer"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PlanStep({
  lot,
  offer,
  existing,
  onPlan,
}: {
  lot: LotState | null;
  offer: OfferState | null;
  existing: PlanState | null;
  onPlan: (plan: PlanState) => void;
}) {
  const [vehicleLabel, setVehicleLabel] = useState(existing?.vehicleLabel ?? "Tractor trolley PB-10-AB-4321");
  const [capacity, setCapacity] = useState(String(existing?.capacity ?? Math.ceil((lot?.quantity ?? 10) + 4)));
  const [pickupDate, setPickupDate] = useState(existing?.pickupDate ?? "2026-04-08");
  const [touched, setTouched] = useState(false);

  if (!lot || !offer) {
    return (
      <p className="alert alert-warn small" style={{ margin: 0 }}>
        A pickup needs an accepted offer. Publish the lot and send an offer first.
      </p>
    );
  }

  const planned = lot.quantity;
  const capacityNumber = Number(capacity);
  const capacityError = !capacity.trim()
    ? "Enter the vehicle capacity"
    : !Number.isFinite(capacityNumber) || capacityNumber <= 0
      ? "Capacity has to be a number greater than zero"
      : capacityNumber < planned
        ? `Planned ${planned} ton exceeds the ${capacityNumber} ton vehicle capacity`
        : undefined;
  const dateError = !pickupDate
    ? "Pick a pickup date"
    : pickupDate < DEMO_TODAY
      ? "Pick a pickup date that is today or later"
      : undefined;

  function confirm(): void {
    setTouched(true);
    if (capacityError || dateError) return;
    onPlan({ pickupDate, vehicleLabel, capacity: capacityNumber });
  }

  return (
    <div className="stack">
      <p className="small muted" style={{ margin: 0 }}>
        One stop, {planned} ton, bought at ₹{offer.pricePerTonne} per tonne. The plan's unit is fixed by the lot, and
        the vehicle capacity is checked against the planned quantity.
      </p>
      <div className="form-grid form-grid-2">
        <div className="field">
          <label htmlFor="demo-vehicle">Vehicle</label>
          <input
            className="input"
            id="demo-vehicle"
            type="text"
            value={vehicleLabel}
            onChange={(event) => setVehicleLabel(event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="demo-capacity">Vehicle capacity (ton)</label>
          <input
            className={`input${touched && capacityError ? " input-invalid" : ""}`}
            id="demo-capacity"
            type="number"
            min="0"
            step="0.1"
            inputMode="decimal"
            value={capacity}
            onChange={(event) => setCapacity(event.target.value)}
          />
          {touched && capacityError ? (
            <FieldError id="demo-err-capacity" message={capacityError} />
          ) : (
            <p className="help">
              Planned {planned} ton, so the capacity has to be {planned} ton or more.
            </p>
          )}
        </div>
        <div className="field">
          <label htmlFor="demo-pickup-date">Pickup date</label>
          <input
            className={`input${touched && dateError ? " input-invalid" : ""}`}
            id="demo-pickup-date"
            type="date"
            min={DEMO_TODAY}
            value={pickupDate}
            onChange={(event) => setPickupDate(event.target.value)}
          />
          <FieldError id="demo-err-pickup-date" message={touched ? dateError : undefined} />
        </div>
      </div>
      <div className="btn-row">
        <button type="button" className="btn btn-primary" onClick={confirm}>
          {existing ? "Update the plan" : "Plan the pickup"}
        </button>
      </div>
    </div>
  );
}

function HandoverStep({
  lot,
  plan,
  existing,
  onHandover,
}: {
  lot: LotState | null;
  plan: PlanState | null;
  existing: HandoverState | null;
  onHandover: (handover: HandoverState) => void;
}) {
  const planned = lot?.quantity ?? 0;
  const [weighed, setWeighed] = useState(String(existing?.weighed ?? (planned ? planned - 0.3 : 0)));
  const [evidenceRef, setEvidenceRef] = useState(existing?.evidenceRef ?? "");
  const [collectedAt, setCollectedAt] = useState(existing?.collectedAt ?? "2026-04-08T09:30");
  const [note, setNote] = useState(existing?.note ?? "");
  const [touched, setTouched] = useState(false);

  if (!plan) {
    return (
      <p className="alert alert-warn small" style={{ margin: 0 }}>
        Record what moved after the pickup has been planned.
      </p>
    );
  }

  const weighedNumber = Number(weighed);
  const weighedError = !weighed.trim()
    ? "Enter the weighed quantity"
    : !Number.isFinite(weighedNumber) || weighedNumber <= 0
      ? "The weighed quantity has to be greater than zero"
      : undefined;
  const evidenceError = evidenceRef.trim() ? undefined : "Add the hand-over reference (weighbridge slip or photo id)";
  const gap = Number.isFinite(weighedNumber) ? weighedNumber - planned : 0;

  function save(): void {
    setTouched(true);
    if (weighedError || evidenceError) return;
    onHandover({ weighed: weighedNumber, evidenceRef, note, collectedAt });
  }

  return (
    <div className="stack">
      <p className="small muted" style={{ margin: 0 }}>
        The lot was listed as {planned} ton. Enter what the weighbridge actually showed; the difference is the point of
        this step, not a problem to hide.
      </p>
      <div className="form-grid form-grid-2">
        <div className="field">
          <label htmlFor="demo-weighed">Weighed quantity (ton)</label>
          <input
            className={`input${touched && weighedError ? " input-invalid" : ""}`}
            id="demo-weighed"
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={weighed}
            onChange={(event) => setWeighed(event.target.value)}
          />
          <FieldError id="demo-err-weighed" message={touched ? weighedError : undefined} />
        </div>
        <div className="field">
          <label htmlFor="demo-evidence">Hand-over reference</label>
          <input
            className={`input${touched && evidenceError ? " input-invalid" : ""}`}
            id="demo-evidence"
            type="text"
            value={evidenceRef}
            placeholder="Weighbridge slip WB-SIM-0091"
            onChange={(event) => setEvidenceRef(event.target.value)}
          />
          <FieldError id="demo-err-evidence" message={touched ? evidenceError : undefined} />
        </div>
        <div className="field">
          <label htmlFor="demo-collected">Collected at</label>
          <input
            className="input"
            id="demo-collected"
            type="datetime-local"
            value={collectedAt}
            onChange={(event) => setCollectedAt(event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="demo-handover-note">Note (optional)</label>
          <input
            className="input"
            id="demo-handover-note"
            type="text"
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </div>
      </div>

      <p className={`alert ${gap === 0 ? "alert-info" : "alert-warn"} small`} style={{ margin: 0 }}>
        {gap === 0
          ? `The weighed figure matches the ${planned} ton listing.`
          : `${Math.abs(gap).toFixed(2)} ton ${gap < 0 ? "less" : "more"} than the ${planned} ton listing.`}
      </p>

      <div className="btn-row">
        <button type="button" className="btn btn-primary" onClick={save}>
          {existing ? "Update the record" : "Record the hand-over"}
        </button>
      </div>
    </div>
  );
}

function ReviewStep({
  state,
  existing,
  onReview,
}: {
  state: DemoState;
  existing: ReviewState | null;
  onReview: (review: ReviewState) => void;
}) {
  const [note, setNote] = useState(existing?.note ?? "");
  const ready = Boolean(state.lot && state.offer && state.plan && state.handover);

  if (!ready) {
    return (
      <p className="alert alert-warn small" style={{ margin: 0 }}>
        The programme view fills in as the chain completes. Finish the pickup hand-over first.
      </p>
    );
  }

  const planned = state.lot?.quantity ?? 0;
  const weighed = state.handover?.weighed ?? 0;
  const gap = weighed - planned;
  const flags = dataQualityFlags(state);

  return (
    <div className="stack">
      <div className="grid-2">
        <div className="card">
          <h4 style={{ marginTop: 0 }}>Chain summary</h4>
          <dl className="dl">
            <dt>Lot</dt>
            <dd>
              {state.lot?.residueType}, {planned} ton, {state.lot?.areaLabel}
            </dd>
            <dt>Offer</dt>
            <dd>₹{state.offer?.pricePerTonne} per ton from {state.offer?.availableFrom}</dd>
            <dt>Pickup</dt>
            <dd>
              {state.plan?.vehicleLabel} on {state.plan?.pickupDate}
            </dd>
            <dt>Weighed</dt>
            <dd>
              {weighed} ton ({gap === 0 ? "matches listing" : `${Math.abs(gap).toFixed(2)} ton ${gap < 0 ? "short" : "over"}`})
            </dd>
            <dt>Evidence</dt>
            <dd>{state.handover?.evidenceRef}</dd>
          </dl>
        </div>

        <div className="card">
          <h4 style={{ marginTop: 0 }}>Data quality to review</h4>
          {flags.length ? (
            <ul className="small" style={{ margin: 0, paddingLeft: 18 }}>
              {flags.map((flag) => (
                <li key={flag}>{flag}</li>
              ))}
            </ul>
          ) : (
            <p className="small muted" style={{ margin: 0 }}>
              Nothing flagged.
            </p>
          )}
          <div className="field" style={{ marginTop: 12 }}>
            <label htmlFor="demo-review-note">Review note (optional)</label>
            <input
              className="input"
              id="demo-review-note"
              type="text"
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </div>
          <button type="button" className="btn btn-primary" onClick={() => onReview({ note })}>
            {existing ? "Update the review" : "Acknowledge the review"}
          </button>
        </div>
      </div>

      <div className="card">
        <h4 style={{ marginTop: 0 }}>Steps recorded in this browser</h4>
        <ul className="audit">
          {state.log.map((entry, index) => (
            <li className="audit-row" key={`${entry.at}-${index}`}>
              <span>{entry.action}</span>
              <span className="small muted mono">
                {PERSONA_LABEL[entry.persona]} · {entry.at.replace("T", " ").slice(0, 19)}
              </span>
            </li>
          ))}
        </ul>
        <p className="small muted" style={{ marginTop: 10 }}>
          Timestamps come from your device clock, and the list is rebuilt each session from the records you create.
        </p>
      </div>
    </div>
  );
}

function dataQualityFlags(state: DemoState): string[] {
  const flags: string[] = [];
  const planned = state.lot?.quantity ?? 0;
  const weighed = state.handover?.weighed ?? 0;
  if (planned && weighed && weighed !== planned) {
    const gap = weighed - planned;
    flags.push(
      `Listed ${planned} ton but weighed ${weighed} ton: ${Math.abs(gap).toFixed(2)} ton ${gap < 0 ? "below" : "above"} the listing.`,
    );
  }
  if (!state.handover?.evidenceRef) flags.push("No hand-over reference was attached.");
  flags.push("No moisture reading was recorded anywhere in the chain.");
  flags.push("The quantity is an estimate until it is weighed; the condition label is a review state, not a grade.");
  return flags;
}

function toLotFacts(lot: LotState): LotFacts {
  return {
    id: lot.id,
    residueType: lot.residueType,
    quantity: lot.quantity,
    unit: lot.unit,
    readyDate: lot.readyDate,
    areaLabel: lot.areaLabel,
    status: "OPEN",
  };
}

function toRequirementFacts(requirement: DemoRequirementFixture): RequirementFacts {
  return {
    residueType: requirement.residueType,
    quantityMin: requirement.quantityMin,
    quantityMax: requirement.quantityMax,
    unit: requirement.unit,
    windowStart: requirement.windowStart,
    windowEnd: requirement.windowEnd,
    areaLabel: requirement.areaLabel,
    radiusKm: requirement.radiusKm,
    minCondition: requirement.minCondition,
  };
}

function conditionText(label?: ConditionLabel): string {
  if (label === "buyer_review") return "Ready for buyer review";
  if (label === "needs_inspection") return "Needs inspection";
  if (label === "off_spec") return "Outside buyer specification";
  return "Not stated";
}
