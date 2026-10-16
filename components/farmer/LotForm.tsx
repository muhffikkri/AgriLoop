"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { createLotAction, updateLotAction, type FormState } from "@/app/(workspace)/farmer/actions.ts";
import { CROPS, RESIDUE_TYPES, STORAGE_OPTIONS } from "@/lib/domain/catalog.ts";
import { UNITS } from "@/lib/domain/validation.ts";
import { FormFeedback, FieldError } from "@/components/ui/FormFeedback.tsx";
import type { Lot } from "@/lib/server/db.ts";
import type { SelectableArea } from "@/lib/server/lots.ts";

const initialState: FormState = {};

export function LotForm({
  lot,
  areas,
  today,
}: {
  lot?: Lot;
  areas: SelectableArea[];
  today: string;
}) {
  const editing = Boolean(lot);
  const [state, action, pending] = useActionState(editing ? updateLotAction : createLotAction, initialState);
  const [areaId, setAreaId] = useState(lot?.areaId ?? areas[0]?.id ?? "");
  const errors = state.fieldErrors ?? {};
  const areaLabel = areas.find((area) => area.id === areaId)?.areaLabel ?? lot?.areaLabel ?? "";

  return (
    <form action={action} className="card" noValidate>
      {lot ? <input type="hidden" name="lotId" value={lot.id} /> : null}
      <input type="hidden" name="areaLabel" value={areaLabel} />

      <h2 style={{ fontSize: "1.25rem" }}>{editing ? `Edit ${lot!.id}` : "Describe a lot"}</h2>
      <p className="small muted">
        Only what you enter here is shown to buyers. Your phone number never leaves your profile.
      </p>

      <div className="form-grid form-grid-2">
        <div className="field">
          <label htmlFor="residueType">Residue type</label>
          <select
            className={`select${errors.residueType ? " input-invalid" : ""}`}
            id="residueType"
            name="residueType"
            defaultValue={lot?.residueType ?? ""}
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
          <label htmlFor="crop">Crop it came from</label>
          <select
            className={`select${errors.crop ? " input-invalid" : ""}`}
            id="crop"
            name="crop"
            defaultValue={lot?.crop ?? ""}
            aria-invalid={errors.crop ? true : undefined}
            aria-describedby={errors.crop ? "err-crop" : undefined}
            required
          >
            <option value="" disabled>
              Choose the crop
            </option>
            {CROPS.map((crop) => (
              <option key={crop} value={crop}>
                {crop}
              </option>
            ))}
          </select>
          <FieldError id="err-crop" message={errors.crop} />
        </div>

        <div className="field">
          <label htmlFor="quantity">Quantity you expect</label>
          <input
            className={`input${errors.quantity ? " input-invalid" : ""}`}
            id="quantity"
            name="quantity"
            type="number"
            min="0"
            step="0.1"
            inputMode="decimal"
            defaultValue={lot?.quantity ?? ""}
            aria-invalid={errors.quantity ? true : undefined}
            aria-describedby={errors.quantity ? "err-quantity" : "help-quantity"}
            required
          />
          {errors.quantity ? (
            <FieldError id="err-quantity" message={errors.quantity} />
          ) : (
            <p className="help" id="help-quantity">
              An estimate is fine. It is checked against the weighed amount at pickup.
            </p>
          )}
        </div>

        <div className="field">
          <label htmlFor="unit">Unit</label>
          <select className="select" id="unit" name="unit" defaultValue={lot?.unit ?? "ton"}>
            {UNITS.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="readyDate">Ready from</label>
          <input
            className={`input${errors.readyDate ? " input-invalid" : ""}`}
            id="readyDate"
            name="readyDate"
            type="date"
            min={today}
            defaultValue={lot?.readyDate ?? ""}
            aria-invalid={errors.readyDate ? true : undefined}
            aria-describedby={errors.readyDate ? "err-readyDate" : undefined}
            required
          />
          <FieldError id="err-readyDate" message={errors.readyDate} />
        </div>

        <div className="field">
          <label htmlFor="areaId">Area or grid cell</label>
          <select
            className="select"
            id="areaId"
            name="areaId"
            value={areaId}
            onChange={(event) => setAreaId(event.target.value)}
            required
          >
            {areas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.areaLabel} ({area.id})
              </option>
            ))}
          </select>
          <p className="help">A coarse cell label, not your field boundary.</p>
        </div>

        <div className="field">
          <label htmlFor="harvestDate">Harvest date (optional)</label>
          <input
            className={`input${errors.harvestDate ? " input-invalid" : ""}`}
            id="harvestDate"
            name="harvestDate"
            type="date"
            max={lot?.readyDate}
            defaultValue={lot?.harvestDate ?? ""}
            aria-describedby={errors.harvestDate ? "err-harvestDate" : undefined}
          />
          <FieldError id="err-harvestDate" message={errors.harvestDate} />
        </div>

        <div className="field">
          <label htmlFor="storage">How it is stored</label>
          <select className="select" id="storage" name="storage" defaultValue={lot?.storage ?? ""}>
            <option value="">Not stated</option>
            {STORAGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="moisturePercent">Moisture reading (optional)</label>
          <input
            className={`input${errors.moisturePercent ? " input-invalid" : ""}`}
            id="moisturePercent"
            name="moisturePercent"
            type="number"
            min="0"
            max="100"
            step="0.1"
            inputMode="decimal"
            defaultValue={lot?.moisturePercent ?? ""}
            aria-describedby={errors.moisturePercent ? "err-moisture" : "help-moisture"}
          />
          {errors.moisturePercent ? (
            <FieldError id="err-moisture" message={errors.moisturePercent} />
          ) : (
            <p className="help" id="help-moisture">
              Percent, if you measured it. Leave empty rather than guessing.
            </p>
          )}
        </div>

        <div className="field">
          <label htmlFor="photoRef">Photo reference (optional)</label>
          <input
            className="input"
            id="photoRef"
            name="photoRef"
            type="text"
            defaultValue={lot?.photoRef ?? ""}
            aria-describedby="help-photo"
          />
          <p className="help" id="help-photo">
            A filename or link to your own photos. This prototype does not upload files.
          </p>
        </div>
      </div>

      <div className="field">
        <label htmlFor="notes">Notes for the buyer (optional)</label>
        <textarea
          className={`textarea${errors.notes ? " input-invalid" : ""}`}
          id="notes"
          name="notes"
          maxLength={500}
          defaultValue={lot?.notes ?? ""}
          aria-describedby={errors.notes ? "err-notes" : "help-notes"}
        />
        {errors.notes ? (
          <FieldError id="err-notes" message={errors.notes} />
        ) : (
          <p className="help" id="help-notes">
            Access, baling, loading help, anything a collector should know. Up to 500 characters.
          </p>
        )}
      </div>

      <div className="btn-row">
        <button className="btn btn-primary" type="submit" disabled={pending}>
          {pending ? "Saving" : editing ? "Save changes" : "Save as draft"}
        </button>
        <Link className="btn btn-ghost" href={editing ? `/farmer/supply/${lot!.id}` : "/farmer/supply"}>
          Cancel
        </Link>
      </div>

      <FormFeedback state={state} />
    </form>
  );
}
