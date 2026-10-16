import Link from "next/link";
import { WorkspaceHeader } from "@/components/layout/WorkspaceShell.tsx";
import { ConditionBadge, StatusBadge } from "@/components/ui/badges.tsx";
import { EmptyState } from "@/components/ui/states.tsx";
import { availableOrders } from "@/lib/server/collections.ts";
import { requirePageUser } from "@/lib/server/auth.ts";

export const metadata = { title: "Available work" };

/**
 * G1 work queue: the active orders that no live plan covers yet, with the lot facts an
 * operator needs to decide. Ticking stops carries them to the plan builder.
 */
export default async function AvailableLotsPage() {
  const user = await requirePageUser("aggregator");
  const queue = availableOrders(user);

  return (
    <>
      <WorkspaceHeader
        title="Available work"
        intro="Active orders that are not on a live plan yet. A lot appears here once a buyer confirms the agreement on an accepted offer and no plan covers it."
        actions={
          <Link className="btn btn-ghost" href="/aggregator/collections">
            Pickup plans
          </Link>
        }
      />

      {queue.length ? (
        <form method="get" action="/aggregator/collections" className="card">
          <div className="card-title">
            <h2 style={{ fontSize: "1.2rem", margin: 0 }}>Orders waiting to be worked</h2>
            <span className="small muted">{queue.length} order(s)</span>
          </div>
          <p className="small muted">
            Tick the stops you want on one trip, then continue. The plan builder asks for a vehicle, its capacity and
            a date, and shows the running planned total against that capacity.
          </p>

          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Use</th>
                  <th scope="col">Order</th>
                  <th scope="col">Lot</th>
                  <th scope="col">Material</th>
                  <th scope="col">Quantity</th>
                  <th scope="col">Ready from</th>
                  <th scope="col">Area</th>
                  <th scope="col">Farmer</th>
                  <th scope="col">Buyer</th>
                  <th scope="col">Condition note</th>
                </tr>
              </thead>
              <tbody>
                {queue.map(({ order, lot }) => (
                  <tr key={order.id}>
                    <td>
                      <input
                        type="checkbox"
                        id={`queue-${order.id}`}
                        name="order"
                        value={order.id}
                        aria-label={`Include ${order.id} in a new plan`}
                      />
                    </td>
                    <td className="num">{order.id}</td>
                    <td className="num">{lot.id}</td>
                    <td>{lot.residueType}</td>
                    <td className="num">
                      {lot.quantity} {lot.unit}
                    </td>
                    <td className="num">{lot.readyDate}</td>
                    <td>{lot.areaLabel}</td>
                    <td>{lot.farmerOrg}</td>
                    <td>{order.buyerOrg}</td>
                    <td>
                      <ConditionBadge label={lot.conditionLabel} />
                      <div style={{ marginTop: 4 }}>
                        <StatusBadge status={order.status} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="btn-row" style={{ marginTop: 16 }}>
            <button className="btn btn-primary" type="submit">
              Continue to a plan
            </button>
          </div>
        </form>
      ) : (
        <EmptyState
          title="The queue is empty"
          hint="Every active order is already on a plan, or no buyer has confirmed an agreement yet. New work appears here as buyers confirm."
          action={
            <Link className="btn btn-ghost" href="/aggregator/collections">
              Review your plans
            </Link>
          }
        />
      )}

      <p className="small muted" style={{ marginTop: 18 }}>
        A condition label is a working note from the farmer or an enumerator, not a quality certificate. The listed
        quantity is what the farmer recorded, not a weighbridge figure. You see the farmer&apos;s organisation and a
        coarse area label only, never a name, contact detail or exact field boundary.
      </p>
    </>
  );
}
