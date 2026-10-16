import Link from "next/link";
import { WorkspaceHeader } from "@/components/layout/WorkspaceShell.tsx";
import { CreatePlanForm, type QueueRow } from "@/components/aggregator/PlanForm.tsx";
import { StatusBadge } from "@/components/ui/badges.tsx";
import { EmptyState } from "@/components/ui/states.tsx";
import { availableOrders, myPlans, plannedQuantity } from "@/lib/server/collections.ts";
import { requirePageUser } from "@/lib/server/auth.ts";
import { todayIso } from "@/lib/server/db.ts";

export const metadata = { title: "Pickup plans" };

export default async function AggregatorCollectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string | string[] }>;
}) {
  const user = await requirePageUser("aggregator");
  const params = await searchParams;
  const requested = params.order ? (Array.isArray(params.order) ? params.order : [params.order]) : [];

  const queue = availableOrders(user);
  const rows: QueueRow[] = queue.map(({ order, lot }) => ({
    orderId: order.id,
    lotId: lot.id,
    quantity: lot.quantity,
    unit: lot.unit,
    residueType: lot.residueType,
    farmerOrg: lot.farmerOrg,
    areaLabel: lot.areaLabel,
    buyerOrg: order.buyerOrg,
  }));
  const preselected = requested.filter((id) => rows.some((row) => row.orderId === id));

  const plans = myPlans(user);

  return (
    <>
      <WorkspaceHeader
        title="Pickup plans"
        intro="A plan is one trip: the stops it covers, the vehicle, its capacity and the date. The summed lot quantities cannot exceed the vehicle capacity, and every lot on a plan has to share the capacity unit."
        actions={
          <Link className="btn btn-ghost" href="/aggregator/available-lots">
            Available work
          </Link>
        }
      />

      <CreatePlanForm rows={rows} today={todayIso()} preselected={preselected} />

      <section className="card" style={{ marginTop: 22 }}>
        <div className="card-title">
          <h2 style={{ fontSize: "1.2rem", margin: 0 }}>Your plans</h2>
          <span className="small muted">{plans.length} plan(s)</span>
        </div>

        {plans.length ? (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Plan</th>
                  <th scope="col">Vehicle</th>
                  <th scope="col">Date</th>
                  <th scope="col">Stops</th>
                  <th scope="col">Planned vs capacity</th>
                  <th scope="col">Status</th>
                  <th scope="col" />
                </tr>
              </thead>
              <tbody>
                {plans.map((plan) => {
                  const planned = plannedQuantity(plan.orderIds);
                  return (
                    <tr key={plan.id}>
                      <td className="num">{plan.id}</td>
                      <td>{plan.vehicleLabel}</td>
                      <td className="num">{plan.plannedAt}</td>
                      <td className="num">{plan.orderIds.length}</td>
                      <td className="num">
                        {planned}/{plan.vehicleCapacity} {plan.capacityUnit}
                      </td>
                      <td>
                        <StatusBadge status={plan.status} />
                      </td>
                      <td>
                        <Link className="small" href={`/aggregator/collections/${plan.id}`}>
                          Open
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No pickup plan yet"
            hint="Tick an order in the queue above, name the vehicle and set a capacity and date. The plan then holds a stop for each order it covers."
            action={
              <Link className="btn btn-ghost btn-sm" href="/aggregator/available-lots">
                See available work
              </Link>
            }
          />
        )}
      </section>
    </>
  );
}
