import { useReducer, useState } from "react";
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
  getHeaders: (() => Header<TData>[]) | null;
  getCoreRowModel: (() => RowModel<TData>) | null;
};

function createCache<TData>(): TableCache<TData> {
  return {
    live: null,
    stable: null,
    getAllColumns: null,
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
    getRowModel: () => requireLive(cache).getRowModel(),
    getRow: (id) => requireLive(cache).getRow(id),
  };
}

function buildColumns<TData>(cache: TableCache<TData>) {
  return memo(
    () => [requireLive(cache).options.columns] as const,
    (columnDefs): Column<TData>[] =>
      dedupeColumns(columnDefs).map((columnDef) => ({
        id: columnDef.id,
        columnDef,
        accessor: resolveAccessor(columnDef),
        getSize: () => columnDef.size ?? DEFAULT_COLUMN_SIZE,
        getIsPinned: () => columnDef.pin === "left",
      })),
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

  const getAllColumns = cache.getAllColumns ?? buildColumns(cache);
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

    getRowModel: () => live.getCoreRowModel(),
    getRow: (id) => live.getRowModel().rowsById[id],
  };

  cache.live = live;

  return stable;
}
