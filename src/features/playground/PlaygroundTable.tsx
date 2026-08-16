"use client";

import { useMemo, useState } from "react";
import type { DataTableStatus } from "@/components/data-table";
import { DataTable, DataTablePagination } from "@/components/data-table";
import { Button } from "@/components/ui/Button";
import {
  AsyncAttendeePanel,
  AttendeeTable,
} from "@/features/attendees/AttendeePanel";
import {
  type Attendee,
  createAttendees,
  createSessions,
  type Session,
} from "@/mocks/seed";
import {
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useDataTable,
} from "@/table-core";
import { sessionColumns } from "./columns";

const coreRowModel =
  getCoreRowModel<ReturnType<typeof createSessions>[number]>();
const sortedRowModel =
  getSortedRowModel<ReturnType<typeof createSessions>[number]>();
const paginationRowModel =
  getPaginationRowModel<ReturnType<typeof createSessions>[number]>();

const STATUSES: DataTableStatus[] = ["success", "loading", "error"];
const ROW_COUNTS = [0, 40, 1000];
type ExpandMode = "none" | "inline" | "on-demand";
const EXPAND_MODES: ExpandMode[] = ["none", "inline", "on-demand"];

export function PlaygroundTable() {
  const [status, setStatus] = useState<DataTableStatus>("success");
  const [rowCount, setRowCount] = useState(40);
  const [paginated, setPaginated] = useState(true);
  const [sortable, setSortable] = useState(true);
  const [expandMode, setExpandMode] = useState<ExpandMode>("inline");
  const [failChild, setFailChild] = useState(false);

  const data = useMemo(() => createSessions(rowCount), [rowCount]);

  const loadSubRows = useMemo(() => {
    if (expandMode !== "on-demand") return undefined;
    return (row: { original: Session }, signal: AbortSignal) =>
      new Promise<Attendee[]>((resolve, reject) => {
        const delay = 400 + Math.random() * 700;
        const timer = setTimeout(() => {
          if (failChild) {
            reject(new Error("The connection timed out."));
          } else {
            resolve(createAttendees(row.original));
          }
        }, delay);
        signal.addEventListener("abort", () => {
          clearTimeout(timer);
          reject(new Error("aborted"));
        });
      });
  }, [expandMode, failChild]);

  const table = useDataTable({
    data,
    columns: sessionColumns,
    getRowId: (row) => row.id,
    initialState: { pagination: { pageIndex: 0, pageSize: 10 } },
    getCoreRowModel: coreRowModel,
    ...(sortable ? { getSortedRowModel: sortedRowModel } : {}),
    ...(paginated ? { getPaginationRowModel: paginationRowModel } : {}),
    ...(expandMode === "none"
      ? {}
      : {
          getRowCanExpand: () => true,
          ...(loadSubRows ? { loadSubRows } : {}),
        }),
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {STATUSES.map((value) => (
          <Button
            key={value}
            size="sm"
            variant={status === value ? "primary" : "secondary"}
            onClick={() => setStatus(value)}
          >
            {value}
          </Button>
        ))}
        <span className="mx-1 h-5 w-px bg-border-subtle" />
        {ROW_COUNTS.map((value) => (
          <Button
            key={value}
            size="sm"
            variant={rowCount === value ? "primary" : "secondary"}
            onClick={() => setRowCount(value)}
          >
            {value} rows
          </Button>
        ))}
        <span className="mx-1 h-5 w-px bg-border-subtle" />
        <Button
          size="sm"
          variant={sortable ? "primary" : "secondary"}
          onClick={() => setSortable((v) => !v)}
        >
          sorting {sortable ? "on" : "off"}
        </Button>
        <Button
          size="sm"
          variant={paginated ? "primary" : "secondary"}
          onClick={() => setPaginated((v) => !v)}
        >
          pagination {paginated ? "on" : "off"}
        </Button>
        <span className="mx-1 h-5 w-px bg-border-subtle" />
        {EXPAND_MODES.map((mode) => (
          <Button
            key={mode}
            size="sm"
            variant={expandMode === mode ? "primary" : "secondary"}
            onClick={() => setExpandMode(mode)}
          >
            children: {mode}
          </Button>
        ))}
        {expandMode === "on-demand" ? (
          <Button
            size="sm"
            variant={failChild ? "danger" : "secondary"}
            onClick={() => setFailChild((v) => !v)}
          >
            child fetch {failChild ? "fails" : "ok"}
          </Button>
        ) : null}
      </div>

      <div>
        <DataTable
          table={table}
          caption="Playground sessions"
          status={status}
          stickyHeader
          error={{
            title: "Couldn't load the sessions.",
            description: "The connection timed out.",
          }}
          onRetry={() => setStatus("success")}
          expandLabel={(row) => `Show attendees for ${row.original.name}`}
          renderExpanded={
            expandMode === "none"
              ? undefined
              : expandMode === "inline"
                ? (row) => (
                    <AttendeeTable attendees={createAttendees(row.original)} />
                  )
                : (_row, sub) => <AsyncAttendeePanel state={sub} />
          }
          empty={{
            title: "No classes scheduled.",
            description: "Nothing is on the timetable for this day.",
          }}
        />
        {paginated && status === "success" ? (
          <DataTablePagination table={table} itemNoun="classes" />
        ) : null}
      </div>
    </div>
  );
}
