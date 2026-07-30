"use client";

interface AepsLedgerPaginationProps {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (limit: number) => void;
  pageSizeOptions?: number[];
  disabled?: boolean;
}

export function AepsLedgerPagination({
  page,
  limit,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  disabled,
}: AepsLedgerPaginationProps) {
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-sm">
      <p className="text-muted">
        Showing{" "}
        <span className="font-medium text-foreground">
          {from} to {to}
        </span>{" "}
        of <span className="font-medium text-foreground">{total}</span>
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-muted">
          Rows
          <select
            className="rounded-lg border border-border bg-card px-2 py-1.5 text-sm text-foreground outline-none focus:border-primary"
            value={limit}
            disabled={disabled}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-lg border border-border px-3 py-1.5 font-medium text-foreground transition hover:bg-muted disabled:opacity-50"
            disabled={disabled || page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            Previous
          </button>
          <span className="min-w-[72px] text-center tabular-nums text-muted">
            {page} / {Math.max(1, totalPages)}
          </span>
          <button
            type="button"
            className="rounded-lg border border-border px-3 py-1.5 font-medium text-foreground transition hover:bg-muted disabled:opacity-50"
            disabled={disabled || page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
