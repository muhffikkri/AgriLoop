import Link from "next/link";
import { WorkspaceNav } from "./WorkspaceNav.tsx";
import { SimBadge } from "@/components/ui/badges.tsx";
import { signOutAction } from "@/app/(auth)/actions.ts";
import { ROLE_LABEL, ROLE_NAV } from "@/lib/role-nav.ts";
import type { User } from "@/lib/server/db.ts";

export function WorkspaceShell({
  user,
  title,
  intro,
  actions,
  children,
}: {
  user: User;
  title: string;
  intro?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="ws">
      <aside className="ws-side">
        <p style={{ margin: "0 0 4px", fontWeight: 700 }}>
          <Link href="/" style={{ color: "var(--ink)" }}>
            AgriLoop<span style={{ color: "var(--green)" }}> AI</span>
          </Link>
        </p>
        <p className="small muted" style={{ margin: "0 0 14px" }}>
          {ROLE_LABEL[user.role]}
        </p>
        <nav aria-label={`${ROLE_LABEL[user.role]} navigation`}>
          <WorkspaceNav items={ROLE_NAV[user.role]} />
        </nav>
        <div style={{ marginTop: 18, borderTop: "1px solid var(--line)", paddingTop: 14 }}>
          <p className="small" style={{ margin: "0 0 2px", fontWeight: 600 }}>
            {user.name}
          </p>
          <p className="small muted" style={{ margin: "0 0 10px" }}>
            {user.orgName ?? "Individual account"}
          </p>
          <form action={signOutAction}>
            <button className="btn btn-ghost btn-sm" type="submit">
              Sign out
            </button>
          </form>
        </div>
        <p style={{ marginTop: 14 }}>
          <SimBadge compact />
        </p>
      </aside>

      <main id="main" className="ws-main">
        <div className="ws-top">
          <div>
            <h1 style={{ fontSize: "1.7rem", marginBottom: intro ? 6 : 0 }}>{title}</h1>
            {intro ? <p className="lede" style={{ margin: 0, fontSize: "1rem" }}>{intro}</p> : null}
          </div>
          {actions ? <div className="btn-row">{actions}</div> : null}
        </div>
        {children}
        <p className="sim-banner" style={{ marginTop: 28 }}>
          <SimBadge />
          <span>
            This workspace is a prototype running on invented records. Nothing here is a real order,
            shipment or payment.
          </span>
        </p>
      </main>
    </div>
  );
}
