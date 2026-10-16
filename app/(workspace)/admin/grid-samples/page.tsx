import { WorkspaceHeader } from "@/components/layout/WorkspaceShell.tsx";
import { GridMetadataForm } from "@/components/admin/GridMetadataForm.tsx";
import { SimBadge, SimNotice } from "@/components/ui/badges.tsx";
import { ErrorState } from "@/components/ui/states.tsx";
import { listGridSamples } from "@/lib/server/admin.ts";
import { getSamples } from "@/lib/server/demo.ts";
import { requirePageUser } from "@/lib/server/auth.ts";

export const metadata = { title: "Demo grids" };

export default async function AdminGridSamplesPage() {
  const user = await requirePageUser("admin");
  const result = listGridSamples(user);
  const samples = getSamples();
  const noDataMonth = samples.months.find((month) => month.noData);

  if (!result.ok) {
    return (
      <>
        <WorkspaceHeader title="Demo grids" />
        <ErrorState title="Grid metadata could not be loaded" detail={result.error} />
      </>
    );
  }

  const grids = result.value;

  return (
    <>
      <WorkspaceHeader
        title="Demo grids"
        intro="Editing on this page changes cell metadata only: the area label, district, active flag and note. The source rasters under public/satellite/** are never read or written here, and no tonnage or grade is derived from the imagery."
      />

      <SimNotice>
        Every cell below is a simulated selection extent drawn for the walkthrough. It is not a field boundary and it
        does not represent farmer land. The pixels it is drawn over are synthetic stand-ins, not an Earth Engine
        export.
      </SimNotice>

      <section className="card" style={{ padding: 0, marginTop: 16 }}>
        <div className="table-wrap">
          <table className="table">
            <caption className="sr-only">Simulated grid cells with metadata and active state</caption>
            <thead>
              <tr>
                <th scope="col">Cell</th>
                <th scope="col">Area label</th>
                <th scope="col">District</th>
                <th scope="col">Simulated</th>
                <th scope="col">Active</th>
                <th scope="col">Note</th>
              </tr>
            </thead>
            <tbody>
              {grids.map((grid) => (
                <tr key={grid.id}>
                  <td className="num">{grid.id}</td>
                  <td>{grid.areaLabel}</td>
                  <td>{grid.district}</td>
                  <td>
                    {grid.isSimulated ? (
                      <span className="badge badge-solid b-gold">Simulated</span>
                    ) : (
                      <span className="badge badge-solid b-slate">As supplied</span>
                    )}
                  </td>
                  <td>
                    {grid.active ? (
                      <span className="badge badge-solid b-green">Active</span>
                    ) : (
                      <span className="badge badge-solid b-slate">Inactive</span>
                    )}
                  </td>
                  <td>
                    <span className="small muted">{grid.note ?? "—"}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section style={{ marginTop: 22 }}>
        <h2 style={{ fontSize: "1.2rem" }}>Edit cell metadata</h2>
        <p className="small muted">
          The area label an active cell carries is offered to a farmer recording a lot. Deactivating a cell hides it
          from the public demo and from that picker, but does not delete it.
        </p>
        <div className="stack" style={{ marginTop: 8 }}>
          {grids.map((grid) => (
            <div className="card" key={grid.id}>
              <div className="card-title">
                <h3 style={{ fontSize: "1.05rem", margin: 0 }}>
                  <span className="mono">{grid.id}</span> · {grid.areaLabel}
                </h3>
                <span className="small muted">{grid.district}</span>
              </div>
              <GridMetadataForm
                grid={{
                  id: grid.id,
                  areaLabel: grid.areaLabel,
                  district: grid.district,
                  active: grid.active,
                  note: grid.note,
                }}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="card" style={{ marginTop: 22 }}>
        <div className="card-title">
          <h3 style={{ margin: 0 }}>Imagery provenance</h3>
          <SimBadge compact />
        </div>
        <dl className="dl">
          <dt>Dataset</dt>
          <dd>{samples.dataset}</dd>
          <dt>Period</dt>
          <dd>
            {samples.periodStart} to {samples.periodEnd}
          </dd>
          <dt>Resolution</dt>
          <dd>{samples.resolutionMeters} m</dd>
          <dt>CRS</dt>
          <dd>{samples.crs}</dd>
          <dt>Cloud mask</dt>
          <dd>{samples.cloudMask}</dd>
          <dt>Composite</dt>
          <dd>{samples.compositeMethod}</dd>
          <dt>Data status</dt>
          <dd>{samples.dataStatus}</dd>
          <dt>No-data month</dt>
          <dd>
            {noDataMonth
              ? `${noDataMonth.label} · valid pixels ${noDataMonth.validPixelsPercent}%`
              : "none flagged in this dataset"}
          </dd>
        </dl>
        <p className="small muted" style={{ marginTop: 12 }}>
          {samples.provenance}
        </p>
        <p className="alert alert-warn small" style={{ marginTop: 10 }}>
          Imagery is an observation of the ground surface. It is not a measurement of residue volume and it cannot
          produce a quantity or a grade for a cell. The interactive viewer lives on the public demo page, not here.
        </p>
      </section>
    </>
  );
}
