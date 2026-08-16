"use client";

import type { ReactNode } from "react";

export function ExpandedRow({
  id,
  colSpan,
  open,
  children,
}: {
  id: string;
  colSpan: number;
  open: boolean;
  children: ReactNode;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="border-b border-border-subtle p-0">
        <div
          id={id}
          hidden={!open}
          className="grid transition-[grid-template-rows] duration-180 ease-expand"
          style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
        >
          <div className="overflow-hidden">
            <div className="bg-surface-sunken px-(--cell-pad-x) py-3">
              {children}
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
}
