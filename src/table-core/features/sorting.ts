import type {
  ColumnDef,
  ColumnSort,
  SortDirection,
  SortingFnName,
  SortingState,
  ValueSortingFn,
} from "../types";

const collator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
});

export function isNullish(value: unknown): boolean {
  return value === null || value === undefined;
}

function toComparable(value: unknown): number | string | null {
  if (typeof value === "number") {
    return Number.isNaN(value) ? null : value;
  }
  if (typeof value === "string") return value;
  if (typeof value === "boolean") return value ? 1 : 0;
  if (typeof value === "bigint") return Number(value);
  if (value instanceof Date) {
    const time = value.getTime();
    return Number.isNaN(time) ? null : time;
  }
  return null;
}

function compareNumbers(a: number, b: number): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

const alphanumeric: ValueSortingFn = (a, b) =>
  collator.compare(String(a), String(b));

const number: ValueSortingFn = (a, b) => {
  const left = Number(a);
  const right = Number(b);
  const leftNaN = Number.isNaN(left);
  const rightNaN = Number.isNaN(right);
  if (leftNaN && rightNaN) return 0;
  if (leftNaN) return 1;
  if (rightNaN) return -1;
  return compareNumbers(left, right);
};

const datetime: ValueSortingFn = (a, b) => {
  const left = a instanceof Date ? a.getTime() : Number(new Date(String(a)));
  const right = b instanceof Date ? b.getTime() : Number(new Date(String(b)));
  const leftNaN = Number.isNaN(left);
  const rightNaN = Number.isNaN(right);
  if (leftNaN && rightNaN) return 0;
  if (leftNaN) return 1;
  if (rightNaN) return -1;
  return compareNumbers(left, right);
};

const basic: ValueSortingFn = (a, b) => {
  const left = toComparable(a);
  const right = toComparable(b);
  if (left === null && right === null) return 0;
  if (left === null) return 1;
  if (right === null) return -1;
  if (typeof left === "number" && typeof right === "number") {
    return compareNumbers(left, right);
  }
  return collator.compare(String(left), String(right));
};

const auto: ValueSortingFn = (a, b) => {
  const sample = isNullish(a) ? b : a;
  if (typeof sample === "number" || typeof sample === "bigint") {
    return number(a, b);
  }
  if (sample instanceof Date) return datetime(a, b);
  if (typeof sample === "string") return alphanumeric(a, b);
  return basic(a, b);
};

export const sortingFns: Record<SortingFnName, ValueSortingFn> = {
  auto,
  alphanumeric,
  basic,
  datetime,
  number,
};

function inferSortingFnName(sample: unknown): SortingFnName {
  if (typeof sample === "number" || typeof sample === "bigint") return "number";
  if (sample instanceof Date) return "datetime";
  if (typeof sample === "string") return "alphanumeric";
  return "basic";
}

export function resolveSortingFnName<TData>(
  columnDef: ColumnDef<TData>,
  sample: unknown,
): SortingFnName {
  const configured = columnDef.sortingFn;
  if (typeof configured === "string" && configured !== "auto") {
    return configured;
  }
  return inferSortingFnName(sample);
}

export function resolveSortDescFirst<TData>(
  columnDef: ColumnDef<TData>,
  sample: unknown,
): boolean {
  if (columnDef.sortDescFirst !== undefined) return columnDef.sortDescFirst;
  const name = resolveSortingFnName(columnDef, sample);
  return name === "number" || name === "datetime";
}

export function nextSortingOrder(
  current: SortDirection | false,
  descFirst: boolean,
  allowRemoval: boolean,
): SortDirection | false {
  const first: SortDirection = descFirst ? "desc" : "asc";
  const second: SortDirection = descFirst ? "asc" : "desc";

  if (current === false) return first;
  if (current === first) return second;
  return allowRemoval ? false : first;
}

export function directionOf(
  sorting: SortingState,
  id: string,
): SortDirection | false {
  const entry = sorting.find((sort) => sort.id === id);
  if (!entry) return false;
  return entry.desc ? "desc" : "asc";
}

export function toggleSortingState(
  sorting: SortingState,
  id: string,
  options: {
    desc?: boolean;
    multi: boolean;
    descFirst: boolean;
    allowRemoval: boolean;
  },
): SortingState {
  const current = directionOf(sorting, id);
  const next =
    options.desc === undefined
      ? nextSortingOrder(current, options.descFirst, options.allowRemoval)
      : options.desc
        ? "desc"
        : "asc";

  if (next === false) {
    return options.multi ? sorting.filter((sort) => sort.id !== id) : [];
  }

  const entry: ColumnSort = { id, desc: next === "desc" };
  if (!options.multi) return [entry];

  return sorting.some((sort) => sort.id === id)
    ? sorting.map((sort) => (sort.id === id ? entry : sort))
    : [...sorting, entry];
}
