"use client";

import type { Table } from "@/table-core";

const WIDTHS = ["70%", "45%", "85%", "55%", "62%"];

export function SkeletonRows<TData>({
  table,
  rows,
}: {
  table: Table<TData>;
  rows: number;
}) {
  const columns = table.getAllColumns();

  return (
    <tbody aria-hidden>
      {Array.from({ length: rows }, (_, rowIndex) => (
        <tr key={`skeleton-${table.getAllColumns().length}-${rowIndex}`}>
          {columns.map((column, columnIndex) => (
            <td
              key={column.id}
              className="border-b border-border-subtle px-(--cell-pad-x)"
              style={{ height: "var(--row-height)" }}
            >
              <span
                className="block h-2.5 animate-pulse rounded-full bg-surface-inset motion-reduce:animate-none"
                style={{
                  width: WIDTHS[(rowIndex + columnIndex) % WIDTHS.length],
                }}
              />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}
