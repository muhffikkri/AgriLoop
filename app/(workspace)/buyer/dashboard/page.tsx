import Link from "next/link";
import { WorkspaceHeader } from "@/components/layout/WorkspaceShell.tsx";
import { AuditList } from "@/components/ui/AuditList.tsx";
import { EmptyState, StatGrid } from "@/components/ui/states.tsx";
import { StatusBadge } from "@/components/ui/badges.tsx";
import { buyerSummary, listRequirements, ordersForBuyer } from "@/lib/server/market.ts";
import { requirePageUser } from "@/lib/server/auth.ts";
import { readStore } from "@/lib/server/db.ts";

export const metadata = { title: "Buyer overview" };

export default async function BuyerDashboardPage() {
  const user = await requirePageUser("buyer");
  const summary = buyerSummary(user);
  const requirements = listRequirements(user);
  const openRequirements = requirements.filter((requirement) => requirement.status === "OPEN");
  const orders = ordersForBuyer(user);
  const activeOrders = orders.filter((order) => order.status === "AWAITING_BUYER" || order.status === "ACTIVE");
  const history = readStore()
    .audit.filter((event) => event.actorId === user.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 12);

  return (
    <>
      <WorkspaceHeader
        title={`Good to see you, ${user.name.split(" ")[0]}`}
        intro="Everything here concerns the requirements and orders your account or your group has recorded. Farmers only ever see the offers you send against their open lots."
        actions={
          <>
            <Link className="btn btn-primary" href="/buyer/requirements">
              New requirement
            </Link>
            <Link className="btn btn-ghost" href="/buyer/marketplace">
              Find supply
            </Link>
          </>
        }
      />

      <StatGrid
        items={[
          { label: "Open requirements", value: summary.openRequirements, hint: "Published and matchable" },
          { label: "Orders in progress", value: summary.activeOrders, hint: "Awaiting you or active" },
          { label: "Offers awaiting a reply", value: summary.pendingOfferResponses, hint: "Sent to farmers" },
          { label: "Open disputes", value: summary.disputes, hint: "Waiting on an admin" },
        ]}
      />

      <div className="split" style={{ marginTop: 22 }}>
        <section className="card">
          <div className="card-title">
            <h2 style={{ fontSize: "1.2rem", margin: 0 }}>Your open requirements</h2>
            <Link className="small" href="/buyer/requirements">
              All requirements
            </Link>
          </div>
          {openRequirements.length ? (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">Requirement</th>
                    <th scope="col">Material</th>
                    <th scope="col">Quantity</th>
                    <th scope="col">Window</th>
                    <th scope="col" />
                  </tr>
                </thead>
                <tbody>
                  {openRequirements.slice(0, 5).map((requirement) => (
                    <tr key={requirement.id}>
                      <td className="num">{requirement.id}</td>
                      <td>{requirement.residueType}</td>
                      <td className="num">
                        {requirement.quantityMin}-{requirement.quantityMax} {requirement.unit}
                      </td>
                      <td className="num">
                        {requirement.windowStart} to {requirement.windowEnd}
                      </td>
                      <td>
                        <Link className="small" href={`/buyer/requirements/${requirement.id}`}>
                          Review matches
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="No open requirement"
              hint="Describe the material, volume and window you need. Publishing it lets lots be ranked against it with the reasons shown."
              action={
                <Link className="btn btn-primary btn-sm" href="/buyer/requirements">
                  Add a requirement
                </Link>
              }
            />
          )}
        </section>

        <section className="card">
          <div className="card-title">
            <h2 style={{ fontSize: "1.2rem", margin: 0 }}>Orders needing your action</h2>
            <Link className="small" href="/buyer/orders">
              All orders
            </Link>
          </div>
          {activeOrders.length ? (
            <ul className="audit">
              {activeOrders.slice(0, 4).map((order) => (
                <li className="audit-row" key={order.id}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 600 }}>
                      {order.id} · {order.agreedQuantity} {order.unit}
                    </p>
                    <p className="small muted" style={{ margin: "2px 0 0" }}>
                      Lot {order.lotId} from {order.farmerOrg}
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <StatusBadge status={order.status} />
                    <Link className="small" href="/buyer/orders" style={{ display: "block", marginTop: 4 }}>
                      {order.status === "AWAITING_BUYER" ? "Confirm" : "Open"}
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="No order needs you right now"
              hint="When a farmer accepts one of your offers, an order appears here for you to confirm the agreement."
            />
          )}
        </section>
      </div>

      <div className="split" style={{ marginTop: 22 }}>
        <section className="card">
          <h2 style={{ fontSize: "1.2rem" }}>Your recent activity</h2>
          <p className="small muted">
            Only actions your account took. Other accounts and farmers never appear here.
          </p>
          <AuditList events={history} />
        </section>
        <section className="card">
          <h2 style={{ fontSize: "1.2rem" }}>What a match means</h2>
          <ul className="meta-list">
            <li>
              <span className="k">A reason</span>
              <span>is a fact that supports the suggestion, such as the quantity sitting in your window.</span>
            </li>
            <li>
              <span className="k">A blocker</span>
              <span>is a fact that stops the lot being a clean match. Blockers are never hidden.</span>
            </li>
            <li>
              <span className="k">A score</span>
              <span>sorts lots for one requirement. It is a relative aid, not a quality grade.</span>
            </li>
          </ul>
          <p style={{ marginTop: 14, marginBottom: 0 }}>
            A condition label on a lot is a working note, never a certificate. Inspect before you commit if it
            matters to you.
          </p>
        </section>
      </div>
    </>
  );
}
