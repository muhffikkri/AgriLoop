import Link from "next/link";
import { WorkspaceHeader } from "@/components/layout/WorkspaceShell.tsx";
import { OfferForm } from "@/components/buyer/OfferForm.tsx";
import { MatchList } from "@/components/buyer/MatchList.tsx";
import { EmptyState } from "@/components/ui/states.tsx";
import { marketplaceLots } from "@/lib/server/lots.ts";
import { matchPreview, openRequirementsFor, type MatchRow } from "@/lib/server/market.ts";
import { requirePageUser } from "@/lib/server/auth.ts";
import { todayIso } from "@/lib/server/db.ts";
import { RESIDUE_TYPES } from "@/lib/domain/catalog.ts";
import type { Lot } from "@/lib/server/db.ts";

export const metadata = { title: "Find supply" };

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ residue?: string; area?: string; requirement?: string }>;
}) {
  const user = await requirePageUser("buyer");
  const { residue = "", area = "", requirement = "" } = await searchParams;

  const requirements = openRequirementsFor(user);
  const selected = requirements.find((candidate) => candidate.id === requirement) ?? requirements[0];
  const lots = marketplaceLots();
  const areas = Array.from(new Set(lots.map((lot) => lot.areaLabel))).sort();

  const filtered = lots.filter(
    (lot) => (!residue || lot.residueType === residue) && (!area || lot.areaLabel === area),
  );

  const toRow = (lot: Lot): MatchRow => {
    const result = matchPreview(lot, selected!);
    return { lot, eligible: result.eligible, score: result.score, reasons: result.reasons, blockers: result.blockers };
  };

  return (
    <>
      <WorkspaceHeader
        title="Find supply"
        intro="Every lot here is published and open. The reasons and blockers come from the requirement you pick, and they are shown as written. A lot that is blocked cannot be offered at all."
      />

      <form method="get" className="card" style={{ marginBottom: 18 }}>
        <div className="form-grid form-grid-2">
          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor="residue">Material</label>
            <select className="select" id="residue" name="residue" defaultValue={residue}>
              <option value="">All materials</option>
              {RESIDUE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor="area">Area</label>
            <select className="select" id="area" name="area" defaultValue={area}>
              <option value="">All areas</option>
              {areas.map((label) => (
                <option key={label} value={label}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor="requirement">Rank against requirement</label>
            {requirements.length ? (
              <select className="select" id="requirement" name="requirement" defaultValue={selected?.id ?? ""}>
                {requirements.map((candidate) => (
                  <option key={candidate.id} value={candidate.id}>
                    {candidate.id} · {candidate.residueType} · {candidate.quantityMin}-{candidate.quantityMax}{" "}
                    {candidate.unit}
                  </option>
                ))}
              </select>
            ) : (
              <p className="help" style={{ marginTop: 0 }}>
                You have no open requirement yet. Create one to see ranked matches and send offers.
              </p>
            )}
          </div>
        </div>
        <div className="btn-row" style={{ marginTop: 14 }}>
          <button className="btn btn-ghost btn-sm" type="submit">
            Apply filters
          </button>
          <Link className="btn btn-ghost btn-sm" href="/buyer/marketplace">
            Clear
          </Link>
        </div>
      </form>

      {requirements.length === 0 ? (
        <EmptyState
          title="Create a requirement before sending an offer"
          hint="An offer is always tied to one of your own requirements. Describe what you need, publish it, then come back."
          action={
            <Link className="btn btn-primary btn-sm" href="/buyer/requirements">
              Add a requirement
            </Link>
          }
        />
      ) : filtered.length ? (
        <MatchList rows={filtered.map(toRow)}>
          {(row) => (
            <OfferForm
              lotId={row.lot.id}
              lotQuantity={row.lot.quantity}
              lotUnit={row.lot.unit}
              requirements={requirements}
              today={todayIso()}
              defaultRequirementId={selected?.id}
            />
          )}
        </MatchList>
      ) : (
        <EmptyState
          title="No open lot fits these filters"
          hint="Try a different material or area. Farmers add new lots through the season."
        />
      )}

      <p className="small muted" style={{ marginTop: 18 }}>
        Distance and condition only shift the ranking. A published quantity is what the farmer recorded, not a
        weighbridge figure. Never send an offer on your own lot.
      </p>
    </>
  );
}
