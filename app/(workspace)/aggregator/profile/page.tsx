import Link from "next/link";
import { WorkspaceHeader } from "@/components/layout/WorkspaceShell.tsx";
import { AuditList } from "@/components/ui/AuditList.tsx";
import { aggregatorSummary, myPlans } from "@/lib/server/collections.ts";
import { requirePageUser } from "@/lib/server/auth.ts";
import { readStore } from "@/lib/server/db.ts";

export const metadata = { title: "Profile" };

export default async function AggregatorProfilePage() {
  const user = await requirePageUser("aggregator");
  const summary = aggregatorSummary(user);
  const plans = myPlans(user);
  const history = readStore()
    .audit.filter((event) => event.actorId === user.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 30);

  return (
    <>
      <WorkspaceHeader
        title="Profile"
        intro="Your account details and the totals recorded against your name. Farmers and buyers see your organisation and the plan you hold, never your email."
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
          <h2 style={{ fontSize: "1.2rem" }}>My plan totals</h2>
          <ul className="meta-list">
            <li>
              <span className="k">Plans held</span>
              <span className="mono">{summary.plans}</span>
            </li>
            <li>
              <span className="k">Still open</span>
              <span className="mono">{summary.open}</span>
            </li>
            <li>
              <span className="k">Completed</span>
              <span className="mono">{summary.completed}</span>
            </li>
            <li>
              <span className="k">Available work</span>
              <span className="mono">{summary.availableOrders}</span>
            </li>
            <li>
              <span className="k">Planned total</span>
              <span className="mono">{summary.plannedTotal}</span>
            </li>
            <li>
              <span className="k">Weighed total</span>
              <span className="mono">{summary.actualTotal}</span>
            </li>
            <li>
              <span className="k">Difference</span>
              <span className="mono">{summary.variance}%</span>
            </li>
          </ul>
          <p className="small muted" style={{ marginTop: 14, marginBottom: 0 }}>
            Totals mix units only where the plans do. A difference between planned and weighed stays on the record.
          </p>
        </section>
      </div>

      <div className="split" style={{ marginTop: 22 }}>
        <section className="card">
          <h2 style={{ fontSize: "1.2rem" }}>My activity</h2>
          <p className="small muted">Only actions your account took. Other accounts stay out of this list.</p>
          <AuditList events={history} />
        </section>

        <section className="card">
          <h2 style={{ fontSize: "1.2rem" }}>What you are sharing</h2>
          <p>
            A farmer sees the plan&apos;s vehicle, the date and the stop covering their order, along with your
            organisation. A buyer sees the lot status move to picked up once a hand-over is recorded.
          </p>
          <p style={{ marginBottom: 0 }}>
            What you never see about a farmer: their name, phone number or exact field boundary. What they never see
            about you: your email.
          </p>
          <div className="btn-row" style={{ marginTop: 14 }}>
            <Link className="btn btn-ghost btn-sm" href="/aggregator/collections">
              Review my plans ({plans.length})
            </Link>
            <Link className="btn btn-ghost btn-sm" href="/aggregator/available-lots">
              Available work
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
