import Link from "next/link";
import { notFound } from "next/navigation";
import { WorkspaceHeader } from "@/components/layout/WorkspaceShell.tsx";
import { LotForm } from "@/components/farmer/LotForm.tsx";
import { ConditionForm, ObservationForm, PublishForm, WithdrawForm } from "@/components/farmer/LotActions.tsx";
import { OfferResponseForm } from "@/components/farmer/OfferResponseForm.tsx";
import { AuditList } from "@/components/ui/AuditList.tsx";
import { ConditionBadge, StatusBadge } from "@/components/ui/badges.tsx";
import { EmptyState } from "@/components/ui/states.tsx";
import {
  canFarmerEdit,
  getOwnedLot,
  lotTimeline,
  observationsFor,
  selectableAreas,
} from "@/lib/server/lots.ts";
import { offersForLot } from "@/lib/server/market.ts";
import { requirePageUser } from "@/lib/server/auth.ts";
import { todayIso } from "@/lib/server/db.ts";
import { LOT_TRANSITIONS } from "@/lib/domain/status.ts";

export const metadata = { title: "Lot detail" };

export default async function LotDetailPage({ params }: { params: Promise<{ lotId: string }> }) {
  const user = await requirePageUser("farmer");
  const { lotId } = await params;

  const lot = getOwnedLot(user, lotId);
  if (!lot) notFound();

  const editable = canFarmerEdit(user, lot);
  const canPublish = lot.status === "DRAFT";
  const canWithdraw = LOT_TRANSITIONS[lot.status].includes("CANCELLED");
  const offers = offersForLot(lot.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const observations = observationsFor(lot.id);
  const timeline = lotTimeline(lot.id);
  const areas = selectableAreas();

  return (
    <>
      <WorkspaceHeader
        title={`Lot ${lot.id}`}
        intro={
          <span>
            <StatusBadge status={lot.status} /> {lot.residueType} · {lot.areaLabel} · owned by {lot.ownerName}
          </span>
        }
        actions={
          <Link className="btn btn-ghost" href="/farmer/supply">
            Back to my supply
          </Link>
        }
      />

      <div className="split">
        <div className="stack">
          <section className="card">
            <h2 style={{ fontSize: "1.2rem" }}>Listing details</h2>
            <dl className="facts">
              <div>
                <dt>Residue type</dt>
                <dd>{lot.residueType}</dd>
              </div>
              <div>
                <dt>Crop</dt>
                <dd>{lot.crop}</dd>
              </div>
              <div>
                <dt>Quantity recorded</dt>
                <dd className="mono">
                  {lot.quantity} {lot.unit}
                </dd>
              </div>
              <div>
                <dt>Ready from</dt>
                <dd className="mono">{lot.readyDate}</dd>
              </div>
              <div>
                <dt>Area cell</dt>
                <dd>{lot.areaLabel}</dd>
              </div>
              <div>
                <dt>Harvest date</dt>
                <dd className="mono">{lot.harvestDate ?? "not stated"}</dd>
              </div>
              <div>
                <dt>Storage</dt>
                <dd>{lot.storage ?? "not stated"}</dd>
              </div>
              <div>
                <dt>Moisture</dt>
                <dd className="mono">{lot.moisturePercent === undefined ? "not measured" : `${lot.moisturePercent}%`}</dd>
              </div>
              <div>
                <dt>Photo reference</dt>
                <dd>{lot.photoRef ?? "none"}</dd>
              </div>
              <div>
                <dt>Last updated</dt>
                <dd className="mono">{lot.updatedAt.slice(0, 16).replace("T", " ")}</dd>
              </div>
            </dl>
            {lot.notes ? (
              <p style={{ marginTop: 14, marginBottom: 0 }}>
                <strong>Notes for the buyer:</strong> {lot.notes}
              </p>
            ) : null}
          </section>

          <section className="card">
            <h2 style={{ fontSize: "1.2rem" }}>Offers on this lot</h2>
            <p className="small muted">
              A buyer sends an offer against one of their own requirements. Accepting reserves this lot and hands
              the buyer an order to confirm.
            </p>
            {offers.length ? (
              offers.map((offer) => (
                <article key={offer.id} style={{ marginTop: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                    <p style={{ margin: 0, fontWeight: 600 }}>
                      {offer.buyerOrg} · {offer.quantity} {offer.unit}
                    </p>
                    <StatusBadge status={offer.status} />
                  </div>
                  <p className="small muted" style={{ margin: "4px 0 0" }}>
                    Against {offer.requirementId} · valid until {offer.expiresAt}
                    {offer.responseNote ? ` · your note: ${offer.responseNote}` : ""}
                  </p>
                  {offer.status === "PENDING" ? (
                    <OfferResponseForm
                      offerId={offer.id}
                      lotId={lot.id}
                      quantity={offer.quantity}
                      unit={offer.unit}
                      buyerOrg={offer.buyerOrg}
                      requirementLabel={offer.requirementId}
                      terms={offer.terms}
                    />
                  ) : null}
                </article>
              ))
            ) : (
              <EmptyState
                title="No offer yet"
                hint={lot.status === "OPEN" ? "Buyers only see published lots. This one is open, so an offer can arrive at any time." : "Publish the lot to make it matchable."}
              />
            )}
          </section>

          {editable ? (
            <LotForm lot={lot} areas={areas} today={todayIso()} />
          ) : (
            <section className="card">
              <h2 style={{ fontSize: "1.2rem" }}>Listing details are locked</h2>
              <p style={{ margin: 0 }}>
                A lot with status <strong>{lot.status}</strong> can no longer be edited. That keeps the record the
                buyer agreed to. Open a new lot if the material has changed.
              </p>
            </section>
          )}
        </div>

        <div className="stack">
          <section className="card">
            <h2 style={{ fontSize: "1.2rem" }}>Lifecycle</h2>
            <p className="small muted">
              Current status <StatusBadge status={lot.status} />
            </p>

            {canPublish ? (
              <div style={{ marginBottom: 14 }}>
                <p style={{ marginTop: 0 }}>
                  This is a draft. Publishing lets buyers match it; you can still withdraw it afterwards.
                </p>
                <PublishForm lotId={lot.id} />
              </div>
            ) : (
              <p className="small muted">
                {lot.status === "OPEN"
                  ? "The lot is open. Publish is no longer offered; wait for an offer or withdraw it."
                  : "No further publishing step is needed at this status."}
              </p>
            )}

            {canWithdraw ? (
              <>
                <hr style={{ border: 0, borderTop: "1px solid var(--line)", margin: "16px 0" }} />
                <WithdrawForm lotId={lot.id} />
              </>
            ) : (
              <p className="small muted" style={{ marginBottom: 0 }}>
                Withdrawing is not possible from {lot.status}. A confirmed order has to be cancelled through the
                order record instead.
              </p>
            )}
          </section>

          <section className="card">
            <h2 style={{ fontSize: "1.2rem" }}>Condition</h2>
            <p style={{ marginBottom: 10 }}>
              <ConditionBadge label={lot.conditionLabel} />
              {lot.conditionSource ? (
                <span className="small muted"> · recorded by {lot.conditionSource}</span>
              ) : null}
            </p>
            {lot.conditionNote ? (
              <p className="small" style={{ marginTop: 0 }}>
                {lot.conditionNote}
              </p>
            ) : null}
            <ConditionForm lotId={lot.id} current={lot.conditionLabel} />
          </section>

          <section className="card">
            <h2 style={{ fontSize: "1.2rem" }}>Field observations</h2>
            {observations.length ? (
              <ul className="audit">
                {observations.map((observation) => (
                  <li className="audit-row" key={observation.id}>
                    <div>
                      <p style={{ margin: 0, fontWeight: 600 }}>{observation.observedBy}</p>
                      <p className="small muted" style={{ margin: "2px 0 0" }}>
                        {observation.harvestDate ? `Harvest ${observation.harvestDate} · ` : ""}
                        {observation.storage ? `${observation.storage} · ` : ""}
                        {observation.moisturePercent !== undefined ? `${observation.moisturePercent}% · ` : ""}
                        {observation.measureMethod ?? ""}
                      </p>
                      {observation.note ? (
                        <p className="small" style={{ margin: "4px 0 0" }}>
                          {observation.note}
                        </p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="small muted">No field observation recorded yet.</p>
            )}
            <div style={{ marginTop: 12 }}>
              <ObservationForm lotId={lot.id} />
            </div>
          </section>
        </div>
      </div>

      <section className="card" style={{ marginTop: 22 }}>
        <h2 style={{ fontSize: "1.2rem" }}>History for this lot</h2>
        <AuditList events={timeline} emptyHint="Status changes and edits on this lot will be listed here." />
      </section>
    </>
  );
}
