import Link from "next/link";
import { WorkspaceHeader } from "@/components/layout/WorkspaceShell.tsx";
import { LotTable } from "@/components/farmer/LotTable.tsx";
import { AuditList } from "@/components/ui/AuditList.tsx";
import { EmptyState, StatGrid } from "@/components/ui/states.tsx";
import { StatusBadge } from "@/components/ui/badges.tsx";
import { farmerHistory, farmerSummary, listLotsForFarmer } from "@/lib/server/lots.ts";
import { offersForFarmer } from "@/lib/server/market.ts";
import { stopsForFarmer } from "@/lib/server/collections.ts";
import { requirePageUser } from "@/lib/server/auth.ts";

export const metadata = { title: "Farmer overview" };

export default async function FarmerDashboardPage() {
  const user = await requirePageUser("farmer");
  const summary = farmerSummary(user);
  const lots = listLotsForFarmer(user);
  const offers = offersForFarmer(user);
  const pendingOffers = offers.filter((offer) => offer.status === "PENDING");
  const stops = stopsForFarmer(user).filter((stop) => stop.plan.status !== "COMPLETED" && stop.plan.status !== "FAILED");
  const history = farmerHistory(user, 12);

  return (
    <>
      <WorkspaceHeader
        title={`Good to see you, ${user.name.split(" ")[0]}`}
        intro="Everything here concerns the lots you and your group have recorded. Buyers only ever see lots you have published."
        actions={
          <>
            <Link className="btn btn-primary" href="/farmer/supply/new">
              Add a lot
            </Link>
            <Link className="btn btn-ghost" href="/farmer/offers">
              Offers{pendingOffers.length ? ` (${pendingOffers.length})` : ""}
            </Link>
          </>
        }
      />

      <StatGrid
        items={[
          { label: "Lots recorded", value: summary.total, hint: "Drafts included" },
          { label: "Open to buyers", value: summary.open, hint: "Published and matchable" },
          { label: "Reserved or in pickup", value: summary.reserved, hint: "A buyer has committed" },
          { label: "Waiting on your reply", value: summary.pendingOffers, hint: "Offers you have not answered" },
        ]}
      />

      <div className="split" style={{ marginTop: 22 }}>
        <section className="card">
          <div className="card-title">
            <h2 style={{ fontSize: "1.2rem", margin: 0 }}>Offers waiting on you</h2>
            <Link className="small" href="/farmer/offers">
              All offers
            </Link>
          </div>
          {pendingOffers.length ? (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">Offer</th>
                    <th scope="col">Lot</th>
                    <th scope="col">Buyer</th>
                    <th scope="col">Quantity</th>
                    <th scope="col">Valid until</th>
                    <th scope="col" />
                  </tr>
                </thead>
                <tbody>
                  {pendingOffers.slice(0, 5).map((offer) => (
                    <tr key={offer.id}>
                      <td className="num">{offer.id}</td>
                      <td className="num">{offer.lotId}</td>
                      <td>{offer.buyerOrg}</td>
                      <td className="num">
                        {offer.quantity} {offer.unit}
                      </td>
                      <td className="num">{offer.expiresAt}</td>
                      <td>
                        <Link className="small" href="/farmer/offers">
                          Review
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="No offer is waiting"
              hint="When a buyer sends an offer on one of your open lots it appears here for accept, reject or counter."
            />
          )}
        </section>

        <section className="card">
          <div className="card-title">
            <h2 style={{ fontSize: "1.2rem", margin: 0 }}>Upcoming pickups</h2>
            <Link className="small" href="/farmer/collections">
              Schedule
            </Link>
          </div>
          {stops.length ? (
            <ul className="audit">
              {stops.slice(0, 4).map((stop) => (
                <li className="audit-row" key={`${stop.plan.id}-${stop.order.id}`}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 600 }}>
                      {stop.plan.vehicleLabel} · {stop.plan.plannedAt}
                    </p>
                    <p className="small muted" style={{ margin: "2px 0 0" }}>
                      Lot {stop.lot.id} for {stop.order.buyerOrg}
                    </p>
                  </div>
                  <span className="badge badge-solid b-slate" title={`Plan status ${stop.plan.status}`}>
                    {stop.record.readyConfirmed ? "Ready" : "Prep"}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="No pickup scheduled"
              hint="A collector plans a trip once a buyer confirms the agreement on an accepted offer."
            />
          )}
        </section>
      </div>

      <section className="card" style={{ marginTop: 22 }}>
        <div className="card-title">
          <h2 style={{ fontSize: "1.2rem", margin: 0 }}>Your recent lots</h2>
          <Link className="small" href="/farmer/supply">
            My supply
          </Link>
        </div>
        <LotTable lots={lots.slice(0, 6)} />
      </section>

      <div className="split" style={{ marginTop: 22 }}>
        <section className="card">
          <h2 style={{ fontSize: "1.2rem" }}>Your activity</h2>
          <p className="small muted">
            Only your own actions and changes to your lots. Other accounts never appear here.
          </p>
          <AuditList events={history} />
        </section>
        <section className="card">
          <h2 style={{ fontSize: "1.2rem" }}>Lot status at a glance</h2>
          <ul className="meta-list">
            <li>
              <span className="k">Drafts</span>
              <span className="mono">{lots.filter((lot) => lot.status === "DRAFT").length}</span>
            </li>
            <li>
              <span className="k">Open</span>
              <span className="mono">{summary.open}</span>
            </li>
            <li>
              <span className="k">Reserved / pickup</span>
              <span className="mono">{summary.reserved}</span>
            </li>
            <li>
              <span className="k">Finished</span>
              <span className="mono">{summary.closed}</span>
            </li>
          </ul>
          <div style={{ marginTop: 14 }}>
            <StatusBadge status="OPEN" />{" "}
            <span className="small muted">means buyers can find the lot in their matches.</span>
          </div>
        </section>
      </div>
    </>
  );
}
