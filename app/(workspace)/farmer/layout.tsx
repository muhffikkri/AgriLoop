import { WorkspaceFrame } from "@/components/layout/WorkspaceShell.tsx";
import { requirePageUser } from "@/lib/server/auth.ts";

/** Server-side gate for the whole farmer area: anonymous visitors go to login. */
export default async function FarmerLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePageUser("farmer");
  return <WorkspaceFrame user={user}>{children}</WorkspaceFrame>;
}
