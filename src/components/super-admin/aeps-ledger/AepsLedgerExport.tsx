"use client";

import { FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "@/components/common/Button";

interface AepsLedgerExportProps {
  onExportCsv: () => void;
  onExportExcel: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export function AepsLedgerExport({
  onExportCsv,
  onExportExcel,
  loading,
  disabled,
}: AepsLedgerExportProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled || loading}
        onClick={onExportCsv}
        className="!border-sky-500/40 !text-sky-700 hover:!bg-sky-50 dark:!text-sky-400"
      >
        <FileText className="size-4" />
        Export CSV
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled || loading}
        onClick={onExportExcel}
        className="!border-emerald-500/40 !text-emerald-700 hover:!bg-emerald-50 dark:!text-emerald-400"
      >
        <FileSpreadsheet className="size-4" />
        Export Excel
      </Button>
    </div>
  );
}
