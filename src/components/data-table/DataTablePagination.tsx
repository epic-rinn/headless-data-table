"use client";

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useId } from "react";
import { IconButton } from "@/components/ui/Button";
import { PAGE_SIZE_OPTIONS } from "@/constants";
import type { Table } from "@/table-core";

export function DataTablePagination<TData>({
  table,
  pageSizeOptions = PAGE_SIZE_OPTIONS,
  itemNoun = "results",
}: {
  table: Table<TData, unknown>;
  pageSizeOptions?: readonly number[];
  itemNoun?: string;
}) {
  const selectId = useId();
  const { start, end, total } = table.getDisplayRange();
  const pageCount = table.getPageCount();

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-wrap items-center justify-between gap-3 px-1 pt-3"
    >
      <div className="flex items-center gap-2">
        <label htmlFor={selectId} className="text-2xs text-text-muted">
          Rows per page
        </label>
        <select
          id={selectId}
          value={table.getPageSize()}
          onChange={(event) => table.setPageSize(Number(event.target.value))}
          className="h-7 rounded-md border border-border-strong bg-surface px-1.5 text-2xs text-text-primary"
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-3">
        <p aria-live="polite" className="text-2xs text-text-muted" data-numeric>
          {total === 0
            ? `No ${itemNoun}`
            : `${start}–${end} of ${total} ${itemNoun}`}
        </p>

        <div className="flex items-center gap-1">
          <IconButton
            icon={ChevronsLeft}
            label="First page"
            size="sm"
            onClick={() => table.firstPage()}
            disabled={!table.getCanPreviousPage()}
          />
          <IconButton
            icon={ChevronLeft}
            label="Previous page"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          />
          <span className="px-1 text-2xs text-text-muted" data-numeric>
            {pageCount === 0
              ? "0 of 0"
              : `${table.getPageIndex() + 1} of ${pageCount}`}
          </span>
          <IconButton
            icon={ChevronRight}
            label="Next page"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          />
          <IconButton
            icon={ChevronsRight}
            label="Last page"
            size="sm"
            onClick={() => table.lastPage()}
            disabled={!table.getCanNextPage()}
          />
        </div>
      </div>
    </nav>
  );
}
