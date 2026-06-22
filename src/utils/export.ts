import * as XLSX from "xlsx";
import { downloadFile } from "@/lib/utils";

export function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  sheetName = "Report"
) {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  downloadFile(blob, `${filename}.xlsx`, blob.type);
}

export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  filename: string
) {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const csv = XLSX.utils.sheet_to_csv(worksheet);
  downloadFile(csv, `${filename}.csv`, "text/csv");
}
