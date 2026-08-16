"use client";

import clsx from "clsx";
import type { Table } from "@/table-core";
import { SortButton } from "./SortButton";

export function DataTableHead<TData>({
  table,
  sticky,
  onAnnounce,
}: {
  table: Table<TData, unknown>;
  sticky: boolean;
  onAnnounce: (message: string) => void;
}) {
  return (
    <thead>
      <tr>
        {table.getHeaders().map((header) => {
          const { column } = header;
          const canSort = column.getCanSort();
          const sorted = column.getIsSorted();
          const { align, meta } = column.columnDef;
          const resolved = align ?? (meta?.numeric ? "end" : "start");
          const pinned = column.getIsPinned();

          return (
            <th
              key={header.id}
              scope="col"
              data-pinned={pinned || undefined}
              data-pin-edge={(pinned && column.getIsLastPinned()) || undefined}
              style={{
                left: pinned ? `${column.getPinOffset()}px` : undefined,
              }}
              aria-sort={
                canSort
                  ? sorted === "asc"
                    ? "ascending"
                    : sorted === "desc"
                      ? "descending"
                      : "none"
                  : undefined
              }
              title={meta?.headerTooltip}
              className={clsx(
                "group/th h-9 border-b border-border-subtle bg-surface px-(--cell-pad-x)",
                "text-2xs font-semibold uppercase tracking-[0.04em] text-text-muted",
                resolved === "end"
                  ? "text-right"
                  : resolved === "center"
                    ? "text-center"
                    : "text-left",
                (sticky || pinned) && "sticky",
                sticky && "top-0",
                pinned && sticky
                  ? "z-(--z-header-pinned)"
                  : pinned
                    ? "z-(--z-pinned)"
                    : sticky
                      ? "z-(--z-header)"
                      : undefined,
              )}
            >
              {canSort ? (
                <SortButton
                  column={column}
                  label={
                    typeof column.columnDef.header === "string"
                      ? column.columnDef.header
                      : column.id
                  }
                  onAnnounce={onAnnounce}
                >
                  {header.render()}
                </SortButton>
              ) : (
                <span className="truncate">{header.render()}</span>
              )}
            </th>
          );
        })}
      </tr>
    </thead>
  );
}
