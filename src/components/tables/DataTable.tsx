"use client";

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  OnChangeFn,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import { HiChevronLeft, HiChevronRight, HiSearch } from "react-icons/hi";

type ColumnAlign = "left" | "center" | "right";

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T, unknown>[];
  searchPlaceholder?: string;
  onSearch?: (value: string) => void;
  searchValue?: string;
  isLoading?: boolean;
  pageSize?: number;
  hideSearch?: boolean;
  manualPagination?: boolean;
  pageCount?: number;
  pageIndex?: number;
  onPageChange?: (pageIndex: number) => void;
  pageSizeOptions?: number[];
  onPageSizeChange?: (pageSize: number) => void;
  /** Total records across all pages (for "Showing X to Y of Z") */
  totalRows?: number;
  manualSorting?: boolean;
  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;
  /** `report` = Wallet Credit History style (default). `network` kept for compatibility. */
  tone?: "default" | "network" | "report";
  stickyHeader?: boolean;
  minTableWidth?: number;
}

function getAlignClass(align?: ColumnAlign): string {
  if (align === "right") return "text-right";
  if (align === "center") return "text-center";
  return "text-left";
}

export function DataTable<T>({
  data,
  columns,
  searchPlaceholder = "Search...",
  onSearch,
  searchValue,
  isLoading,
  pageSize = 10,
  hideSearch = false,
  manualPagination = false,
  pageCount: controlledPageCount,
  pageIndex: controlledPageIndex,
  onPageChange,
  pageSizeOptions,
  onPageSizeChange,
  totalRows,
  manualSorting = false,
  sorting: controlledSorting,
  onSortingChange,
  tone: _tone = "report",
  stickyHeader = false,
  minTableWidth = 720,
}: DataTableProps<T>) {
  void _tone;
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [internalPageIndex, setInternalPageIndex] = useState(0);

  const pageIndex = manualPagination
    ? (controlledPageIndex ?? 0)
    : internalPageIndex;
  const pageCount = manualPagination ? (controlledPageCount ?? 1) : undefined;
  const activeSorting = manualSorting ? (controlledSorting ?? []) : sorting;

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting: activeSorting,
      globalFilter: searchValue ?? globalFilter,
      pagination: { pageIndex, pageSize },
    },
    onSortingChange: manualSorting
      ? (onSortingChange ?? setSorting)
      : setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: manualSorting ? undefined : getSortedRowModel(),
    getFilteredRowModel: manualPagination ? undefined : getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination,
    manualSorting,
    pageCount,
    onPaginationChange: manualPagination
      ? (updater) => {
          const next =
            typeof updater === "function"
              ? updater({ pageIndex, pageSize })
              : updater;
          onPageChange?.(next.pageIndex);
        }
      : (updater) => {
          const next =
            typeof updater === "function"
              ? updater({ pageIndex: internalPageIndex, pageSize })
              : updater;
          setInternalPageIndex(next.pageIndex);
        },
  });

  const handleSearch = (value: string) => {
    setGlobalFilter(value);
    onSearch?.(value);
  };

  const filteredCount = manualPagination
    ? (totalRows ?? data.length)
    : table.getFilteredRowModel().rows.length;

  const range = useMemo(() => {
    if (!filteredCount) return { from: 0, to: 0, total: 0 };
    const from = pageIndex * pageSize + 1;
    const to = Math.min(
      (pageIndex + 1) * pageSize,
      manualPagination ? filteredCount : filteredCount
    );
    return { from, to: Math.min(to, filteredCount), total: filteredCount };
  }, [filteredCount, pageIndex, pageSize, manualPagination]);

  const totalPages = Math.max(1, table.getPageCount() || 1);
  const pageButtons = useMemo(() => {
    const maxButtons = 5;
    if (totalPages <= maxButtons) {
      return Array.from({ length: totalPages }, (_, i) => i);
    }
    const start = Math.max(
      0,
      Math.min(pageIndex - 2, totalPages - maxButtons)
    );
    return Array.from({ length: maxButtons }, (_, i) => start + i);
  }, [pageIndex, totalPages]);

  return (
    <div className="space-y-4">
      {!hideSearch && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="w-full sm:max-w-md">
            <Input
              placeholder={searchPlaceholder}
              icon={<HiSearch className="h-4 w-4" />}
              value={searchValue ?? globalFilter}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
        </div>
      )}

      <div
        className={cn(
          "overflow-x-auto rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_rgba(15,23,42,0.04)] dark:border-border dark:bg-card",
          stickyHeader && "max-h-[min(70vh,720px)] overflow-y-auto"
        )}
      >
        <table className="w-full border-collapse" style={{ minWidth: minTableWidth }}>
          <thead className={cn(stickyHeader && "sticky top-0 z-20")}>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className="border-b border-slate-200 bg-slate-800 shadow-[inset_0_-1px_0_rgba(15,23,42,0.08)] dark:border-border dark:bg-slate-900"
              >
                {headerGroup.headers.map((header) => {
                  const align = (
                    header.column.columnDef.meta as
                      | { align?: ColumnAlign }
                      | undefined
                  )?.align;
                  return (
                    <th
                      key={header.id}
                      className={cn(
                        "px-4 py-3.5 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-100 select-none",
                        getAlignClass(align),
                        header.column.getCanSort() &&
                          "cursor-pointer hover:text-white"
                      )}
                      style={{
                        width: header.column.getSize()
                          ? `${header.column.getSize()}px`
                          : undefined,
                      }}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <span
                        className={cn(
                          "inline-flex items-center gap-1",
                          align === "right" && "w-full justify-end",
                          align === "center" && "w-full justify-center"
                        )}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {header.column.getIsSorted() === "asc" && " ↑"}
                        {header.column.getIsSorted() === "desc" && " ↓"}
                      </span>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr
                  key={i}
                  className={cn(
                    "border-b border-slate-100 dark:border-border",
                    i % 2 === 1 && "bg-slate-50/80 dark:bg-muted/20"
                  )}
                >
                  {columns.map((_, j) => (
                    <td key={j} className="px-4 py-4">
                      <div className="h-4 animate-pulse rounded bg-slate-200/80 dark:bg-border" />
                    </td>
                  ))}
                </tr>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-16 text-center text-muted"
                >
                  <p className="text-sm font-medium text-slate-700 dark:text-foreground">
                    No data found
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Try adjusting your search criteria
                  </p>
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row, rowIndex) => (
                <tr
                  key={row.id}
                  className={cn(
                    "border-b border-slate-100 transition-colors duration-150 last:border-b-0 dark:border-border",
                    rowIndex % 2 === 0
                      ? "bg-white dark:bg-card"
                      : "bg-slate-50/90 dark:bg-muted/15",
                    "hover:bg-sky-50/70 dark:hover:bg-primary/5"
                  )}
                >
                  {row.getVisibleCells().map((cell) => {
                    const align = (
                      cell.column.columnDef.meta as
                        | { align?: ColumnAlign }
                        | undefined
                    )?.align;
                    return (
                      <td
                        key={cell.id}
                        className={cn(
                          "px-4 py-4 text-sm text-slate-900 align-middle dark:text-foreground",
                          "min-h-[68px]",
                          getAlignClass(align)
                        )}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500 dark:text-muted">
          Showing {range.from} to {range.to} of {range.total} entries
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="!h-8 !rounded-lg"
          >
            <HiChevronLeft className="h-4 w-4" />
          </Button>

          {pageButtons.map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                if (manualPagination) onPageChange?.(i);
                else table.setPageIndex(i);
              }}
              className={cn(
                "flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-semibold transition-colors duration-150",
                pageIndex === i
                  ? "bg-slate-800 text-white shadow-sm dark:bg-primary"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-border dark:bg-card dark:text-foreground"
              )}
            >
              {i + 1}
            </button>
          ))}

          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="!h-8 !rounded-lg"
          >
            <HiChevronRight className="h-4 w-4" />
          </Button>

          {pageSizeOptions?.length && onPageSizeChange ? (
            <label className="ml-1 flex items-center gap-2 text-sm text-slate-500">
              <select
                className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900 outline-none focus:border-slate-400 dark:border-border dark:bg-card dark:text-foreground"
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
              >
                {pageSizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size} / page
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </div>
      </div>
    </div>
  );
}
