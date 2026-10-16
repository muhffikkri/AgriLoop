import { WorkspaceHeader } from "@/components/layout/WorkspaceShell.tsx";
import { LotForm } from "@/components/farmer/LotForm.tsx";
import { selectableAreas } from "@/lib/server/lots.ts";
import { requirePageUser } from "@/lib/server/auth.ts";
import { todayIso } from "@/lib/server/db.ts";

export const metadata = { title: "Add a lot" };

export default async function NewLotPage() {
  await requirePageUser("farmer");
  const areas = selectableAreas();

  return (
    <>
      <WorkspaceHeader
        title="Add a lot"
        intro="A lot is saved as a draft first. Nothing reaches buyers until you publish it, and you can withdraw it again while it is still open."
      />
      <LotForm areas={areas} today={todayIso()} />
    </>
  );
}
