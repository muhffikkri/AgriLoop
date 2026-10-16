"use client";

import { useActionState } from "react";
import { confirmReadinessAction, type FormState } from "@/app/(workspace)/farmer/actions.ts";
import { FormFeedback } from "@/components/ui/FormFeedback.tsx";

const initialState: FormState = {};

export function ReadinessForm({ planId, orderId }: { planId: string; orderId: string }) {
  const [state, action, pending] = useActionState(confirmReadinessAction, initialState);

  return (
    <form action={action}>
      <input type="hidden" name="planId" value={planId} />
      <input type="hidden" name="orderId" value={orderId} />
      <button className="btn btn-primary btn-sm" type="submit" disabled={pending}>
        {pending ? "Confirming" : "Confirm the lot is ready"}
      </button>
      <FormFeedback state={state} />
    </form>
  );
}
