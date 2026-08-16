import { useReducer, useState } from "react";
import {
  clampPageIndex,
  getDisplayRange,
  getPageCount,
  pageIndexForNewPageSize,
} from "./features/pagination";
import { computePinning } from "./features/pinning";
import {
  directionOf,
  nextSortingOrder,
  resolveSortDescFirst,
  toggleSortingState,
} from "./features/sorting";
import {
  createInitialState,
  isSliceControlled,
  resolveState,
  tableStateReducer,
} from "./state";
import type {
  Column,
  ExpandedState,
  Header,
  OnChangeFn,
  PaginationState,
  RowModel,
  SortDirection,
  SortingState,
  Table,
  UseDataTableOptions,
} from "./types";
import { dedupeColumns, resolveAccessor } from "./utils/accessors";
import { memo } from "./utils/memo";

const DEFAULT_COLUMN_SIZE = 160;

type TableCache<TData> = {
  live: Table<TData> | null;
  stable: Table<TData> | null;
  getAllColumns: (() => Column<TData>[]) | null;
  getSortedRowModel: (() => RowModel<TData>) | null;
  getPaginationRowModel: (() => RowModel<TData>) | null;
  getHeaders: (() => Header<TData>[]) | null;
  getCoreRowModel: (() => RowModel<TData>) | null;
};

function createCache<TData>(): TableCache<TData> {
  return {
    live: null,
    stable: null,
    getAllColumns: null,
    getSortedRowModel: null,
    getPaginationRowModel: null,
    getHeaders: null,
    getCoreRowModel: null,
  };
}

function requireLive<TData>(cache: TableCache<TData>): Table<TData> {
  const live = cache.live;
  if (!live) {
    throw new Error("Table was accessed before its first render completed.");
  }
  return live;
}

function createStableTable<TData>(cache: TableCache<TData>): Table<TData> {
  return {
    get options() {
      return requireLive(cache).options;
    },
    getState: () => requireLive(cache).getState(),
    setSorting: (updater) => requireLive(cache).setSorting(updater),
    setPagination: (updater) => requireLive(cache).setPagination(updater),
    setExpanded: (updater) => requireLive(cache).setExpanded(updater),
    getAllColumns: () => requireLive(cache).getAllColumns(),
    getColumn: (id) => requireLive(cache).getColumn(id),
    getHeaders: () => requireLive(cache).getHeaders(),
    getCoreRowModel: () => requireLive(cache).getCoreRowModel(),
    getPreSortedRowModel: () => requireLive(cache).getPreSortedRowModel(),
    getSortedRowModel: () => requireLive(cache).getSortedRowModel(),
    getPrePaginationRowModel: () =>
      requireLive(cache).getPrePaginationRowModel(),
    getPaginationRowModel: () => requireLive(cache).getPaginationRowModel(),
    getRowModel: () => requireLive(cache).getRowModel(),
    getRow: (id) => requireLive(cache).getRow(id),

    getRowCount: () => requireLive(cache).getRowCount(),
    getPageCount: () => requireLive(cache).getPageCount(),
    getPageIndex: () => requireLive(cache).getPageIndex(),
    getPageSize: () => requireLive(cache).getPageSize(),
    getDisplayRange: () => requireLive(cache).getDisplayRange(),
    getCanPreviousPage: () => requireLive(cache).getCanPreviousPage(),
    getCanNextPage: () => requireLive(cache).getCanNextPage(),
    setPageIndex: (pageIndex) => requireLive(cache).setPageIndex(pageIndex),
    setPageSize: (pageSize) => requireLive(cache).setPageSize(pageSize),
    nextPage: () => requireLive(cache).nextPage(),
    previousPage: () => requireLive(cache).previousPage(),
    firstPage: () => requireLive(cache).firstPage(),
    lastPage: () => requireLive(cache).lastPage(),
  };
}

function buildColumns<TData>(cache: TableCache<TData>, stable: Table<TData>) {
  return memo(
    () => [requireLive(cache).options.columns] as const,
    (columnDefs): Column<TData>[] => {
      const defs = dedupeColumns(columnDefs);
      const pinning = computePinning(defs, DEFAULT_COLUMN_SIZE);

      return defs.map((columnDef) => {
        const id = columnDef.id;
        const accessor = resolveAccessor(columnDef);

        const sample = (): unknown => {
          const first = stable.getPreSortedRowModel().rows[0];
          return first ? accessor(first.original, first.index) : undefined;
        };

        const descFirst = () => resolveSortDescFirst(columnDef, sample());

        const getIsSorted = (): SortDirection | false =>
          directionOf(stable.getState().sorting, id);

        const getCanSort = () => {
          const options = stable.options;
          if (columnDef.enableSorting !== true) return false;
          return (
            options.getSortedRowModel !== undefined ||
            options.manualSorting === true
          );
        };

        return {
          id,
          columnDef,
          accessor,
          getSize: () => columnDef.size ?? DEFAULT_COLUMN_SIZE,
          getIsPinned: () => columnDef.pin === "left",
          getPinOffset: () => pinning.offsets[id] ?? 0,
          getIsLastPinned: () => pinning.lastPinnedId === id,

          getCanSort,
          getIsSorted,
          getSortIndex: () =>
            stable.getState().sorting.findIndex((sort) => sort.id === id),
          getNextSortingOrder: () =>
            nextSortingOrder(
              getIsSorted(),
              descFirst(),
              stable.options.enableSortingRemoval !== false,
            ),

          toggleSorting: (desc?: boolean, multi?: boolean) => {
            if (!getCanSort()) return;
            const options = stable.options;

            stable.setSorting((old) =>
              toggleSortingState(old, id, {
                desc,
                multi: options.enableMultiSort === true && multi === true,
                descFirst: descFirst(),
                allowRemoval: options.enableSortingRemoval !== false,
              }),
            );
          },

          clearSorting: () => {
            stable.setSorting((old) => old.filter((sort) => sort.id !== id));
          },
        };
      });
    },
  );
}

