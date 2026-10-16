import { WorkspaceHeader } from "@/components/layout/WorkspaceShell.tsx";
import { UserRoleForm } from "@/components/admin/UserRoleForm.tsx";
import { UserStatusForm } from "@/components/admin/UserStatusForm.tsx";
import { ErrorState } from "@/components/ui/states.tsx";
import { listUsers } from "@/lib/server/admin.ts";
import { requirePageUser } from "@/lib/server/auth.ts";

export const metadata = { title: "Users" };

export default async function AdminUsersPage() {
  const user = await requirePageUser("admin");
  const result = listUsers(user);

  if (!result.ok) {
    return (
      <>
        <WorkspaceHeader title="Users" />
        <ErrorState title="Accounts could not be loaded" detail={result.error} />
      </>
    );
  }

  const rows = result.value;

  return (
    <>
      <WorkspaceHeader
        title="Users"
        intro="Every account with its role, organisation and status. Role and status changes are made here; each one records the actor, the change and the time. Password hashes are never shown."
      />

      <section className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table className="table">
            <caption className="sr-only">Accounts with role, organisation, status, lot count and creation date</caption>
            <thead>
              <tr>
                <th scope="col">User</th>
                <th scope="col">Role</th>
                <th scope="col">Organisation</th>
                <th scope="col">Status</th>
                <th scope="col">Lots</th>
                <th scope="col">Created</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <span className="mono">{row.id}</span>
                    <span className="small muted" style={{ display: "block" }}>
                      {row.name}
                    </span>
                  </td>
                  <td>{row.role}</td>
                  <td>{row.orgName ?? "Individual account"}</td>
                  <td>
                    {row.status === "blocked" ? (
                      <span className="badge badge-solid b-red">Blocked</span>
                    ) : (
                      <span className="badge badge-solid b-green">Active</span>
                    )}
                    {row.status === "blocked" && row.blockedReason ? (
                      <span className="small muted" style={{ display: "block" }}>
                        {row.blockedReason}
                      </span>
                    ) : null}
                  </td>
                  <td className="num">{row.lotCount}</td>
                  <td className="num">{row.createdAt.slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section style={{ marginTop: 22 }}>
        <h2 style={{ fontSize: "1.2rem" }}>Manage an account</h2>
        <p className="small muted">
          The server refuses a role change to your own account and refuses blocking your own account. Those refusals
          appear next to the form you submitted.
        </p>
        <div className="grid-2" style={{ marginTop: 8 }}>
          {rows.map((row) => (
            <div className="card" key={row.id}>
              <div className="card-title">
                <h3 style={{ fontSize: "1.05rem", margin: 0 }}>
                  {row.name}
                  {row.id === user.id ? <span className="small muted"> · your account</span> : null}
                </h3>
                <span className="mono small muted">{row.id}</span>
              </div>
              <p className="small muted" style={{ marginTop: 0 }}>
                {row.role} · {row.orgName ?? "Individual account"}
              </p>

              <div className="stack">
                <div>
                  <h4 className="field-label">Change role</h4>
                  <UserRoleForm userId={row.id} name={row.name} role={row.role} />
                </div>
                <div>
                  <h4 className="field-label">Change status</h4>
                  <UserStatusForm userId={row.id} name={row.name} status={row.status} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <p className="small muted" style={{ marginTop: 18 }}>
        This list carries organisation names, roles and counts only. No password hash, no farmer contact detail and no
        exact coordinates appear on this page.
      </p>
    </>
  );
}
