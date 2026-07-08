import * as React from "react";

export interface Pagination<T> {
  pageSize: number;
  setPageSize: React.Dispatch<React.SetStateAction<number>>;
  pageIndex: number;
  setPageIndex: React.Dispatch<React.SetStateAction<number>>;
  /** Total pages for the current items/pageSize (never below 1). */
  pageCount: number;
  /** pageIndex clamped into [1, pageCount] so an out-of-range index can't blank the table. */
  safePage: number;
  /** The slice of items for the current page. */
  pageRows: T[];
}

/**
 * Client-side pagination over an in-memory list. Owns page-size and page-index
 * state and derives the clamped current page plus its slice.
 *
 * Callers reset the page to 1 on their own filter/sort changes — the trigger set
 * is caller-specific — e.g. `useEffect(() => setPageIndex(1), [query, sort])`.
 */
export function usePagination<T>(items: T[], initialPageSize = 10): Pagination<T> {
  const [pageSize, setPageSize] = React.useState(initialPageSize);
  const [pageIndex, setPageIndex] = React.useState(1);

  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(pageIndex, pageCount);
  const pageRows = items.slice((safePage - 1) * pageSize, safePage * pageSize);

  return { pageSize, setPageSize, pageIndex, setPageIndex, pageCount, safePage, pageRows };
}
