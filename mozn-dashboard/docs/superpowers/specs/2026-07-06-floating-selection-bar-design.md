# Floating Selection Bar — Design

**Date:** 2026-07-06
**Status:** Approved

## Problem

When rows are selected in a data table, each of the 6 table views renders a flat,
edge-to-edge tinted band (`bg-brand-subtle`, `border-b`) with the selected count
pinned to one edge and a Clear button to the other, leaving dead space between.
The markup is duplicated (with minor variations) across all 6 views. It reads as
flat and unintentional, especially in dark mode.

## Solution

Replace the duplicated inline band with a single shared **inline selection
toolbar** component (a refined strip inside the table card — not floating).

### Component

`web/components/data-table/selection-bar.tsx`

```tsx
<SelectionBar count={selected.size} onClear={() => setSelected(new Set())}>
  {/* optional bulk-action buttons */}
</SelectionBar>
```

- **Props:** `count: number`, `onClear: () => void`, `children?: ReactNode`
  (bulk actions), `className?: string`.
- Returns `null` when `count === 0` — call sites drop their `selected.size > 0 ?`
  guard and always render the component.

### Visual treatment

- **Inline strip** inside the table card, between the toolbar and the header
  row (in the layout flow — not floating/fixed).
- Tinted brand surface (`bg-brand-subtle`) with a bottom border (`border-b
  border-border`) so it reads as a contextual selection state.
- Internal layout (grouped, no dead space):
  `[brand count chip (N)]  [N selected]  [ ...actions ]      [Clear ✕ →]`
  The count chip + label group on the leading edge; `children` (bulk actions)
  follow; Clear is pinned to the trailing edge (`ms-auto`).
- **Motion:** `animate-in fade-in slide-in-from-top-1`, gated by
  `motion-reduce:animate-none`.
- **RTL:** logical properties throughout (`ms/me`, `start/end`) so it mirrors for
  Arabic.
- **A11y:** `role="status"` + `aria-live="polite"` announces the count; Clear
  keeps its existing `common.clear` label + X icon.

### Rollout

Swap the inline bar for `<SelectionBar>` in all 6 views:

1. `features/activity/components/activity-log-view.tsx` — count + Clear
2. `features/alert-inbox/components/alert-inbox-view.tsx` — count + Clear
3. `features/history/components/alert-history-view.tsx` — count + Clear
4. `features/alert-management/components/alert-management-view.tsx` — count + Clear
5. `features/users/components/users-table.tsx` — count + Clear
6. `features/stations/components/stations-table.tsx` — count + Clear +
   Maintenance / Export as `children` (keeps the `!readOnly` guard on the wrapper)

## Non-goals

- No change to selection logic, checkboxes, or bulk-action behavior.
- No change to the i18n keys (`common.selected`, `common.clear`).
