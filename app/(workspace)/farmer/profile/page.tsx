import Link from "next/link";
import { WorkspaceHeader } from "@/components/layout/WorkspaceShell.tsx";
import { AuditList } from "@/components/ui/AuditList.tsx";
import { farmerHistory, farmerSummary } from "@/lib/server/lots.ts";
import { requirePageUser } from "@/lib/server/auth.ts";

export const metadata = { title: "Profile" };

export default async function FarmerProfilePage() {
  const user = await requirePageUser("farmer");
  const summary = farmerSummary(user);
  const history = farmerHistory(user, 30);

  return (
    <>
      <WorkspaceHeader
        title="Profile"
        intro="Your account details and everything recorded against your name. Buyers see your organisation and area label, never your email."
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
              <span className="k">Lots recorded</span>
              <span className="mono">{summary.total}</span>
            </li>
            <li>
              <span className="k">Open to buyers</span>
              <span className="mono">{summary.open}</span>
            </li>
            <li>
              <span className="k">Finished</span>
              <span className="mono">{summary.closed}</span>
            </li>
          </ul>
          <p style={{ marginTop: 14 }}>
            A published lot shows buyers the material, quantity, ready date, area label and your condition note.
            It does not show your email, your phone number or an exact field boundary.
          </p>
          <div className="btn-row">
            <Link className="btn btn-ghost btn-sm" href="/farmer/supply">
              Review my lots
            </Link>
          </div>
        </section>
      </div>

      <section className="card" style={{ marginTop: 22 }}>
        <h2 style={{ fontSize: "1.2rem" }}>My history</h2>
        <p className="small muted">
          Only your own actions and changes to your lots. Other accounts stay out of this list.
        </p>
        <AuditList events={history} />
      </section>
    </>
  );
}
