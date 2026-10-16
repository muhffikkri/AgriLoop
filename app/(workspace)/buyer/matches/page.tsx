import Link from "next/link";
import { WorkspaceHeader } from "@/components/layout/WorkspaceShell.tsx";
import { MatchList } from "@/components/buyer/MatchList.tsx";
import { EmptyState } from "@/components/ui/states.tsx";
import { StatusBadge } from "@/components/ui/badges.tsx";
import { listRequirements, matchesForRequirement } from "@/lib/server/market.ts";
import { requirePageUser } from "@/lib/server/auth.ts";

export const metadata = { title: "Match reasons" };

export default async function MatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ requirement?: string }>;
}) {
  const user = await requirePageUser("buyer");
  const { requirement } = await searchParams;

  const requirements = listRequirements(user);
  const selected = requirements.find((candidate) => candidate.id === requirement) ?? requirements[0];
  const matchResult = selected ? matchesForRequirement(user, selected.id) : null;
  const rows = matchResult && matchResult.ok ? matchResult.value.rows : [];

  return (
    <>
      <WorkspaceHeader
        title="Match reasons"
        intro="Pick one of your requirements and read why each open lot was suggested or blocked. The reasons and blockers are shown as written. The score only sorts this one list."
      />

      {requirements.length ? (
        <>
          <form method="get" className="card" style={{ marginBottom: 18 }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <label htmlFor="requirement">Requirement</label>
              <select className="select" id="requirement" name="requirement" defaultValue={selected?.id ?? ""}>
                {requirements.map((candidate) => (
                  <option key={candidate.id} value={candidate.id}>
                    {candidate.id} · {candidate.residueType} · {candidate.quantityMin}-{candidate.quantityMax}{" "}
                    {candidate.unit} · {candidate.status}
                  </option>
                ))}
              </select>
            </div>
            <div className="btn-row" style={{ marginTop: 14 }}>
              <button className="btn btn-ghost btn-sm" type="submit">
                Show matches
              </button>
            </div>
          </form>

          {selected ? (
            <section className="card" style={{ marginBottom: 18 }}>
              <div className="card-title">
                <h2 style={{ fontSize: "1.15rem", margin: 0 }}>
                  {selected.id} · {selected.residueType}
                </h2>
                <StatusBadge status={selected.status} />
              </div>
              <p className="small muted" style={{ margin: 0 }}>
                {selected.quantityMin}-{selected.quantityMax} {selected.unit} in {selected.areaLabel} within{" "}
                {selected.radiusKm} km, ready {selected.windowStart} to {selected.windowEnd}.{" "}
                <Link href={`/buyer/requirements/${selected.id}`}>Open the requirement</Link>
              </p>
            </section>
          ) : null}

          <MatchList
            rows={rows}
            emptyTitle="No lot matches this requirement yet"
            emptyHint="When a farmer publishes a lot of the same material, it is ranked here with the reasons and any blockers."
          />
        </>
      ) : (
        <EmptyState
          title="No requirement to match against"
          hint="Create a requirement first. Every match is ranked against one of your own requirements."
          action={
            <Link className="btn btn-primary btn-sm" href="/buyer/requirements">
              Add a requirement
            </Link>
          }
        />
      )}

      <section className="card" style={{ marginTop: 22 }}>
        <h2 style={{ fontSize: "1.2rem" }}>How to read this list</h2>
        <ul className="meta-list">
          <li>
            <span className="k">A reason</span>
            <span>is a fact that supports the suggestion, such as the quantity sitting inside your window.</span>
          </li>
          <li>
            <span className="k">A blocker</span>
            <span>is a fact that stops a clean match. Blocked lots cannot be offered as they are.</span>
          </li>
          <li>
            <span className="k">The score</span>
            <span>sorts lots for this requirement only. It is a relative aid, not a quality grade.</span>
          </li>
        </ul>
        <p style={{ marginTop: 14, marginBottom: 0 }}>
          A condition label is a working note from the farmer or an enumerator, never a certificate. Inspect the
          material before you commit if it matters to you.
        </p>
      </section>
    </>
  );
}
