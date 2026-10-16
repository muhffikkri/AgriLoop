"use client";

import { useActionState } from "react";
import { updatePlanAction, type FormState } from "@/app/(workspace)/aggregator/actions.ts";
import { FormFeedback } from "@/components/ui/FormFeedback.tsx";

const initialState: FormState = {};

/** Editable fields of an existing plan. The server still refuses a capacity below the planned total. */
export function PlanChangeForm({
  plan,
  plannedTotal,
  today,
}: {
  plan: {
    id: string;
    plannedAt: string;
    vehicleLabel: string;
    vehicleCapacity: number;
    capacityUnit: string;
  };
  plannedTotal: number;
  today: string;
}) {
  const [state, action, pending] = useActionState(updatePlanAction, initialState);

  return (
    <form action={action} className="stack" noValidate>
      <input type="hidden" name="planId" value={plan.id} />

      <div className="form-grid form-grid-2">
        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor={`${plan.id}-vehicle`}>Vehicle</label>
          <input className="input" id={`${plan.id}-vehicle`} name="vehicleLabel" type="text" defaultValue={plan.vehicleLabel} required />
        </div>

        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor={`${plan.id}-capacity`}>Vehicle capacity</label>
          <input
            className="input"
            id={`${plan.id}-capacity`}
            name="vehicleCapacity"
            type="number"
            min="0"
            step="0.1"
            inputMode="decimal"
            defaultValue={plan.vehicleCapacity}
            aria-describedby={`${plan.id}-capacity-help`}
            required
          />
          <p className="help" id={`${plan.id}-capacity-help`}>
            This plan holds <span className="mono">{plannedTotal}</span> {plan.capacityUnit}. A capacity below that is
            refused.
          </p>
        </div>

        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor={`${plan.id}-date`}>Pickup date</label>
          <input className="input" id={`${plan.id}-date`} name="plannedAt" type="date" min={today} defaultValue={plan.plannedAt} required />
        </div>
      </div>

      <div>
        <button className="btn btn-ghost" type="submit" disabled={pending}>
          {pending ? "Saving" : "Save plan details"}
        </button>
      </div>

      <FormFeedback state={state} />
    </form>
  );
}
