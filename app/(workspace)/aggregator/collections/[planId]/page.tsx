import Link from "next/link";
import { notFound } from "next/navigation";
import { WorkspaceHeader } from "@/components/layout/WorkspaceShell.tsx";
import { PlanChangeForm } from "@/components/aggregator/PlanChangeForm.tsx";
import { PlanStatusForm } from "@/components/aggregator/PlanStatusForm.tsx";
import { RecordPickupForm } from "@/components/aggregator/RecordPickupForm.tsx";
import { AuditList } from "@/components/ui/AuditList.tsx";
import { StatusBadge } from "@/components/ui/badges.tsx";
import { planById, planRows, plannedQuantity } from "@/lib/server/collections.ts";
import { requirePageUser } from "@/lib/server/auth.ts";
import { readStore, todayIso } from "@/lib/server/db.ts";
import { PICKUP_TRANSITIONS } from "@/lib/domain/status.ts";

export const metadata = { title: "Plan detail" };

export default async function PlanDetailPage({ params }: { params: Promise<{ planId: string }> }) {
  const user = await requirePageUser("aggregator");
  const { planId } = await params;

  const plan = planById(user, planId);
  if (!plan) notFound();

  const rows = planRows(plan);
  const stopIndex = (orderId: string) => {
    const position = plan.stopOrder.indexOf(orderId);
    return position === -1 ? plan.orderIds.indexOf(orderId) : position;
  };
  const ordered = [...rows].sort((a, b) => stopIndex(a.order.id) - stopIndex(b.order.id));

  const plannedTotal = plannedQuantity(plan.orderIds);
  const pending = rows.filter((row) => !row.record.collectedAt);
  const closed = plan.status === "COMPLETED" || plan.status === "FAILED";
  const editable = !closed;
  const recorded = plan.status !== "FAILED" && plan.status !== "COMPLETED";

  const allowed = PICKUP_TRANSITIONS[plan.status];
  const offered = pending.length ? allowed.filter((status) => status !== "COMPLETED") : allowed;

  const history = readStore()
    .audit.filter((event) => event.entityType === "pickup" && event.entityId === plan.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <>
      <WorkspaceHeader
        title={`Plan ${plan.id}`}
        intro={
          <span>
            <StatusBadge status={plan.status} /> {plan.vehicleLabel} · {plan.plannedAt} · {plan.orderIds.length} stop(s)
          </span>
        }
        actions={
          <Link className="btn btn-ghost" href="/aggregator/collections">
            Back to plans
          </Link>
        }
      />

      <div className="split">
        <div className="stack">
          <section className="card">
            <h2 style={{ fontSize: "1.2rem" }}>The trip</h2>
            <dl className="facts">
              <div>
                <dt>Vehicle</dt>
                <dd>{plan.vehicleLabel}</dd>
              </div>
              <div>
                <dt>Capacity</dt>
                <dd className="mono">
                  {plan.vehicleCapacity} {plan.capacityUnit}
                </dd>
              </div>
              <div>
                <dt>Planned total</dt>
                <dd className="mono">
                  {plannedTotal} {plan.capacityUnit}
                </dd>
              </div>
              <div>
                <dt>Pickup date</dt>
                <dd className="mono">{plan.plannedAt}</dd>
              </div>
              <div>
                <dt>Organisation</dt>
                <dd>{plan.aggregatorOrg}</dd>
              </div>
              <div>
                <dt>Last updated</dt>
                <dd className="mono">{plan.updatedAt.slice(0, 16).replace("T", " ")}</dd>
              </div>
            </dl>
            {plan.note ? (
              <p style={{ marginTop: 14, marginBottom: 0 }}>
                <strong>Plan note:</strong> {plan.note}
              </p>
            ) : null}
          </section>

          <section className="card">
            <div className="card-title">
              <h2 style={{ fontSize: "1.2rem", margin: 0 }}>Stops in order</h2>
              <span className="small muted">
                {rows.length - pending.length}/{rows.length} recorded
              </span>
            </div>
            <p className="small muted">
              The order matches the route on the Route notes page. Each stop is one order; the lot moves to picked up
              when its hand-over is recorded.
            </p>

            <div className="stack">
              {ordered.map((row, index) => {
                const collected = Boolean(row.record.collectedAt);
                return (
                  <article className="card" key={row.order.id} style={{ background: "var(--surface-alt)" }}>
                    <div className="card-title">
                      <h3 style={{ fontSize: "1.05rem", margin: 0 }}>
                        <span className="mono">{index + 1}.</span> {row.lot.id} · {row.order.id}
                      </h3>
                      <StatusBadge status={row.lot.status} />
                    </div>

                    <dl className="facts">
                      <div>
                        <dt>Material</dt>
                        <dd>
                          {row.lot.residueType} · {row.lot.crop}
                        </dd>
                      </div>
                      <div>
                        <dt>Farm area</dt>
                        <dd>{row.lot.areaLabel}</dd>
                      </div>
                      <div>
                        <dt>Farmer organisation</dt>
                        <dd>{row.lot.farmerOrg}</dd>
                      </div>
                      <div>
                        <dt>Buyer organisation</dt>
                        <dd>{row.order.buyerOrg}</dd>
                      </div>
                      <div>
                        <dt>Listed quantity</dt>
                        <dd className="mono">
                          {row.lot.quantity} {row.lot.unit}
                        </dd>
                      </div>
                      <div>
                        <dt>Weighed at hand-over</dt>
                        <dd className="mono">
                          {collected ? `${row.record.actualQuantity} ${row.record.unit}` : "not recorded"}
                        </dd>
                      </div>
                      <div>
                        <dt>Collected at</dt>
                        <dd className="mono">{collected ? row.record.collectedAt : "—"}</dd>
                      </div>
                      <div>
                        <dt>Hand-over reference</dt>
                        <dd>{row.record.evidenceRef ?? "—"}</dd>
                      </div>
                      <div>
                        <dt>Farmer readiness</dt>
                        <dd>{row.record.readyConfirmed ? "confirmed" : "not confirmed yet"}</dd>
                      </div>
                      <div>
                        <dt>Agreed quantity</dt>
                        <dd className="mono">
                          {row.order.agreedQuantity} {row.order.unit}
                        </dd>
                      </div>
                    </dl>

                    {row.record.note ? (
                      <p className="small" style={{ marginTop: 10 }}>
                        Hand-over note: {row.record.note}
                      </p>
                    ) : null}

                    {recorded ? (
                      <div style={{ marginTop: 14 }}>
                        <RecordPickupForm
                          planId={plan.id}
                          orderId={row.order.id}
                          listedQuantity={row.lot.quantity}
                          unit={row.lot.unit}
                          existing={{
                            actualQuantity: row.record.actualQuantity,
                            collectedAt: row.record.collectedAt,
                            evidenceRef: row.record.evidenceRef,
                            note: row.record.note,
                          }}
                        />
                      </div>
                    ) : (
                      <p className="small muted" style={{ marginBottom: 0 }}>
                        {plan.status === "FAILED"
                          ? "This plan failed, so no further hand-over can be recorded."
                          : "Every stop is recorded. The plan can be completed."}
                      </p>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        </div>

        <div className="stack">
          <section className="card">
            <h2 style={{ fontSize: "1.2rem" }}>Lifecycle</h2>
            <p className="small muted">
              Current status <StatusBadge status={plan.status} />
            </p>

            {pending.length ? (
              <div className="alert alert-warn" style={{ marginBottom: 14 }}>
                <p style={{ margin: "0 0 4px", fontWeight: 600 }}>
                  {pending.length} stop(s) still have no recorded hand-over
                </p>
                <p className="small" style={{ margin: 0 }}>
                  A plan can only be completed once every stop has a weighed quantity, a collection time and a
                  hand-over reference. The Complete step stays withheld until then.
                </p>
              </div>
            ) : null}

            <PlanStatusForm key={plan.status} planId={plan.id} current={plan.status} allowed={offered} />
          </section>

          {editable ? (
            <section className="card">
              <h2 style={{ fontSize: "1.2rem" }}>Change the plan</h2>
              <p className="small muted">
                The date and vehicle can change until the plan is finished. The capacity cannot be set below the
                planned total.
              </p>
              <PlanChangeForm
                plan={{
                  id: plan.id,
                  plannedAt: plan.plannedAt,
                  vehicleLabel: plan.vehicleLabel,
                  vehicleCapacity: plan.vehicleCapacity,
                  capacityUnit: plan.capacityUnit,
                }}
                plannedTotal={plannedTotal}
                today={todayIso()}
              />
            </section>
          ) : (
            <section className="card">
              <h2 style={{ fontSize: "1.2rem" }}>This plan is locked</h2>
              <p style={{ margin: 0 }}>
                A plan with status <strong>{plan.status}</strong> can no longer change. That keeps the record the
                farmer and buyer saw. Create a new plan if another trip is needed.
              </p>
            </section>
          )}

          <section className="card">
            <h2 style={{ fontSize: "1.2rem" }}>How a hand-over is recorded</h2>
            <ul className="meta-list">
              <li>
                <span className="k">Weighed quantity</span>
                <span>is the weighing figure, greater than zero.</span>
              </li>
              <li>
                <span className="k">Reference</span>
                <span>is the weighbridge slip or photo id tied to that weight.</span>
              </li>
              <li>
                <span className="k">Difference</span>
                <span>from the listed quantity stays on the record, it is not corrected here.</span>
              </li>
            </ul>
          </section>
        </div>
      </div>

      <section className="card" style={{ marginTop: 22 }}>
        <h2 style={{ fontSize: "1.2rem" }}>History for this plan</h2>
        <p className="small muted">
          Planning, changes, status moves and recorded hand-overs on this plan, with the actor and the time.
        </p>
        <AuditList events={history} emptyHint="Changes to this plan will be listed here with a timestamp." />
      </section>
    </>
  );
}
