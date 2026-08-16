"use client";

import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/Button";
import type { Attendee } from "@/mocks/seed";
import {
  type AsyncSubRowsState,
  getCoreRowModel,
  getSortedRowModel,
  useDataTable,
} from "@/table-core";
import { attendeeColumns } from "./columns";

const coreRowModel = getCoreRowModel<Attendee>();
const sortedRowModel = getSortedRowModel<Attendee>();

export function AttendeeTable({ attendees }: { attendees: Attendee[] }) {
  const table = useDataTable({
    data: attendees,
    columns: attendeeColumns,
    getRowId: (row) => row.id,
    getCoreRowModel: coreRowModel,
    getSortedRowModel: sortedRowModel,
  });

  return (
    <DataTable
      table={table}
      caption="Attendees for this class"
      empty={{ title: "No one booked in yet." }}
    />
  );
}

function PanelSkeleton() {
  return (
    <div className="flex flex-col gap-2" aria-hidden>
      {[0, 1, 2].map((row) => (
        <div key={row} className="flex gap-3">
          <span className="h-2.5 w-48 animate-pulse rounded-full bg-surface-inset motion-reduce:animate-none" />
          <span className="h-2.5 w-24 animate-pulse rounded-full bg-surface-inset motion-reduce:animate-none" />
          <span className="h-2.5 w-20 animate-pulse rounded-full bg-surface-inset motion-reduce:animate-none" />
        </div>
      ))}
    </div>
  );
}

export function AsyncAttendeePanel({
  state,
}: {
  state: AsyncSubRowsState<Attendee[]>;
}) {
  if (state.status === "idle" || state.status === "loading") {
    return <PanelSkeleton />;
  }

  if (state.status === "error") {
    return (
      <div className="flex flex-col items-start gap-2">
        <p className="text-sm text-text-primary">
          Couldn&rsquo;t load the attendees.
        </p>
        <p className="text-2xs text-text-muted">{state.error.message}</p>
        <Button size="sm" variant="secondary" onClick={state.retry}>
          Try again
        </Button>
      </div>
    );
  }

  return <AttendeeTable attendees={state.data} />;
}
