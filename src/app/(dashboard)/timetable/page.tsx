import { PageHeader } from "@/components/shell/PageHeader";
import { TimetableTable } from "@/features/timetable/TimetableTable";

export default function TimetablePage() {
  return (
    <>
      <PageHeader
        title="Timetable"
        description="What's running today, and who's walking through the door"
      />
      <div className="p-5">
        <TimetableTable />
      </div>
    </>
  );
}
