"use client";

import { useActionState } from "react";
import { cancelRequirementAction, publishRequirementAction, type FormState } from "@/app/(workspace)/buyer/actions.ts";
import { FormFeedback } from "@/components/ui/FormFeedback.tsx";

const initialState: FormState = {};

export function PublishRequirementForm({ requirementId }: { requirementId: string }) {
  const [state, action, pending] = useActionState(publishRequirementAction, initialState);

  return (
    <form action={action}>
      <input type="hidden" name="requirementId" value={requirementId} />
      <button className="btn btn-primary btn-sm" type="submit" disabled={pending}>
        {pending ? "Publishing" : "Publish requirement"}
      </button>
      <FormFeedback state={state} />
    </form>
  );
}

export function CancelRequirementForm({ requirementId }: { requirementId: string }) {
  const [state, action, pending] = useActionState(cancelRequirementAction, initialState);

  return (
    <form action={action} className="stack">
      <input type="hidden" name="requirementId" value={requirementId} />
      <div className="field" style={{ marginBottom: 0 }}>
        <label htmlFor="cancel-reason">Reason for cancelling</label>
        <textarea
          className="textarea"
          id="cancel-reason"
          name="reason"
          maxLength={300}
          required
          aria-describedby="help-cancel"
        />
        <p className="help" id="help-cancel">
          Stored on the record so the decision stays traceable. Cancelling is final and cannot be undone.
        </p>
      </div>
      <button className="btn btn-danger" type="submit" disabled={pending}>
        {pending ? "Cancelling" : "Cancel requirement"}
      </button>
      <FormFeedback state={state} />
    </form>
  );
}
