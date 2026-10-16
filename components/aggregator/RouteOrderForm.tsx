"use client";

import { useActionState, useState } from "react";
import { updateRouteAction, type FormState } from "@/app/(workspace)/aggregator/actions.ts";
import { FormFeedback } from "@/components/ui/FormFeedback.tsx";

const initialState: FormState = {};

export type RouteStop = {
  orderId: string;
  lotId: string;
  quantity: number;
  unit: string;
  farmerOrg: string;
  areaLabel: string;
};

/**
 * Reorders the stops of one plan and keeps a note on it. The order is a working sequence
 * for the driver; it does not change the plan date or its capacity.
 */
export function RouteOrderForm({
  planId,
  stops,
  note,
}: {
  planId: string;
  stops: RouteStop[];
  note: string;
}) {
  const [state, action, pending] = useActionState(updateRouteAction, initialState);
  const [order, setOrder] = useState<string[]>(stops.map((stop) => stop.orderId));

  const byId = new Map(stops.map((stop) => [stop.orderId, stop]));

  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= order.length) return;
    setOrder((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  return (
    <form action={action} className="stack">
      <input type="hidden" name="planId" value={planId} />
      {order.map((orderId) => (
        <input key={orderId} type="hidden" name="orderIds" value={orderId} />
      ))}

      <ol className="audit" style={{ margin: 0 }}>
        {order.map((orderId, index) => {
          const stop = byId.get(orderId);
          if (!stop) return null;
          return (
            <li className="audit-row" key={orderId}>
              <div>
                <p style={{ margin: 0, fontWeight: 600 }}>
                  <span className="mono">{index + 1}.</span> {stop.lotId} · {stop.quantity} {stop.unit}
                </p>
                <p className="small muted" style={{ margin: "2px 0 0" }}>
                  {stop.orderId} · {stop.farmerOrg} · {stop.areaLabel}
                </p>
              </div>
              <div className="btn-row" style={{ flexWrap: "nowrap" }}>
                <button
                  className="btn btn-ghost btn-sm"
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label={`Move stop ${index + 1} earlier`}
                >
                  Up
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === order.length - 1}
                  aria-label={`Move stop ${index + 1} later`}
                >
                  Down
                </button>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="field" style={{ marginBottom: 0 }}>
        <label htmlFor={`${planId}-route-note`}>Note for this plan</label>
        <textarea
          className="textarea"
          id={`${planId}-route-note`}
          name="note"
          maxLength={300}
          defaultValue={note}
          aria-describedby={`${planId}-route-note-help`}
        />
        <p className="help" id={`${planId}-route-note-help`}>
          Kept with the plan and shown to the farmer. Clearing the box removes the note.
        </p>
      </div>

      <div>
        <button className="btn btn-primary" type="submit" disabled={pending}>
          {pending ? "Saving" : "Save route and note"}
        </button>
      </div>

      <FormFeedback state={state} />
    </form>
  );
}
