import { WorkspaceHeader } from "@/components/layout/WorkspaceShell.tsx";
import { SimNotice } from "@/components/ui/badges.tsx";
import { EmptyState } from "@/components/ui/states.tsx";
import { requirePageUser } from "@/lib/server/auth.ts";
import { readStore, type Lot } from "@/lib/server/db.ts";

export const metadata = { title: "Areas" };

type AreaGroup = {
  areaId: string;
  areaLabel: string;
  lots: Lot[];
};

/** Coverage is a read-only view, so it is rebuilt directly from the store grouping lots. */
function groupByArea(lots: Lot[]): AreaGroup[] {
  const groups = new Map<string, AreaGroup>();
  for (const lot of lots) {
    const key = `${lot.areaId}::${lot.areaLabel}`;
    const group = groups.get(key) ?? { areaId: lot.areaId, areaLabel: lot.areaLabel, lots: [] };
    group.lots.push(lot);
    groups.set(key, group);
  }
  return [...groups.values()].sort((a, b) => a.areaLabel.localeCompare(b.areaLabel));
}

export default async function AdminAreasPage() {
  const user = await requirePageUser("admin");
  const store = readStore();
  const groups = groupByArea(store.lots);

  return (
    <>
      <WorkspaceHeader
        title="Areas"
        intro="Coverage grouped by the coarse area label a lot carries, with the demo cell that shares the same id. Read-only: coverage is derived from the records, never edited here."
      />

      <SimNotice>
        A grid cell is a simulated extent drawn for the walkthrough. It is not a field boundary, it does not belong to
        any farmer, and it says nothing about how much residue exists. Area labels are coarse working labels, not
        surveyed place names.
      </SimNotice>

      {groups.length ? (
        <section className="card" style={{ padding: 0, marginTop: 16 }}>
          <div className="table-wrap">
            <table className="table">
              <caption className="sr-only">Area coverage with lot counts, owning organisations and the matching demo cell</caption>
              <thead>
                <tr>
                  <th scope="col">Area</th>
                  <th scope="col">Lots</th>
                  <th scope="col">Open</th>
                  <th scope="col">Past open</th>
                  <th scope="col">Organisations</th>
                  <th scope="col">Demo cell</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((group) => {
                  const open = group.lots.filter((lot) => lot.status === "OPEN").length;
                  const orgs = [...new Set(group.lots.map((lot) => lot.farmerOrg))].sort((a, b) => a.localeCompare(b));
                  const grid = store.grids.find((candidate) => candidate.id === group.areaId);
                  return (
                    <tr key={`${group.areaId}::${group.areaLabel}`}>
                      <td>
                        {group.areaLabel}
                        <span className="mono small muted" style={{ display: "block" }}>
                          {group.areaId}
                        </span>
                      </td>
                      <td className="num">{group.lots.length}</td>
                      <td className="num">{open}</td>
                      <td className="num">{group.lots.length - open}</td>
                      <td>{orgs.join(", ")}</td>
                      <td>
                        {grid ? (
                          <>
                            <span className="mono">{grid.id}</span>
                            <span className="small muted" style={{ display: "block" }}>
                              {grid.district} · {grid.active ? "active" : "inactive"} ·{" "}
                              {grid.isSimulated ? "simulated extent" : "as supplied"}
                            </span>
                          </>
                        ) : (
                          <span className="small muted">No demo cell shares this id</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <div style={{ marginTop: 16 }}>
          <EmptyState
            title="No lot has been recorded yet"
            hint="An area appears here once a farmer records a lot against one of the demo cells."
          />
        </div>
      )}

      <p className="small muted" style={{ marginTop: 16 }}>
        Organisations are shown by name only. This view carries no farmer name, phone number or exact coordinate.
        Coverage counts are prototype figures from the bundled demo dataset.
      </p>
    </>
  );
}
