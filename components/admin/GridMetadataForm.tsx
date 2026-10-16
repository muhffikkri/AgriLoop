"use client";

import { useActionState } from "react";
import { updateGridSampleAction, type FormState } from "@/app/(workspace)/admin/actions.ts";
import { FormFeedback } from "@/components/ui/FormFeedback.tsx";

const initialState: FormState = {};

/**
 * Metadata of one demo grid cell only. The source rasters under public/satellite/** are
 * never edited here, and no tonnage or grade is derived from the imagery.
 */
export function GridMetadataForm({
  grid,
}: {
  grid: { id: string; areaLabel: string; district: string; active: boolean; note?: string };
}) {
  const [state, action, pending] = useActionState(updateGridSampleAction, initialState);

  return (
    <form action={action} className="stack" noValidate>
      <input type="hidden" name="gridId" value={grid.id} />

      <div className="form-grid form-grid-2">
        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor={`${grid.id}-area`}>Area label</label>
          <input
            className="input"
            id={`${grid.id}-area`}
            name="areaLabel"
            type="text"
            defaultValue={grid.areaLabel}
            aria-describedby={`${grid.id}-area-help`}
            required
          />
          <p className="help" id={`${grid.id}-area-help`}>
            A coarse working label, not a surveyed place name. It must not be empty.
          </p>
        </div>

        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor={`${grid.id}-district`}>District</label>
          <input
            className="input"
            id={`${grid.id}-district`}
            name="district"
            type="text"
            defaultValue={grid.district}
            aria-describedby={`${grid.id}-district-help`}
          />
          <p className="help" id={`${grid.id}-district-help`}>
            Shown beside the cell on the demo. The cell is a simulated extent, not a field boundary.
          </p>
        </div>
      </div>

      <div className="field">
        <label className="choice" htmlFor={`${grid.id}-active`} style={{ maxWidth: 460 }}>
          <input
            type="checkbox"
            id={`${grid.id}-active`}
            name="active"
            defaultChecked={grid.active}
            aria-describedby={`${grid.id}-active-help`}
          />
          <span>
            <strong>Active</strong>
            <span className="small muted" style={{ display: "block" }}>
              An inactive cell is hidden from the public demo and cannot be chosen when a farmer records a lot.
            </span>
          </span>
        </label>
        <p className="help" id={`${grid.id}-active-help`} style={{ marginTop: 6 }}>
          This flips a metadata flag. It never reads from or writes to the raster files.
        </p>
      </div>

      <div className="field" style={{ marginBottom: 0 }}>
        <label htmlFor={`${grid.id}-note`}>Note</label>
        <textarea
          className="textarea"
          id={`${grid.id}-note`}
          name="note"
          maxLength={300}
          defaultValue={grid.note ?? ""}
          aria-describedby={`${grid.id}-note-help`}
        />
        <p className="help" id={`${grid.id}-note-help`}>
          A plain remark about the cell metadata. It cannot carry a residue quantity or a quality grade.
        </p>
      </div>

      <div>
        <button className="btn btn-ghost" type="submit" disabled={pending}>
          {pending ? "Saving" : "Save grid metadata"}
        </button>
      </div>

      <FormFeedback state={state} />
    </form>
  );
}
