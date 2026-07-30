"use client";

import { Button } from "@/components/common/Button";

interface WalletPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

export function WalletPagination({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  disabled,
}: WalletPaginationProps) {
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted" aria-live="polite">
        Showing <span className="font-semibold text-foreground">{from}</span>–
        <span className="font-semibold text-foreground">{to}</span> of{" "}
        <span className="font-semibold text-foreground">
          {total.toLocaleString("en-IN")}
        </span>
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled || page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          Previous
        </Button>
        <span className="min-w-[88px] text-center text-sm font-medium text-foreground">
          Page {page} / {Math.max(totalPages, 1)}
        </span>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled || page >= totalPages || total === 0}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          Next
        </Button>
      </div>
    </div>
  );
}
