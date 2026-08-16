import type { ColumnDef } from "../types";

const isDev = process.env.NODE_ENV !== "production";

export function resolveAccessor<TData>(
  columnDef: ColumnDef<TData>,
): (row: TData, index: number) => unknown {
  const { accessorFn, accessorKey } = columnDef;

  if (accessorFn) return accessorFn;
  if (accessorKey !== undefined) {
    return (row: TData) => row[accessorKey];
  }
  return () => undefined;
}

export function assertColumnId<TData>(
  columnDef: ColumnDef<TData>,
  index: number,
): string {
  const id = columnDef.id ?? columnDef.accessorKey;

  if (!id) {
    throw new Error(
      `Column at index ${index} has no id. Give it an \`id\`, or use \`accessorKey\`. ` +
        `A column defined only by \`accessorFn\` must name itself.`,
    );
  }

  return id;
}

export function dedupeColumns<TData>(
  columnDefs: ColumnDef<TData>[],
): ColumnDef<TData>[] {
  const seen = new Set<string>();
  const result: ColumnDef<TData>[] = [];

  for (let index = 0; index < columnDefs.length; index++) {
    const columnDef = columnDefs[index];
    if (!columnDef) continue;

    const id = assertColumnId(columnDef, index);

    if (seen.has(id)) {
      const message = `Duplicate column id "${id}" at index ${index}.`;
      if (isDev) throw new Error(message);
      console.warn(`${message} The later column was dropped.`);
      continue;
    }

    seen.add(id);
    result.push(columnDef);
  }

  return result;
}
