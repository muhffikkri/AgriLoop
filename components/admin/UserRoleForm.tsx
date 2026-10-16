"use client";

import { useActionState } from "react";
import { setUserRoleAction, type FormState } from "@/app/(workspace)/admin/actions.ts";
import { FormFeedback } from "@/components/ui/FormFeedback.tsx";
import type { Role } from "@/lib/server/db.ts";

const initialState: FormState = {};

const ROLE_OPTIONS: Role[] = ["farmer", "buyer", "aggregator", "admin"];

/**
 * One account's role. The server refuses a change to the signed-in admin's own role,
 * so that message arrives through FormFeedback rather than a silent no-op.
 */
export function UserRoleForm({ userId, name, role }: { userId: string; name: string; role: Role }) {
  const [state, action, pending] = useActionState(setUserRoleAction, initialState);

  return (
    <form action={action} className="stack" noValidate>
      <input type="hidden" name="userId" value={userId} />

      <div className="field" style={{ marginBottom: 0 }}>
        <label htmlFor={`${userId}-role`}>Role for {name}</label>
        <select
          className="select"
          id={`${userId}-role`}
          name="role"
          defaultValue={role}
          aria-describedby={`${userId}-role-help`}
          required
        >
          {ROLE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <p className="help" id={`${userId}-role-help`}>
          Changing a role rewrites what this account can open. The previous and new role are both recorded on the
          audit log, and there is no self-service path for the change.
        </p>
      </div>

      <div>
        <button className="btn btn-ghost btn-sm" type="submit" disabled={pending}>
          {pending ? "Saving" : "Save role"}
        </button>
      </div>

      <FormFeedback state={state} />
    </form>
  );
}
