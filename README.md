# Headless Table

A data table built from scratch — no TanStack Table, AG Grid or `react-table`. The row-model architecture is borrowed; none of the code is.

| Layer | Path | Knows about |
| --- | --- | --- |
| Core | `src/table-core/` | Types, state, row models. No JSX, CSS, DOM or `next/*`. |
| Styled | `src/components/data-table/` | Markup, tokens, sticky, skeletons. No domain nouns. |
| Product | `src/app/`, `src/features/` | Column defs, seeded data, copy. |

Demo: a fitness studio front desk. `/timetable` is the real page, `/playground` toggles every feature independently.

## Setup

```bash
pnpm install
pnpm dev      # localhost:3000
```

| Command | Does |
| --- | --- |
| `pnpm build` / `pnpm start` | production build / serve it |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | eslint |
| `pnpm check` / `check:fix` | biome format, lint, import order |

Node 20+, pnpm.

## Component API

```tsx
const table = useDataTable({
  data,
  columns,
  getRowId: (row) => row.id,
  getCoreRowModel: coreRowModel,        // required
  getSortedRowModel: sortedRowModel,    // omit → no sort buttons, no aria-sort
  getPaginationRowModel: pageRowModel,  // omit → every row renders
});

<DataTable table={table} caption="Classes" />
<DataTablePagination table={table} />
```

Features are opt-in via row models. Omit one and the feature does not exist — no disabled buttons, no dead affordances. Pipeline: `core → sorted → paginated`, each stage memoised on its own deps, so paging a sorted 10k list does not re-sort.

Pagination is a separate export, not baked in.

### Column definitions

`createColumnHelper<TData>()` infers the value type. Consumers never annotate.

```tsx
const col = createColumnHelper<Session>();

col.accessor("name", { header: "Class", pin: "left", enableSorting: true,
  cell: (info) => info.getValue().toUpperCase() });         // ^? string

col.computed("instructor", (row) => row.instructor.name, {
  header: "Instructor", cell: (info) => info.getValue() });  // ^? string

col.display("actions", { header: "" });                      // no value
```

| Rule | Why |
| --- | --- |
| `accessorKey` is top-level only | No `DeepKeys` recursion. Nested access uses `col.computed` — refactor-safe, survives renames. |
| `Row.getValue()` returns `unknown` | A caller-chosen `getValue<T>()` is an unchecked cast with nicer syntax. Cell contexts carry the real type. |
| One type assertion in the core | `ColumnDefInput` is contravariant in `TValue`, so mixed-value column arrays have no common supertype. The helper infers locally, then erases at the boundary. TanStack uses `any` here; erasure gives the same ergonomics without it. |

`meta` carries styled-layer hints: `numeric` (tabular figures, end-aligned), `priority` (card layout), `headerTooltip`.

### Sorting functions

A column picks the comparator suited to its data — the cheapest one that is still correct.

| Fn | For | Compares by |
| --- | --- | --- |
| `number` | numeric, currency | numeric, `NaN` last — no string coercion |
| `datetime` | dates, ISO strings | epoch ms as integers |
| `alphanumeric` | text | `Intl.Collator`, numeric-aware (`item2` before `item10`) |
| `basic` | booleans, mixed | coerce to a primitive, then compare |
| `auto` (default) | anything | inspects the first non-nullish value, dispatches once per sort |

Collating numbers as strings is slower *and* wrong (`10` before `9`), so numeric columns skip locale handling entirely.

Rules: three-state cycle (none → first → second → none); `sortDescFirst` defaults true for numeric and date; `null`/`undefined` forced last **before** the comparator, so they stay last in both directions; equal keys keep source order; unknown sort ids warn and pass through.

Built-ins compare precomputed values (*n* accessor calls). A custom `sortingFn` receives rows and pays that cost only when used.

> Sorting reads the **accessor value, not the rendered cell**. A cell mapping `one_time` → "Drop-in" still sorts by `one_time`. Pass an explicit comparator where that ordering is meaningless — Level and Status rank semantically.

## Client vs server

One component, both modes. Resolution is per slice:

> A slice is **controlled** if its key exists in `state`; otherwise it lives in the hook's reducer. **Either way `on*Change` fires** — uncontrolled is not silent.

```tsx
useDataTable({
  data: page,
  columns,
  state: { sorting, pagination },
  onSortingChange: setSorting,
  onPaginationChange: setPagination,
  manualSorting: true,
  manualPagination: true,
  rowCount: total,          // required with manualPagination
  getCoreRowModel,
});
```

`manualSorting` / `manualPagination` **short-circuit, not disable**: the model is skipped but `state.sorting`, `aria-sort`, the header cycle and callbacks keep working. That is what lets one component serve both.

Updaters pass through unresolved (`T | ((old: T) => T)`), so the parent applies them against its own current state.

### URL state

`useTableUrlState` keeps sorting and pagination in the query string — `nuqs` ergonomics, no dependency.

