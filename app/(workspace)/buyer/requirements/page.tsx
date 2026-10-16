import Link from "next/link";
import { WorkspaceHeader } from "@/components/layout/WorkspaceShell.tsx";
import { RequirementForm } from "@/components/buyer/RequirementForm.tsx";
import { StatusBadge } from "@/components/ui/badges.tsx";
import { EmptyState } from "@/components/ui/states.tsx";
import { listRequirements } from "@/lib/server/market.ts";
import { selectableAreas } from "@/lib/server/lots.ts";
import { requirePageUser } from "@/lib/server/auth.ts";
import { todayIso } from "@/lib/server/db.ts";
import type { Requirement } from "@/lib/server/db.ts";

export const metadata = { title: "Requirements" };

const FILTERS: Array<{ key: string; label: string; match: (requirement: Requirement) => boolean }> = [
  { key: "all", label: "All", match: () => true },
  { key: "draft", label: "Drafts", match: (requirement) => requirement.status === "DRAFT" },
  { key: "open", label: "Open", match: (requirement) => requirement.status === "OPEN" },
  { key: "matched", label: "Partly matched", match: (requirement) => requirement.status === "PARTIALLY_MATCHED" },
  { key: "fulfilled", label: "Fulfilled", match: (requirement) => requirement.status === "FULFILLED" },
  { key: "closed", label: "Closed", match: (requirement) => requirement.status === "CLOSED" },
  { key: "cancelled", label: "Cancelled", match: (requirement) => requirement.status === "CANCELLED" },
];

export default async function RequirementsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await requirePageUser("buyer");
  const { status } = await searchParams;
  const active = FILTERS.find((filter) => filter.key === status) ?? FILTERS[0];
  const all = listRequirements(user);
  const requirements = all.filter(active.match);
  const areas = selectableAreas();

  return (
    <>
      <WorkspaceHeader
        title="Requirements"
        intro="A requirement states the material, the volume you can take and the delivery window. Save a draft until it is right, then publish it so lots are ranked against it. Publishing is not a contract."
      />

      <nav className="seg" aria-label="Filter requirements by status" style={{ marginBottom: 16 }}>
        {FILTERS.map((filter) => (
          <Link
            key={filter.key}
            href={filter.key === "all" ? "/buyer/requirements" : `/buyer/requirements?status=${filter.key}`}
            aria-current={filter.key === active.key ? "true" : undefined}
          >
            {filter.label}
          </Link>
        ))}
      </nav>

      <section className="card" style={{ padding: 0 }}>
        {requirements.length ? (
          <div className="table-wrap">
            <table className="table">
              <caption className="sr-only" style={{ position: "absolute", left: -9999 }}>
                Your requirements with material, quantity, window and status
              </caption>
              <thead>
                <tr>
                  <th scope="col">Requirement</th>
                  <th scope="col">Material</th>
                  <th scope="col">Quantity</th>
                  <th scope="col">Window</th>
                  <th scope="col">Area</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {requirements.map((requirement) => (
                  <tr key={requirement.id}>
                    <td className="num">
                      <Link href={`/buyer/requirements/${requirement.id}`}>{requirement.id}</Link>
                      <span className="small muted" style={{ display: "block" }}>
                        {requirement.orgName}
                      </span>
                    </td>
                    <td>{requirement.residueType}</td>
                    <td className="num">
                      {requirement.quantityMin}-{requirement.quantityMax} {requirement.unit}
                    </td>
                    <td className="num">
                      {requirement.windowStart} to {requirement.windowEnd}
                    </td>
                    <td>{requirement.areaLabel}</td>
                    <td>
                      <StatusBadge status={requirement.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No requirement in this status"
            hint={
              active.key === "all"
                ? "Describe your first requirement below to start matching against open lots."
                : "No requirement is in this status right now. Try another filter."
            }
          />
        )}
      </section>

      <div style={{ marginTop: 22 }}>
        <RequirementForm areas={areas} today={todayIso()} />
      </div>

      <p className="small muted" style={{ marginTop: 14 }}>
        Quantities you enter are the volume you can take, not a confirmed purchase. A lot only becomes yours once a
        farmer accepts your offer and you confirm the agreement.
      </p>
    </>
  );
}
