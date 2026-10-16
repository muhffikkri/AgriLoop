import { redirect } from "next/navigation";
import { getCurrentUser, homeFor } from "@/lib/server/auth.ts";

export const metadata = { title: "Workspace" };

/** Single entry point that sends a signed-in account to the dashboard for its role. */
export default async function AppEntryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  redirect(homeFor(user.role));
}
