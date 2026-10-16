import Link from "next/link";
import { WorkspaceHeader } from "@/components/layout/WorkspaceShell.tsx";
import { OfferResponseForm } from "@/components/farmer/OfferResponseForm.tsx";
import { ConditionBadge, StatusBadge } from "@/components/ui/badges.tsx";
import { EmptyState } from "@/components/ui/states.tsx";
import { offersForFarmer } from "@/lib/server/market.ts";
import { getLot } from "@/lib/server/lots.ts";
import { requirePageUser } from "@/lib/server/auth.ts";

export const metadata = { title: "Offers" };

export default async function OffersPage() {
  const user = await requirePageUser("farmer");
  const offers = offersForFarmer(user);
  const pending = offers.filter((offer) => offer.status === "PENDING");
  const answered = offers.filter((offer) => offer.status !== "PENDING");

  return (
    <>
      <WorkspaceHeader
        title="Offers"
        intro="Offers arrive against a buyer requirement and one of your published lots. Only you decide what happens to your supply."
      />

      <section className="card">
        <h2 style={{ fontSize: "1.2rem" }}>Waiting on your reply ({pending.length})</h2>
        {pending.length ? (
          pending.map((offer) => {
            const lot = getLot(offer.lotId);
            return (
              <article key={offer.id}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 600 }}>
                      {offer.buyerOrg} wants {offer.quantity} {offer.unit}
                    </p>
                    <p className="small muted" style={{ margin: "2px 0 0" }}>
                      Lot {offer.lotId} · {lot?.residueType ?? "material"} in {lot?.areaLabel ?? "area"} · against{" "}
                      {offer.requirementId}
                    </p>
                  </div>
                  <StatusBadge status={offer.status} />
                </div>
                <OfferResponseForm
                  offerId={offer.id}
                  lotId={offer.lotId}
                  quantity={offer.quantity}
                  unit={offer.unit}
                  buyerOrg={offer.buyerOrg}
                  requirementLabel={offer.requirementId}
                  terms={offer.terms}
                />
              </article>
            );
          })
        ) : (
          <EmptyState
            title="No offer is waiting"
            hint="When a buyer sends an offer on one of your open lots, it lands here for accept, reject or counter."
            action={
              <Link className="btn btn-ghost" href="/farmer/supply">
                Review my lots
              </Link>
            }
          />
        )}
      </section>

      <section className="card" style={{ marginTop: 22 }}>
        <h2 style={{ fontSize: "1.2rem" }}>Already answered ({answered.length})</h2>
        {answered.length ? (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Offer</th>
                  <th scope="col">Lot</th>
                  <th scope="col">Buyer</th>
                  <th scope="col">Quantity</th>
                  <th scope="col">Decision</th>
                  <th scope="col">Your note</th>
                </tr>
              </thead>
              <tbody>
                {answered.map((offer) => (
                  <tr key={offer.id}>
                    <td className="num">{offer.id}</td>
                    <td className="num">
                      <Link href={`/farmer/supply/${offer.lotId}`}>{offer.lotId}</Link>
                    </td>
                    <td>{offer.buyerOrg}</td>
                    <td className="num">
                      {offer.quantity} {offer.unit}
                    </td>
                    <td>
                      <StatusBadge status={offer.status} />
                    </td>
                    <td className="small">{offer.responseNote ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="small muted" style={{ margin: 0 }}>
            Answered offers are kept here so the decision and its reason stay traceable.
          </p>
        )}
      </section>

      <section className="card" style={{ marginTop: 22 }}>
        <h2 style={{ fontSize: "1.2rem" }}>What an offer means</h2>
        <ul className="meta-list">
          <li>
            <span className="k">Accepting</span>
            <span>reserves the lot and creates an order the buyer still has to confirm.</span>
          </li>
          <li>
            <span className="k">Rejecting</span>
            <span>needs a reason and leaves the lot open to other buyers.</span>
          </li>
          <li>
            <span className="k">A condition label</span>
            <span>is a working note, never a quality certificate.</span>
          </li>
        </ul>
        <p style={{ marginTop: 12, marginBottom: 0 }}>
          <ConditionBadge label="buyer_review" />{" "}
          <span className="small muted">on a lot means the buyer should still inspect before committing.</span>
        </p>
      </section>
    </>
  );
}
