import { WorkspaceHeader } from "@/components/layout/WorkspaceShell.tsx";
import { SimNotice } from "@/components/ui/badges.tsx";
import { EmptyState, ErrorState, StatGrid } from "@/components/ui/states.tsx";
import { dataQuality } from "@/lib/server/admin.ts";
import { requirePageUser } from "@/lib/server/auth.ts";

export const metadata = { title: "Data quality" };

function variance(value: number): string {
  return `${value > 0 ? "+" : ""}${value}%`;
}

export default async function AdminDataQualityPage() {
  const user = await requirePageUser("admin");
  const result = dataQuality(user);

  if (!result.ok) {
    return (
      <>
        <WorkspaceHeader title="Data quality" />
        <ErrorState title="Data quality could not be loaded" detail={result.error} />
      </>
    );
  }

  const data = result.value;

  return (
    <>
      <WorkspaceHeader
        title="Data quality"
        intro="Where records are thin, and how listed quantities sit against weighed ones. This is a working checklist for follow-up, not a score for any account."
      />

      <StatGrid
        items={[
          { label: "Lots with no condition label", value: data.lotsWithoutCondition, hint: "No working note for a buyer" },
          { label: "Lots with no moisture figure", value: data.lotsWithoutMoisture, hint: "Not measured or not entered" },
          { label: "Lots with no photo", value: data.lotsWithoutPhoto, hint: "No reference image attached" },
          { label: "Offers pending over a week", value: data.staleOffers, hint: "Sent, still unanswered" },
          { label: "Orders awaiting buyer", value: data.awaitingBuyer, hint: "Not yet confirmed" },
          { label: "Open disputes", value: data.openDisputes, hint: "Waiting on a decision" },
          { label: "Blocked accounts", value: data.blockedAccounts, hint: "Cannot sign in" },
        ]}
      />

      <section className="card" style={{ marginTop: 22, padding: 0 }}>
        <div className="card-title" style={{ padding: "20px 20px 0" }}>
          <h2 style={{ fontSize: "1.2rem", margin: 0 }}>Listed against weighed</h2>
          <span className="small muted">{data.estimateRows.length} order(s) with a weighed figure</span>
        </div>
        {data.estimateRows.length ? (
          <div className="table-wrap">
            <table className="table">
              <caption className="sr-only">Orders comparing the listed agreed quantity against the weighed quantity</caption>
              <thead>
                <tr>
                  <th scope="col">Order</th>
                  <th scope="col">Listed quantity</th>
                  <th scope="col">Weighed quantity</th>
                  <th scope="col">Variance</th>
                </tr>
              </thead>
              <tbody>
                {data.estimateRows.map((row) => (
                  <tr key={row.orderId}>
                    <td className="num">{row.orderId}</td>
                    <td className="num">
                      {row.agreed} {row.unit}
                    </td>
                    <td className="num">
                      {row.actual} {row.unit}
                    </td>
                    <td className="num">{variance(row.variancePercent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: "0 20px 20px" }}>
            <EmptyState
              title="Nothing weighed yet"
              hint="A row appears once a pickup hand-over records an actual quantity that can be set against the listed figure."
            />
          </div>
        )}
      </section>

      <p className="small muted" style={{ marginTop: 16 }}>
        &ldquo;Listed against weighed&rdquo; compares an estimate to a measurement. It is an honest record of the gap
        between the two, not a correction of either figure, and it is never derived from imagery. Counts are prototype
        figures from the bundled demo dataset.
      </p>

      <div style={{ marginTop: 16 }}>
        <SimNotice>
          Missing-field counters cover the demo records only. A blank field is reported as blank rather than filled in
          with a guess.
        </SimNotice>
      </div>
    </>
  );
}
