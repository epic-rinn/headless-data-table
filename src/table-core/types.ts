import type { ReactNode } from "react";

export type SortDirection = "asc" | "desc";

export type ColumnSort = { id: string; desc: boolean };
export type SortingState = ColumnSort[];

export type PaginationState = { pageIndex: number; pageSize: number };

export type ExpandedState = Record<string, boolean>;

export type TableState = {
  sorting: SortingState;
  pagination: PaginationState;
  expanded: ExpandedState;
};

export type Updater<T> = T | ((old: T) => T);
export type OnChangeFn<T> = (updater: Updater<T>) => void;

export type AccessorKey<TData> = Extract<keyof TData, string>;

export type SortingFnName =
  | "auto"
  | "alphanumeric"
  | "basic"
  | "datetime"
  | "number";

export type SortingFn<TData> = (
  a: Row<TData>,
  b: Row<TData>,
  columnId: string,
) => number;

export interface ColumnMeta {
  numeric?: boolean;
  priority?: 1 | 2 | 3;
  headerTooltip?: string;
}

export type ColumnAlign = "start" | "end" | "center";

export type ColumnDefInput<TData, TValue = unknown> = {
  id?: string;
  accessorKey?: AccessorKey<TData>;
  accessorFn?: (row: TData, index: number) => TValue;

  header: string | ((ctx: HeaderContext<TData>) => ReactNode);
  cell?: (ctx: CellContext<TData, TValue>) => ReactNode;

  enableSorting?: boolean;
  sortingFn?: SortingFn<TData> | SortingFnName;
  sortDescFirst?: boolean;
  invertSorting?: boolean;

  size?: number;
  minSize?: number;

  pin?: "left" | false;
  align?: ColumnAlign;

  meta?: ColumnMeta;
};

export type ColumnDef<TData> = Omit<ColumnDefInput<TData, unknown>, "id"> & {
  id: string;
};

export type ColumnDefBody<TData, TValue> = Omit<
  ColumnDefInput<TData, TValue>,
  "id" | "accessorKey" | "accessorFn"
>;

export type DisplayColumnBody<TData> = ColumnDefBody<TData, undefined>;

export type Column<TData> = {
  id: string;
  columnDef: ColumnDef<TData>;
  accessor: (row: TData, index: number) => unknown;
  getSize: () => number;
  getIsPinned: () => boolean;
};

export type Header<TData> = {
  id: string;
  column: Column<TData>;
  colSpan: number;
  render: () => ReactNode;
};

export type Cell<TData> = {
  id: string;
  column: Column<TData>;
  row: Row<TData>;
  getValue: () => unknown;
  render: () => ReactNode;
};

export type Row<TData> = {
  id: string;
  index: number;
  depth: number;
  original: TData;
  parentId?: string;
  subRows: Row<TData>[];
  getValue: (columnId: string) => unknown;
  getCells: () => Cell<TData>[];
};

export type RowModel<TData> = {
  rows: Row<TData>[];
  flatRows: Row<TData>[];
  rowsById: Record<string, Row<TData>>;
};

export type RowModelFactory<TData> = (
  table: Table<TData>,
) => () => RowModel<TData>;

export type HeaderContext<TData> = {
  table: Table<TData>;
  column: Column<TData>;
  header: Header<TData>;
};

export type CellContext<TData, TValue> = {
  table: Table<TData>;
  row: Row<TData>;
  column: Column<TData>;
  getValue: () => TValue;
};

export type UseDataTableOptions<TData> = {
  data: TData[];
  columns: ColumnDef<TData>[];

  getRowId?: (row: TData, index: number, parent?: Row<TData>) => string;

  state?: Partial<TableState>;
  initialState?: Partial<TableState>;

  onSortingChange?: OnChangeFn<SortingState>;
  onPaginationChange?: OnChangeFn<PaginationState>;
  onExpandedChange?: OnChangeFn<ExpandedState>;

  getCoreRowModel: RowModelFactory<TData>;

  manualSorting?: boolean;
  manualPagination?: boolean;
  rowCount?: number;

  enableSortingRemoval?: boolean;
  enableMultiSort?: boolean;
};

export type Table<TData> = {
  options: UseDataTableOptions<TData>;
  getState: () => TableState;

  setSorting: OnChangeFn<SortingState>;
  setPagination: OnChangeFn<PaginationState>;
  setExpanded: OnChangeFn<ExpandedState>;

  getAllColumns: () => Column<TData>[];
  getColumn: (id: string) => Column<TData> | undefined;
  getHeaders: () => Header<TData>[];

  getCoreRowModel: () => RowModel<TData>;
  getRowModel: () => RowModel<TData>;
  getRow: (id: string) => Row<TData> | undefined;
};
