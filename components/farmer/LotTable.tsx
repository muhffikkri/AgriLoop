import Link from "next/link";
import { StatusBadge, ConditionBadge } from "@/components/ui/badges.tsx";
import type { Lot } from "@/lib/server/db.ts";

/** Shared lot table for the farmer workspace; every row links to the full lot record. */
export function LotTable({ lots, emptyHint }: { lots: Lot[]; emptyHint?: string }) {
  if (!lots.length) {
    return (
      <div className="state">
        <p style={{ margin: 0, fontWeight: 600, color: "var(--ink)" }}>No lots here yet</p>
        <p className="small" style={{ margin: "6px 0 0" }}>
          {emptyHint ?? "Create a listing to describe what you have and when it is ready."}
        </p>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table className="table">
        <caption className="sr-only" style={{ position: "absolute", left: -9999 }}>
          Your lots with status, quantity and area
        </caption>
        <thead>
          <tr>
            <th scope="col">Lot</th>
            <th scope="col">Material</th>
            <th scope="col">Quantity</th>
            <th scope="col">Ready</th>
            <th scope="col">Area</th>
            <th scope="col">Status</th>
            <th scope="col">Condition</th>
          </tr>
        </thead>
        <tbody>
          {lots.map((lot) => (
            <tr key={lot.id}>
              <td className="num">
                <Link href={`/farmer/supply/${lot.id}`}>{lot.id}</Link>
                <span className="small muted" style={{ display: "block" }}>
                  {lot.ownerName}
                </span>
              </td>
              <td>
                {lot.residueType}
                <span className="small muted" style={{ display: "block" }}>
                  {lot.crop}
                </span>
              </td>
              <td className="num">
                {lot.quantity} {lot.unit}
              </td>
              <td className="num">{lot.readyDate}</td>
              <td>{lot.areaLabel}</td>
              <td>
                <StatusBadge status={lot.status} />
              </td>
              <td>
                <ConditionBadge label={lot.conditionLabel} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
