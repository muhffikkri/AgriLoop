"use client";

import { useActionState } from "react";
import {
  addObservationAction,
  publishLotAction,
  recordConditionAction,
  withdrawLotAction,
  type FormState,
} from "@/app/(workspace)/farmer/actions.ts";
import { FormFeedback, FieldError } from "@/components/ui/FormFeedback.tsx";
import { STORAGE_OPTIONS } from "@/lib/domain/catalog.ts";

const initialState: FormState = {};

const CONDITION_OPTIONS = [
  { value: "buyer_review", label: "Ready for buyer review" },
  { value: "needs_inspection", label: "Needs inspection" },
  { value: "off_spec", label: "Outside buyer specification" },
];

export function PublishForm({ lotId }: { lotId: string }) {
  const [state, action, pending] = useActionState(publishLotAction, initialState);
  return (
    <form action={action}>
      <input type="hidden" name="lotId" value={lotId} />
      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Publishing" : "Publish for buyers"}
      </button>
      <FormFeedback state={state} />
    </form>
  );
}

export function WithdrawForm({ lotId }: { lotId: string }) {
  const [state, action, pending] = useActionState(withdrawLotAction, initialState);
  return (
    <form action={action} className="stack">
      <input type="hidden" name="lotId" value={lotId} />
      <div className="field" style={{ marginBottom: 0 }}>
        <label htmlFor="withdraw-reason">Reason for withdrawing</label>
        <textarea
          className="textarea"
          id="withdraw-reason"
          name="reason"
          maxLength={300}
          required
          aria-describedby="help-withdraw"
        />
        <p className="help" id="help-withdraw">
          Stored on the record. A lot that already has a confirmed order cannot be withdrawn this way.
        </p>
      </div>
      <button className="btn btn-danger" type="submit" disabled={pending}>
        {pending ? "Withdrawing" : "Withdraw lot"}
      </button>
      <FormFeedback state={state} />
    </form>
  );
}

export function ConditionForm({ lotId, current }: { lotId: string; current?: string }) {
  const [state, action, pending] = useActionState(recordConditionAction, initialState);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={action} className="stack">
      <input type="hidden" name="lotId" value={lotId} />
      <div className="field" style={{ marginBottom: 0 }}>
        <label htmlFor="condition-label">Condition label</label>
        <select className="select" id="condition-label" name="label" defaultValue={current ?? "buyer_review"} required>
          {CONDITION_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <p className="help">
          A working note for the buyer. It is not a quality certificate and does not replace inspection.
        </p>
      </div>

      <div className="field" style={{ marginBottom: 0 }}>
        <label htmlFor="condition-source">Who checked it</label>
        <select className="select" id="condition-source" name="source" defaultValue="farmer">
          <option value="farmer">The farmer or the group</option>
          <option value="enumerator">A field enumerator visited</option>
        </select>
      </div>

      <div className="field" style={{ marginBottom: 0 }}>
        <label htmlFor="condition-note">What did you observe (optional)</label>
        <textarea className="textarea" id="condition-note" name="note" maxLength={300} />
        <FieldError id="err-condition" message={errors.label} />
      </div>

      <button className="btn btn-ghost" type="submit" disabled={pending}>
        {pending ? "Saving" : "Save condition note"}
      </button>
      <FormFeedback state={state} />
    </form>
  );
}

export function ObservationForm({ lotId }: { lotId: string }) {
  const [state, action, pending] = useActionState(addObservationAction, initialState);

  return (
    <form action={action} className="stack">
      <input type="hidden" name="lotId" value={lotId} />
      <div className="form-grid form-grid-2">
        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor="obs-harvest">Harvest date</label>
          <input className="input" id="obs-harvest" name="harvestDate" type="date" />
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor="obs-storage">Storage</label>
          <select className="select" id="obs-storage" name="storage" defaultValue="">
            <option value="">Not stated</option>
            {STORAGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor="obs-rain">Rain exposure</label>
          <input className="input" id="obs-rain" name="rainExposure" type="text" placeholder="e.g. two wet days" />
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor="obs-moisture">Moisture (%)</label>
          <input className="input" id="obs-moisture" name="moisturePercent" type="number" min="0" max="100" step="0.1" />
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor="obs-method">How moisture was measured</label>
          <input className="input" id="obs-method" name="measureMethod" type="text" placeholder="e.g. handheld meter, one reading" />
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor="obs-image">Image quality</label>
          <input className="input" id="obs-image" name="imageQuality" type="text" placeholder="e.g. three photos, daylight" />
        </div>
      </div>
      <div className="field" style={{ marginBottom: 0 }}>
        <label htmlFor="obs-note">Note</label>
        <textarea className="textarea" id="obs-note" name="note" maxLength={300} />
      </div>
      <button className="btn btn-ghost" type="submit" disabled={pending}>
        {pending ? "Adding" : "Add field observation"}
      </button>
      <FormFeedback state={state} />
    </form>
  );
}
