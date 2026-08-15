import type { Row, RowModel, RowModelFactory, Table } from "../types";
import { memo } from "../utils/memo";

function createRow<TData>(
  table: Table<TData>,
  original: TData,
  index: number,
): Row<TData> {
  const { getRowId } = table.options;
  const id = getRowId ? getRowId(original, index) : String(index);

  const row: Row<TData> = {
    id,
    index,
    depth: 0,
    original,
    subRows: [],
    getValue: (columnId) => {
      const column = table.getColumn(columnId);
      return column ? column.accessor(original, index) : undefined;
    },
    getCells: () => [],
  };

  row.getCells = memo(
    () => [table.getAllColumns()] as const,
    (columns) =>
      columns.map((column) => {
        const getValue = () => column.accessor(original, index);

        return {
          id: `${id}_${column.id}`,
          column,
          row,
          getValue,
          render: () => {
            const cellRenderer = column.columnDef.cell;
            if (cellRenderer) {
              return cellRenderer({ table, row, column, getValue });
            }
            const value = getValue();
            return value === null || value === undefined ? "" : String(value);
          },
        };
      }),
  );

  return row;
}

export function getCoreRowModel<TData>(): RowModelFactory<TData> {
  return (table) =>
    memo(
      () => [table.options.data] as const,
      (data): RowModel<TData> => {
        const rows: Row<TData>[] = [];
        const rowsById: Record<string, Row<TData>> = {};

        for (let index = 0; index < data.length; index++) {
          const original = data[index];
          if (original === undefined) continue;

          const row = createRow(table, original, index);
          rows.push(row);
          rowsById[row.id] = row;
        }

        return { rows, flatRows: rows, rowsById };
      },
    );
}
