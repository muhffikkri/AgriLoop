"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createRequirementAction, updateRequirementAction, type FormState } from "@/app/(workspace)/buyer/actions.ts";
import { RESIDUE_TYPES } from "@/lib/domain/catalog.ts";
import { UNITS } from "@/lib/domain/validation.ts";
import { FormFeedback, FieldError } from "@/components/ui/FormFeedback.tsx";
import type { Requirement } from "@/lib/server/db.ts";
import type { SelectableArea } from "@/lib/server/lots.ts";

const initialState: FormState = {};

const CONDITION_OPTIONS = [
  { value: "buyer_review", label: "Ready for buyer review" },
  { value: "needs_inspection", label: "Needs inspection" },
  { value: "off_spec", label: "Outside buyer specification" },
];

/** Shared create/edit form for a buyer requirement. Edit mode reuses the same fields. */
export function RequirementForm({
  requirement,
  areas,
  today,
}: {
  requirement?: Requirement;
  areas: SelectableArea[];
  today: string;
}) {
  const editing = Boolean(requirement);
  const [state, action, pending] = useActionState(
    editing ? updateRequirementAction : createRequirementAction,
    initialState,
  );
  const errors = state.fieldErrors ?? {};

  const areaOptions = Array.from(new Set([...areas.map((area) => area.areaLabel), requirement?.areaLabel ?? ""])).filter(
    Boolean,
  );

  return (
    <form action={action} className="card" noValidate>
      {requirement ? <input type="hidden" name="requirementId" value={requirement.id} /> : null}

      <h2 style={{ fontSize: "1.25rem" }}>
        {editing ? `Edit ${requirement!.id}` : "State what you need"}
      </h2>
      <p className="small muted">
        A requirement describes the material, the volume you can take, and the delivery window. Publishing it lets
        lots be ranked against it. It is not a contract until a farmer accepts an offer.
      </p>

      <div className="form-grid form-grid-2">
        <div className="field">
          <label htmlFor="residueType">Residue type</label>
          <select
            className={`select${errors.residueType ? " input-invalid" : ""}`}
            id="residueType"
            name="residueType"
            defaultValue={requirement?.residueType ?? ""}
            aria-invalid={errors.residueType ? true : undefined}
            aria-describedby={errors.residueType ? "err-residueType" : undefined}
            required
          >
            <option value="" disabled>
              Choose the material
            </option>
            {RESIDUE_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <FieldError id="err-residueType" message={errors.residueType} />
        </div>

        <div className="field">
          <label htmlFor="unit">Unit</label>
          <select className="select" id="unit" name="unit" defaultValue={requirement?.unit ?? "ton"}>
            {UNITS.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="quantityMin">Minimum you will accept</label>
          <input
            className={`input${errors.quantityMin ? " input-invalid" : ""}`}
            id="quantityMin"
            name="quantityMin"
            type="number"
            min="0"
            step="0.1"
            inputMode="decimal"
            defaultValue={requirement?.quantityMin ?? ""}
            aria-invalid={errors.quantityMin ? true : undefined}
            aria-describedby={errors.quantityMin ? "err-quantityMin" : "help-quantity"}
            required
          />
          {errors.quantityMin ? (
            <FieldError id="err-quantityMin" message={errors.quantityMin} />
          ) : (
            <p className="help" id="help-quantity">
              Lots below this size are marked as not matching.
            </p>
          )}
        </div>

        <div className="field">
          <label htmlFor="quantityMax">Maximum you can take</label>
          <input
            className={`input${errors.quantityMax ? " input-invalid" : ""}`}
            id="quantityMax"
            name="quantityMax"
            type="number"
            min="0"
            step="0.1"
            inputMode="decimal"
            defaultValue={requirement?.quantityMax ?? ""}
            aria-invalid={errors.quantityMax ? true : undefined}
            aria-describedby={errors.quantityMax ? "err-quantityMax" : undefined}
            required
          />
          <FieldError id="err-quantityMax" message={errors.quantityMax} />
        </div>

        <div className="field">
          <label htmlFor="windowStart">Delivery window from</label>
          <input
            className={`input${errors.windowStart ? " input-invalid" : ""}`}
            id="windowStart"
            name="windowStart"
            type="date"
            defaultValue={requirement?.windowStart ?? ""}
            aria-invalid={errors.windowStart ? true : undefined}
            aria-describedby={errors.windowStart ? "err-windowStart" : undefined}
            required
          />
          <FieldError id="err-windowStart" message={errors.windowStart} />
        </div>

        <div className="field">
          <label htmlFor="windowEnd">Delivery window to</label>
          <input
            className={`input${errors.windowEnd ? " input-invalid" : ""}`}
            id="windowEnd"
            name="windowEnd"
            type="date"
            min={requirement?.windowStart ?? today}
            defaultValue={requirement?.windowEnd ?? ""}
            aria-invalid={errors.windowEnd ? true : undefined}
            aria-describedby={errors.windowEnd ? "err-windowEnd" : undefined}
            required
          />
          <FieldError id="err-windowEnd" message={errors.windowEnd} />
        </div>

        <div className="field">
          <label htmlFor="areaLabel">Search area</label>
          <select
            className={`select${errors.areaLabel ? " input-invalid" : ""}`}
            id="areaLabel"
            name="areaLabel"
            defaultValue={requirement?.areaLabel ?? ""}
            aria-invalid={errors.areaLabel ? true : undefined}
            aria-describedby={errors.areaLabel ? "err-areaLabel" : "help-area"}
            required
          >
            <option value="" disabled>
              Choose the area
            </option>
            {areaOptions.map((label) => (
              <option key={label} value={label}>
                {label}
              </option>
            ))}
          </select>
          {errors.areaLabel ? (
            <FieldError id="err-areaLabel" message={errors.areaLabel} />
          ) : (
            <p className="help" id="help-area">
              A coarse area label, not a delivery address.
            </p>
          )}
        </div>

        <div className="field">
          <label htmlFor="radiusKm">Search radius (km)</label>
          <input
            className={`input${errors.radiusKm ? " input-invalid" : ""}`}
            id="radiusKm"
            name="radiusKm"
            type="number"
            min="1"
            max="500"
            step="1"
            inputMode="numeric"
            defaultValue={requirement?.radiusKm ?? ""}
            aria-invalid={errors.radiusKm ? true : undefined}
            aria-describedby={errors.radiusKm ? "err-radiusKm" : "help-radius"}
            required
          />
          {errors.radiusKm ? (
            <FieldError id="err-radiusKm" message={errors.radiusKm} />
          ) : (
            <p className="help" id="help-radius">
              Between 1 and 500 km. Distance affects the ranking, it is not a hard cut-off on its own.
            </p>
          )}
        </div>

        <div className="field">
          <label htmlFor="minCondition">Lowest condition you will consider</label>
          <select className="select" id="minCondition" name="minCondition" defaultValue={requirement?.minCondition ?? "buyer_review"}>
            {CONDITION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="help">
            A condition label is a working note from the farmer or an enumerator. It is not a quality certificate.
          </p>
        </div>
      </div>

      <div className="field">
        <label htmlFor="notes">Notes for the farmer (optional)</label>
        <textarea
          className={`textarea${errors.notes ? " input-invalid" : ""}`}
          id="notes"
          name="notes"
          maxLength={500}
          defaultValue={requirement?.notes ?? ""}
          aria-describedby={errors.notes ? "err-notes" : "help-notes"}
        />
        {errors.notes ? (
          <FieldError id="err-notes" message={errors.notes} />
        ) : (
          <p className="help" id="help-notes">
            Anything a farmer should know before offering, such as bale size or moisture you will check on arrival.
          </p>
        )}
      </div>

      <div className="field">
        <label className="choice" htmlFor="substitution">
          <input
            type="checkbox"
            id="substitution"
            name="substitution"
            defaultChecked={requirement?.substitution ?? false}
          />
          <span>
            <strong>Substitution is acceptable</strong>
            <span className="small muted" style={{ display: "block" }}>
              A close residue type from the same crop family can be offered instead.
            </span>
          </span>
        </label>
      </div>

      <div className="btn-row">
        <button className="btn btn-primary" type="submit" name="intent" value="publish" disabled={pending}>
          {pending ? "Saving" : editing ? "Save changes" : "Publish requirement"}
        </button>
        {!editing ? (
          <button className="btn btn-ghost" type="submit" name="intent" value="draft" disabled={pending}>
            Save as draft
          </button>
        ) : null}
        <Link className="btn btn-ghost" href={editing ? `/buyer/requirements/${requirement!.id}` : "/buyer/requirements"}>
          Cancel
        </Link>
      </div>

      <FormFeedback state={state} />
    </form>
  );
}
