import Link from "next/link";
import { WorkspaceHeader } from "@/components/layout/WorkspaceShell.tsx";
import { LotTable } from "@/components/farmer/LotTable.tsx";
import { listLotsForFarmer } from "@/lib/server/lots.ts";
import { requirePageUser } from "@/lib/server/auth.ts";
import type { Lot } from "@/lib/server/db.ts";

export const metadata = { title: "My supply" };

const FILTERS: Array<{ key: string; label: string; match: (lot: Lot) => boolean }> = [
  { key: "all", label: "All", match: () => true },
  { key: "draft", label: "Drafts", match: (lot) => lot.status === "DRAFT" },
  { key: "open", label: "Open", match: (lot) => lot.status === "OPEN" },
  {
    key: "progress",
    label: "In progress",
    match: (lot) => lot.status === "RESERVED" || lot.status === "PICKUP_SCHEDULED" || lot.status === "PICKED_UP",
  },
  { key: "closed", label: "Finished", match: (lot) => lot.status === "ACCEPTED" || lot.status === "CLOSED" },
  {
    key: "stopped",
    label: "Stopped",
    match: (lot) => lot.status === "CANCELLED" || lot.status === "EXPIRED" || lot.status === "REJECTED" || lot.status === "DISPUTED",
  },
];

export default async function SupplyPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await requirePageUser("farmer");
  const { status } = await searchParams;
  const active = FILTERS.find((filter) => filter.key === status) ?? FILTERS[0];
  const lots = listLotsForFarmer(user).filter(active.match);

  return (
    <>
      <WorkspaceHeader
        title="My supply"
        intro="A lot is a described quantity of residue with a ready date. Keep it a draft until you are happy with the details, then publish it for buyers."
        actions={
          <Link className="btn btn-primary" href="/farmer/supply/new">
            Add a lot
          </Link>
        }
      />

      <nav className="seg" aria-label="Filter lots by status" style={{ marginBottom: 16 }}>
        {FILTERS.map((filter) => (
          <Link
            key={filter.key}
            href={filter.key === "all" ? "/farmer/supply" : `/farmer/supply?status=${filter.key}`}
            aria-current={filter.key === active.key ? "true" : undefined}
          >
            {filter.label}
          </Link>
        ))}
      </nav>

      <section className="card" style={{ padding: 0 }}>
        <LotTable
          lots={lots}
          emptyHint={
            active.key === "all"
              ? "Create your first listing to describe what you have and when it is ready."
              : "No lot in this status right now. Try another filter."
          }
        />
      </section>

      <p className="small muted" style={{ marginTop: 14 }}>
        Quantities are what you recorded, not a weighbridge figure. The weighed amount is captured at pickup and
        the difference is kept on the record.
      </p>
    </>
  );
}
