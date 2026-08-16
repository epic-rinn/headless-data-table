import type { Session } from "./seed";

export type ListParams = {
  page: number;
  pageSize: number;
  sort: { id: string; desc: boolean }[];
};

export type ListResult = {
  data: Session[];
  total: number;
  page: number;
  pageSize: number;
};

const VALUES: Record<string, (row: Session) => string | number> = {
  name: (row) => row.name,
  instructor: (row) => row.instructor.name,
  startsAt: (row) => new Date(row.startsAt).getTime(),
  endsAt: (row) => new Date(row.startsAt).getTime() + row.durationMin * 60000,
  booked: (row) => row.booked,
  waitlisted: (row) => row.waitlisted,
  checkedIn: (row) => row.checkedIn,
  durationMin: (row) => row.durationMin,
  equipment: (row) => row.equipment,
  priceGbp: (row) => row.priceGbp,
  level: (row) =>
    ["all", "beginner", "intermediate", "advanced"].indexOf(row.level),
  status: (row) => ["scheduled", "full", "cancelled"].indexOf(row.status),
};

const collator = new Intl.Collator(undefined, { numeric: true });

function compare(a: string | number, b: string | number): number {
  if (typeof a === "number" && typeof b === "number") {
    return a < b ? -1 : a > b ? 1 : 0;
  }
  return collator.compare(String(a), String(b));
}

export function listSessions(
  all: Session[],
  params: ListParams,
  signal?: AbortSignal,
): Promise<ListResult> {
  return new Promise((resolve, reject) => {
    const latency = 350 + Math.random() * 400;

    const timer = setTimeout(() => {
      const rows = [...all];

      for (let i = params.sort.length - 1; i >= 0; i--) {
        const entry = params.sort[i];
        if (!entry) continue;
        const read = VALUES[entry.id];
        if (!read) continue;
        rows.sort((a, b) => {
          const result = compare(read(a), read(b));
          return entry.desc ? -result : result;
        });
      }

      const pageCount = Math.max(
        1,
        Math.ceil(all.length / Math.max(1, params.pageSize)),
      );
      const page = Math.min(Math.max(0, params.page), pageCount - 1);
      const start = page * params.pageSize;

      resolve({
        data: rows.slice(start, start + params.pageSize),
        total: all.length,
        page,
        pageSize: params.pageSize,
      });
    }, latency);

    signal?.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(new Error("aborted"));
    });
  });
}
