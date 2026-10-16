import { WorkspaceHeader } from "@/components/layout/WorkspaceShell.tsx";
import { StatusBadge } from "@/components/ui/badges.tsx";
import { EmptyState, ErrorState } from "@/components/ui/states.tsx";
import { transactionRows } from "@/lib/server/admin.ts";
import { requirePageUser } from "@/lib/server/auth.ts";

export const metadata = { title: "Transactions" };

function stamp(iso: string): string {
  return iso.slice(0, 16).replace("T", " ");
}

function disputeLabel(category?: string): string {
  if (!category) return "not categorised";
  return category.replace(/_/g, " ").replace(/^./, (letter) => letter.toUpperCase());
}

export default async function AdminTransactionsPage() {
  const user = await requirePageUser("admin");
  const result = transactionRows(user);

  if (!result.ok) {
    return (
      <>
        <WorkspaceHeader title="Transactions" />
        <ErrorState title="Transactions could not be loaded" detail={result.error} />
      </>
    );
  }

  const rows = result.value;

  return (
    <>
      <WorkspaceHeader
        title="Transactions"
        intro="Orders and their disputes, joined to the pickup and the weighed quantity on the record. A monitoring view: it shows organisation names and statuses, and it does not need farmer contact details or exact coordinates."
      />

      {rows.length ? (
        <section className="card" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table className="table">
              <caption className="sr-only">Orders with lot, parties, status, dispute and pickup details</caption>
              <thead>
                <tr>
                  <th scope="col">Order</th>
                  <th scope="col">Lot</th>
                  <th scope="col">Residue</th>
                  <th scope="col">Agreed</th>
                  <th scope="col">Buyer</th>
                  <th scope="col">Farmer</th>
                  <th scope="col">Status</th>
                  <th scope="col">Dispute</th>
                  <th scope="col">Pickup</th>
                  <th scope="col">Weighed</th>
                  <th scope="col">Updated</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.orderId}>
                    <td className="num">{row.orderId}</td>
                    <td className="num">{row.lotId}</td>
                    <td>{row.residueType}</td>
                    <td className="num">
                      {row.quantity} {row.unit}
                    </td>
                    <td>{row.buyerOrg}</td>
                    <td>{row.farmerOrg}</td>
                    <td>
                      <StatusBadge status={row.status} />
                    </td>
                    <td>
                      {row.status === "DISPUTED" || row.disputeCategory || row.disputeReason ? (
                        <>
                          <span>{disputeLabel(row.disputeCategory)}</span>
                          {row.disputeReason ? (
                            <span className="small muted" style={{ display: "block" }}>
                              {row.disputeReason}
                            </span>
                          ) : null}
                        </>
                      ) : (
                        <span className="small muted">—</span>
                      )}
                    </td>
                    <td>
                      {row.pickupStatus ? <StatusBadge status={row.pickupStatus} /> : <span className="small muted">Not planned</span>}
                    </td>
                    <td className="num">
                      {row.actualQuantity === undefined ? (
                        <span className="small muted">Not weighed</span>
                      ) : (
                        `${row.actualQuantity} ${row.unit}`
                      )}
                    </td>
                    <td className="num">{stamp(row.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <EmptyState
          title="No transaction yet"
          hint="An order appears once a farmer accepts a buyer's offer and the buyer confirms the agreement."
        />
      )}

      <p className="small muted" style={{ marginTop: 16 }}>
        Organisation names are shown because a transaction is between organisations. No farmer name, phone number or
        exact coordinate is part of this view. The agreed quantity is what the two sides settled; the weighed quantity
        is what a pickup hand-over recorded, and any difference stays on the record.
      </p>
    </>
  );
}
