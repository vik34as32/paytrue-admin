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
import {
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  ChevronUp,
  ChevronDown,
  Inbox,
  Search,
} from "lucide-react";

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
  totalRows?: number;
  manualSorting?: boolean;
  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;
  tone?: "default" | "network" | "report";
  stickyHeader?: boolean;
  minTableWidth?: number;
  onRowClick?: (row: T) => void;
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
  onRowClick,
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
    const to = Math.min((pageIndex + 1) * pageSize, filteredCount);
    return { from, to: Math.min(to, filteredCount), total: filteredCount };
  }, [filteredCount, pageIndex, pageSize]);

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

  const goToPage = (index: number) => {
    if (manualPagination) onPageChange?.(index);
    else table.setPageIndex(index);
  };

  return (
    <div className="pt-table space-y-3">
      {!hideSearch && (
        <div className="pt-table__toolbar">
          <div className="w-full sm:max-w-sm">
            <Input
              placeholder={searchPlaceholder}
              icon={<Search className="h-4 w-4" />}
              value={searchValue ?? globalFilter}
              onChange={(e) => handleSearch(e.target.value)}
              className="h-10 rounded-2xl border-border/80 bg-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]"
            />
          </div>
        </div>
      )}

      <div
        className={cn(
          "pt-table__shell",
          stickyHeader && "max-h-[min(70vh,720px)] overflow-y-auto"
        )}
      >
        <div className="pt-table__accent" />
        <table
          className="pt-table__grid"
          style={{ minWidth: minTableWidth }}
        >
          <thead className={cn(stickyHeader && "sticky top-0 z-20")}>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const align = (
                    header.column.columnDef.meta as
                      | { align?: ColumnAlign }
                      | undefined
                  )?.align;
                  const sorted = header.column.getIsSorted();
                  return (
                    <th
                      key={header.id}
                      className={cn(
                        "pt-table__th",
                        getAlignClass(align),
                        header.column.getCanSort() && "pt-table__th--sort"
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
                          "inline-flex items-center gap-1.5",
                          align === "right" && "w-full justify-end",
                          align === "center" && "w-full justify-center"
                        )}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {header.column.getCanSort() ? (
                          <span className="pt-table__sort" aria-hidden>
                            {sorted === "asc" ? (
                              <ChevronUp className="h-3.5 w-3.5" />
                            ) : sorted === "desc" ? (
                              <ChevronDown className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronsUpDown className="h-3.5 w-3.5 opacity-45" />
                            )}
                          </span>
                        ) : null}
                      </span>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="pt-table__row pt-table__row--skel">
                  {columns.map((_, j) => (
                    <td key={j} className="pt-table__td">
                      <div
                        className="pt-table__pulse"
                        style={{ width: `${46 + ((i + j) % 4) * 12}%` }}
                      />
                    </td>
                  ))}
                </tr>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="pt-table__empty">
                  <span className="pt-table__empty-icon">
                    <Inbox className="h-6 w-6" />
                  </span>
                  <p>No records to show</p>
                  <span>Try a different search or filter</span>
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row, rowIndex) => (
                <tr
                  key={row.id}
                  onClick={
                    onRowClick ? () => onRowClick(row.original) : undefined
                  }
                  className={cn(
                    "pt-table__row",
                    rowIndex % 2 === 1 && "pt-table__row--alt",
                    onRowClick && "pt-table__row--click"
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
                        className={cn("pt-table__td", getAlignClass(align))}
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

      <div className="pt-table__foot">
        <div className="pt-table__meta">
          <p>
            Showing{" "}
            <strong className="tabular-nums">{range.from}</strong>
            –
            <strong className="tabular-nums">{range.to}</strong> of{" "}
            <strong className="tabular-nums">{range.total}</strong>
          </p>
          <span>
            Page <b className="tabular-nums">{pageIndex + 1}</b> /{" "}
            <b className="tabular-nums">{totalPages}</b>
          </span>
        </div>

        <div className="pt-table__pager">
          <button
            type="button"
            className="pt-page-btn"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
            Prev
          </button>

          <div className="pt-table__pages">
            {pageButtons.map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => goToPage(i)}
                className={cn(
                  "pt-page-num",
                  pageIndex === i && "pt-page-num--on"
                )}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="pt-page-btn"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>

          {pageSizeOptions?.length && onPageSizeChange ? (
            <label className="pt-table__rows">
              <span>Rows</span>
              <select
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
              >
                {pageSizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size}
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
