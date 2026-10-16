import Link from "next/link";

export const metadata = { title: "Access denied" };

export default function DeniedPage() {
  return (
    <main id="main" className="container" style={{ paddingBlock: 64, maxWidth: 640 }}>
      <div className="card stack">
        <h1 style={{ fontSize: "1.8rem" }}>This area is not open to your account</h1>
        <p style={{ margin: 0 }}>
          Every role has its own workspace and the pages are checked on the server, not just hidden in the
          navigation. If you need access for a second role, a programme admin has to grant it.
        </p>
        <div className="btn-row">
          <Link className="btn btn-primary" href="/app">
            Go to my dashboard
          </Link>
          <Link className="btn btn-ghost" href="/">
            Back to the public site
          </Link>
        </div>
      </div>
    </main>
  );
}
