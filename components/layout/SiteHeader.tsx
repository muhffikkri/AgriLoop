import Link from "next/link";
import { getCurrentUser, homeFor } from "@/lib/server/auth.ts";

const LINKS = [
  { href: "/#problem", label: "Why it matters" },
  { href: "/#workflow", label: "How it works" },
  { href: "/demo", label: "Demo" },
  { href: "/#limits", label: "What it cannot do" },
];

export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header
      style={{
        borderBottom: "1px solid var(--line)",
        background: "var(--surface)",
        position: "sticky",
        top: 0,
        zIndex: 20,
      }}
    >
      <div
        className="container"
        style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16, paddingBlock: 12 }}
      >
        <Link href="/" style={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--ink)" }}>
          AgriLoop<span style={{ color: "var(--green)" }}> AI</span>
        </Link>

        <nav aria-label="Main" style={{ display: "flex", flexWrap: "wrap", gap: 4, marginInlineEnd: "auto" }}>
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="small"
              style={{ padding: "8px 10px", color: "var(--ink-muted)" }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="btn-row">
          {user ? (
            <Link className="btn btn-ghost btn-sm" href={homeFor(user.role)}>
              Open workspace
            </Link>
          ) : (
            <>
              <Link className="btn btn-ghost btn-sm" href="/login">
                Sign in
              </Link>
              <Link className="btn btn-primary btn-sm" href="/demo">
                Try the demo
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
