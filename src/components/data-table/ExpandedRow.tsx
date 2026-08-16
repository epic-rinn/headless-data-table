"use client";

import type { ReactNode } from "react";
import { CollapsePanel } from "./CollapsePanel";

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
        <CollapsePanel id={id} open={open} className="px-(--cell-pad-x) py-3">
          {children}
        </CollapsePanel>
      </td>
    </tr>
  );
}
