import Link from "next/link";
import { WorkspaceHeader } from "@/components/layout/WorkspaceShell.tsx";
import { ReadinessForm } from "@/components/farmer/ReadinessForm.tsx";
import { StatusBadge } from "@/components/ui/badges.tsx";
import { EmptyState } from "@/components/ui/states.tsx";
import { stopsForFarmer } from "@/lib/server/collections.ts";
import { requirePageUser } from "@/lib/server/auth.ts";

export const metadata = { title: "Pickups" };

export default async function FarmerCollectionsPage() {
  const user = await requirePageUser("farmer");
  const stops = stopsForFarmer(user);

  return (
    <>
      <WorkspaceHeader
        title="Pickups"
        intro="When a collector schedules a trip for your order, the stop appears here. Confirming readiness tells the driver the lot is accessible and safe to load."
      />

      {stops.length ? (
        <div className="stack">
          {stops.map((stop) => {
            const closed = stop.plan.status === "COMPLETED" || stop.plan.status === "FAILED";
            return (
              <section className="card" key={`${stop.plan.id}-${stop.order.id}`}>
                <div className="card-title">
                  <h2 style={{ fontSize: "1.15rem", margin: 0 }}>
                    {stop.plan.vehicleLabel} · {stop.plan.plannedAt}
                  </h2>
                  <StatusBadge status={stop.plan.status} />
                </div>
                <dl className="facts">
                  <div>
                    <dt>Plan</dt>
                    <dd className="mono">{stop.plan.id}</dd>
                  </div>
                  <div>
                    <dt>Order</dt>
                    <dd className="mono">{stop.order.id}</dd>
                  </div>
                  <div>
                    <dt>Lot</dt>
                    <dd className="mono">
                      <Link href={`/farmer/supply/${stop.lot.id}`}>{stop.lot.id}</Link>
                    </dd>
                  </div>
                  <div>
                    <dt>Agreed quantity</dt>
                    <dd className="mono">
                      {stop.order.agreedQuantity} {stop.order.unit}
                    </dd>
                  </div>
                  <div>
                    <dt>Buyer</dt>
                    <dd>{stop.order.buyerOrg}</dd>
                  </div>
                  <div>
                    <dt>Weighed at pickup</dt>
                    <dd className="mono">
                      {stop.record.collectedAt
                        ? `${stop.record.actualQuantity} ${stop.record.unit} on ${stop.record.collectedAt}`
                        : "not collected yet"}
                    </dd>
                  </div>
                </dl>
                {stop.plan.note ? (
                  <p className="small muted" style={{ marginTop: 10 }}>
                    Collector&apos;s note: {stop.plan.note}
                  </p>
                ) : null}

                <div style={{ marginTop: 14 }}>
                  {closed ? (
                    <p className="small muted" style={{ margin: 0 }}>
                      This plan is {stop.plan.status.toLowerCase()}, so there is nothing to confirm.
                    </p>
                  ) : stop.record.readyConfirmed ? (
                    <p className="alert alert-info" style={{ margin: 0 }}>
                      Readiness confirmed. The collector sees that this stop is ready.
                    </p>
                  ) : (
                    <ReadinessForm planId={stop.plan.id} orderId={stop.order.id} />
                  )}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No pickup scheduled"
          hint="A collector plans a trip once a buyer confirms the agreement on an accepted offer. You will see the stop here before the driver leaves."
          action={
            <Link className="btn btn-ghost" href="/farmer/offers">
              Review your offers
            </Link>
          }
        />
      )}

      <p className="small muted" style={{ marginTop: 18 }}>
        The weighed quantity is recorded at hand-over by the collector. Any difference from the quantity you
        listed stays on the record rather than being quietly corrected.
      </p>
    </>
  );
}
