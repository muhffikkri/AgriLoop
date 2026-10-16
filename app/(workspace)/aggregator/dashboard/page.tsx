import Link from "next/link";
import { WorkspaceHeader } from "@/components/layout/WorkspaceShell.tsx";
import { AuditList } from "@/components/ui/AuditList.tsx";
import { EmptyState, StatGrid } from "@/components/ui/states.tsx";
import { StatusBadge } from "@/components/ui/badges.tsx";
import { aggregatorSummary, availableOrders, myPlans, plannedQuantity } from "@/lib/server/collections.ts";
import { requirePageUser } from "@/lib/server/auth.ts";
import { readStore } from "@/lib/server/db.ts";

export const metadata = { title: "Collector overview" };

export default async function AggregatorDashboardPage() {
  const user = await requirePageUser("aggregator");
  const summary = aggregatorSummary(user);
  const plans = myPlans(user);
  const openPlans = plans.filter(
    (plan) => plan.status === "PLANNED" || plan.status === "CONFIRMED" || plan.status === "IN_PROGRESS" || plan.status === "RESCHEDULED",
  );
  const queue = availableOrders(user);
  const history = readStore()
    .audit.filter((event) => event.actorId === user.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 12);

  return (
    <>
      <WorkspaceHeader
        title={`Good to see you, ${user.name.split(" ")[0]}`}
        intro="Everything here concerns the pickup plans your account or your organisation holds. The work queue shows the active orders that are not yet on a live plan."
        actions={
          <>
            <Link className="btn btn-primary" href="/aggregator/collections">
              New pickup plan
            </Link>
            <Link className="btn btn-ghost" href="/aggregator/available-lots">
              Available work
            </Link>
          </>
        }
      />

      <StatGrid
        items={[
          { label: "Pickup plans", value: summary.plans, hint: "Your plans and your organisation's" },
          { label: "Still open", value: summary.open, hint: "Planned, confirmed or in progress" },
          { label: "Completed", value: summary.completed, hint: "Every stop handed over" },
          { label: "Available work", value: summary.availableOrders, hint: "Active orders not yet on a plan" },
        ]}
      />

      <div className="split" style={{ marginTop: 22 }}>
        <section className="card">
          <div className="card-title">
            <h2 style={{ fontSize: "1.2rem", margin: 0 }}>Your open plans</h2>
            <Link className="small" href="/aggregator/collections">
              All plans
            </Link>
          </div>
          {openPlans.length ? (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">Plan</th>
                    <th scope="col">Vehicle</th>
                    <th scope="col">Date</th>
                    <th scope="col">Stops</th>
                    <th scope="col">Planned</th>
                    <th scope="col">Status</th>
                    <th scope="col" />
                  </tr>
                </thead>
                <tbody>
                  {openPlans.slice(0, 5).map((plan) => {
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
              title="No open plan"
              hint="Select work from the queue, name a vehicle and set a pickup date. Each plan holds the stops for one trip."
              action={
                <Link className="btn btn-primary btn-sm" href="/aggregator/collections">
                  Start a plan
                </Link>
              }
            />
          )}
        </section>

        <section className="card">
          <div className="card-title">
            <h2 style={{ fontSize: "1.2rem", margin: 0 }}>Waiting for a plan</h2>
            <Link className="small" href="/aggregator/available-lots">
              Full queue
            </Link>
          </div>
          {queue.length ? (
            <ul className="audit">
              {queue.slice(0, 4).map(({ order, lot }) => (
                <li className="audit-row" key={order.id}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 600 }}>
                      {lot.id} · {lot.quantity} {lot.unit}
                    </p>
                    <p className="small muted" style={{ margin: "2px 0 0" }}>
                      {order.id} · {lot.farmerOrg} · {lot.areaLabel}
                    </p>
                  </div>
                  <Link className="small" href="/aggregator/available-lots">
                    Plan it
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="Nothing in the queue"
              hint="An order enters the queue when a buyer confirms the agreement on an accepted offer and it is not yet on a plan."
            />
          )}
        </section>
      </div>

      <div className="split" style={{ marginTop: 22 }}>
        <section className="card">
          <h2 style={{ fontSize: "1.2rem" }}>Your recent activity</h2>
          <p className="small muted">Only actions your account took. Other accounts never appear here.</p>
          <AuditList events={history} />
        </section>

        <section className="card">
          <h2 style={{ fontSize: "1.2rem" }}>Planned against weighed</h2>
          <ul className="meta-list">
            <li>
              <span className="k">Planned total</span>
              <span className="mono">{summary.plannedTotal}</span>
            </li>
            <li>
              <span className="k">Weighed so far</span>
              <span className="mono">{summary.actualTotal}</span>
            </li>
            <li>
              <span className="k">Difference</span>
              <span className="mono">{summary.variance}%</span>
            </li>
          </ul>
          <p className="small muted" style={{ marginTop: 14 }}>
            The planned total comes from the lot quantities. The weighed total is what each hand-over recorded. A
            difference is kept on the record, never corrected away.
          </p>
          <p className="small muted" style={{ marginBottom: 0 }}>
            You see each farmer&apos;s organisation and a coarse area label, never a name, phone number or exact
            coordinates.
          </p>
        </section>
      </div>
    </>
  );
}
