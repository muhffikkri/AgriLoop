import Link from "next/link";
import { WorkspaceHeader } from "@/components/layout/WorkspaceShell.tsx";
import { AuditList } from "@/components/ui/AuditList.tsx";
import { ErrorState } from "@/components/ui/states.tsx";
import { auditTrail } from "@/lib/server/admin.ts";
import { requirePageUser } from "@/lib/server/auth.ts";
import type { AuditEvent } from "@/lib/server/db.ts";

export const metadata = { title: "Audit log" };

const ENTITY_TYPES: AuditEvent["entityType"][] = [
  "lot",
  "offer",
  "order",
  "pickup",
  "requirement",
  "user",
  "grid",
  "observation",
];

function isEntityType(value: string): value is AuditEvent["entityType"] {
  return (ENTITY_TYPES as string[]).includes(value);
}

export default async function AdminAuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ entityType?: string; entityId?: string }>;
}) {
  const user = await requirePageUser("admin");
  const params = await searchParams;

  const entityType = params.entityType && isEntityType(params.entityType) ? params.entityType : undefined;
  const entityId = params.entityId?.trim() || undefined;
  const result = auditTrail(user, { entityType, entityId });

  if (!result.ok) {
    return (
      <>
        <WorkspaceHeader title="Audit log" />
        <ErrorState title="The audit log could not be loaded" detail={result.error} />
      </>
    );
  }

  const events = result.value;
  const filtering = Boolean(entityType || entityId);

  return (
    <>
      <WorkspaceHeader
        title="Audit log"
        intro="An append-only list of recorded actions: who did what, to which record, and when. The most recent 200 matching events are shown."
      />

      <form method="get" action="/admin/audit-log" className="card" style={{ marginBottom: 18 }}>
        <div className="form-grid form-grid-2">
          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor="audit-entity-type">Entity type</label>
            <select className="select" id="audit-entity-type" name="entityType" defaultValue={entityType ?? ""}>
              <option value="">All entity types</option>
              {ENTITY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor="audit-entity-id">Entity id</label>
            <input
              className="input"
              id="audit-entity-id"
              name="entityId"
              type="text"
              defaultValue={entityId ?? ""}
              placeholder="e.g. LOT-0001"
              aria-describedby="audit-entity-id-help"
            />
            <p className="help" id="audit-entity-id-help">
              Optional exact match on a record id such as LOT-0001, OFF-0002, ORD-0001 or USR-0004.
            </p>
          </div>
        </div>
        <div className="btn-row" style={{ marginTop: 14 }}>
          <button className="btn btn-primary" type="submit">
            Apply filter
          </button>
          {filtering ? (
            <Link className="btn btn-ghost" href="/admin/audit-log">
              Clear
            </Link>
          ) : null}
        </div>
      </form>

      <section className="card">
        <div className="card-title">
          <h2 style={{ fontSize: "1.2rem", margin: 0 }}>Recorded events</h2>
          <span className="small muted">{events.length} event(s)</span>
        </div>
        {filtering ? (
          <p className="small muted">
            Filtering by {entityType ? `type ${entityType}` : "any type"}
            {entityId ? ` and id ${entityId}` : ""}.
          </p>
        ) : null}
        <AuditList
          events={events}
          emptyHint={
            filtering
              ? "No recorded event matches this filter. Clear it to see the full trail."
              : "Role changes, status changes and grid metadata edits will appear here with a timestamp."
          }
        />
      </section>
    </>
  );
}