```tsx
const url = useTableUrlState({ defaultPageSize: 10 });
// → ?sort=priceGbp.desc&page=3&size=25
```

Defaults omitted, multi-sort comma-separated, sort changes reset to page one. The back button works for free — `useSearchParams` re-renders on history navigation. Requires a `<Suspense>` boundary.

Out-of-range pages are **clamped on the request, not written back**. Writing a correction triggers a navigation, which refetches, which corrects again — an oscillation.

## Expandable rows

Detail panels are heterogeneous — attendees are not classes. Forcing them through the parent's columns means union types and null-padded cells, so the core owns **state and lifecycle**, the consumer owns **rendering**.

```tsx
// inline: children already on the row
<DataTable table={table}
  renderExpanded={(row) => <AttendeeTable attendees={row.original.attendees} />} />

// on-demand: sub carries idle | loading | success | error
<DataTable table={table}
  renderExpanded={(row, sub) => <AsyncAttendeePanel state={sub} />} />
```

| Mode | Setup |
| --- | --- |
| **Inline** | Children already on the row. No fetching. |
| **On-demand** | Pass `loadSubRows`; the core runs the lifecycle and hands `renderExpanded` an `AsyncSubRowsState<TSubData>`. |

`TSubData` is inferred from `loadSubRows`. Without it, `TSubData` is `never` and reading detail data is a compile error.

Lifecycle:

1. First expand → `loading`
2. Success caches by row id — re-expanding never refetches
3. Collapse mid-flight → `abort()`, back to `idle`
4. Failure → `error` with a repeatable `retry()` that reads the **current** loader, not the one it closed over
5. New `data` identity → clear the cache
6. Empty result is **success**, not error

Renders as one `<tr>` with a `<td colSpan>`, animated `grid-template-rows: 0fr → 1fr` — no measurement, no `ResizeObserver`.

## Sticky column

`table-layout: fixed` + a `<colgroup>` from column `size`, so pinned offsets are arithmetic (sum of preceding pinned widths) — no measurement pass.

Offsets are exact exactly when they matter: sticky only shows when the container scrolls, which only happens when columns overflow, which is when the browser honours declared widths.

- Four z-index levels defined in one place; each cell resolves to **one** — emitting competing classes makes the winner depend on CSS source order.
- Pinned cells carry an opaque background and inherit row hover.
- Scroll shadow is a `data-scrolled-x` attribute written by a passive, rAF-throttled listener. **No React state, so scrolling never re-renders.**
- The shadow is drawn *inside* the pinned edge; outside, `overflow: hidden` from truncation clips it.

Responsive: full table ≥1024px; scroll with the pinned column held 640–1023px; `responsive="cards"` below 640px, where `meta.priority` 1 forms the card header, 2 becomes labelled rows, 3 is dropped.

## State management

`useReducer` inside the hook, liftable via controlled props. No Redux, Zustand or Jotai.

Table state is ephemeral view state scoped to one component. A global store re-renders subscribers that do not care on every sort click, and makes the table unusable twice on one page. Local by default, liftable when a page needs it (URL sync), zero dependencies, testable reducers.

`useDataTable` holds **no refs**. A `useState` cache carries memo closures and a stable table object delegating to the current render's instance. Writing `ref.current` during render is unsafe — React may discard a render — and the version that did also served stale `data` from a row model that had captured the first render's table.

## Tradeoffs and assumptions

| Decision | Tradeoff |
| --- | --- |
| No virtualisation | 10k rows sort in **~20ms**, but unpaginated they scroll at **6fps** (120k cells, ~164ms/frame). Large datasets must paginate. `getRowModel().rows` is flat so windowing can drop in later. |
| No test suite | Row models and reducers verified by compiling the core to CJS and driving it under `node` (50 assertions); behaviour verified in a browser. No automated regression net. |
| No `role="grid"` | 2D arrow-key navigation is not implemented, and a grid role without grid semantics is worse than none. |
| Tailwind, not CSS Modules | Every raw value lives in `tokens.css` and reaches components as a semantic utility, so no component holds a hex — but consumers of the styled layer adopt this theme. The core has no styling opinion. |
| Left-pinning only | `pin` is typed `"left" \| false`. Right-pinning needs offsets measured from the right edge. |
| Two pages | Server mode is demonstrated in the playground rather than a dedicated bookings page. |
| Single theme | Tokens are structured for a second palette; none ships. |
| Seeded mock data | No network layer, cache or persistence, apart from injected latency on on-demand children. |

Accessibility assumptions: real `<table>` semantics with a visually hidden `<caption>`; sort buttons label the **next** action and keep focus across re-render; polite live regions for sort changes, fetch status and page range; expand toggles wired with `aria-expanded` / `aria-controls`. Built to spec and checked by hand — not verified with axe.

Non-goals: column resizing, reordering, visibility toggling, grouping, aggregation, row selection, filtering as a table feature, virtualisation, a real backend.
