"use client";

import { useActionState } from "react";
import { respondOfferAction, type FormState } from "@/app/(workspace)/farmer/actions.ts";
import { FormFeedback } from "@/components/ui/FormFeedback.tsx";

const initialState: FormState = {};

const DECISIONS = [
  { value: "accept", label: "Accept", hint: "Reserves the lot and starts an order for the buyer to confirm." },
  { value: "reject", label: "Reject", hint: "Needs a reason. The buyer sees it, the lot stays open." },
  { value: "counter", label: "Ask for a change", hint: "Needs a note saying what you want changed." },
];

export function OfferResponseForm({
  offerId,
  lotId,
  quantity,
  unit,
  buyerOrg,
  requirementLabel,
  terms,
}: {
  offerId: string;
  lotId: string;
  quantity: number;
  unit: string;
  buyerOrg: string;
  requirementLabel?: string;
  terms?: string;
}) {
  const [state, action, pending] = useActionState(respondOfferAction, initialState);

  return (
    <form action={action} className="stack" style={{ borderTop: "1px solid var(--line)", paddingTop: 14, marginTop: 14 }}>
      <input type="hidden" name="offerId" value={offerId} />

      <dl className="facts">
        <div>
          <dt>Offer</dt>
          <dd className="mono">{offerId}</dd>
        </div>
        <div>
          <dt>Lot</dt>
          <dd className="mono">{lotId}</dd>
        </div>
        <div>
          <dt>Buyer</dt>
          <dd>{buyerOrg}</dd>
        </div>
        <div>
          <dt>Quantity offered</dt>
          <dd className="mono">
            {quantity} {unit}
          </dd>
        </div>
        {requirementLabel ? (
          <div>
            <dt>Against requirement</dt>
            <dd className="mono">{requirementLabel}</dd>
          </div>
        ) : null}
      </dl>

      {terms ? (
        <p className="small" style={{ margin: 0 }}>
          Buyer&apos;s terms: {terms}
        </p>
      ) : null}

      <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="field-label">Your decision</legend>
        <div className="stack">
          {DECISIONS.map((decision, index) => (
            <label key={decision.value} htmlFor={`${offerId}-${decision.value}`} className="choice">
              <input
                type="radio"
                id={`${offerId}-${decision.value}`}
                name="decision"
                value={decision.value}
                defaultChecked={index === 0}
              />
              <span>
                <strong>{decision.label}</strong>
                <span className="small muted" style={{ display: "block" }}>
                  {decision.hint}
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="field" style={{ marginBottom: 0 }}>
        <label htmlFor={`${offerId}-note`}>Note (required to reject or ask for a change)</label>
        <textarea className="textarea" id={`${offerId}-note`} name="note" maxLength={300} />
      </div>

      <div>
        <button className="btn btn-primary btn-sm" type="submit" disabled={pending}>
          {pending ? "Sending" : "Send response"}
        </button>
      </div>
      <FormFeedback state={state} />
    </form>
  );
}
