"use client";

import { useActionState } from "react";
import { recordPickupAction, type FormState } from "@/app/(workspace)/aggregator/actions.ts";
import { FormFeedback } from "@/components/ui/FormFeedback.tsx";

const initialState: FormState = {};

/**
 * Records one stop's hand-over: the weighed quantity, the time and the reference.
 * The recorded weight is the weighing figure; any difference from the listed quantity
 * stays on the record rather than being corrected silently.
 */
export function RecordPickupForm({
  planId,
  orderId,
  listedQuantity,
  unit,
  existing,
}: {
  planId: string;
  orderId: string;
  listedQuantity: number;
  unit: string;
  existing?: { actualQuantity: number; collectedAt: string; evidenceRef?: string; note?: string };
}) {
  const [state, action, pending] = useActionState(recordPickupAction, initialState);
  const prefix = `${planId}-${orderId}`;

  return (
    <form action={action} className="stack" noValidate>
      <input type="hidden" name="planId" value={planId} />
      <input type="hidden" name="orderId" value={orderId} />

      <div className="form-grid form-grid-2">
        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor={`${prefix}-qty`}>Weighed quantity ({unit})</label>
          <input
            className="input"
            id={`${prefix}-qty`}
            name="actualQuantity"
            type="number"
            min="0"
            step="0.1"
            inputMode="decimal"
            defaultValue={existing && existing.actualQuantity > 0 ? existing.actualQuantity : ""}
            aria-describedby={`${prefix}-qty-help`}
            required
          />
          <p className="help" id={`${prefix}-qty-help`}>
            The weighing figure, greater than zero. The listed quantity is{" "}
            <span className="mono">
              {listedQuantity} {unit}
            </span>
            ; a difference stays on the record.
          </p>
        </div>

        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor={`${prefix}-time`}>Collection time</label>
          <input
            className="input"
            id={`${prefix}-time`}
            name="collectedAt"
            type="datetime-local"
            defaultValue={existing?.collectedAt ?? ""}
            required
          />
          <p className="help">When the material left the field.</p>
        </div>
      </div>

      <div className="field" style={{ marginBottom: 0 }}>
        <label htmlFor={`${prefix}-evidence`}>Hand-over reference</label>
        <input
          className="input"
          id={`${prefix}-evidence`}
          name="evidenceRef"
          type="text"
          placeholder="e.g. weighbridge slip 4471 or photo ref IMG-2210"
          defaultValue={existing?.evidenceRef ?? ""}
          aria-describedby={`${prefix}-evidence-help`}
          required
        />
        <p className="help" id={`${prefix}-evidence-help`}>
          A weighbridge slip number or a photo id. This is the evidence tied to the recorded weight.
        </p>
      </div>

      <div className="field" style={{ marginBottom: 0 }}>
        <label htmlFor={`${prefix}-note`}>Note (optional)</label>
        <textarea className="textarea" id={`${prefix}-note`} name="note" maxLength={300} defaultValue={existing?.note ?? ""} />
      </div>

      <div>
        <button className="btn btn-primary btn-sm" type="submit" disabled={pending}>
          {pending ? "Recording" : existing && existing.collectedAt ? "Update hand-over" : "Record hand-over"}
        </button>
      </div>

      <FormFeedback state={state} />
    </form>
  );
}
