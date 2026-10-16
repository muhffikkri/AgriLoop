import { WorkspaceFrame } from "@/components/layout/WorkspaceShell.tsx";
import { requirePageUser } from "@/lib/server/auth.ts";

/** Server-side gate for the whole admin area: anonymous visitors go to login. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePageUser("admin");
  return <WorkspaceFrame user={user}>{children}</WorkspaceFrame>;
}
