"use client";

import { useActionState, useState } from "react";
import { setPlanStatusAction, type FormState } from "@/app/(workspace)/aggregator/actions.ts";
import { FormFeedback } from "@/components/ui/FormFeedback.tsx";
import type { PickupStatus } from "@/lib/domain/status.ts";

const initialState: FormState = {};

function statusLabel(status: PickupStatus): string {
  return status.replace(/_/g, " ").toLowerCase().replace(/^./, (letter) => letter.toUpperCase());
}

const STATUS_HINT: Partial<Record<PickupStatus, string>> = {
  CONFIRMED: "The vehicle and the date are agreed with the farmer.",
  IN_PROGRESS: "The trip has started and loading is under way.",
  COMPLETED: "Every stop has a recorded hand-over. The plan closes here.",
  RESCHEDULED: "The date or vehicle changed. A reason is required.",
  FAILED: "The trip could not go ahead. A reason is required and the lots go back to reserved.",
};

/**
 * Offers only the transitions allowed from the current status, mirroring the pickup
 * state machine. A reschedule or failure needs a reason; the server enforces that too.
 */
export function PlanStatusForm({
  planId,
  current,
  allowed,
}: {
  planId: string;
  current: PickupStatus;
  allowed: PickupStatus[];
}) {
  const [state, action, pending] = useActionState(setPlanStatusAction, initialState);
  const [next, setNext] = useState<PickupStatus | "">(allowed[0] ?? "");
  const needsNote = next === "RESCHEDULED" || next === "FAILED";

  if (!allowed.length) {
    return (
      <p className="small muted" style={{ margin: 0 }}>
        No further status change is offered from <strong>{statusLabel(current)}</strong>.
      </p>
    );
  }

  return (
    <form action={action} className="stack">
      <input type="hidden" name="planId" value={planId} />

      <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="field-label">Move this plan to</legend>
        <div className="stack">
          {allowed.map((status) => (
            <label className="choice" htmlFor={`${planId}-${status}`} key={status}>
              <input
                type="radio"
                id={`${planId}-${status}`}
                name="next"
                value={status}
                checked={next === status}
                onChange={() => setNext(status)}
              />
              <span>
                <strong>{statusLabel(status)}</strong>
                {STATUS_HINT[status] ? (
                  <span className="small muted" style={{ display: "block" }}>
                    {STATUS_HINT[status]}
                  </span>
                ) : null}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="field" style={{ marginBottom: 0 }}>
        <label htmlFor={`${planId}-status-note`}>
          {needsNote ? "Reason (required)" : "Reason (optional)"}
        </label>
        <textarea
          className="textarea"
          id={`${planId}-status-note`}
          name="note"
          maxLength={300}
          required={needsNote}
          aria-describedby={`${planId}-status-note-help`}
        />
        <p className="help" id={`${planId}-status-note-help`}>
          Saved on the pickup record with your name and the time. {needsNote ? "This step needs a reason." : "Add one when it helps the farmer understand the change."}
        </p>
      </div>

      <div>
        <button className="btn btn-primary" type="submit" disabled={pending || !next}>
          {pending ? "Saving" : next ? `Move to ${statusLabel(next as PickupStatus)}` : "Move plan"}
        </button>
      </div>

      <FormFeedback state={state} />
    </form>
  );
}
