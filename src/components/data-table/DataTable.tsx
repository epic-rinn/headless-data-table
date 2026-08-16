"use client";

import clsx from "clsx";
import { Fragment, type ReactNode, useState } from "react";
import type { AsyncSubRowsState, Row, Table } from "@/table-core";
import { DataTableHead } from "./DataTableHead";
import { DataTableRow } from "./DataTableRow";
import { ExpandedRow } from "./ExpandedRow";
import { ExpandToggle } from "./ExpandToggle";
import { SkeletonRows } from "./SkeletonRows";
import { EmptyState, ErrorState } from "./TableStates";
import { useScrollShadow } from "./useScrollShadow";

export type DataTableStatus = "idle" | "loading" | "success" | "error";

export const expandedRowId = (rowId: string) => `row-${rowId}-detail`;

export type DataTableProps<TData, TSubData = never> = {
  table: Table<TData, TSubData>;
  caption: string;
  status?: DataTableStatus;
  error?: { title: string; description?: string };
  onRetry?: () => void;
  empty?: { title: string; description?: string; action?: ReactNode };
  skeletonRows?: number;
  stickyHeader?: boolean;
  className?: string;
  renderExpanded?: (
    row: Row<TData>,
    sub: AsyncSubRowsState<TSubData>,
  ) => ReactNode;
  /** Accessible name for a row's expand button, e.g. "Show attendees for X". */
  expandLabel?: (row: Row<TData>) => string;
};

export function DataTable<TData, TSubData = never>({
  table,
  caption,
  status = "success",
  error,
  onRetry,
  empty,
  skeletonRows = 8,
  stickyHeader = false,
  className,
  renderExpanded,
  expandLabel,
}: DataTableProps<TData, TSubData>) {
  const [announcement, setAnnouncement] = useState("");
  const scrollRef = useScrollShadow();

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
        ref={scrollRef}
        aria-busy={loading || undefined}
        className="relative overflow-x-auto rounded-lg border border-border-subtle bg-surface"
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
              {rows.map((row) => {
                const canExpand =
                  Boolean(renderExpanded) && table.getCanExpand(row);
                const expanded = canExpand && table.getIsExpanded(row.id);

                return (
                  <Fragment key={row.id}>
                    <DataTableRow
                      row={row}
                      expander={
                        canExpand ? (
                          <ExpandToggle
                            expanded={expanded}
                            controls={expandedRowId(row.id)}
                            label={
                              expandLabel?.(row) ??
                              (expanded ? "Hide details" : "Show details")
                            }
                            onToggle={() => table.toggleExpanded(row.id)}
                          />
                        ) : undefined
                      }
                    />
                    {canExpand ? (
                      <ExpandedRow
                        id={expandedRowId(row.id)}
                        colSpan={columns.length}
                        open={expanded}
                      >
                        {expanded
                          ? renderExpanded?.(row, table.getSubRowsState(row.id))
                          : null}
                      </ExpandedRow>
                    ) : null}
                  </Fragment>
                );
              })}
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
