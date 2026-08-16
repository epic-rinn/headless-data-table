import type { AsyncSubRowsState, ExpandedState } from "../types";

export const IDLE: AsyncSubRowsState<never> = { status: "idle" };

export function toggleExpandedState(
  expanded: ExpandedState,
  rowId: string,
): ExpandedState {
  const next = { ...expanded };
  if (next[rowId]) {
    delete next[rowId];
  } else {
    next[rowId] = true;
  }
  return next;
}

export function expandedIds(expanded: ExpandedState): string[] {
  return Object.keys(expanded).filter((id) => expanded[id] === true);
}

export type SubRowsStore<TSubData> = {
  states: Map<string, AsyncSubRowsState<TSubData>>;
  controllers: Map<string, AbortController>;
  /** Identity of the `data` array the cache was built against (rule 5). */
  dataSource: unknown;
};

export function createSubRowsStore<TSubData>(): SubRowsStore<TSubData> {
  return { states: new Map(), controllers: new Map(), dataSource: null };
}

export function abortRow<TSubData>(
  store: SubRowsStore<TSubData>,
  rowId: string,
): void {
  const controller = store.controllers.get(rowId);
  if (!controller) return;
  controller.abort();
  store.controllers.delete(rowId);
  store.states.delete(rowId);
}

export function clearStore<TSubData>(store: SubRowsStore<TSubData>): void {
  for (const controller of store.controllers.values()) controller.abort();
  store.controllers.clear();
  store.states.clear();
}

export function syncDataSource<TSubData>(
  store: SubRowsStore<TSubData>,
  data: unknown,
): boolean {
  if (store.dataSource === data) return false;
  if (store.dataSource !== null) clearStore(store);
  store.dataSource = data;
  return true;
}
