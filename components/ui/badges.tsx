import type { ConditionLabel } from "@/lib/domain/matching.ts";

const STATUS_STYLE: Record<string, { className: string; label: string }> = {
  DRAFT: { className: "b-slate", label: "Draft" },
  OPEN: { className: "b-green", label: "Open" },
  RESERVED: { className: "b-gold", label: "Reserved" },
  PICKUP_SCHEDULED: { className: "b-blue", label: "Pickup scheduled" },
  PICKED_UP: { className: "b-cyan", label: "Picked up" },
  ACCEPTED: { className: "b-emerald", label: "Accepted" },
  CLOSED: { className: "b-ink", label: "Closed" },
  REJECTED: { className: "b-red", label: "Rejected" },
  CANCELLED: { className: "b-soil", label: "Cancelled" },
  EXPIRED: { className: "b-orange", label: "Expired" },
  DISPUTED: { className: "b-crimson", label: "Disputed" },
  PENDING: { className: "b-gold", label: "Pending" },
  COUNTERED: { className: "b-blue", label: "Countered" },
  PARTIALLY_MATCHED: { className: "b-gold", label: "Partly matched" },
  FULFILLED: { className: "b-emerald", label: "Fulfilled" },
  PLANNED: { className: "b-slate", label: "Planned" },
  CONFIRMED: { className: "b-blue", label: "Confirmed" },
  IN_PROGRESS: { className: "b-cyan", label: "In progress" },
  COMPLETED: { className: "b-emerald", label: "Completed" },
  RESCHEDULED: { className: "b-gold", label: "Rescheduled" },
  FAILED: { className: "b-red", label: "Failed" },
  AWAITING_BUYER: { className: "b-gold", label: "Awaiting buyer" },
  ACTIVE: { className: "b-blue", label: "Active" },
  RECEIVED: { className: "b-emerald", label: "Received" },
};

export function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLE[status] ?? { className: "b-slate", label: status.replace(/_/g, " ").toLowerCase() };
  return <span className={`badge badge-solid ${style.className}`}>{style.label}</span>;
}

const CONDITION_TEXT: Record<ConditionLabel, string> = {
  buyer_review: "Ready for buyer review",
  needs_inspection: "Needs inspection",
  off_spec: "Outside buyer specification",
};

export function ConditionBadge({ label }: { label?: ConditionLabel }) {
  if (!label) return <span className="badge" style={{ color: "var(--ink-muted)" }}>No condition label yet</span>;
  const tone = label === "buyer_review" ? "b-green" : label === "needs_inspection" ? "b-gold" : "b-red";
  return <span className={`badge badge-solid ${tone}`}>{CONDITION_TEXT[label]}</span>;
}

/** Marks any invented number on a walkthrough or workspace surface. */
export function SimBadge({ compact = false }: { compact?: boolean }) {
  return <span className="sim-badge">{compact ? "SIMULATED" : "DATA DUMMY / SIMULASI"}</span>;
}

export function SimNotice({ children }: { children: React.ReactNode }) {
  return (
    <p className="sim-banner">
      <SimBadge />
      <span>{children}</span>
    </p>
  );
}
