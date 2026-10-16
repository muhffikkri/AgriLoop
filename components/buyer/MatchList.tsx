import { StatusBadge, ConditionBadge } from "@/components/ui/badges.tsx";
import { EmptyState } from "@/components/ui/states.tsx";
import type { MatchRow } from "@/lib/server/market.ts";

/**
 * Renders one ranked lot with the reasons and blockers written verbatim. The score is a
 * relative sorting aid across a single requirement, never a quality grade, so the reasons
 * and blockers carry the real decision.
 */
export function MatchCard({
  row,
  showStatus = true,
  children,
}: {
  row: MatchRow;
  showStatus?: boolean;
  children?: React.ReactNode;
}) {
  const { lot, eligible, score, reasons, blockers } = row;

  return (
    <article className="card">
      <div className="card-title">
        <h3 style={{ fontSize: "1.1rem", margin: 0 }}>
          <span className="mono">{lot.id}</span> · {lot.residueType}
        </h3>
        <span className="badge badge-solid" style={{ background: eligible ? "var(--green)" : "var(--ink-faint)" }}>
          {eligible ? "Eligible" : "Blocked"} · score {score}
        </span>
      </div>

      <dl className="facts">
        <div>
          <dt>Quantity</dt>
          <dd className="mono">
            {lot.quantity} {lot.unit}
          </dd>
        </div>
        <div>
          <dt>Ready from</dt>
          <dd className="mono">{lot.readyDate}</dd>
        </div>
        <div>
          <dt>Area</dt>
          <dd>{lot.areaLabel}</dd>
        </div>
        <div>
          <dt>From</dt>
          <dd>{lot.farmerOrg}</dd>
        </div>
        <div>
          <dt>Condition</dt>
          <dd>
            <ConditionBadge label={lot.conditionLabel} />
          </dd>
        </div>
        {showStatus ? (
          <div>
            <dt>Lot status</dt>
            <dd>
              <StatusBadge status={lot.status} />
            </dd>
          </div>
        ) : null}
      </dl>

      <div style={{ marginTop: 14 }}>
        <p className="small muted" style={{ margin: "0 0 6px" }}>
          Why it was suggested
        </p>
        {reasons.length ? (
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {reasons.map((reason) => (
              <li key={reason} className="small">
                {reason}
              </li>
            ))}
          </ul>
        ) : (
          <p className="small muted" style={{ margin: 0 }}>
            No supporting reason was recorded.
          </p>
        )}
      </div>

      {blockers.length ? (
        <div className="alert alert-error" style={{ marginTop: 12 }}>
          <p style={{ margin: "0 0 6px", fontWeight: 600 }}>What stops this from being a clean match</p>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {blockers.map((blocker) => (
              <li key={blocker} className="small">
                {blocker}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {children ? <div style={{ marginTop: 14 }}>{children}</div> : null}
    </article>
  );
}

export function MatchList({
  rows,
  emptyTitle = "No lot matches this requirement yet",
  emptyHint = "When a farmer publishes a lot of the same material, it is ranked here with the reasons and any blockers.",
  children,
}: {
  rows: MatchRow[];
  emptyTitle?: string;
  emptyHint?: string;
  children?: (row: MatchRow) => React.ReactNode;
}) {
  if (!rows.length) {
    return <EmptyState title={emptyTitle} hint={emptyHint} />;
  }

  return (
    <div className="stack">
      {rows.map((row) => (
        <MatchCard key={row.lot.id} row={row}>
          {children ? children(row) : null}
        </MatchCard>
      ))}
    </div>
  );
}
