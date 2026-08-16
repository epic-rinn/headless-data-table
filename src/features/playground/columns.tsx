import { STUDIO_TIMEZONE } from "@/constants";
import type { Session, SessionLevel } from "@/mocks/seed";
import { createColumnHelper } from "@/table-core";

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

const LEVEL_LABEL: Record<SessionLevel, string> = {
  all: "All levels",
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

const LEVEL_ORDER: Record<SessionLevel, number> = {
  all: 0,
  beginner: 1,
  intermediate: 2,
  advanced: 3,
};

const money = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
});

const col = createColumnHelper<Session>();

export const sessionColumns = [
  col.accessor("name", {
    header: "Class",
    enableSorting: true,
    size: 260,
    pin: "left",
    cell: (info) => (
      <div className="min-w-0">
        <div className="truncate font-medium text-text-primary">
          {info.getValue()}
        </div>
        <div className="truncate text-2xs text-text-muted">
          {info.row.original.room}
        </div>
      </div>
    ),
  }),
  col.computed("instructor", (row) => row.instructor.name, {
    header: "Instructor",
    enableSorting: true,
    size: 150,
  }),
  col.computed("startsAt", (row) => new Date(row.startsAt), {
    header: "Time",
    enableSorting: true,
    size: 100,
    meta: { numeric: true },
    cell: (info) => timeFormat.format(info.getValue()),
  }),
  col.accessor("booked", {
    header: "Attendance",
    enableSorting: true,
    size: 130,
    meta: { numeric: true },
    cell: (info) => {
      const { capacity } = info.row.original;
      const booked = info.getValue();
      const ratio = capacity === 0 ? 0 : Math.min(booked / capacity, 1);
      const over = booked > capacity;

      return (
        <div className="flex flex-col items-end gap-1">
          <span data-numeric className="text-sm">
            {booked} / {capacity}
          </span>
          <span className="flex h-[3px] w-full overflow-hidden rounded-full bg-(--meter-track)">
            <span
              className="h-full rounded-full"
              style={{
                width: `${ratio * 100}%`,
                backgroundColor: over
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
  col.accessor("waitlisted", {
    header: "Waitlist",
    enableSorting: true,
    size: 100,
    meta: { numeric: true },
    cell: (info) => {
      const waitlisted = info.getValue();
      return waitlisted === 0 ? (
        <span className="text-text-muted">—</span>
      ) : (
        <span data-numeric className="text-warn">
          +{waitlisted}
        </span>
      );
    },
  }),
  col.accessor("checkedIn", {
    header: "Checked in",
    enableSorting: true,
    size: 110,
    meta: { numeric: true },
  }),
  col.computed(
    "endsAt",
    (row) =>
      new Date(new Date(row.startsAt).getTime() + row.durationMin * 60000),
    {
      header: "Ends",
      enableSorting: true,
      size: 90,
      meta: { numeric: true },
      cell: (info) => timeFormat.format(info.getValue()),
    },
  ),
  col.accessor("durationMin", {
    header: "Duration",
    enableSorting: true,
    size: 100,
    meta: { numeric: true },
    cell: (info) => `${info.getValue()} min`,
  }),
  col.accessor("level", {
    header: "Level",
    enableSorting: true,
    size: 130,
    sortingFn: (a, b) =>
      LEVEL_ORDER[a.original.level] - LEVEL_ORDER[b.original.level],
    cell: (info) => (
      <span className="text-text-secondary">
        {LEVEL_LABEL[info.getValue()]}
      </span>
    ),
  }),
  col.accessor("equipment", {
    header: "Equipment",
    enableSorting: true,
    size: 130,
  }),
  col.accessor("priceGbp", {
    header: "Price",
    enableSorting: true,
    size: 100,
    meta: { numeric: true },
    cell: (info) => money.format(info.getValue()),
  }),
  col.accessor("status", {
    header: "Status",
    enableSorting: true,
    size: 120,
    cell: (info) => {
      const status = info.getValue();
      return (
        <span
          className={`inline-flex h-5 items-center rounded-full px-2 text-2xs font-medium ${STATUS_STYLE[status]}`}
        >
          {STATUS_LABEL[status]}
        </span>
      );
    },
  }),
];
