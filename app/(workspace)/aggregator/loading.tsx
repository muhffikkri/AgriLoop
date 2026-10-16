import { LoadingRows } from "@/components/ui/states.tsx";

export default function AggregatorLoading() {
  return (
    <div className="stack">
      <LoadingRows rows={4} label="Loading your workspace" />
    </div>
  );
}
