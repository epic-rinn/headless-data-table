import { useCallback, useEffect, useReducer, useState } from "react";
import {
  abortRow,
  clearStore,
  createSubRowsStore,
  expandedIds,
  IDLE,
  type SubRowsStore,
  syncDataSource,
  toggleExpandedState,
} from "./features/expansion";
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
  AsyncSubRowsState,
  Column,
  ExpandedState,
  Header,
  OnChangeFn,
  PaginationState,
  Row,
  RowModel,
  SortDirection,
  SortingState,
  Table,
  UseDataTableOptions,
} from "./types";
import { dedupeColumns, resolveAccessor } from "./utils/accessors";
import { memo } from "./utils/memo";

const DEFAULT_COLUMN_SIZE = 160;

type TableCache<TData, TSubData> = {
  live: Table<TData, TSubData> | null;
  stable: Table<TData, TSubData> | null;
  subRows: SubRowsStore<TSubData>;
  loadSubRows:
    | ((row: Row<TData>, signal: AbortSignal) => Promise<TSubData>)
    | undefined;
  getAllColumns: (() => Column<TData>[]) | null;
  getSortedRowModel: (() => RowModel<TData>) | null;
  getPaginationRowModel: (() => RowModel<TData>) | null;
  getHeaders: (() => Header<TData>[]) | null;
  getCoreRowModel: (() => RowModel<TData>) | null;
};

function createCache<TData, TSubData>(): TableCache<TData, TSubData> {
  return {
    live: null,
    stable: null,
    subRows: createSubRowsStore<TSubData>(),
    loadSubRows: undefined,
    getAllColumns: null,
    getSortedRowModel: null,
    getPaginationRowModel: null,
    getHeaders: null,
    getCoreRowModel: null,
  };
}

function requireLive<TData, TSubData>(
  cache: TableCache<TData, TSubData>,
): Table<TData, TSubData> {
  const live = cache.live;
  if (!live) {
    throw new Error("Table was accessed before its first render completed.");
  }
  return live;
}

function createStableTable<TData, TSubData>(
  cache: TableCache<TData, TSubData>,
): Table<TData, TSubData> {
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

    getCanExpand: (row) => requireLive(cache).getCanExpand(row),
    getIsExpanded: (rowId) => requireLive(cache).getIsExpanded(rowId),
    toggleExpanded: (rowId) => requireLive(cache).toggleExpanded(rowId),
    getSubRowsState: (rowId) => requireLive(cache).getSubRowsState(rowId),
  };
}

function buildColumns<TData, TSubData>(
  cache: TableCache<TData, TSubData>,
  stable: Table<TData, TSubData>,
) {
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

function buildHeaders<TData, TSubData>(
  cache: TableCache<TData, TSubData>,
  stable: Table<TData, TSubData>,
) {
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

export function useDataTable<TData, TSubData = never>(
  options: UseDataTableOptions<TData, TSubData>,
): Table<TData, TSubData> {
  const [internalState, dispatch] = useReducer(
    tableStateReducer,
    options.initialState,
    createInitialState,
  );

  const [cache] = useState<TableCache<TData, TSubData>>(
    createCache<TData, TSubData>,
  );
  const [, bump] = useState(0);
  const rerender = useCallback(() => bump((n) => n + 1), []);

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

  const live: Table<TData, TSubData> = {
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

    getCanExpand: (row) => options.getRowCanExpand?.(row) ?? false,
    getIsExpanded: (rowId) => state.expanded[rowId] === true,
    toggleExpanded: (rowId) => {
      setExpanded((old) => toggleExpandedState(old, rowId));
    },
    getSubRowsState: (rowId) =>
      cache.subRows.states.get(rowId) ?? (IDLE as AsyncSubRowsState<TSubData>),
  };

  cache.live = live;
  cache.loadSubRows = options.loadSubRows;

  const loadSubRows = options.loadSubRows;
  const expandedKey = expandedIds(state.expanded).sort().join("\u0000");

  useEffect(() => {
    if (!loadSubRows) return;

    const store = cache.subRows;
    syncDataSource(store, options.data);

    const open = new Set(expandedIds(stable.getState().expanded));

    for (const rowId of store.controllers.keys()) {
      if (!open.has(rowId)) abortRow(store, rowId);
    }

    for (const rowId of open) {
      const existing = store.states.get(rowId);
      if (existing && existing.status !== "idle") continue;

      const row = stable.getRow(rowId);
      if (!row) continue;

      start(store, row, rowId);
    }

    function start(
      store: SubRowsStore<TSubData>,
      row: Row<TData>,
      rowId: string,
    ) {
      const controller = new AbortController();
      store.controllers.set(rowId, controller);
      store.states.set(rowId, { status: "loading" });
      rerender();

      cache.loadSubRows?.(row, controller.signal).then(
        (data) => {
          if (controller.signal.aborted) return;
          store.controllers.delete(rowId);
          store.states.set(rowId, {
            status: "success",
            data,
            fetchedAt: Date.now(),
          });
          rerender();
        },
        (error: unknown) => {
          if (controller.signal.aborted) return;
          store.controllers.delete(rowId);
          store.states.set(rowId, {
            status: "error",
            error: error instanceof Error ? error : new Error(String(error)),
            retry: () => {
              store.states.delete(rowId);
              start(store, row, rowId);
            },
          });
          rerender();
        },
      );
    }
  }, [expandedKey, loadSubRows, options.data, cache, stable, rerender]);

  useEffect(() => {
    const store = cache.subRows;
    return () => clearStore(store);
  }, [cache]);

  return stable;
}
