"use client";

import { useSyncExternalStore } from "react";
import { STUDIO_TIMEZONE } from "@/constants";

let cached: number | null = null;

const subscribe = () => () => {};

function getSnapshot(): number {
  if (cached === null) cached = Date.now();
  return cached;
}

function getServerSnapshot(): null {
  return null;
}

export function useClientNow(): number | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

const dayParts = new Intl.DateTimeFormat("en-GB", {
  timeZone: STUDIO_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function startOfStudioDay(timestamp: number): Date {
  const parts = dayParts.formatToParts(new Date(timestamp));
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "01";

  return new Date(
    `${value("year")}-${value("month")}-${value("day")}T00:00:00Z`,
  );
}
