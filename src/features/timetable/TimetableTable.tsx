"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { DataTable, DataTablePagination } from "@/components/data-table";
import { Button, IconButton } from "@/components/ui/Button";
import { AttendeeTable } from "@/features/attendees/AttendeePanel";
import { createAttendees, createSessions, dateSeed } from "@/mocks/seed";
import {
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useDataTable,
} from "@/table-core";
import { createTimetableColumns } from "./columns";
import { startOfStudioDay, useClientNow } from "./useClientNow";

const coreRowModel =
  getCoreRowModel<ReturnType<typeof createSessions>[number]>();
const sortedRowModel =
  getSortedRowModel<ReturnType<typeof createSessions>[number]>();
const paginationRowModel =
  getPaginationRowModel<ReturnType<typeof createSessions>[number]>();

const dayFormat = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function TimetableTable() {
  const now = useClientNow();
  const [picked, setPicked] = useState<Date | null>(null);
  const date = picked ?? (now === null ? null : startOfStudioDay(now));

  const columns = useMemo(() => createTimetableColumns(now), [now]);

  const data = useMemo(() => {
    if (!date) return [];
    const seed = dateSeed(date);
    if (date.getUTCDay() === 0) return [];
    return createSessions(14, seed);
  }, [date]);

  const table = useDataTable({
    data,
    columns,
    getRowId: (row) => row.id,
    initialState: {
      sorting: [{ id: "startsAt", desc: false }],
      pagination: { pageIndex: 0, pageSize: 10 },
    },
    getCoreRowModel: coreRowModel,
    getSortedRowModel: sortedRowModel,
    getPaginationRowModel: paginationRowModel,
    getRowCanExpand: () => true,
  });

  const label = date ? dayFormat.format(date) : "";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <IconButton
          icon={ChevronLeft}
          label="Previous day"
          size="sm"
          onClick={() => date && setPicked(addDays(date, -1))}
        />
        <span className="min-w-32 text-center text-sm font-medium">
          {label}
        </span>
        <IconButton
          icon={ChevronRight}
          label="Next day"
          size="sm"
          onClick={() => date && setPicked(addDays(date, 1))}
        />
        <Button size="sm" variant="ghost" onClick={() => setPicked(null)}>
          Today
        </Button>
      </div>

      <div>
        <DataTable
          table={table}
          caption={`Classes scheduled for ${label}`}
          stickyHeader
          responsive="cards"
          empty={{
            title: `No classes scheduled for ${label}.`,
            description: "The studio is closed on Sundays.",
          }}
          expandLabel={(row) =>
            `Show attendees for ${row.original.name}, ${label}`
          }
          renderExpanded={(row) => (
            <div className="flex flex-col gap-3">
              {row.original.cancellationReason ? (
                <p className="text-sm text-stop">
                  Cancelled — {row.original.cancellationReason}
                </p>
              ) : null}
              <AttendeeTable attendees={createAttendees(row.original)} />
            </div>
          )}
        />
        <DataTablePagination table={table} itemNoun="classes" />
      </div>
    </div>
  );
}
