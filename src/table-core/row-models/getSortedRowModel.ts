import {
  isNullish,
  resolveSortingFnName,
  sortingFns,
} from "../features/sorting";
import type {
  Row,
  RowModel,
  RowModelFactory,
  SortingFn,
  ValueSortingFn,
} from "../types";
import { memo } from "../utils/memo";

type SortEntry<TData> = {
  columnId: string;
  desc: boolean;
  invert: boolean;
  values: unknown[];
  compareValues: ValueSortingFn | null;
  compareRows: SortingFn<TData> | null;
};

function firstNonNullish(values: unknown[]): unknown {
  for (const value of values) {
    if (!isNullish(value)) return value;
  }
  return undefined;
}

export function getSortedRowModel<TData>(): RowModelFactory<TData> {
  return (table) =>
    memo(
      () =>
        [
          table.getPreSortedRowModel(),
          table.getState().sorting,
          table.options.manualSorting === true,
        ] as const,
      (rowModel, sorting, manualSorting): RowModel<TData> => {
        if (manualSorting || sorting.length === 0) return rowModel;

        const rows = rowModel.rows;
        const entries: SortEntry<TData>[] = [];

        for (const sort of sorting) {
          const column = table.getColumn(sort.id);

          if (!column) {
            console.warn(
              `Unknown sort column id "${sort.id}". Sorting for it was skipped.`,
            );
            continue;
          }

          const values = rows.map((row) =>
            column.accessor(row.original, row.index),
          );
          const configured = column.columnDef.sortingFn;
          const compareRows =
            typeof configured === "function" ? configured : null;

          entries.push({
            columnId: sort.id,
            desc: sort.desc,
            invert: column.columnDef.invertSorting === true,
            values,
            compareRows,
            compareValues: compareRows
              ? null
              : sortingFns[
                  resolveSortingFnName(
                    column.columnDef,
                    firstNonNullish(values),
                  )
                ],
          });
        }

        if (entries.length === 0) return rowModel;

        const order = rows.map((_, index) => index);

        order.sort((indexA, indexB) => {
          for (const entry of entries) {
            const valueA = entry.values[indexA];
            const valueB = entry.values[indexB];

            const nullA = isNullish(valueA);
            const nullB = isNullish(valueB);
            if (nullA && nullB) continue;
            if (nullA) return 1;
            if (nullB) return -1;

            let result = 0;
            if (entry.compareRows) {
              const rowA = rows[indexA];
              const rowB = rows[indexB];
              if (rowA && rowB) {
                result = entry.compareRows(rowA, rowB, entry.columnId);
              }
            } else if (entry.compareValues) {
              result = entry.compareValues(valueA, valueB);
            }

            if (entry.invert) result = -result;
            if (entry.desc) result = -result;
            if (result !== 0) return result;
          }

          return indexA - indexB;
        });

        const sortedRows: Row<TData>[] = [];
        for (const index of order) {
          const row = rows[index];
          if (row) sortedRows.push(row);
        }

        return {
          rows: sortedRows,
          flatRows: sortedRows,
          rowsById: rowModel.rowsById,
        };
      },
    );
}
