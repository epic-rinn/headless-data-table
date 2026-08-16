"use client";

import clsx from "clsx";
import type { ReactNode } from "react";

export function CollapsePanel({
  id,
  open,
  className,
  children,
}: {
  id: string;
  open: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      id={id}
      hidden={!open}
      className="grid transition-[grid-template-rows] duration-180 ease-expand"
      style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
    >
      <div className="overflow-hidden">
        <div className={clsx("bg-surface-sunken", className)}>{children}</div>
      </div>
    </div>
  );
}
