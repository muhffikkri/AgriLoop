import Link from "next/link";
import { WorkspaceHeader } from "@/components/layout/WorkspaceShell.tsx";
import { CloseOrderForm, ConfirmAgreementForm, RecordReceiptForm, type DisputeOption } from "@/components/buyer/OrderActions.tsx";
import { StatusBadge, ConditionBadge } from "@/components/ui/badges.tsx";
import { EmptyState } from "@/components/ui/states.tsx";
import { buyerVisibleLot, ordersForBuyer, DISPUTE_CATEGORIES } from "@/lib/server/market.ts";
import { requirePageUser } from "@/lib/server/auth.ts";

export const metadata = { title: "Orders" };

const DISPUTE_OPTIONS: DisputeOption[] = DISPUTE_CATEGORIES.map((value) => ({
  value,
  label: value.replace(/_/g, " ").replace(/^./, (letter) => letter.toUpperCase()),
}));

function disputeLabel(category?: string): string {
  if (!category) return "not categorised";
  return category.replace(/_/g, " ").replace(/^./, (letter) => letter.toUpperCase());
}

export default async function BuyerOrdersPage() {
  const user = await requirePageUser("buyer");
  const orders = ordersForBuyer(user);

  return (
    <>
      <WorkspaceHeader
        title="Orders"
        intro="An order appears when a farmer accepts your offer. Confirm the agreement to start the pickup, record what actually arrived, and close the order once both sides are finished."
      />

      {orders.length ? (
        <div className="stack">
          {orders.map((order) => {
            const lot = buyerVisibleLot(user, order.lotId);
            return (
              <section className="card" key={order.id}>
                <div className="card-title">
                  <h2 style={{ fontSize: "1.15rem", margin: 0 }}>
                    {order.id} · {order.agreedQuantity} {order.unit}
                  </h2>
                  <StatusBadge status={order.status} />
                </div>

                <dl className="facts">
                  <div>
                    <dt>Lot</dt>
                    <dd className="mono">{order.lotId}</dd>
                  </div>
                  <div>
                    <dt>From</dt>
                    <dd>{order.farmerOrg}</dd>
                  </div>
                  <div>
                    <dt>Material</dt>
                    <dd>{lot ? `${lot.residueType} · ${lot.crop}` : "lot no longer available"}</dd>
                  </div>
                  <div>
                    <dt>Condition label</dt>
                    <dd>{lot ? <ConditionBadge label={lot.conditionLabel} /> : "—"}</dd>
                  </div>
                  <div>
                    <dt>Agreed quantity</dt>
                    <dd className="mono">
                      {order.agreedQuantity} {order.unit}
                    </dd>
                  </div>
                  <div>
                    <dt>Received quantity</dt>
                    <dd className="mono">
                      {order.receivedQuantity === undefined ? "not recorded" : `${order.receivedQuantity} ${order.unit}`}
                    </dd>
                  </div>
                  <div>
                    <dt>Lot status</dt>
                    <dd>{lot ? <StatusBadge status={lot.status} /> : "—"}</dd>
                  </div>
                  <div>
                    <dt>Last updated</dt>
                    <dd className="mono">{order.updatedAt.slice(0, 16).replace("T", " ")}</dd>
                  </div>
                </dl>

                {order.status === "DISPUTED" ? (
                  <div className="alert alert-error" style={{ marginTop: 14 }}>
                    <p style={{ margin: "0 0 4px", fontWeight: 600 }}>
                      Dispute open · {disputeLabel(order.disputeCategory)}
                    </p>
                    <p className="small" style={{ margin: 0 }}>
                      {order.disputeReason ?? "No reason recorded."} An admin resolves the dispute; the order stays
                      here until then.
                    </p>
                  </div>
                ) : null}

                <div style={{ marginTop: 16 }}>
                  {order.status === "AWAITING_BUYER" ? (
                    <>
                      <p className="small muted" style={{ marginTop: 0 }}>
                        The farmer accepted your offer and reserved the lot. Confirming tells the collector the order
                        is ready to plan.
                      </p>
                      <ConfirmAgreementForm orderId={order.id} />
                    </>
                  ) : null}

                  {order.status === "ACTIVE" ? (
                    <>
                      <p className="small muted" style={{ marginTop: 0 }}>
                        {lot && lot.status === "PICKED_UP"
                          ? "The lot has been picked up. Record what arrived and accept it or open a dispute."
                          : "Receipt can only be recorded once the collector marks the lot picked up. Until then the form will decline."}
                      </p>
                      <RecordReceiptForm
                        orderId={order.id}
                        agreedQuantity={order.agreedQuantity}
                        disputeOptions={DISPUTE_OPTIONS}
                      />
                    </>
                  ) : null}

                  {order.status === "RECEIVED" ? (
                    <>
                      <p className="small muted" style={{ marginTop: 0 }}>
                        Receipt recorded. Closing finishes the transaction and locks the lot record.
                      </p>
                      <CloseOrderForm orderId={order.id} />
                    </>
                  ) : null}

                  {order.status === "CLOSED" ? (
                    <p className="small muted" style={{ margin: 0 }}>
                      This order is closed. The record stays for reference.
                    </p>
                  ) : null}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No order yet"
          hint="Send an offer on a published lot. When the farmer accepts, an order appears here for you to confirm."
          action={
            <Link className="btn btn-primary btn-sm" href="/buyer/marketplace">
              Find supply
            </Link>
          }
        />
      )}

      <p className="small muted" style={{ marginTop: 18 }}>
        You only ever see the farmer&apos;s organisation, never a name, phone number or exact field boundary. The
        agreed quantity is what you offered; the received quantity is the weighed figure you record here, and the
        difference stays on the record.
      </p>
    </>
  );
}
