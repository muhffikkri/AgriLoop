import { WorkspaceFrame } from "@/components/layout/WorkspaceShell.tsx";
import { requirePageUser } from "@/lib/server/auth.ts";

/** Server-side gate for the whole buyer area: anonymous visitors go to login. */
export default async function BuyerLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePageUser("buyer");
  return <WorkspaceFrame user={user}>{children}</WorkspaceFrame>;
}
