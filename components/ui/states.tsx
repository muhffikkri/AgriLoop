export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <div className="state">
      <p style={{ margin: "0 0 6px", fontWeight: 600, color: "var(--ink)" }}>{title}</p>
      {hint ? <p className="small" style={{ margin: 0 }}>{hint}</p> : null}
      {action ? <div style={{ marginTop: 14 }}>{action}</div> : null}
    </div>
  );
}

export function LoadingRows({ rows = 3, label = "Loading" }: { rows?: number; label?: string }) {
  return (
    <div className="stack" role="status" aria-live="polite" aria-busy="true">
      <span className="small muted">{label}</span>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="skeleton" />
      ))}
    </div>
  );
}

export function ErrorState({ title, detail }: { title: string; detail?: React.ReactNode }) {
  return (
    <div className="alert alert-error" role="alert">
      <p style={{ margin: 0, fontWeight: 600 }}>{title}</p>
      {detail ? <p className="small" style={{ margin: "6px 0 0" }}>{detail}</p> : null}
    </div>
  );
}

export function StatGrid({
  items,
}: {
  items: Array<{ label: string; value: React.ReactNode; hint?: string }>;
}) {
  return (
    <div className="grid-4">
      {items.map((item) => (
        <div className="card" key={item.label}>
          <p className="small muted" style={{ margin: "0 0 4px" }}>
            {item.label}
          </p>
          <p className="mono" style={{ margin: 0, fontSize: "1.9rem", fontWeight: 600, lineHeight: 1.1 }}>
            {item.value}
          </p>
          {item.hint ? (
            <p className="small muted" style={{ margin: "6px 0 0" }}>
              {item.hint}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
