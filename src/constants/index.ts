import { CalendarDays, FlaskConical, type LucideIcon } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/timetable", label: "Timetable", icon: CalendarDays },
  { href: "/playground", label: "Playground", icon: FlaskConical },
];

export const STUDIO_TIMEZONE = "Europe/London";

export const SIDEBAR_WIDTH = {
  expanded: "lg:w-53",
  collapsed: "lg:w-14",
} as const;

export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;
export const DEFAULT_SKELETON_ROWS = 8;
export const DEFAULT_COLUMN_SIZE = 160;
