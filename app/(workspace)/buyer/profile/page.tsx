import Link from "next/link";
import { WorkspaceHeader } from "@/components/layout/WorkspaceShell.tsx";
import { AuditList } from "@/components/ui/AuditList.tsx";
import { buyerSummary, offersForBuyer, ordersForBuyer } from "@/lib/server/market.ts";
import { requirePageUser } from "@/lib/server/auth.ts";
import { readStore } from "@/lib/server/db.ts";

export const metadata = { title: "Organisation" };

export default async function BuyerProfilePage() {
  const user = await requirePageUser("buyer");
  const summary = buyerSummary(user);
  const offers = offersForBuyer(user);
  const orders = ordersForBuyer(user);
  const history = readStore()
    .audit.filter((event) => event.actorId === user.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 30);

  const farmers = Array.from(new Set(orders.map((order) => order.farmerOrg)));

  return (
    <>
      <WorkspaceHeader
        title="Organisation"
        intro="Your account details and everything recorded against your name. Farmers see the offers you send and your organisation, never your email."
      />

      <div className="split">
        <section className="card">
          <h2 style={{ fontSize: "1.2rem" }}>Account</h2>
          <dl className="facts">
            <div>
              <dt>Name</dt>
              <dd>{user.name}</dd>
            </div>
            <div>
              <dt>Role</dt>
              <dd>{user.role}</dd>
            </div>
            <div>
              <dt>Organisation</dt>
              <dd>{user.orgName ?? "Individual account"}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd className="mono">{user.email}</dd>
            </div>
            <div>
              <dt>Account created</dt>
              <dd className="mono">{user.createdAt.slice(0, 10)}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{user.status}</dd>
            </div>
          </dl>
          <p className="small muted" style={{ marginTop: 14, marginBottom: 0 }}>
            Role changes are made by a programme admin and recorded in the audit log. This prototype has no
            self-service role change.
          </p>
        </section>

        <section className="card">
          <h2 style={{ fontSize: "1.2rem" }}>What you are sharing</h2>
          <ul className="meta-list">
            <li>
              <span className="k">Requirements</span>
              <span className="mono">{summary.totalRequirements}</span>
            </li>
            <li>
              <span className="k">Open requirements</span>
              <span className="mono">{summary.openRequirements}</span>
            </li>
            <li>
              <span className="k">Offers sent</span>
              <span className="mono">{offers.length}</span>
            </li>
            <li>
              <span className="k">Orders</span>
              <span className="mono">{orders.length}</span>
            </li>
          </ul>
          <p style={{ marginTop: 14 }}>
            A farmer sees your organisation name, the quantity you offer and the terms you write. Your email, phone
            number and any internal reference never leave your account.
          </p>
          <div className="btn-row">
            <Link className="btn btn-ghost btn-sm" href="/buyer/requirements">
              Review my requirements
            </Link>
            <Link className="btn btn-ghost btn-sm" href="/buyer/marketplace">
              Find supply
            </Link>
          </div>
        </section>
      </div>

      <div className="split" style={{ marginTop: 22 }}>
        <section className="card">
          <h2 style={{ fontSize: "1.2rem" }}>My activity</h2>
          <p className="small muted">
            Only actions your account took. Other accounts, farmers and collectors stay out of this list.
          </p>
          <AuditList events={history} />
        </section>

        <section className="card">
          <h2 style={{ fontSize: "1.2rem" }}>Farmers you have traded with</h2>
          {farmers.length ? (
            <ul className="meta-list">
              {farmers.map((farmerOrg) => (
                <li key={farmerOrg}>
                  <span className="k">{farmerOrg}</span>
                  <span className="mono">{orders.filter((order) => order.farmerOrg === farmerOrg).length}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="small muted" style={{ margin: 0 }}>
              No order has been confirmed yet, so no farmer organisation is linked to your account.
            </p>
          )}
          <p style={{ marginTop: 14, marginBottom: 0 }}>
            Only the organisation name is shown. A farmer&apos;s name, contact details and exact location are never
            exposed here.
          </p>
        </section>
      </div>
    </>
  );
}
