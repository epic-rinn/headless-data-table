"use client";

import clsx from "clsx";
import { memo } from "react";
import type { Cell, Row } from "@/table-core";

function cellAlignment<TData>(cell: Cell<TData>): string {
  const { align, meta } = cell.column.columnDef;
  const resolved = align ?? (meta?.numeric ? "end" : "start");
  if (resolved === "end") return "text-right";
  if (resolved === "center") return "text-center";
  return "text-left";
}

function DataTableCell<TData>({ cell }: { cell: Cell<TData> }) {
  const numeric = cell.column.columnDef.meta?.numeric === true;
  const value = cell.getValue();
  const pinned = cell.column.getIsPinned();

  return (
    <td
      data-numeric={numeric || undefined}
      data-pinned={pinned || undefined}
      data-pin-edge={(pinned && cell.column.getIsLastPinned()) || undefined}
      className={clsx(
        "truncate border-b border-border-subtle px-(--cell-pad-x) align-middle",
        cellAlignment(cell),
        pinned && "sticky z-(--z-pinned) bg-surface group-hover:bg-row-hover",
      )}
      style={{
        height: "var(--row-height)",
        left: pinned ? `${cell.column.getPinOffset()}px` : undefined,
      }}
      title={typeof value === "string" ? value : undefined}
    >
      {cell.render()}
    </td>
  );
}

function DataTableRowImpl<TData>({ row }: { row: Row<TData> }) {
  return (
    <tr className="group transition-colors hover:bg-row-hover">
      {row.getCells().map((cell) => (
        <DataTableCell key={cell.id} cell={cell} />
      ))}
    </tr>
  );
}

export const DataTableRow = memo(DataTableRowImpl) as typeof DataTableRowImpl;
