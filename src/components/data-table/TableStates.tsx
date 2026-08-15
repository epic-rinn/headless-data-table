"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";

function StateCell({
  colSpan,
  children,
}: {
  colSpan: number;
  children: ReactNode;
}) {
  return (
    <tbody>
      <tr>
        <td colSpan={colSpan} className="px-(--cell-pad-x) py-14">
          <div className="mx-auto flex max-w-sm flex-col items-center gap-2 text-center">
            {children}
          </div>
        </td>
      </tr>
    </tbody>
  );
}

export function EmptyState({
  colSpan,
  title,
  description,
  action,
}: {
  colSpan: number;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <StateCell colSpan={colSpan}>
      <p className="text-base font-medium text-text-primary">{title}</p>
      {description ? (
        <p className="text-sm text-text-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </StateCell>
  );
}

export function ErrorState({
  colSpan,
  title,
  description,
  onRetry,
}: {
  colSpan: number;
  title: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <StateCell colSpan={colSpan}>
      <p className="text-base font-medium text-text-primary">{title}</p>
      {description ? (
        <p className="text-sm text-text-muted">{description}</p>
      ) : null}
      {onRetry ? (
        <div className="mt-2">
          <Button variant="secondary" size="sm" onClick={onRetry}>
            Try again
          </Button>
        </div>
      ) : null}
    </StateCell>
  );
}
