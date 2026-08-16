"use client";

import { useSyncExternalStore } from "react";

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

export function startOfUtcDay(timestamp: number): Date {
  return new Date(new Date(timestamp).toISOString().slice(0, 10));
}
