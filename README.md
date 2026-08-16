# Headless Table

A data table built from scratch — no TanStack Table, no AG Grid, no `react-table`. The architecture borrows TanStack's row-model pipeline, but none of its code.

It ships as two layers that can be used independently:

| Layer | Path | Knows about |
| --- | --- | --- |
| Headless core | `src/table-core/` | Row types, column definitions, state, the row-model pipeline. No JSX for UI, no CSS, no DOM, no `next/*`. |
| Styled layer | `src/components/data-table/` | Markup, tokens, sticky behaviour, skeletons, transitions. Knows nothing about classes or attendees. |
| Product | `src/app/`, `src/features/` | Column definitions, seeded data, page composition, copy. |

The demo is a fitness studio's front desk: what's running today, which classes are full, who has walked in.

## Setup

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

```bash
pnpm build        # production build
pnpm start        # serve the production build
pnpm typecheck    # tsc --noEmit
pnpm lint         # eslint
pnpm check        # biome: format, lint, import order
pnpm check:fix    # ...and apply
```

Requires Node 20+ and pnpm.

## Pages

- **`/timetable`** — the real page. Client-side sorting and pagination, inline attendee expansion, day navigation, card layout on phones.
- **`/playground`** — every feature toggled independently: fetch status, row count up to 10,000, sorting on/off, pagination on/off, children none/inline/on-demand, child-fetch failure injection, and a client/server switch. Each toggle maps to *not passing an option*, which is what makes the opt-in architecture visible.

## Defining columns

Columns are built through a helper that infers the value type from the key. Consumers never annotate a type parameter:

```tsx
const col = createColumnHelper<Session>();

const columns = [
  col.accessor("name", {
    header: "Class",
    pin: "left",
    enableSorting: true,
    cell: (info) => info.getValue().toUpperCase(),
    //                    ^? string
  }),
  col.computed("instructor", (row) => row.instructor.name, {
    header: "Instructor",
    cell: (info) => info.getValue(),
    //                    ^? string
  }),
  col.accessor("booked", {
    header: "Attendance",
    meta: { numeric: true, priority: 2 },
    cell: (info) => `${info.getValue()} / ${info.row.original.capacity}`,
    //                      ^? number
  }),
  col.display("actions", { header: "" }),
];
```

`accessorKey` is deliberately **top-level only** — there is no `DeepKeys<TData>` and no `"instructor.name"` string paths. Recursive conditional types over a real domain model produce unreadable errors and hit the instantiation-depth ceiling. Nested access goes through `col.computed`, which is three characters longer, refactor-safe, and survives a rename.

### The one type assertion

`ColumnDefInput` is contravariant in `TValue` because `TValue` sits in the `cell` parameter position. So `ColumnDefInput<Row, string>` is *not* assignable to `ColumnDefInput<Row, unknown>`, and an array of columns with mixed value types has no useful common supertype. This is why TanStack's public type is `ColumnDef<TData, any>` — that `any` is load-bearing.

This codebase erases at the boundary instead. `createColumnHelper` infers `TValue` locally and stores the column with it erased, behind **the single type assertion in `src/table-core/`**. Soundness holds because `TValue` is captured inside the closures the stored object carries; nothing downstream re-reads it.

`Row.getValue(columnId)` returns `unknown` rather than a caller-chosen `getValue<T>()`. The latter looks convenient and is a lie — nothing checks it. Where the type is genuinely knowable, the context carries it: `info.getValue()` inside a cell is fully typed.

## Features are opt-in

The table is assembled from row models. Not passing one means the feature does not exist — no dead affordances, no disabled buttons:

```tsx
const table = useDataTable({
  data,
  columns,
  getRowId: (row) => row.id,
  getCoreRowModel: coreRowModel,        // required
  getSortedRowModel: sortedRowModel,    // omit -> no sort buttons, no aria-sort
  getPaginationRowModel: pageRowModel,  // omit -> every row renders
});
```

With both optional models removed you get a plain table: zero sort buttons, zero `aria-sort` attributes, no pagination nav. Verified in the browser, not assumed.

The pipeline is `core -> sorted -> paginated`, each stage memoised on its own dependencies. Paging a sorted 10,000-row list reuses the cached sorted model rather than re-sorting.

## Client-side vs server-side

The same component covers both. State resolution happens per slice:

> A slice is **controlled** if its key exists in `state`. Otherwise it is **uncontrolled** and lives in the hook's reducer. In **both** cases the `on*Change` callback fires — uncontrolled is not silent.

```tsx
// uncontrolled: the hook owns sorting
useDataTable({ data, columns, getCoreRowModel, getSortedRowModel });

// controlled: the page owns sorting, and can sync it to the URL
useDataTable({
  data,
  columns,
  state: { sorting },
  onSortingChange: setSorting,
  manualSorting: true,   // the sorted model is bypassed
  manualPagination: true,
  rowCount: total,       // required when manualPagination
  getCoreRowModel,
});
```

