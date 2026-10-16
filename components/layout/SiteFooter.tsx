import Link from "next/link";
import { SimBadge } from "@/components/ui/badges.tsx";

export function SiteFooter() {
  return (
    <footer style={{ borderTop: "1px solid var(--line)", background: "var(--surface-alt)", marginTop: 40 }}>
      <div className="container" style={{ paddingBlock: 32, display: "grid", gap: 20 }} data-testid="site-footer">
        <div className="grid-3">
          <div>
            <h3 style={{ marginBottom: 6 }}>Documents</h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }} className="small">
              <li>
                <Link href="/about">About the project and its sources</Link>
              </li>
              <li>
                <Link href="/demo">How the walkthrough is put together</Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 style={{ marginBottom: 6 }}>Data honesty</h3>
            <p className="small" style={{ margin: 0 }}>
              Every quantity, buyer and price inside this website is invented for the demo. Public
              figures used on the about page are cited with their original source.
            </p>
          </div>
          <div>
            <h3 style={{ marginBottom: 6 }}>Status</h3>
            <p className="small" style={{ margin: 0 }}>
              MVP prototype. No payments, no contracts, no automated quality certification.
            </p>
            <p style={{ marginTop: 8 }}>
              <SimBadge compact />
            </p>
          </div>
        </div>
        <p className="small muted" style={{ margin: 0 }}>
          AgriLoop AI · pilot planning in progress · imagery and grid extents on this site are
          synthetic samples, not field boundaries.
        </p>
      </div>
    </footer>
  );
}
