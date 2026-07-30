"use client";

import { FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "@/components/common/Button";
import { cn } from "@/lib/utils";

interface ReportExportBarProps {
  onExportExcel?: () => void;
  onExportPdf?: () => void;
  loading?: boolean;
  className?: string;
  left?: React.ReactNode;
}

/** Wallet Credit History style export actions (Excel + PDF). */
export function ReportExportBar({
  onExportExcel,
  onExportPdf,
  loading,
  className,
  left,
}: ReportExportBarProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3",
        className
      )}
    >
      <div>{left}</div>
      <div className="flex flex-wrap items-center gap-2">
        {onExportExcel ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loading}
            onClick={onExportExcel}
            className="!border-emerald-500/40 !text-emerald-700 hover:!bg-emerald-50 dark:!text-emerald-400"
          >
            <FileSpreadsheet className="size-4" />
            Export Excel
          </Button>
        ) : null}
        {onExportPdf ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loading}
            onClick={onExportPdf}
            className="!border-rose-500/40 !text-rose-700 hover:!bg-rose-50 dark:!text-rose-400"
          >
            <FileText className="size-4" />
            Export PDF
          </Button>
        ) : null}
      </div>
    </div>
  );
}
