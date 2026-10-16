import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main" className="container" style={{ paddingBlock: 64, maxWidth: 640 }}>
      <div className="card stack" data-testid="not-found">
        <h1 style={{ fontSize: "1.8rem" }}>That page does not exist</h1>
        <p style={{ margin: 0 }}>
          The link may be old, or the record it pointed at is no longer shared with your account. Both are
          normal in a pilot where statuses move.
        </p>
        <div className="btn-row">
          <Link className="btn btn-primary" href="/">
            Public site
          </Link>
          <Link className="btn btn-ghost" href="/demo">
            Open the demo
          </Link>
        </div>
      </div>
    </main>
  );
}