function buildHeaders<TData>(cache: TableCache<TData>, stable: Table<TData>) {
  return memo(
    () => [requireLive(cache).getAllColumns()] as const,
    (columns): Header<TData>[] =>
      columns.map((column) => {
        const header: Header<TData> = {
          id: column.id,
          column,
          colSpan: 1,
          render: () => {
            const headerDef = column.columnDef.header;
            return typeof headerDef === "function"
              ? headerDef({ table: stable, column, header })
              : headerDef;
          },
        };
        return header;
      }),
  );
}

export function useDataTable<TData>(
  options: UseDataTableOptions<TData>,
): Table<TData> {
  const [internalState, dispatch] = useReducer(
    tableStateReducer,
    options.initialState,
    createInitialState,
  );

  const [cache] = useState<TableCache<TData>>(createCache<TData>);

  const state = resolveState(internalState, options.state);

  const setSorting: OnChangeFn<SortingState> = (updater) => {
    if (!isSliceControlled("sorting", options.state)) {
      dispatch({ slice: "sorting", updater });
    }
    options.onSortingChange?.(updater);
  };

  const setPagination: OnChangeFn<PaginationState> = (updater) => {
    if (!isSliceControlled("pagination", options.state)) {
      dispatch({ slice: "pagination", updater });
    }
    options.onPaginationChange?.(updater);
  };

  const setExpanded: OnChangeFn<ExpandedState> = (updater) => {
    if (!isSliceControlled("expanded", options.state)) {
      dispatch({ slice: "expanded", updater });
    }
    options.onExpandedChange?.(updater);
  };

  const stable = cache.stable ?? createStableTable(cache);
  cache.stable = stable;

  const getAllColumns = cache.getAllColumns ?? buildColumns(cache, stable);
  cache.getAllColumns = getAllColumns;

  const getHeaders = cache.getHeaders ?? buildHeaders(cache, stable);
  cache.getHeaders = getHeaders;

  const live: Table<TData> = {
    options,
    getState: () => state,

    setSorting,
    setPagination,
    setExpanded,

    getAllColumns,
    getColumn: (id) => getAllColumns().find((column) => column.id === id),
    getHeaders,

    getCoreRowModel: () => {
      const getModel = cache.getCoreRowModel ?? options.getCoreRowModel(stable);
      cache.getCoreRowModel = getModel;
      return getModel();
    },

    getPreSortedRowModel: () => live.getCoreRowModel(),

    getSortedRowModel: () => {
      const factory = options.getSortedRowModel;
      if (!factory) return live.getPreSortedRowModel();
      const getModel = cache.getSortedRowModel ?? factory(stable);
      cache.getSortedRowModel = getModel;
      return getModel();
    },

    getPrePaginationRowModel: () => live.getSortedRowModel(),

    getPaginationRowModel: () => {
      const factory = options.getPaginationRowModel;
      if (!factory) return live.getPrePaginationRowModel();
      const getModel = cache.getPaginationRowModel ?? factory(stable);
      cache.getPaginationRowModel = getModel;
      return getModel();
    },

    getRowModel: () => live.getPaginationRowModel(),
    getRow: (id) => live.getRowModel().rowsById[id],

    getRowCount: () =>
      options.manualPagination
        ? (options.rowCount ?? 0)
        : live.getPrePaginationRowModel().rows.length,

    getPageCount: () =>
      getPageCount(live.getRowCount(), state.pagination.pageSize),

    getPageIndex: () =>
      clampPageIndex(state.pagination.pageIndex, live.getPageCount()),

    getPageSize: () => state.pagination.pageSize,

    getDisplayRange: () =>
      getDisplayRange(
        live.getPageIndex(),
        state.pagination.pageSize,
        live.getRowCount(),
      ),

    getCanPreviousPage: () => live.getPageIndex() > 0,
    getCanNextPage: () => live.getPageIndex() < live.getPageCount() - 1,

    setPageIndex: (pageIndex) => {
      live.setPagination((old) => ({ ...old, pageIndex }));
    },

    setPageSize: (pageSize) => {
      live.setPagination((old) => ({
        pageSize,
        pageIndex: pageIndexForNewPageSize(
          old.pageIndex,
          old.pageSize,
          pageSize,
        ),
      }));
    },

    nextPage: () => live.setPageIndex(live.getPageIndex() + 1),
    previousPage: () => live.setPageIndex(live.getPageIndex() - 1),
    firstPage: () => live.setPageIndex(0),
    lastPage: () => live.setPageIndex(live.getPageCount() - 1),
  };

  cache.live = live;

  return stable;
}
