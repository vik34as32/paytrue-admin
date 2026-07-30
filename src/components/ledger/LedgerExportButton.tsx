"use client";

import { Button, Dropdown } from "antd";
import type { MenuProps } from "antd";
import { Download } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { LedgerRow } from "@/types/ledger";

interface LedgerExportButtonProps {
  rows: LedgerRow[];
  filename?: string;
}

function toExportRows(rows: LedgerRow[]) {
  return rows.map((r) => ({
    "Transaction ID": r.transactionId,
    "Reference ID": r.referenceId || "",
    User: r.userName,
    "User Code": r.userCode || "",
    Role: r.role,
    Service: r.serviceType,
    Credit: r.credit,
    Debit: r.debit,
    "Opening Balance": r.openingBalance ?? "",
    "Closing Balance": r.closingBalance ?? "",
    Charge: r.charge,
    Commission: r.commission,
    GST: r.gst,
    Status: r.status,
    "Created By": r.createdBy || "",
    Date: r.createdAt || "",
  }));
}

export function LedgerExportButton({
  rows,
  filename = "wallet-ledger",
}: LedgerExportButtonProps) {
  const exportCsv = () => {
    if (!rows.length) {
      toast.message("Nothing to export");
      return;
    }
    const sheet = XLSX.utils.json_to_sheet(toExportRows(rows));
    const csv = XLSX.utils.sheet_to_csv(sheet);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    saveAs(blob, `${filename}.csv`);
    toast.success("CSV exported");
  };

  const exportExcel = () => {
    if (!rows.length) {
      toast.message("Nothing to export");
      return;
    }
    const sheet = XLSX.utils.json_to_sheet(toExportRows(rows));
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, "Ledger");
    const buffer = XLSX.write(book, { bookType: "xlsx", type: "array" });
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, `${filename}.xlsx`);
    toast.success("Excel exported");
  };

  const items: MenuProps["items"] = [
    { key: "csv", label: "Export CSV", onClick: exportCsv },
    { key: "excel", label: "Export Excel", onClick: exportExcel },
  ];

  return (
    <Dropdown menu={{ items }} placement="bottomRight">
      <Button type="primary" icon={<Download className="h-4 w-4" />}>
        Export
      </Button>
    </Dropdown>
  );
}
