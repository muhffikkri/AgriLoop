import Link from "next/link";
import { notFound } from "next/navigation";
import { WorkspaceHeader } from "@/components/layout/WorkspaceShell.tsx";
import { RequirementForm } from "@/components/buyer/RequirementForm.tsx";
import { CancelRequirementForm, PublishRequirementForm } from "@/components/buyer/RequirementActions.tsx";
import { MatchList } from "@/components/buyer/MatchList.tsx";
import { StatusBadge, ConditionBadge } from "@/components/ui/badges.tsx";
import { requirementById, matchesForRequirement } from "@/lib/server/market.ts";
import { selectableAreas } from "@/lib/server/lots.ts";
import { requirePageUser } from "@/lib/server/auth.ts";
import { todayIso } from "@/lib/server/db.ts";
import { REQUIREMENT_TRANSITIONS } from "@/lib/domain/status.ts";

export const metadata = { title: "Requirement detail" };

const LOCKED = ["FULFILLED", "CLOSED", "CANCELLED"];

export default async function RequirementDetailPage({
  params,
}: {
  params: Promise<{ requirementId: string }>;
}) {
  const user = await requirePageUser("buyer");
  const { requirementId } = await params;

  const requirement = requirementById(user, requirementId);
  if (!requirement) notFound();

  const matchResult = matchesForRequirement(user, requirementId);
  const rows = matchResult.ok ? matchResult.value.rows : [];

  const editable = !LOCKED.includes(requirement.status);
  const canPublish = requirement.status === "DRAFT";
  const canCancel = REQUIREMENT_TRANSITIONS[requirement.status].includes("CANCELLED");
  const areas = selectableAreas();

  return (
    <>
      <WorkspaceHeader
        title={`Requirement ${requirement.id}`}
        intro={
          <span>
            <StatusBadge status={requirement.status} /> {requirement.residueType} · {requirement.areaLabel} · owned
            by {requirement.orgName}
          </span>
        }
        actions={
          <Link className="btn btn-ghost" href="/buyer/requirements">
            Back to requirements
          </Link>
        }
      />

      <div className="split">
        <div className="stack">
          <section className="card">
            <h2 style={{ fontSize: "1.2rem" }}>What you asked for</h2>
            <dl className="facts">
              <div>
                <dt>Residue type</dt>
                <dd>{requirement.residueType}</dd>
              </div>
              <div>
                <dt>Quantity window</dt>
                <dd className="mono">
                  {requirement.quantityMin}-{requirement.quantityMax} {requirement.unit}
                </dd>
              </div>
              <div>
                <dt>Delivery window</dt>
                <dd className="mono">
                  {requirement.windowStart} to {requirement.windowEnd}
                </dd>
              </div>
              <div>
                <dt>Search area</dt>
                <dd>{requirement.areaLabel}</dd>
              </div>
              <div>
                <dt>Search radius</dt>
                <dd className="mono">{requirement.radiusKm} km</dd>
              </div>
              <div>
                <dt>Lowest condition</dt>
                <dd>
                  <ConditionBadge label={requirement.minCondition} />
                </dd>
              </div>
              <div>
                <dt>Substitution</dt>
                <dd>{requirement.substitution ? "Acceptable" : "Not acceptable"}</dd>
              </div>
              <div>
                <dt>Last updated</dt>
                <dd className="mono">{requirement.updatedAt.slice(0, 16).replace("T", " ")}</dd>
              </div>
            </dl>
            {requirement.notes ? (
              <p style={{ marginTop: 14, marginBottom: 0 }}>
                <strong>Your notes:</strong> {requirement.notes}
              </p>
            ) : null}
          </section>

          {editable ? (
            <RequirementForm requirement={requirement} areas={areas} today={todayIso()} />
          ) : (
            <section className="card">
              <h2 style={{ fontSize: "1.2rem" }}>This requirement is locked</h2>
              <p style={{ margin: 0 }}>
                A requirement with status <strong>{requirement.status}</strong> can no longer be edited. That keeps
                the record the farmers answered against. Create a new requirement if your needs have changed.
              </p>
            </section>
          )}
        </div>

        <div className="stack">
          <section className="card">
            <h2 style={{ fontSize: "1.2rem" }}>Lifecycle</h2>
            <p className="small muted">
              Current status <StatusBadge status={requirement.status} />
            </p>

            {canPublish ? (
              <div style={{ marginBottom: 14 }}>
                <p style={{ marginTop: 0 }}>
                  This is a draft. Publishing lets lots be ranked against it. You can still cancel it afterwards.
                </p>
                <PublishRequirementForm requirementId={requirement.id} />
              </div>
            ) : (
              <p className="small muted">
                {requirement.status === "OPEN"
                  ? "The requirement is open. Lots are ranked against it on the matches page."
                  : "No further publishing step is needed at this status."}
              </p>
            )}

            {canCancel ? (
              <>
                <hr style={{ border: 0, borderTop: "1px solid var(--line)", margin: "16px 0" }} />
                <CancelRequirementForm requirementId={requirement.id} />
              </>
            ) : (
              <p className="small muted" style={{ marginBottom: 0 }}>
                Cancelling is not possible from {requirement.status}. A finished requirement keeps its record.
              </p>
            )}
          </section>

          <section className="card">
            <h2 style={{ fontSize: "1.2rem" }}>How matches are read</h2>
            <ul className="meta-list">
              <li>
                <span className="k">Reasons</span>
                <span>are facts that support the suggestion, shown as written by the matcher.</span>
              </li>
              <li>
                <span className="k">Blockers</span>
                <span>are facts that stop a clean match. They are never hidden.</span>
              </li>
              <li>
                <span className="k">Score</span>
                <span>sorts lots for this one requirement. It is a relative aid, not a quality grade.</span>
              </li>
            </ul>
            <p style={{ marginTop: 14, marginBottom: 0 }}>
              A condition label is a working note, not a certificate. Check the material before you commit.
            </p>
          </section>
        </div>
      </div>

      <section className="card" style={{ marginTop: 22 }}>
        <div className="card-title">
          <h2 style={{ fontSize: "1.2rem", margin: 0 }}>Matched lots ({rows.length})</h2>
          <Link className="small" href={`/buyer/matches?requirement=${requirement.id}`}>
            Open in match reasons
          </Link>
        </div>
        <p className="small muted">
          Lots of the same material ranked against this requirement. The score only sorts this list; read the reasons
          and blockers to decide.
        </p>
        <MatchList
          rows={rows}
          emptyTitle="No lot matches this requirement yet"
          emptyHint="When a farmer publishes a lot of the same material, it is ranked here with the reasons and any blockers."
        />
      </section>
    </>
  );
}
