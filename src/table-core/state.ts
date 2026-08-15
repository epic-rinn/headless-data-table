import type {
  ExpandedState,
  PaginationState,
  SortingState,
  TableState,
  Updater,
} from "./types";

export const DEFAULT_PAGE_SIZE = 10;

function isUpdaterFn<T>(updater: Updater<T>): updater is (old: T) => T {
  return typeof updater === "function";
}

export function applyUpdater<T>(updater: Updater<T>, old: T): T {
  return isUpdaterFn(updater) ? updater(old) : updater;
}

export function createInitialState(
  initialState?: Partial<TableState>,
): TableState {
  return {
    sorting: initialState?.sorting ?? [],
    pagination: initialState?.pagination ?? {
      pageIndex: 0,
      pageSize: DEFAULT_PAGE_SIZE,
    },
    expanded: initialState?.expanded ?? {},
  };
}

export type StateAction =
  | { slice: "sorting"; updater: Updater<SortingState> }
  | { slice: "pagination"; updater: Updater<PaginationState> }
  | { slice: "expanded"; updater: Updater<ExpandedState> };

export function tableStateReducer(
  state: TableState,
  action: StateAction,
): TableState {
  switch (action.slice) {
    case "sorting": {
      const sorting = applyUpdater(action.updater, state.sorting);
      return sorting === state.sorting ? state : { ...state, sorting };
    }
    case "pagination": {
      const pagination = applyUpdater(action.updater, state.pagination);
      return pagination === state.pagination ? state : { ...state, pagination };
    }
    case "expanded": {
      const expanded = applyUpdater(action.updater, state.expanded);
      return expanded === state.expanded ? state : { ...state, expanded };
    }
  }
}

export function resolveState(
  internal: TableState,
  controlled?: Partial<TableState>,
): TableState {
  if (!controlled) return internal;

  return {
    sorting:
      "sorting" in controlled
        ? (controlled.sorting ?? internal.sorting)
        : internal.sorting,
    pagination:
      "pagination" in controlled
        ? (controlled.pagination ?? internal.pagination)
        : internal.pagination,
    expanded:
      "expanded" in controlled
        ? (controlled.expanded ?? internal.expanded)
        : internal.expanded,
  };
}

export function isSliceControlled(
  slice: keyof TableState,
  controlled?: Partial<TableState>,
): boolean {
  return controlled !== undefined && slice in controlled;
}
