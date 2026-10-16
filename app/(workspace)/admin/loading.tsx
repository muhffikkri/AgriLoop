import { LoadingRows } from "@/components/ui/states.tsx";

export default function AdminLoading() {
  return (
    <div className="stack">
      <LoadingRows rows={4} label="Loading the admin workspace" />
    </div>
  );
}
