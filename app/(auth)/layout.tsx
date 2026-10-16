import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header style={{ borderBottom: "1px solid var(--line)", background: "var(--surface)" }}>
        <div className="container" style={{ paddingBlock: 12 }}>
          <Link href="/" style={{ fontWeight: 700, color: "var(--ink)" }}>
            AgriLoop<span style={{ color: "var(--green)" }}> AI</span>
          </Link>
        </div>
      </header>
      <main id="main" className="container" style={{ maxWidth: 520, paddingBlock: 40 }}>
        {children}
      </main>
    </>
  );
}
