import { PageHeader } from "@/components/shell/PageHeader";
import { PlaygroundTable } from "@/features/playground/PlaygroundTable";

export default function PlaygroundPage() {
  return (
    <>
      <PageHeader
        title="Playground"
        description="Every table feature toggled independently"
      />
      <div className="p-5">
        <PlaygroundTable />
      </div>
    </>
  );
}
