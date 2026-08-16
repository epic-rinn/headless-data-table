"use client";

import clsx from "clsx";
import { memo, type ReactNode } from "react";
import type { Cell, Row } from "@/table-core";

function cellAlignment<TData>(cell: Cell<TData>): string {
  const { align, meta } = cell.column.columnDef;
  const resolved = align ?? (meta?.numeric ? "end" : "start");
  if (resolved === "end") return "text-right";
  if (resolved === "center") return "text-center";
  return "text-left";
}

function DataTableCell<TData>({
  cell,
  leading,
}: {
  cell: Cell<TData>;
  leading?: ReactNode;
}) {
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
      {leading ? (
        <div className="flex min-w-0 items-center gap-1.5">
          {leading}
          <div className="min-w-0 flex-1 truncate">{cell.render()}</div>
        </div>
      ) : (
        cell.render()
      )}
    </td>
  );
}

function DataTableRowImpl<TData>({
  row,
  expander,
}: {
  row: Row<TData>;
  expander?: ReactNode;
}) {
  return (
    <tr className="group transition-colors hover:bg-row-hover">
      {row.getCells().map((cell, index) => (
        <DataTableCell
          key={cell.id}
          cell={cell}
          leading={index === 0 ? expander : undefined}
        />
      ))}
    </tr>
  );
}

export const DataTableRow = memo(DataTableRowImpl) as typeof DataTableRowImpl;
