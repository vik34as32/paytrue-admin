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
import { useState } from "react";
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
  manualSorting?: boolean;
  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;
  /** Attractive striped header + hover for network user lists */
  tone?: "default" | "network";
  stickyHeader?: boolean;
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
  manualSorting = false,
  sorting: controlledSorting,
  onSortingChange,
  tone = "default",
  stickyHeader = false,
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [internalPageIndex, setInternalPageIndex] = useState(0);
  const isNetworkTone = tone === "network";

  const pageIndex = manualPagination
    ? (controlledPageIndex ?? 0)
    : internalPageIndex;
  const pageCount = manualPagination ? (controlledPageCount ?? 1) : undefined;
  const activeSorting = manualSorting
    ? (controlledSorting ?? [])
    : sorting;

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
          <p className="text-sm text-muted">
            {manualPagination
              ? `${data.length} results`
              : `${table.getFilteredRowModel().rows.length} results`}
          </p>
        </div>
      )}

      <div
        className={cn(
          "overflow-x-auto rounded-xl border border-border",
          isNetworkTone && "network-data-table shadow-sm",
          stickyHeader && "max-h-[min(70vh,720px)] overflow-y-auto"
        )}
      >
        <table className="w-full min-w-[720px]">
          <thead className={cn(stickyHeader && "sticky top-0 z-10")}>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className={cn(
                  "border-b border-border",
                  isNetworkTone
                    ? "bg-gradient-to-r from-[#4318FF] via-[#5B33FF] to-[#7551FF]"
                    : "bg-background/80"
                )}
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
                        "px-4 py-3.5 text-[11px] font-semibold uppercase tracking-wider select-none transition-colors",
                        getAlignClass(align),
                        header.column.getCanSort() && "cursor-pointer",
                        isNetworkTone
                          ? "text-white/95 hover:text-white"
                          : "text-muted hover:text-foreground"
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
                          align === "right" && "justify-end w-full",
                          align === "center" && "justify-center w-full"
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
                <tr key={i} className="border-b border-border">
                  {columns.map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 animate-pulse rounded bg-border" />
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
              table.getRowModel().rows.map((row, i) => (
                <tr
                  key={row.id}
                  className={cn(
                    "border-b border-border last:border-0 transition-all duration-200",
                    isNetworkTone
                      ? cn(
                          "network-data-row",
                          i % 2 === 0
                            ? "bg-white dark:bg-card"
                            : "bg-[#F4F7FE]/80 dark:bg-white/[0.03]",
                          "hover:bg-gradient-to-r hover:from-[#4318FF]/[0.08] hover:via-[#7551FF]/[0.06] hover:to-transparent hover:shadow-[inset_3px_0_0_0_#4318FF] hover:scale-[1.002]"
                        )
                      : cn(
                          "hover:bg-primary/[0.03]",
                          i % 2 === 0 && "bg-background/20"
                        )
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
                          "px-4 py-3.5 text-sm text-foreground align-middle",
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

      <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-muted">
            Showing page {pageIndex + 1} of {table.getPageCount() || 1}
          </p>
          {pageSizeOptions?.length && onPageSizeChange ? (
            <label className="flex items-center gap-2 text-sm text-muted">
              Show
              <select
                className="rounded-lg border border-border bg-card px-2 py-1.5 text-sm text-foreground outline-none focus:border-primary"
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
              >
                {pageSizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
              records
            </label>
          ) : null}
          {manualPagination && onPageChange ? (
            <label className="flex items-center gap-2 text-sm text-muted">
              Go to
              <input
                type="number"
                min={1}
                max={Math.max(1, table.getPageCount())}
                className="w-16 rounded-lg border border-border bg-card px-2 py-1.5 text-sm text-foreground outline-none focus:border-primary"
                placeholder={`${pageIndex + 1}`}
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  const value = Number((e.target as HTMLInputElement).value);
                  if (!Number.isFinite(value)) return;
                  const next = Math.min(
                    Math.max(1, Math.floor(value)),
                    Math.max(1, table.getPageCount())
                  );
                  onPageChange(next - 1);
                  (e.target as HTMLInputElement).value = "";
                }}
              />
            </label>
          ) : null}
        </div>
        <div className="flex items-center gap-1">
          {Array.from({
            length: Math.min(table.getPageCount(), 5),
          }).map((_, i) => (
            <button
              key={i}
              onClick={() => {
                if (manualPagination) {
                  onPageChange?.(i);
                } else {
                  table.setPageIndex(i);
                }
              }}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition-colors",
                pageIndex === i
                  ? "bg-primary text-white"
                  : "text-muted hover:bg-background"
              )}
            >
              {i + 1}
            </button>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <HiChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <HiChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
