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
} from "@tanstack/react-table";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import { HiChevronLeft, HiChevronRight, HiSearch } from "react-icons/hi";

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T, unknown>[];
  searchPlaceholder?: string;
  onSearch?: (value: string) => void;
  isLoading?: boolean;
  pageSize?: number;
  hideSearch?: boolean;
  manualPagination?: boolean;
  pageCount?: number;
  pageIndex?: number;
  onPageChange?: (pageIndex: number) => void;
}

export function DataTable<T>({
  data,
  columns,
  searchPlaceholder = "Search...",
  onSearch,
  isLoading,
  pageSize = 10,
  hideSearch = false,
  manualPagination = false,
  pageCount: controlledPageCount,
  pageIndex: controlledPageIndex,
  onPageChange,
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [internalPageIndex, setInternalPageIndex] = useState(0);

  const pageIndex = manualPagination ? (controlledPageIndex ?? 0) : internalPageIndex;
  const pageCount = manualPagination
    ? (controlledPageCount ?? 1)
    : undefined;

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
      pagination: { pageIndex, pageSize },
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: manualPagination ? undefined : getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination,
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
              value={globalFilter}
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

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[600px]">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-border bg-background/80">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted cursor-pointer select-none transition-colors hover:text-foreground"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <span className="inline-flex items-center gap-1">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {header.column.getIsSorted() === "asc" && " ↑"}
                      {header.column.getIsSorted() === "desc" && " ↓"}
                    </span>
                  </th>
                ))}
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
                  <p className="mt-1 text-xs">Try adjusting your search criteria</p>
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row, i) => (
                <tr
                  key={row.id}
                  className={cn(
                    "border-b border-border last:border-0 transition-colors hover:bg-primary/[0.03]",
                    i % 2 === 0 && "bg-background/20"
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-4 py-3 text-sm text-foreground"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between pt-2">
        <p className="text-sm text-muted">
          Showing page {pageIndex + 1} of {table.getPageCount() || 1}
        </p>
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(table.getPageCount(), 5) }).map((_, i) => (
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
