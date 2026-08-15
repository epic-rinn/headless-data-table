"use client";

import clsx from "clsx";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import type { ReactNode } from "react";
import type { Column, SortDirection } from "@/table-core";

const DIRECTION_LABEL: Record<SortDirection, string> = {
  asc: "ascending",
  desc: "descending",
};

function SortIcon({
  direction,
  className,
}: {
  direction: SortDirection | false;
  className?: string;
}) {
  const props = {
    size: 12,
    strokeWidth: 2.5,
    "aria-hidden": true,
    className,
  } as const;

  if (direction === "asc") return <ArrowUp {...props} />;
  if (direction === "desc") return <ArrowDown {...props} />;
  return <ChevronsUpDown {...props} />;
}

export function SortButton<TData>({
  column,
  label,
  children,
  onAnnounce,
}: {
  column: Column<TData>;
  label: string;
  children: ReactNode;
  onAnnounce: (message: string) => void;
}) {
  const sorted = column.getIsSorted();
  const next = column.getNextSortingOrder();

  const actionLabel =
    next === false
      ? `Stop sorting by ${label}`
      : `Sort by ${label}, ${DIRECTION_LABEL[next]}`;

  return (
    <button
      type="button"
      onClick={(event) => {
        column.toggleSorting(undefined, event.shiftKey);
        const applied = column.getNextSortingOrder();
        onAnnounce(
          applied === false || next === false
            ? `Sorting removed for ${label}`
            : `Sorted by ${label}, ${DIRECTION_LABEL[next]}`,
        );
      }}
      aria-label={actionLabel}
      className={clsx(
        "-mx-1 flex h-full w-[calc(100%+0.5rem)] items-center gap-1.5 rounded px-1 text-left transition-colors",
        "hover:text-text-primary",
        sorted ? "text-text-primary" : "text-text-muted",
      )}
    >
      <span className="truncate">{children}</span>
      <SortIcon
        direction={sorted}
        className={clsx(
          "shrink-0 transition-opacity duration-120",
          sorted ? "opacity-100" : "opacity-0 group-hover/th:opacity-60",
        )}
      />
      {column.getSortIndex() > 0 ? (
        <span
          aria-hidden
          className="shrink-0 text-[10px] font-semibold text-text-muted"
        >
          {column.getSortIndex() + 1}
        </span>
      ) : null}
    </button>
  );
}
