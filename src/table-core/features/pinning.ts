import type { ColumnDef } from "../types";

const isDev = process.env.NODE_ENV !== "production";

export type PinningLayout = {
  offsets: Record<string, number>;
  lastPinnedId: string | null;
};

export function computePinning<TData>(
  columnDefs: ColumnDef<TData>[],
  defaultSize: number,
): PinningLayout {
  const offsets: Record<string, number> = {};
  let lastPinnedId: string | null = null;
  let running = 0;
  let seenUnpinned = false;
  let warned = false;

  for (const columnDef of columnDefs) {
    if (columnDef.pin !== "left") {
      seenUnpinned = true;
      continue;
    }

    if (seenUnpinned && isDev && !warned) {
      warned = true;
      console.warn(
        `Column "${columnDef.id}" is pinned left but follows an unpinned column. ` +
          "Left-pinned columns must be leading, or their sticky offsets will overlap.",
      );
    }

    offsets[columnDef.id] = running;
    running += columnDef.size ?? defaultSize;
    lastPinnedId = columnDef.id;
  }

  return { offsets, lastPinnedId };
}
