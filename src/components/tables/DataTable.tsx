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
          <div className="w-full sm:max-w-xs">
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
          "overflow-x-auto rounded-xl border border-[#E2E8F0] bg-white shadow-sm dark:border-border dark:bg-card",
          stickyHeader && "max-h-[min(70vh,720px)] overflow-y-auto"
        )}
      >
        <table className="w-full" style={{ minWidth: minTableWidth }}>
          <thead className={cn(stickyHeader && "sticky top-0 z-10")}>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className="border-b border-[#E2E8F0] bg-[#F1F5F9] dark:border-border dark:bg-muted/40"
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
                        "px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-[#334155] select-none dark:text-foreground",
                        getAlignClass(align),
                        header.column.getCanSort() &&
                          "cursor-pointer hover:text-[#0F172A]"
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
                <tr key={i} className="border-b border-[#E2E8F0] dark:border-border">
                  {columns.map((_, j) => (
                    <td key={j} className="px-4 py-3.5">
                      <div className="h-4 animate-pulse rounded bg-[#E2E8F0] dark:bg-border" />
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
                  <p className="text-sm font-medium">No data found</p>
                  <p className="mt-1 text-xs">
                    Try adjusting your search criteria
                  </p>
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={cn(
                    "border-b border-[#E2E8F0] bg-white last:border-0 transition-colors dark:border-border dark:bg-card",
                    "hover:bg-[#EEF2FF]/70 dark:hover:bg-primary/5"
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
                          "px-4 py-3.5 text-sm text-[#0F172A] align-middle dark:text-foreground",
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
        <p className="text-sm text-[#64748B] dark:text-muted">
          Showing {range.from} to {range.to} of {range.total} entries
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="!h-8 !rounded-md"
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
                "flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-xs font-semibold transition-colors",
                pageIndex === i
                  ? "bg-[#4318FF] text-white shadow-sm"
                  : "border border-[#E2E8F0] bg-white text-[#334155] hover:bg-[#F1F5F9] dark:border-border dark:bg-card dark:text-foreground"
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
            className="!h-8 !rounded-md"
          >
            <HiChevronRight className="h-4 w-4" />
          </Button>

          {pageSizeOptions?.length && onPageSizeChange ? (
            <label className="ml-1 flex items-center gap-2 text-sm text-[#64748B]">
              <select
                className="rounded-md border border-[#E2E8F0] bg-white px-2 py-1.5 text-sm text-[#0F172A] outline-none focus:border-[#4318FF] dark:border-border dark:bg-card dark:text-foreground"
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
