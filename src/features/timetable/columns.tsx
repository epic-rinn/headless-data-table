import clsx from "clsx";
import { STUDIO_TIMEZONE } from "@/constants";
import type { Session } from "@/mocks/seed";
import { createColumnHelper } from "@/table-core";
import { RelativeTime } from "./RelativeTime";

const timeFormat = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: STUDIO_TIMEZONE,
});

const STATUS_STYLE: Record<Session["status"], string> = {
  scheduled: "bg-ok-tint text-ok",
  full: "bg-warn-tint text-warn",
  cancelled: "bg-stop-tint text-stop",
};

const STATUS_LABEL: Record<Session["status"], string> = {
  scheduled: "Scheduled",
  full: "Full",
  cancelled: "Cancelled",
};

const STATUS_ORDER: Record<Session["status"], number> = {
  scheduled: 0,
  full: 1,
  cancelled: 2,
};

const col = createColumnHelper<Session>();

export function createTimetableColumns(now: number | null) {
  return [
    col.accessor("name", {
      header: "Class",
      enableSorting: true,
      size: 250,
      pin: "left",
      cell: (info) => {
        const cancelled = info.row.original.status === "cancelled";
        return (
          <div className="min-w-0">
            <div
              className={clsx(
                "truncate font-medium",
                cancelled ? "text-text-muted" : "text-text-primary",
              )}
            >
              {info.getValue()}
            </div>
            <div className="truncate text-2xs text-text-muted">
              {info.row.original.room}
            </div>
          </div>
        );
      },
    }),
    col.computed("instructor", (row) => row.instructor.name, {
      header: "Instructor",
      enableSorting: true,
      size: 180,
      cell: (info) => (
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="truncate">{info.getValue()}</span>
          {info.row.original.instructor.covering ? (
            <span className="shrink-0 rounded-full bg-warn-tint px-1.5 text-2xs font-medium text-warn">
              Covering
            </span>
          ) : null}
        </span>
      ),
    }),
    col.computed("startsAt", (row) => new Date(row.startsAt), {
      header: "Time",
      enableSorting: true,
      size: 130,
      meta: { numeric: true },
      cell: (info) => (
        <span className="flex flex-col items-end leading-tight">
          <span data-numeric>{timeFormat.format(info.getValue())}</span>
          {now === null ? null : (
            <RelativeTime startsAt={info.getValue()} now={now} />
          )}
        </span>
      ),
    }),
    col.accessor("booked", {
      header: "Attendance",
      enableSorting: true,
      size: 140,
      meta: { numeric: true },
      cell: (info) => {
        const { capacity, waitlisted } = info.row.original;
        const booked = info.getValue();
        const ratio = capacity === 0 ? 0 : Math.min(booked / capacity, 1);

        return (
          <div className="flex flex-col items-end gap-1">
            <span data-numeric className="text-sm">
              {booked} / {capacity}
              {waitlisted > 0 ? (
                <span className="text-warn"> +{waitlisted}</span>
              ) : null}
            </span>
            <span className="flex h-[3px] w-full overflow-hidden rounded-full bg-(--meter-track)">
              <span
                className="h-full rounded-full"
                style={{
                  width: `${ratio * 100}%`,
                  backgroundColor:
                    waitlisted > 0
                      ? "var(--meter-overflow)"
                      : ratio === 1
                        ? "var(--meter-full)"
                        : "var(--meter-fill)",
                }}
              />
            </span>
          </div>
        );
      },
    }),
    col.accessor("status", {
      header: "Status",
      enableSorting: true,
      size: 130,
      sortingFn: (a, b) =>
        STATUS_ORDER[a.original.status] - STATUS_ORDER[b.original.status],
      cell: (info) => {
        const status = info.getValue();
        return (
          <span
            className={clsx(
              "inline-flex h-5 items-center rounded-full px-2 text-2xs font-medium",
              STATUS_STYLE[status],
            )}
          >
            {STATUS_LABEL[status]}
          </span>
        );
      },
    }),
  ];
}
