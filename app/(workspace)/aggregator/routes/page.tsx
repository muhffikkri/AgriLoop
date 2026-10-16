import Link from "next/link";
import { WorkspaceHeader } from "@/components/layout/WorkspaceShell.tsx";
import { RouteOrderForm, type RouteStop } from "@/components/aggregator/RouteOrderForm.tsx";
import { StatusBadge } from "@/components/ui/badges.tsx";
import { EmptyState } from "@/components/ui/states.tsx";
import { myPlans, planRows } from "@/lib/server/collections.ts";
import { requirePageUser } from "@/lib/server/auth.ts";

export const metadata = { title: "Route notes" };

export default async function AggregatorRoutesPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const user = await requirePageUser("aggregator");
  const { plan: planParam } = await searchParams;

  const plans = myPlans(user);
  const editablePlans = plans.filter((plan) => plan.status !== "COMPLETED" && plan.status !== "FAILED");
  const selected =
    plans.find((plan) => plan.id === planParam) ?? editablePlans[0] ?? plans[0];

  const rows = selected ? planRows(selected) : [];
  const stopIndex = (orderId: string) => {
    if (!selected) return 0;
    const position = selected.stopOrder.indexOf(orderId);
    return position === -1 ? selected.orderIds.indexOf(orderId) : position;
  };
  const stops: RouteStop[] = [...rows]
    .sort((a, b) => stopIndex(a.order.id) - stopIndex(b.order.id))
    .map((row) => ({
      orderId: row.order.id,
      lotId: row.lot.id,
      quantity: row.lot.quantity,
      unit: row.lot.unit,
      farmerOrg: row.lot.farmerOrg,
      areaLabel: row.lot.areaLabel,
    }));

  const editable = Boolean(selected) && stops.length > 0 && selected!.status !== "COMPLETED" && selected!.status !== "FAILED";

  return (
    <>
      <WorkspaceHeader
        title="Route notes"
        intro="Choose one of your plans to set the order the stops are worked in and keep a note on the trip. The order is a working sequence for the driver; it does not change the date or the capacity."
        actions={
          <Link className="btn btn-ghost" href="/aggregator/collections">
            Pickup plans
          </Link>
        }
      />

      {plans.length ? (
        <>
          <form method="get" className="card" style={{ marginBottom: 18 }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <label htmlFor="plan">Plan</label>
              <select className="select" id="plan" name="plan" defaultValue={selected?.id ?? ""}>
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.id} · {plan.vehicleLabel} · {plan.plannedAt} · {plan.status}
                  </option>
                ))}
              </select>
              <p className="help">Only your own plans and your organisation&apos;s plans appear here.</p>
            </div>
            <div className="btn-row" style={{ marginTop: 14 }}>
              <button className="btn btn-ghost btn-sm" type="submit">
                Show this plan
              </button>
            </div>
          </form>

          {selected ? (
            <section className="card">
              <div className="card-title">
                <h2 style={{ fontSize: "1.2rem", margin: 0 }}>
                  {selected.id} · {selected.vehicleLabel}
                </h2>
                <StatusBadge status={selected.status} />
              </div>
              <p className="small muted">
                Pickup date {selected.plannedAt} · {stops.length} stop(s).{" "}
                <Link href={`/aggregator/collections/${selected.id}`}>Open the plan detail</Link>
              </p>

              {editable ? (
                <RouteOrderForm planId={selected.id} stops={stops} note={selected.note ?? ""} />
              ) : stops.length === 0 ? (
                <p className="small muted" style={{ margin: 0 }}>
                  This plan has no stops to order.
                </p>
              ) : (
                <>
                  <p className="alert alert-info" style={{ marginTop: 0 }}>
                    This plan is {selected.status.toLowerCase()}, so its route and note are locked. The order below is
                    what the trip was worked in.
                  </p>
                  <ol className="audit" style={{ margin: 0 }}>
                    {stops.map((stop, index) => (
                      <li className="audit-row" key={stop.orderId}>
                        <div>
                          <p style={{ margin: 0, fontWeight: 600 }}>
                            <span className="mono">{index + 1}.</span> {stop.lotId} · {stop.quantity} {stop.unit}
                          </p>
                          <p className="small muted" style={{ margin: "2px 0 0" }}>
                            {stop.orderId} · {stop.farmerOrg} · {stop.areaLabel}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                  {selected.note ? (
                    <p className="small muted" style={{ marginTop: 14, marginBottom: 0 }}>
                      Plan note: {selected.note}
                    </p>
                  ) : null}
                </>
              )}
            </section>
          ) : null}
        </>
      ) : (
        <EmptyState
          title="No plan to route yet"
          hint="Create a pickup plan first. Once it holds stops, come back to set the order they are worked in and add a note."
          action={
            <Link className="btn btn-primary btn-sm" href="/aggregator/collections">
              Start a plan
            </Link>
          }
        />
      )}

      <p className="small muted" style={{ marginTop: 18 }}>
        The stop order is a working sequence, not a guarantee about road conditions or timing. The plan note is shown
        to the farmer and stays on the record; clearing the box removes it.
      </p>
    </>
  );
}
