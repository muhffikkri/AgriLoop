"use client";

import { useActionState, useState } from "react";
import {
  closeOrderAction,
  confirmAgreementAction,
  recordReceiptAction,
  type FormState,
} from "@/app/(workspace)/buyer/actions.ts";
import { FormFeedback, FieldError } from "@/components/ui/FormFeedback.tsx";

const initialState: FormState = {};

export type DisputeOption = { value: string; label: string };

export function ConfirmAgreementForm({ orderId }: { orderId: string }) {
  const [state, action, pending] = useActionState(confirmAgreementAction, initialState);

  return (
    <form action={action}>
      <input type="hidden" name="orderId" value={orderId} />
      <button className="btn btn-primary btn-sm" type="submit" disabled={pending}>
        {pending ? "Confirming" : "Confirm the agreement"}
      </button>
      <FormFeedback state={state} />
    </form>
  );
}

export function RecordReceiptForm({
  orderId,
  agreedQuantity,
  disputeOptions,
}: {
  orderId: string;
  agreedQuantity: number;
  disputeOptions: DisputeOption[];
}) {
  const [state, action, pending] = useActionState(recordReceiptAction, initialState);
  const [dispute, setDispute] = useState(false);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={action} className="stack" noValidate>
      <input type="hidden" name="orderId" value={orderId} />

      <div className="field" style={{ marginBottom: 0 }}>
        <label htmlFor={`${orderId}-received`}>Quantity that actually arrived</label>
        <input
          className={`input${errors.receivedQuantity ? " input-invalid" : ""}`}
          id={`${orderId}-received`}
          name="receivedQuantity"
          type="number"
          min="0"
          step="0.1"
          inputMode="decimal"
          defaultValue={agreedQuantity}
          aria-invalid={errors.receivedQuantity ? true : undefined}
          aria-describedby={errors.receivedQuantity ? `err-${orderId}-received` : `help-${orderId}-received`}
          required
        />
        {errors.receivedQuantity ? (
          <FieldError id={`err-${orderId}-received`} message={errors.receivedQuantity} />
        ) : (
          <p className="help" id={`help-${orderId}-received`}>
            Record the weighed figure, even when it differs from the {agreedQuantity} agreed. The gap is kept on the
            record.
          </p>
        )}
      </div>

      <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="field-label">Was the delivery accepted</legend>
        <div className="stack">
          <label className="choice" htmlFor={`${orderId}-accept`}>
            <input
              type="radio"
              id={`${orderId}-accept`}
              name="decision"
              value="accept"
              checked={!dispute}
              onChange={() => setDispute(false)}
            />
            <span>
              <strong>Accept the delivery</strong>
              <span className="small muted" style={{ display: "block" }}>
                The material is usable. The order can be closed once receipt is recorded.
              </span>
            </span>
          </label>
          <label className="choice" htmlFor={`${orderId}-dispute`}>
            <input
              type="radio"
              id={`${orderId}-dispute`}
              name="decision"
              value="dispute"
              checked={dispute}
              onChange={() => setDispute(true)}
            />
            <span>
              <strong>Open a dispute</strong>
              <span className="small muted" style={{ display: "block" }}>
                Something was wrong with the delivery. An admin reviews it with the reason you give.
              </span>
            </span>
          </label>
        </div>
      </fieldset>

      {dispute ? (
        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor={`${orderId}-category`}>What was wrong</label>
          <select className="select" id={`${orderId}-category`} name="category" defaultValue="" required>
            <option value="" disabled>
              Choose the closest category
            </option>
            {disputeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="help">A category is a label for reporting. The detail goes in the note below.</p>
        </div>
      ) : null}

      <div className="field" style={{ marginBottom: 0 }}>
        <label htmlFor={`${orderId}-reason`}>
          {dispute ? "Describe what was wrong" : "A short note on the delivered condition"}
        </label>
        <textarea
          className="textarea"
          id={`${orderId}-reason`}
          name="reason"
          maxLength={300}
          required
          aria-describedby={errors.reason ? `err-${orderId}-reason` : undefined}
        />
        <FieldError id={`err-${orderId}-reason`} message={errors.reason} />
      </div>

      <div>
        <button className={`btn ${dispute ? "btn-danger" : "btn-primary"} btn-sm`} type="submit" disabled={pending}>
          {pending ? "Saving" : dispute ? "Open the dispute" : "Record receipt"}
        </button>
      </div>
      <FormFeedback state={state} />
    </form>
  );
}

export function CloseOrderForm({ orderId }: { orderId: string }) {
  const [state, action, pending] = useActionState(closeOrderAction, initialState);

  return (
    <form action={action}>
      <input type="hidden" name="orderId" value={orderId} />
      <button className="btn btn-ghost btn-sm" type="submit" disabled={pending}>
        {pending ? "Closing" : "Close this order"}
      </button>
      <FormFeedback state={state} />
    </form>
  );
}
