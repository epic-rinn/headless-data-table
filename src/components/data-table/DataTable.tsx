"use client";

import clsx from "clsx";
import { type ReactNode, useState } from "react";
import type { Table } from "@/table-core";
import { DataTableHead } from "./DataTableHead";
import { DataTableRow } from "./DataTableRow";
import { SkeletonRows } from "./SkeletonRows";
import { EmptyState, ErrorState } from "./TableStates";

export type DataTableStatus = "idle" | "loading" | "success" | "error";

export type DataTableProps<TData> = {
  table: Table<TData>;
  caption: string;
  status?: DataTableStatus;
  error?: { title: string; description?: string };
  onRetry?: () => void;
  empty?: { title: string; description?: string; action?: ReactNode };
  skeletonRows?: number;
  stickyHeader?: boolean;
  className?: string;
};

export function DataTable<TData>({
  table,
  caption,
  status = "success",
  error,
  onRetry,
  empty,
  skeletonRows = 8,
  stickyHeader = false,
  className,
}: DataTableProps<TData>) {
  const [announcement, setAnnouncement] = useState("");

  const columns = table.getAllColumns();
  const rows = table.getRowModel().rows;
  const loading = status === "loading";

  const statusMessage = loading
    ? "Loading results"
    : status === "error"
      ? "Failed to load results"
      : status === "success"
        ? `${table.getRowCount()} results loaded`
        : "";

  return (
    <div className={clsx("flex flex-col", className)}>
      <div
        aria-busy={loading || undefined}
        className="overflow-x-auto rounded-lg border border-border-subtle bg-surface"
      >
        <table
          className="w-full table-fixed border-collapse text-sm"
          style={{ minWidth: "max-content" }}
        >
          <caption className="sr-only">{caption}</caption>

          <colgroup>
            {columns.map((column) => (
              <col key={column.id} style={{ width: `${column.getSize()}px` }} />
            ))}
          </colgroup>

          <DataTableHead
            table={table}
            sticky={stickyHeader}
            onAnnounce={setAnnouncement}
          />

          {loading ? (
            <SkeletonRows table={table} rows={skeletonRows} />
          ) : status === "error" ? (
            <ErrorState
              colSpan={columns.length}
              title={error?.title ?? "Couldn't load this table."}
              description={error?.description}
              onRetry={onRetry}
            />
          ) : rows.length === 0 ? (
            <EmptyState
              colSpan={columns.length}
              title={empty?.title ?? "Nothing to show."}
              description={empty?.description}
              action={empty?.action}
            />
          ) : (
            <tbody>
              {rows.map((row) => (
                <DataTableRow key={row.id} row={row} />
              ))}
            </tbody>
          )}
        </table>
      </div>

      <div aria-live="polite" className="sr-only">
        {statusMessage}
      </div>
      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>
    </div>
  );
}
