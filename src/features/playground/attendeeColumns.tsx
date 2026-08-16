import { createColumnHelper } from "@/table-core";
import type { Attendee } from "./data";

const PAYMENT_LABEL: Record<Attendee["paymentType"], string> = {
  one_time: "Drop-in",
  package: "Package",
  membership: "Membership",
};

const BOOKING_LABEL: Record<Attendee["bookingStatus"], string> = {
  booked: "Booked",
  checked_in: "Checked in",
  cancelled: "Cancelled",
  no_show: "No show",
};

const BOOKING_STYLE: Record<Attendee["bookingStatus"], string> = {
  booked: "text-text-secondary",
  checked_in: "text-ok",
  cancelled: "text-stop",
  no_show: "text-warn",
};

const col = createColumnHelper<Attendee>();

export const attendeeColumns = [
  col.accessor("customerName", {
    header: "Customer",
    enableSorting: true,
    size: 220,
    cell: (info) => (
      <span className="flex items-center gap-2">
        <span className="truncate">{info.getValue()}</span>
        {info.row.original.isFirstVisit ? (
          <span className="shrink-0 rounded-full bg-accent-tint px-1.5 text-2xs font-medium text-accent">
            First visit
          </span>
        ) : null}
      </span>
    ),
  }),
  col.accessor("paymentType", {
    header: "Payment",
    enableSorting: true,
    size: 140,
    cell: (info) => {
      const remaining = info.row.original.packageRemaining;
      return (
        <span>
          {PAYMENT_LABEL[info.getValue()]}
          {remaining !== undefined ? (
            <span className="text-text-muted"> · {remaining} left</span>
          ) : null}
        </span>
      );
    },
  }),
  col.accessor("bookingStatus", {
    header: "Status",
    enableSorting: true,
    size: 120,
    cell: (info) => (
      <span className={BOOKING_STYLE[info.getValue()]}>
        {BOOKING_LABEL[info.getValue()]}
      </span>
    ),
  }),
];
