import { WorkspaceFrame } from "@/components/layout/WorkspaceShell.tsx";
import { requirePageUser } from "@/lib/server/auth.ts";

/** Server-side gate for the whole collector area: anonymous visitors go to login. */
export default async function AggregatorLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePageUser("aggregator");
  return <WorkspaceFrame user={user}>{children}</WorkspaceFrame>;
}
