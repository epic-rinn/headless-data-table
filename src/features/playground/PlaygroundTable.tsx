"use client";

import { useMemo, useState } from "react";
import type { DataTableStatus } from "@/components/data-table";
import { DataTable, DataTablePagination } from "@/components/data-table";
import { Button } from "@/components/ui/Button";
import {
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useDataTable,
} from "@/table-core";
import { sessionColumns } from "./columns";
import { createSessions } from "./data";

const coreRowModel =
  getCoreRowModel<ReturnType<typeof createSessions>[number]>();
const sortedRowModel =
  getSortedRowModel<ReturnType<typeof createSessions>[number]>();
const paginationRowModel =
  getPaginationRowModel<ReturnType<typeof createSessions>[number]>();

const STATUSES: DataTableStatus[] = ["success", "loading", "error"];
const ROW_COUNTS = [0, 40, 1000];

export function PlaygroundTable() {
  const [status, setStatus] = useState<DataTableStatus>("success");
  const [rowCount, setRowCount] = useState(40);
  const [paginated, setPaginated] = useState(true);
  const [sortable, setSortable] = useState(true);

  const data = useMemo(() => createSessions(rowCount), [rowCount]);

  const table = useDataTable({
    data,
    columns: sessionColumns,
    getRowId: (row) => row.id,
    initialState: { pagination: { pageIndex: 0, pageSize: 10 } },
    getCoreRowModel: coreRowModel,
    ...(sortable ? { getSortedRowModel: sortedRowModel } : {}),
    ...(paginated ? { getPaginationRowModel: paginationRowModel } : {}),
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
