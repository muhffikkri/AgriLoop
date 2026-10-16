"use client";

import { useActionState } from "react";
import { createOfferAction, type FormState } from "@/app/(workspace)/buyer/actions.ts";
import { FormFeedback, FieldError } from "@/components/ui/FormFeedback.tsx";
import type { Requirement } from "@/lib/server/db.ts";

const initialState: FormState = {};

/** Send an offer against one open lot, tied to one of the buyer's own requirements. */
export function OfferForm({
  lotId,
  lotQuantity,
  lotUnit,
  requirements,
  today,
  defaultRequirementId,
}: {
  lotId: string;
  lotQuantity: number;
  lotUnit: string;
  requirements: Requirement[];
  today: string;
  defaultRequirementId?: string;
}) {
  const [state, action, pending] = useActionState(createOfferAction, initialState);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={action} className="stack" noValidate>
      <input type="hidden" name="lotId" value={lotId} />

      <div className="field" style={{ marginBottom: 0 }}>
        <label htmlFor={`${lotId}-requirement`}>Against which requirement</label>
        <select
          className="select"
          id={`${lotId}-requirement`}
          name="requirementId"
          defaultValue={defaultRequirementId ?? requirements[0]?.id ?? ""}
          required
        >
          {requirements.map((requirement) => (
            <option key={requirement.id} value={requirement.id}>
              {requirement.id} · {requirement.residueType} · {requirement.quantityMin}-{requirement.quantityMax}{" "}
              {requirement.unit}
            </option>
          ))}
        </select>
        <p className="help">An offer is always tied to one of your own requirements.</p>
      </div>

      <div className="form-grid form-grid-2">
        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor={`${lotId}-quantity`}>Quantity to offer</label>
          <input
            className={`input${errors.quantity ? " input-invalid" : ""}`}
            id={`${lotId}-quantity`}
            name="quantity"
            type="number"
            min="0"
            max={lotQuantity}
            step="0.1"
            inputMode="decimal"
            defaultValue={lotQuantity}
            aria-invalid={errors.quantity ? true : undefined}
            aria-describedby={errors.quantity ? `err-${lotId}-quantity` : `help-${lotId}-quantity`}
            required
          />
          {errors.quantity ? (
            <FieldError id={`err-${lotId}-quantity`} message={errors.quantity} />
          ) : (
            <p className="help" id={`help-${lotId}-quantity`}>
              The lot has {lotQuantity} {lotUnit}. You cannot offer more than that.
            </p>
          )}
        </div>

        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor={`${lotId}-expires`}>Offer valid until</label>
          <input
            className="input"
            id={`${lotId}-expires`}
            name="expiresAt"
            type="date"
            min={today}
            defaultValue={today}
            aria-describedby={`help-${lotId}-expires`}
            required
          />
          <p className="help" id={`help-${lotId}-expires`}>
            Today or a later date. After that the offer can be treated as expired.
          </p>
        </div>
      </div>

      <div className="field" style={{ marginBottom: 0 }}>
        <label htmlFor={`${lotId}-terms`}>Your terms (optional)</label>
        <textarea
          className="textarea"
          id={`${lotId}-terms`}
          name="terms"
          maxLength={300}
          placeholder="e.g. buyer arranges pickup, pays after the weighbridge slip is shared"
        />
      </div>

      <div>
        <button className="btn btn-primary btn-sm" type="submit" disabled={pending}>
          {pending ? "Sending" : "Send offer"}
        </button>
      </div>
      <FormFeedback state={state} />
    </form>
  );
}
