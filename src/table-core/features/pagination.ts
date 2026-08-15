export function getPageCount(rowCount: number, pageSize: number): number {
  if (pageSize <= 0 || rowCount <= 0) return 0;
  return Math.ceil(rowCount / pageSize);
}

export function clampPageIndex(pageIndex: number, pageCount: number): number {
  if (!Number.isFinite(pageIndex) || pageIndex < 0) return 0;
  if (pageCount <= 0) return 0;
  return Math.min(Math.floor(pageIndex), pageCount - 1);
}

export function getPageSlice(
  pageIndex: number,
  pageSize: number,
): { start: number; end: number } {
  const start = pageIndex * pageSize;
  return { start, end: start + pageSize };
}

export function getDisplayRange(
  pageIndex: number,
  pageSize: number,
  rowCount: number,
): { start: number; end: number; total: number } {
  if (rowCount <= 0 || pageSize <= 0) {
    return { start: 0, end: 0, total: rowCount };
  }
  const start = pageIndex * pageSize + 1;
  const end = Math.min((pageIndex + 1) * pageSize, rowCount);
  return { start: Math.min(start, rowCount), end, total: rowCount };
}

export function pageIndexForNewPageSize(
  pageIndex: number,
  oldPageSize: number,
  newPageSize: number,
): number {
  if (newPageSize <= 0 || oldPageSize <= 0) return 0;
  const firstVisibleRow = pageIndex * oldPageSize;
  return Math.floor(firstVisibleRow / newPageSize);
}