`manualSorting` and `manualPagination` **short-circuit rather than disable**. The sorted model is skipped, but `state.sorting`, `aria-sort`, the header cycle and `onSortingChange` keep working — which is exactly what lets one component serve both modes.

The playground's **client/server switch** runs this end to end against a mock endpoint that sorts and paginates the full dataset itself and returns only the requested page. It shows a live request counter, so you can confirm a sort click issues exactly one request and that the table renders only what the server sent.

### URL as the source of truth

`useTableUrlState` keeps sorting and pagination in the query string, in the spirit of `nuqs` but with no dependency — just `useSearchParams` and `router.replace`:

```tsx
const url = useTableUrlState({ defaultPageSize: 10 });

useDataTable({
  data: rows,
  columns,
  state: { sorting: url.sorting, pagination: url.pagination },
  onSortingChange: url.setSorting,
  onPaginationChange: url.setPagination,
  manualSorting: true,
  manualPagination: true,
  rowCount: total,
  getCoreRowModel,
});
```

`?sort=priceGbp.desc&page=3&size=25` — multi-sort serialises comma-separated. Parameters at their default are omitted, so a pristine table has a clean URL. Changing the sort returns to page one. Because the URL is the state, the back button works with no extra code: `useSearchParams` re-renders on history navigation and the table follows.

The component using it must sit inside a `<Suspense>` boundary, otherwise `useSearchParams` makes the whole client tree above it render on the client.

**Out-of-range pages are clamped on the request, not written back.** A deep link to `?page=3` on a two-page result renders the last page instead of an empty table. Correcting the URL instead looks tidier and is a trap: the write triggers a navigation, which re-runs the fetch, which can correct again — an oscillation. Clamping the request keeps a single source of truth and settles.

Updaters are passed through unresolved (`T | ((old: T) => T)`), so a parent applies them against its own current state instead of a value read too early.

## Sorting

A column picks the comparator suited to its data, so each dataset is sorted by the cheapest algorithm that is still correct for it:

| `sortingFn` | Use for | How it compares |
| --- | --- | --- |
| `number` | numeric and currency columns | direct numeric comparison, `NaN` last — no string coercion, no locale machinery |
| `datetime` | dates and ISO strings | compares epoch milliseconds as integers |
| `alphanumeric` | human-readable text | `Intl.Collator` with numeric collation, so `item2` precedes `item10` and case and accents fold correctly |
| `basic` | booleans, mixed or unknown shapes | coerces to a comparable primitive, then compares |
| `auto` (default) | anything | inspects the first non-nullish value and dispatches to one of the above, once per sort rather than once per comparison |

The distinction matters at scale. `Intl.Collator` is the correct tool for text and the wrong one for numbers — collating 10,000 numbers as strings is both slower and wrong (`10` would sort before `9`). Picking `number` for a price column skips locale handling entirely. `auto` resolves the choice a single time when the sort begins, so per-comparison cost stays flat.

Any column can override with an explicit comparator when the data has an order the type system cannot infer — see the note on enum columns below.

- Three-state cycle: none → first → second → none. `sortDescFirst` defaults to true for numeric and date columns, false for text, so clicking a money column shows the largest first.
- `null` and `undefined` are forced last **before** the comparator runs, so they stay last in both directions instead of flipping with `desc`.
- Equal keys keep their original order; ties fall back to the source index.
- Unknown sort ids warn and pass data through — never throw.
- Multi-sort is behind `enableMultiSort` (shift-click).

**Built-in comparators compare values; custom ones compare rows.** The built-ins receive precomputed values, so a sort costs *n* accessor calls rather than *n log n*. A consumer-supplied `sortingFn` gets whole rows and pays that cost only when used.

One caveat worth knowing: sorting reads the **accessor value, not the rendered cell**. A column whose cell maps `one_time` to "Drop-in" sorts by `one_time`. Where that ordering would be meaningless, pass an explicit comparator — the Level and Status columns do exactly this, ranking semantically instead of alphabetically.

## Expandable rows

Two shapes exist in the wild. Homogeneous sub-rows (a tree) belong *in* the row model. Heterogeneous detail panels — classes have attendees, a different shape entirely — do not: forcing them through the parent's columns means union types and null-padded cells.

Only the heterogeneous shape is built, because both required modes map onto it:

```tsx
<DataTable
  table={table}
  renderExpanded={(row, sub) => <AttendeeTable attendees={sub.data} />}
/>
```

- **Inline** — children already present on the row. No fetching.
- **On-demand** — pass `loadSubRows`; the core owns the lifecycle and hands `renderExpanded` an `AsyncSubRowsState<TSubData>`.

`TSubData` is inferred from `loadSubRows`, so the panel receives `Attendee[]`, not `unknown`. When `loadSubRows` is absent, `TSubData` is `never` and reading detail data is a compile error.

Lifecycle, all verified in a browser:

