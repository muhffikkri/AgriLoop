import Link from "next/link";
import { WorkspaceHeader } from "@/components/layout/WorkspaceShell.tsx";
import { AuditList } from "@/components/ui/AuditList.tsx";
import { SimNotice } from "@/components/ui/badges.tsx";
import { StatGrid } from "@/components/ui/states.tsx";
import { adminSummary } from "@/lib/server/admin.ts";
import { requirePageUser } from "@/lib/server/auth.ts";
import { readStore } from "@/lib/server/db.ts";

export const metadata = { title: "Admin overview" };

const TOOLS: Array<{ href: string; label: string; note: string }> = [
  { href: "/admin/users", label: "Users", note: "Roles, blocked accounts and the audit note behind each change." },
  { href: "/admin/areas", label: "Areas", note: "Coarse coverage grouped by area label, with the demo cell that shares it." },
  { href: "/admin/grid-samples", label: "Demo grids", note: "Simulated cell metadata. Source rasters are never edited here." },
  { href: "/admin/transactions", label: "Transactions", note: "Orders and disputes by organisation, without private details." },
  { href: "/admin/data-quality", label: "Data quality", note: "Missing fields and listed-against-weighed gaps." },
  { href: "/admin/audit-log", label: "Audit log", note: "Every recorded action, filterable by entity." },
];

export default async function AdminDashboardPage() {
  const user = await requirePageUser("admin");
  const summary = adminSummary(user);
  const store = readStore();
  const awaitingBuyer = store.orders.filter((order) => order.status === "AWAITING_BUYER").length;
  const recent = store.audit.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8);

  return (
    <>
      <WorkspaceHeader
        title="Programme overview"
        intro="Monitoring across accounts, lots, orders and demo grid metadata. Admin views show organisation names, statuses and counts only. Farmer contact details and exact coordinates are never part of this view."
      />

      <StatGrid
        items={[
          { label: "Accounts", value: summary.users, hint: `${summary.blocked} blocked` },
          { label: "Farmers", value: summary.farmers, hint: "Supply side" },
          { label: "Buyers", value: summary.buyers, hint: "Demand side" },
          { label: "Collectors", value: summary.aggregators, hint: "Pickup side" },
          { label: "Lots", value: summary.lots, hint: `${summary.openLots} open` },
          { label: "Open lots", value: summary.openLots, hint: "Visible to buyers" },
          { label: "Active orders", value: summary.activeOrders, hint: "Active or awaiting buyer" },
          { label: "Disputed orders", value: summary.disputed, hint: "Waiting on a decision" },
          { label: "Open pickups", value: summary.openPickups, hint: "Not completed or failed" },
          { label: "Blocked accounts", value: summary.blocked, hint: "Cannot sign in" },
          { label: "Audit events", value: summary.auditEvents, hint: "Recorded actions" },
        ]}
      />

      <div className="split" style={{ marginTop: 22 }}>
        <section className="card">
          <h2 style={{ fontSize: "1.2rem" }}>What needs a human decision</h2>
          <ul className="meta-list">
            <li>
              <span className="k">Disputed orders</span>
              <span className="mono">{summary.disputed}</span>
            </li>
            <li>
              <span className="k">Awaiting buyer confirmation</span>
              <span className="mono">{awaitingBuyer}</span>
            </li>
            <li>
              <span className="k">Blocked accounts</span>
              <span className="mono">{summary.blocked}</span>
            </li>
          </ul>
          <p className="small muted" style={{ marginTop: 14, marginBottom: 0 }}>
            Resolving a dispute is a review decision for now. Blocked accounts and pending offers are visible for
            follow-up on the transaction and user pages rather than actioned from this screen.
          </p>
          <div className="btn-row" style={{ marginTop: 14 }}>
            <Link className="btn btn-ghost btn-sm" href="/admin/transactions">
              Open transactions
            </Link>
            <Link className="btn btn-ghost btn-sm" href="/admin/users">
              Open users
            </Link>
          </div>
        </section>

        <section className="card">
          <h2 style={{ fontSize: "1.2rem" }}>Admin tools</h2>
          <ul className="audit">
            {TOOLS.map((tool) => (
              <li className="audit-row" key={tool.href}>
                <div>
                  <p style={{ margin: 0, fontWeight: 600 }}>
                    <Link href={tool.href}>{tool.label}</Link>
                  </p>
                  <p className="small muted" style={{ margin: "2px 0 0" }}>
                    {tool.note}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="card" style={{ marginTop: 22 }}>
        <div className="card-title">
          <h2 style={{ fontSize: "1.2rem", margin: 0 }}>Recent activity</h2>
          <Link className="small" href="/admin/audit-log">
            Full audit log
          </Link>
        </div>
        <AuditList
          events={recent}
          emptyHint="Role changes, status changes and grid metadata edits will appear here with a timestamp."
        />
      </section>

      <div style={{ marginTop: 22 }}>
        <SimNotice>
          These are prototype counts from the bundled demo dataset, not a live programme statistic. They move as the
          walkthrough is used and reseed when the local store is cleared.
        </SimNotice>
      </div>
    </>
  );
}
