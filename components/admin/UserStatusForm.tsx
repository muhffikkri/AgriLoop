"use client";

import { useActionState, useState } from "react";
import { setUserStatusAction, type FormState } from "@/app/(workspace)/admin/actions.ts";
import { FormFeedback } from "@/components/ui/FormFeedback.tsx";
import type { User } from "@/lib/server/db.ts";

const initialState: FormState = {};

/**
 * Block or reactivate one account. A block needs a recorded reason; the server refuses
 * the change without one, and it refuses blocking the signed-in admin's own account.
 */
export function UserStatusForm({
  userId,
  name,
  status,
}: {
  userId: string;
  name: string;
  status: User["status"];
}) {
  const [state, action, pending] = useActionState(setUserStatusAction, initialState);
  const [decision, setDecision] = useState<"block" | "reactivate">(
    status === "blocked" ? "reactivate" : "block",
  );
  const needsReason = decision === "block";

  return (
    <form action={action} className="stack">
      <input type="hidden" name="userId" value={userId} />

      <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="field-label">Status for {name}</legend>
        <div className="stack">
          <label className="choice" htmlFor={`${userId}-block`}>
            <input
              type="radio"
              id={`${userId}-block`}
              name="decision"
              value="block"
              checked={decision === "block"}
              onChange={() => setDecision("block")}
            />
            <span>
              <strong>Block this account</strong>
              <span className="small muted" style={{ display: "block" }}>
                The account can no longer sign in. A reason is required and is kept on the record.
              </span>
            </span>
          </label>
          <label className="choice" htmlFor={`${userId}-reactivate`}>
            <input
              type="radio"
              id={`${userId}-reactivate`}
              name="decision"
              value="reactivate"
              checked={decision === "reactivate"}
              onChange={() => setDecision("reactivate")}
            />
            <span>
              <strong>Reactivate this account</strong>
              <span className="small muted" style={{ display: "block" }}>
                The account can sign in again. Any earlier block note is cleared.
              </span>
            </span>
          </label>
        </div>
      </fieldset>

      <div className="field" style={{ marginBottom: 0 }}>
        <label htmlFor={`${userId}-status-reason`}>
          {needsReason ? "Reason for the block (required)" : "Reason (optional)"}
        </label>
        <textarea
          className="textarea"
          id={`${userId}-status-reason`}
          name="reason"
          maxLength={300}
          required={needsReason}
          aria-describedby={`${userId}-status-reason-help`}
        />
        <p className="help" id={`${userId}-status-reason-help`}>
          Saved on the audit log with your name and the time. {needsReason ? "A block without a reason is refused." : "Add one when it helps another admin understand the change."}
        </p>
      </div>

      <div>
        <button className={`btn ${needsReason ? "btn-danger" : "btn-primary"} btn-sm`} type="submit" disabled={pending}>
          {pending ? "Saving" : needsReason ? "Block the account" : "Reactivate the account"}
        </button>
      </div>

      <FormFeedback state={state} />
    </form>
  );
}