1. First expand → `loading`.
2. Success caches by row id; collapse and re-expand is instant, no refetch.
3. Collapse mid-flight aborts the request and returns to `idle`.
4. Failure → `error` with a `retry()` callable repeatedly. **`retry` reads the current loader**, not the one it closed over — otherwise a changed token or filter would silently re-run the stale one.
5. A change of `data` identity clears the whole cache.
6. An empty result is **success with an empty list**, not an error. It renders "No one booked in yet."

The panel is one `<tr>` with a `<td colSpan>`, animated with the `grid-template-rows: 0fr → 1fr` technique — no measurement, no `ResizeObserver`.

## Sticky column

`table-layout: fixed` plus a `<colgroup>` generated from each column's `size`, so pinned offsets are computed arithmetically (sum of preceding pinned widths) with no measurement pass.

The offsets are exact precisely when they matter: sticky positioning only has a visible effect when the container scrolls, and it only scrolls when the columns overflow — which is the case where the browser honours declared widths exactly. When widths are redistributed there is no overflow, so nothing is stuck.

Four z-index levels (`--z-cell` → `--z-header-pinned`) are defined in one place, and each cell resolves to exactly one of them; emitting several competing classes makes the winner depend on CSS source order.

The scroll shadow is a `::after` on the last pinned cell, faded in by a `data-scrolled-x` attribute that a passive, rAF-throttled listener writes directly to the DOM. **No React state is involved, so scrolling never triggers a render.**

The shadow is drawn *inside* the pinned cell's right edge. Positioned outside, it is clipped by the `overflow: hidden` that truncation requires — which showed up as a shadow that appeared on the header and nowhere else.

## Responsive

- **≥1024px** — full table.
- **640–1023px** — horizontal scroll, pinned column held. At 820px the pinned column measures 250px, 30% of the viewport, under the ~40% ceiling where clamping to `minSize` would be needed.
- **<640px** — opt in with `responsive="cards"`. Each row becomes a card: `meta.priority: 1` forms the header, `2` becomes labelled rows, `3` is dropped. Expansion still works inline.

Both layouts are mounted and CSS chooses, so there is no server/client swap on mobile. They therefore cannot share element ids — card panels carry a `-card` suffix so `aria-controls` stays unambiguous.

## State management

Table state is ephemeral view state scoped to one component. A global store would re-render subscribers that do not care on every sort click, and would make the table unusable twice on one page. `useReducer` plus a controlled-prop escape hatch gives local-by-default, liftable when a page needs it, and zero dependencies.

`useDataTable` holds **no refs**. A `useState`-created cache carries the memo closures and a stable table object whose methods delegate to the current render's instance. Writing `ref.current` during render is unsafe — React can discard a render — and the first implementation that did so was also serving stale `data` from a row model that had captured the first render's table.

## Accessibility

- Real `<table>`/`<thead>`/`<tbody>`/`<th scope="col">`, with a visually hidden `<caption>`.
- **No `role="grid"`.** Full 2D arrow-key navigation is not implemented, and a grid role without grid semantics is worse than no role.
- Sortable headers are buttons filling the `<th>`; `aria-sort` tracks direction and the button label states the **next** action ("Sort by Instructor, ascending"). Focus stays on the button across the re-render.
- Two polite live regions: fetch status, and sort changes ("Sorted by Class, ascending").
- Expand toggles carry `aria-expanded` and `aria-controls` with domain labels ("Show attendees for Vinyasa Flow, Mon 17 Aug").
- Pagination sits in `<nav aria-label="Pagination">` with the range in a live region.
- Focus rings are never removed; disabled controls get `not-allowed` rather than a pointer that promises nothing.

Sorting and pagination were both driven keyboard-only during development.

## Performance

Measured in a **production build** (`pnpm build && pnpm start`), Chrome on an Apple Silicon Mac, 10,000 seeded rows across 12 columns.

| Scenario | Result |
| --- | --- |
| Sort click → painted, text column | **24ms** first, **21ms** repeat |
| Sort click → painted, numeric column | **15ms** |
| Scroll, paginated (10 rows in DOM) | **120fps**, 0 frames over 16.7ms, p95 9ms |
| Mount 10,000 rows unpaginated | **1507ms** (120,000 cells) |
| Scroll, 10,000 rows unpaginated | **6fps**, avg frame 164ms, every frame over budget |

Sorting comfortably beats the 100ms target, because it happens on a precomputed value array and an index sort rather than repeated accessor calls.

**The unpaginated 10,000-row case does not scroll at 60fps, and cannot without virtualisation.** Putting 120,000 cells in the DOM costs ~164ms per frame in style and layout — no amount of memoisation fixes that, because the work is the browser's, not React's. `getRowModel().rows` is a flat array specifically so a windowing layer could be dropped into `DataTableBody` later. Until then, large datasets must be paginated, which is the realistic usage and is smooth.

## Non-goals

Deliberately not built: column resizing, reordering or visibility toggling; grouping and aggregation; row selection (nothing here acts on a selection, so checkboxes would be decoration); filtering as a table feature (the boundary is honest — filters belong outside and feed the request); virtualisation; a real backend or auth.

