import type { AuditEvent } from "@/lib/server/db.ts";

function stamp(iso: string): string {
  return iso.slice(0, 16).replace("T", " ");
}

function readable(action: string): string {
  return action.replace(/[._]/g, " ");
}

/** A flat, scannable activity list; reused by the farmer history and the admin audit view. */
export function AuditList({ events, emptyHint }: { events: AuditEvent[]; emptyHint?: string }) {
  if (!events.length) {
    return (
      <div className="state">
        <p style={{ margin: 0, fontWeight: 600, color: "var(--ink)" }}>Nothing recorded yet</p>
        <p className="small" style={{ margin: "6px 0 0" }}>
          {emptyHint ?? "Actions you or your colleagues take will be listed here with a timestamp."}
        </p>
      </div>
    );
  }

  return (
    <ul className="audit">
      {events.map((event) => (
        <li key={event.id} className="audit-row">
          <div>
            <p style={{ margin: 0, fontWeight: 600 }}>{readable(event.action)}</p>
            <p className="small muted" style={{ margin: "2px 0 0" }}>
              {event.actorName} ({event.actorRole}) · {event.entityType} {event.entityId}
              {event.from || event.to ? ` · ${event.from ?? "—"} → ${event.to ?? "—"}` : ""}
            </p>
            {event.detail ? (
              <p className="small" style={{ margin: "4px 0 0" }}>
                {event.detail}
              </p>
            ) : null}
          </div>
          <time className="mono small muted" dateTime={event.createdAt}>
            {stamp(event.createdAt)}
          </time>
        </li>
      ))}
    </ul>
  );
}
