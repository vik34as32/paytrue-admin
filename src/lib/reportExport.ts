"use client";

import { exportToExcel } from "@/utils/export";
import { APP_NAME } from "@/constants";
import { downloadFile } from "@/lib/utils";

export type ReportExportColumn = {
  key: string;
  label: string;
};

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function cellValue(row: Record<string, unknown>, key: string): string {
  const value = row[key];
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

/** Download Excel (.xlsx) from flat row objects. */
export function downloadReportExcel(
  rows: Record<string, unknown>[],
  filename: string,
  sheetName = "Report"
) {
  if (!rows.length) {
    throw new Error("No records available to export");
  }
  exportToExcel(rows, filename, sheetName);
}

/**
 * Export PDF via print dialog (Print → Save as PDF).
 * Same pattern as other PayTrue statement exports.
 */
export function downloadReportPdf(options: {
  title: string;
  subtitle?: string;
  filename?: string;
  columns: ReportExportColumn[];
  rows: Record<string, unknown>[];
}): { mode: "print" | "download" } {
  const { title, subtitle, columns, rows, filename } = options;
  if (!rows.length) {
    throw new Error("No records available to export");
  }

  const headerCells = columns
    .map((col) => `<th>${escapeHtml(col.label)}</th>`)
    .join("");
  const bodyRows = rows
    .map((row, index) => {
      const cells = columns
        .map((col) => {
          const raw =
            col.key === "#"
              ? String(index + 1)
              : cellValue(row, col.key);
          return `<td>${escapeHtml(raw)}</td>`;
        })
        .join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; color: #0f172a; margin: 24px; }
    h1 { font-size: 20px; margin: 0 0 4px; }
    .sub { color: #64748b; font-size: 12px; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th { background: #f1f5f9; text-align: left; padding: 8px; border: 1px solid #e2e8f0; text-transform: uppercase; font-size: 10px; }
    td { padding: 8px; border: 1px solid #e2e8f0; vertical-align: top; }
    .footer { margin-top: 16px; font-size: 10px; color: #64748b; display: flex; justify-content: space-between; }
    @media print {
      body { margin: 12px; }
      .footer { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  ${subtitle ? `<p class="sub">${escapeHtml(subtitle)}</p>` : ""}
  <table>
    <thead><tr>${headerCells}</tr></thead>
    <tbody>${bodyRows}</tbody>
  </table>
  <div class="footer">
    <div>System-generated ${escapeHtml(APP_NAME)} report. Confidential.</div>
    <div>Use Print → Save as PDF for PDF download.</div>
  </div>
</body>
</html>`;

  const printWindow = window.open("", "_blank", "width=1280,height=820");
  if (!printWindow) {
    downloadFile(
      html,
      `${filename || "paytrue-report"}.html`,
      "text/html;charset=utf-8"
    );
    return { mode: "download" };
  }

  printWindow.opener = null;
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();

  const triggerPrint = () => {
    try {
      printWindow.print();
    } catch {
      // User can still use Ctrl+P
    }
  };

  if (printWindow.document.readyState === "complete") {
    setTimeout(triggerPrint, 350);
  } else {
    printWindow.onload = () => setTimeout(triggerPrint, 350);
  }

  return { mode: "print" };
}

export function reportFilename(slug: string): string {
  return `paytrue-${slug}-${new Date().toISOString().slice(0, 10)}`;
}
