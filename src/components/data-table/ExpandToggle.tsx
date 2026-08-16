"use client";

import clsx from "clsx";
import { ChevronRight } from "lucide-react";

export function ExpandToggle({
  expanded,
  label,
  controls,
  onToggle,
}: {
  expanded: boolean;
  label: string;
  controls: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      aria-controls={controls}
      aria-label={label}
      className="flex size-6 shrink-0 items-center justify-center rounded text-text-muted transition-colors hover:bg-row-active hover:text-text-primary"
    >
      <ChevronRight
        size={14}
        strokeWidth={2.5}
        aria-hidden
        className={clsx(
          "transition-transform duration-180 ease-expand",
          expanded && "rotate-90",
        )}
      />
    </button>
  );
}
