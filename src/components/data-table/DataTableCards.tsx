"use client";

import clsx from "clsx";
import type { ReactNode } from "react";
import type { Cell, Row } from "@/table-core";
import { CollapsePanel } from "./CollapsePanel";

function priorityOf<TData>(cell: Cell<TData>): 1 | 2 | 3 {
  return cell.column.columnDef.meta?.priority ?? 2;
}

function headerLabel<TData>(cell: Cell<TData>): string {
  const header = cell.column.columnDef.header;
  return typeof header === "string" ? header : cell.column.id;
}

export function DataTableCards<TData>({
  rows,
  className,
  renderExpander,
  renderExpanded,
  expandedId,
  isExpanded,
}: {
  rows: Row<TData>[];
  className?: string;
  renderExpander?: (row: Row<TData>) => ReactNode;
  renderExpanded?: (row: Row<TData>) => ReactNode;
  expandedId?: (row: Row<TData>) => string;
  isExpanded?: (row: Row<TData>) => boolean;
}) {
  return (
    <ul className={clsx("flex flex-col gap-2", className)}>
      {rows.map((row) => {
        const cells = row.getCells();
        const primary = cells.filter((cell) => priorityOf(cell) === 1);
        const secondary = cells.filter((cell) => priorityOf(cell) === 2);
        const expander = renderExpander?.(row);
        const open = isExpanded?.(row) ?? false;

        return (
          <li
            key={row.id}
            className="overflow-hidden rounded-lg border border-border-subtle bg-surface"
          >
            <div className="flex items-start gap-2 p-3">
              {expander}
              <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
                {primary.map((cell) => (
                  <div key={cell.id} className="min-w-0">
                    {cell.render()}
                  </div>
                ))}
              </div>
            </div>

            {secondary.length > 0 ? (
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 border-t border-border-subtle px-3 py-2.5">
                {secondary.map((cell) => (
                  <div key={cell.id} className="contents">
                    <dt className="text-2xs text-text-muted">
                      {headerLabel(cell)}
                    </dt>
                    <dd className="min-w-0 text-right text-sm">
                      {cell.render()}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : null}

            {renderExpanded && expandedId ? (
              <CollapsePanel
                id={expandedId(row)}
                open={open}
                className="border-t border-border-subtle px-3 py-3"
              >
                {open ? renderExpanded(row) : null}
              </CollapsePanel>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
