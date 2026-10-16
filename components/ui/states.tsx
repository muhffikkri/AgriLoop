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
