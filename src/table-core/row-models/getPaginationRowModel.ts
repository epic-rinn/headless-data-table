import { getPageSlice } from "../features/pagination";
import type { RowModel, RowModelFactory } from "../types";
import { memo } from "../utils/memo";

export function getPaginationRowModel<TData>(): RowModelFactory<TData> {
  return (table) =>
    memo(
      () =>
        [
          table.getPrePaginationRowModel(),
          table.getPageIndex(),
          table.getPageSize(),
          table.options.manualPagination === true,
        ] as const,
      (rowModel, pageIndex, pageSize, manualPagination): RowModel<TData> => {
        if (manualPagination || pageSize <= 0) return rowModel;

        const { start, end } = getPageSlice(pageIndex, pageSize);
        if (start === 0 && end >= rowModel.rows.length) return rowModel;

        const rows = rowModel.rows.slice(start, end);
        return { rows, flatRows: rows, rowsById: rowModel.rowsById };
      },
    );
}
