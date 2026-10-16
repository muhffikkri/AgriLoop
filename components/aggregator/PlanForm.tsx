"use client";

import { useActionState, useState } from "react";
import { createPlanAction, type FormState } from "@/app/(workspace)/aggregator/actions.ts";
import { FormFeedback } from "@/components/ui/FormFeedback.tsx";
import { UNITS } from "@/lib/domain/validation.ts";

const initialState: FormState = {};

/** One row of the available-work queue, flattened so it can cross to the client. */
export type QueueRow = {
  orderId: string;
  lotId: string;
  quantity: number;
  unit: string;
  residueType: string;
  farmerOrg: string;
  areaLabel: string;
  buyerOrg: string;
};

/**
 * Builds a pickup plan from the available-work queue. The planned total and the chosen
 * capacity are shown together so the operator sees the limit before submitting; the
 * server still refuses a plan that is over capacity or mixes units.
 */
export function CreatePlanForm({
  rows,
  today,
  preselected = [],
}: {
  rows: QueueRow[];
  today: string;
  preselected?: string[];
}) {
  const [state, action, pending] = useActionState(createPlanAction, initialState);
  const available = rows.map((row) => row.orderId);
  const [selected, setSelected] = useState<string[]>(preselected.filter((id) => available.includes(id)));
  const [unit, setUnit] = useState(rows[0]?.unit ?? "ton");
  const [capacity, setCapacity] = useState("");

  const chosen = rows.filter((row) => selected.includes(row.orderId));
  const total = chosen.reduce((sum, row) => sum + row.quantity, 0);
  const mismatched = chosen.filter((row) => row.unit !== unit);
  const capacityValue = Number(capacity);
  const over = Number.isFinite(capacityValue) && capacityValue > 0 && total > capacityValue;

  const toggle = (orderId: string) => {
    setSelected((current) =>
      current.includes(orderId) ? current.filter((id) => id !== orderId) : [...current, orderId],
    );
  };

  return (
    <form action={action} className="card" noValidate>
      <h2 style={{ fontSize: "1.25rem" }}>Start a pickup plan</h2>
      <p className="small muted">
        Pick the stops to work. The plan holds the vehicle, its capacity and the date; each stop gets its own
        pickup record once the material is handed over.
      </p>

      <fieldset style={{ border: 0, padding: 0, margin: "0 0 16px" }}>
        <legend className="field-label">Stops to include</legend>
        {rows.length ? (
          <div className="stack">
            {rows.map((row) => (
              <label className="choice" htmlFor={`create-${row.orderId}`} key={row.orderId}>
                <input
                  type="checkbox"
                  id={`create-${row.orderId}`}
                  name="orderIds"
                  value={row.orderId}
                  checked={selected.includes(row.orderId)}
                  onChange={() => toggle(row.orderId)}
                />
                <span>
                  <strong>
                    {row.lotId} · {row.quantity} {row.unit} {row.residueType}
                  </strong>
                  <span className="small muted" style={{ display: "block" }}>
                    {row.orderId} · {row.farmerOrg} · {row.areaLabel} · for {row.buyerOrg}
                  </span>
                </span>
              </label>
            ))}
          </div>
        ) : (
          <p className="alert alert-info" style={{ margin: 0 }}>
            No active order is waiting for a plan right now. Orders appear here once a buyer confirms an
            agreement on an accepted offer.
          </p>
        )}
      </fieldset>

      <p className={over || mismatched.length ? "alert alert-warn" : "alert alert-info"} role="status" style={{ marginTop: 0 }}>
        Planned <span className="mono">{total}</span> {unit} across {chosen.length} stop(s)
        {capacity ? (
          <>
            {" "}
            against a <span className="mono">{Number.isFinite(capacityValue) ? capacityValue : 0}</span> {unit} capacity
          </>
        ) : null}
        . {over ? "That is above the vehicle capacity, so the server will refuse the plan. " : ""}
        {mismatched.length
          ? `A selected lot is measured in ${mismatched[0].unit}, so the capacity unit does not match every lot. The server refuses a plan whose capacity unit differs from a lot's unit.`
          : "The capacity unit has to match every selected lot's unit."}
      </p>

      <div className="form-grid form-grid-2">
        <div className="field">
          <label htmlFor="vehicleLabel">Vehicle</label>
          <input
            className="input"
            id="vehicleLabel"
            name="vehicleLabel"
            type="text"
            placeholder="e.g. Tractor trolley 2"
            required
          />
          <p className="help">A label the driver and the farmer both recognise.</p>
        </div>

        <div className="field">
          <label htmlFor="vehicleCapacity">Vehicle capacity</label>
          <input
            className="input"
            id="vehicleCapacity"
            name="vehicleCapacity"
            type="number"
            min="0"
            step="0.1"
            inputMode="decimal"
            value={capacity}
            onChange={(event) => setCapacity(event.target.value)}
            required
          />
          <p className="help">The sum of the planned lot quantities cannot exceed this figure.</p>
        </div>

        <div className="field">
          <label htmlFor="capacityUnit">Capacity unit</label>
          <select
            className="select"
            id="capacityUnit"
            name="capacityUnit"
            value={unit}
            onChange={(event) => setUnit(event.target.value)}
          >
            {UNITS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <p className="help">Every lot on the plan has to use the same unit.</p>
        </div>

        <div className="field">
          <label htmlFor="plannedAt">Pickup date</label>
          <input className="input" id="plannedAt" name="plannedAt" type="date" min={today} required />
          <p className="help">Today or later. The date can be changed until the plan is finished.</p>
        </div>
      </div>

      <div className="field">
        <label htmlFor="plan-note">Note for this trip (optional)</label>
        <textarea
          className="textarea"
          id="plan-note"
          name="note"
          maxLength={300}
          placeholder="e.g. farm gate access confirmed, weighbridge is on the way"
        />
      </div>

      <div className="btn-row">
        <button className="btn btn-primary" type="submit" disabled={pending || !rows.length}>
          {pending ? "Creating" : "Create plan"}
        </button>
      </div>

      <FormFeedback state={state} />
    </form>
  );
}
