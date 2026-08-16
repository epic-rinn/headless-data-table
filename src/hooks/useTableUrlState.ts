"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import {
  applyUpdater,
  type OnChangeFn,
  type PaginationState,
  type SortingState,
} from "@/table-core";

export type TableUrlState = {
  sorting: SortingState;
  pagination: PaginationState;
  setSorting: OnChangeFn<SortingState>;
  setPagination: OnChangeFn<PaginationState>;
};

function parseSorting(raw: string | null): SortingState {
  if (!raw) return [];

  const parsed: SortingState = [];
  for (const part of raw.split(",")) {
    const [id, direction] = part.split(".");
    if (!id) continue;
    parsed.push({ id, desc: direction === "desc" });
  }
  return parsed;
}

function serializeSorting(sorting: SortingState): string {
  return sorting
    .map((sort) => `${sort.id}.${sort.desc ? "desc" : "asc"}`)
    .join(",");
}

function positiveInt(raw: string | null, fallback: number): number {
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 1) return fallback;
  return Math.floor(value);
}

export function useTableUrlState({
  defaultPageSize = 10,
}: {
  defaultPageSize?: number;
} = {}): TableUrlState {
  const router = useRouter();
  const searchParams = useSearchParams();

  const sorting = useMemo(
    () => parseSorting(searchParams.get("sort")),
    [searchParams],
  );

  const pagination = useMemo<PaginationState>(
    () => ({
      pageIndex: positiveInt(searchParams.get("page"), 1) - 1,
      pageSize: positiveInt(searchParams.get("size"), defaultPageSize),
    }),
    [searchParams, defaultPageSize],
  );

  const commit = useCallback(
    (nextSorting: SortingState, nextPagination: PaginationState) => {
      const params = new URLSearchParams(searchParams.toString());

      const sort = serializeSorting(nextSorting);
      if (sort) params.set("sort", sort);
      else params.delete("sort");

      if (nextPagination.pageIndex > 0) {
        params.set("page", String(nextPagination.pageIndex + 1));
      } else {
        params.delete("page");
      }

      if (nextPagination.pageSize !== defaultPageSize) {
        params.set("size", String(nextPagination.pageSize));
      } else {
        params.delete("size");
      }

      const query = params.toString();
      router.replace(query ? `?${query}` : "?", { scroll: false });
    },
    [router, searchParams, defaultPageSize],
  );

  const setSorting = useCallback<OnChangeFn<SortingState>>(
    (updater) => {
      commit(applyUpdater(updater, sorting), { ...pagination, pageIndex: 0 });
    },
    [commit, sorting, pagination],
  );

  const setPagination = useCallback<OnChangeFn<PaginationState>>(
    (updater) => {
      commit(sorting, applyUpdater(updater, pagination));
    },
    [commit, sorting, pagination],
  );

  return useMemo(
    () => ({ sorting, pagination, setSorting, setPagination }),
    [sorting, pagination, setSorting, setPagination],
  );
}
