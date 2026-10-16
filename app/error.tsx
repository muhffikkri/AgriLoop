"use client";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="container" style={{ paddingBlock: 64, maxWidth: 640 }}>
      <div className="card stack" data-testid="error-state">
        <h1 style={{ fontSize: "1.8rem" }}>Something failed while loading this page</h1>
        <p style={{ margin: 0 }}>
          The error was not hidden from you. Try again, and if it repeats, note what you were doing so it can
          be traced.
        </p>
        <p className="mono small" style={{ margin: 0, wordBreak: "break-word" }}>
          {error.message}
        </p>
        <div className="btn-row">
          <button className="btn btn-primary" type="button" onClick={reset}>
            Try again
          </button>
        </div>
      </div>
    </main>
  );
}
