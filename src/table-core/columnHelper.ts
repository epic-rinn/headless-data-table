import type {
  AccessorKey,
  ColumnDef,
  ColumnDefBody,
  ColumnDefInput,
  DisplayColumnBody,
} from "./types";

function erase<TData, TValue>(
  definition: ColumnDefInput<TData, TValue> & { id: string },
): ColumnDef<TData> {
  return definition as ColumnDef<TData>;
}

export function createColumnHelper<TData>() {
  return {
    accessor<K extends AccessorKey<TData>>(
      key: K,
      def: ColumnDefBody<TData, TData[K]>,
    ): ColumnDef<TData> {
      return erase<TData, TData[K]>({ ...def, id: key, accessorKey: key });
    },

    computed<TValue>(
      id: string,
      accessorFn: (row: TData, index: number) => TValue,
      def: ColumnDefBody<TData, TValue>,
    ): ColumnDef<TData> {
      return erase<TData, TValue>({ ...def, id, accessorFn });
    },

    display(id: string, def: DisplayColumnBody<TData>): ColumnDef<TData> {
      return erase<TData, undefined>({ ...def, id });
    },
  };
}
