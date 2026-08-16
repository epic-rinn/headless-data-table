"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { DataTableStatus } from "@/components/data-table";
import { DataTable, DataTablePagination } from "@/components/data-table";
import { Button } from "@/components/ui/Button";
import {
  AsyncAttendeePanel,
  AttendeeTable,
} from "@/features/attendees/AttendeePanel";
import { useTableUrlState } from "@/hooks/useTableUrlState";
import { listSessions } from "@/mocks/api";
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
const ROW_COUNTS = [0, 40, 1000, 10000];
type ExpandMode = "none" | "inline" | "on-demand";
const EXPAND_MODES: ExpandMode[] = ["none", "inline", "on-demand"];

export function PlaygroundTable() {
  const [status, setStatus] = useState<DataTableStatus>("success");
  const [rowCount, setRowCount] = useState(40);
  const [paginated, setPaginated] = useState(true);
  const [sortable, setSortable] = useState(true);
  const [expandMode, setExpandMode] = useState<ExpandMode>("inline");
  const router = useRouter();
  const searchParams = useSearchParams();
  const serverMode = searchParams.get("mode") === "server";

  const setServerMode = useCallback(
    (on: boolean) => {
      const params = new URLSearchParams(searchParams.toString());
      if (on) {
        params.set("mode", "server");
      } else {
        params.delete("mode");
        params.delete("sort");
        params.delete("page");
        params.delete("size");
      }
      const query = params.toString();
      router.replace(query ? `?${query}` : "?", { scroll: false });
    },
    [router, searchParams],
  );

  const url = useTableUrlState({ defaultPageSize: 10 });
  const serverSorting = url.sorting;
  const serverPagination = url.pagination;
  const [result, setResult] = useState<{
    key: string;
    rows: Session[];
    total: number;
    requests: number;
  }>({ key: "", rows: [], total: 0, requests: 0 });
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

  const lastPageIndex =
    result.total > 0
      ? Math.max(0, Math.ceil(result.total / serverPagination.pageSize) - 1)
      : null;
  const requestPageIndex =
    lastPageIndex === null
      ? serverPagination.pageIndex
      : Math.min(serverPagination.pageIndex, lastPageIndex);

  const requestKey = serverMode
    ? JSON.stringify({
        rows: rowCount,
        sort: serverSorting,
        page: requestPageIndex,
        size: serverPagination.pageSize,
      })
    : "";
  const serverLoading = serverMode && result.key !== requestKey;

  useEffect(() => {
    if (!serverMode) return;

    const controller = new AbortController();

    listSessions(
      data,
      {
        page: requestPageIndex,
        pageSize: serverPagination.pageSize,
        sort: serverSorting,
      },
      controller.signal,
    ).then(
      (response) =>
        setResult((old) => ({
          key: requestKey,
          rows: response.data,
          total: response.total,
          requests: old.requests + 1,
        })),
      () => {},
    );

    return () => controller.abort();
  }, [serverMode, data, requestKey]);

  const table = useDataTable({
    data: serverMode ? result.rows : data,
    columns: sessionColumns,
    getRowId: (row) => row.id,
    initialState: { pagination: { pageIndex: 0, pageSize: 10 } },
    getCoreRowModel: coreRowModel,
    ...(sortable ? { getSortedRowModel: sortedRowModel } : {}),
    ...(paginated ? { getPaginationRowModel: paginationRowModel } : {}),
    ...(serverMode
      ? {
          state: { sorting: serverSorting, pagination: serverPagination },
          onSortingChange: url.setSorting,
          onPaginationChange: url.setPagination,
          manualSorting: true,
          manualPagination: true,
          rowCount: result.total,
        }
      : {}),
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
        <span className="mx-1 h-5 w-px bg-border-subtle" />
        <Button
          size="sm"
          variant={serverMode ? "primary" : "secondary"}
          onClick={() => setServerMode(!serverMode)}
        >
          {serverMode ? "server-side" : "client-side"}
        </Button>
        {serverMode ? (
          <span className="text-2xs text-text-muted" data-numeric>
            {result.requests} requests
          </span>
        ) : null}
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
          status={serverMode && serverLoading ? "loading" : status}
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
        {(paginated || serverMode) && status === "success" ? (
          <DataTablePagination table={table} itemNoun="classes" />
        ) : null}
      </div>
    </div>
  );
}
