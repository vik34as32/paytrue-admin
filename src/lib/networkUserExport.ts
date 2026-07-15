import { APP_NAME } from "@/constants";
import { downloadFile, formatCurrency } from "@/lib/utils";
import {
  formatUserTypeLabel,
  getNetworkUserName,
  getUserOutletField,
  getUserOutletName,
  getUserAadhaarNumber,
  getUserPanNumber,
} from "@/lib/normalizeUser";
import { NetworkUserRecord } from "@/types/superAdmin";
import { AdminManagedUserRole } from "@/services/adminUsersApi";

export type AdminNetworkUserKind = AdminManagedUserRole;

export const ADMIN_NETWORK_USER_KIND_LABEL: Record<
  AdminNetworkUserKind,
  string
> = {
  MASTER_DISTRIBUTOR: "Master Distributors",
  DISTRIBUTOR: "Distributors",
  RETAILER: "Retailers",
};

export type NetworkUserExportRow = {
  "S.No": number;
  "User Code": string;
  Name: string;
  Email: string;
  Phone: string;
  "User Type": string;
  Status: string;
  Outlet: string;
  City: string;
  State: string;
  Aadhaar: string;
  PAN: string;
  "Wallet Balance": string;
  "Created Date": string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function display(value?: string | number | null): string {
  if (value === null || value === undefined || value === "") return "—";
  const text = String(value).trim();
  return text && text !== "—" ? text : "—";
}

function outletField(user: NetworkUserRecord, field: "city" | "state"): string {
  const fromOutlet = getUserOutletField(user, field);
  if (fromOutlet && fromOutlet !== "—") return fromOutlet;
  if (field === "city") return display(user.city);
  return display(user.state);
}

function safeFormatDate(value?: string | Date | null): string {
  if (!value) return "—";
  try {
    const date =
      typeof value === "string"
        ? new Date(value.includes("T") ? value : value.replace(" ", "T"))
        : value;
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function phoneOf(user: NetworkUserRecord): string {
  return display(user.mobile || user.phone);
}

function walletOf(user: NetworkUserRecord): string {
  const balance =
    typeof user.walletBalance === "number"
      ? user.walletBalance
      : Number(user.walletBalance);
  if (!Number.isFinite(balance)) return "—";
  try {
    return formatCurrency(balance);
  } catch {
    return String(balance);
  }
}

export function toNetworkUserExportRows(
  users: NetworkUserRecord[]
): NetworkUserExportRow[] {
  return (users || []).map((user, index) => ({
    "S.No": index + 1,
    "User Code": display(user.userCode),
    Name: getNetworkUserName(user) || "—",
    Email: display(user.email),
    Phone: phoneOf(user),
    "User Type": formatUserTypeLabel(user.userType || user.role),
    Status: display(user.status),
    Outlet: getUserOutletName(user) || "—",
    City: outletField(user, "city"),
    State: outletField(user, "state"),
    Aadhaar: getUserAadhaarNumber(user) || "—",
    PAN: getUserPanNumber(user) || "—",
    "Wallet Balance": walletOf(user),
    "Created Date": safeFormatDate(user.createdAt),
  }));
}

async function loadPaytrueLogoBase64(): Promise<string | null> {
  try {
    const logoUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/images/logo.png`
        : "/images/logo.png";
    const response = await fetch(logoUrl);
    if (!response.ok) return null;
    const buffer = await response.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i += 1) {
      binary += String.fromCharCode(bytes[i]!);
    }
    return btoa(binary);
  } catch {
    return null;
  }
}

const EMPTY_HEADERS: NetworkUserExportRow = {
  "S.No": 1,
  "User Code": "",
  Name: "",
  Email: "",
  Phone: "",
  "User Type": "",
  Status: "",
  Outlet: "",
  City: "",
  State: "",
  Aadhaar: "",
  PAN: "",
  "Wallet Balance": "",
  "Created Date": "",
};

export async function exportNetworkUsersToExcel(options: {
  users: NetworkUserRecord[];
  kind: AdminNetworkUserKind;
  filename: string;
  filters?: {
    search?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  };
}) {
  const { users, kind, filename, filters } = options;
  const rows = toNetworkUserExportRows(users);

  // Dynamic import keeps ExcelJS out of the initial bundle and avoids SSR issues
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = APP_NAME;
  workbook.company = APP_NAME;
  workbook.created = new Date();

  const sheetName = ADMIN_NETWORK_USER_KIND_LABEL[kind].slice(0, 31);
  const sheet = workbook.addWorksheet(sheetName, {
    views: [{ state: "frozen", ySplit: 6 }],
  });

  const logoBase64 = await loadPaytrueLogoBase64();
  if (logoBase64) {
    try {
      const imageId = workbook.addImage({
        base64: logoBase64,
        extension: "png",
      });
      sheet.addImage(imageId, {
        tl: { col: 0, row: 0 },
        ext: { width: 56, height: 56 },
      });
    } catch {
      // Logo is optional — continue without it
    }
  }

  sheet.mergeCells("B1", "F1");
  sheet.getCell("B1").value = APP_NAME.toUpperCase();
  sheet.getCell("B1").font = {
    name: "Calibri",
    size: 20,
    bold: true,
    color: { argb: "FF4318FF" },
  };

  sheet.mergeCells("B2", "F2");
  sheet.getCell("B2").value = ADMIN_NETWORK_USER_KIND_LABEL[kind];
  sheet.getCell("B2").font = { name: "Calibri", size: 14, bold: true };

  sheet.mergeCells("B3", "F3");
  sheet.getCell("B3").value = `Generated: ${new Date().toLocaleString("en-IN")}`;
  sheet.getCell("B3").font = {
    name: "Calibri",
    size: 10,
    color: { argb: "FF64748B" },
  };

  const filterParts = [
    filters?.search ? `Search: ${filters.search}` : null,
    filters?.status ? `Status: ${filters.status}` : null,
    filters?.startDate || filters?.endDate
      ? `Period: ${filters.startDate || "…"} → ${filters.endDate || "…"}`
      : null,
    `Records: ${rows.length}`,
  ].filter(Boolean);

  sheet.mergeCells("B4", "F4");
  sheet.getCell("B4").value = filterParts.join("  |  ") || "All records";
  sheet.getCell("B4").font = { name: "Calibri", size: 10 };

  sheet.getRow(5).height = 8;

  const headers = Object.keys(rows[0] ?? EMPTY_HEADERS) as (keyof NetworkUserExportRow)[];

  const headerRow = sheet.getRow(6);
  headers.forEach((header, colIndex) => {
    const cell = headerRow.getCell(colIndex + 1);
    cell.value = header;
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, name: "Calibri" };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4318FF" },
    };
    cell.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };
    cell.border = {
      top: { style: "thin", color: { argb: "FFD0D5DD" } },
      left: { style: "thin", color: { argb: "FFD0D5DD" } },
      bottom: { style: "thin", color: { argb: "FFD0D5DD" } },
      right: { style: "thin", color: { argb: "FFD0D5DD" } },
    };
  });
  headerRow.height = 22;

  rows.forEach((row, rowIndex) => {
    const excelRow = sheet.getRow(7 + rowIndex);
    headers.forEach((header, colIndex) => {
      const cell = excelRow.getCell(colIndex + 1);
      cell.value = row[header];
      cell.font = { name: "Calibri", size: 10 };
      cell.alignment = {
        vertical: "middle",
        horizontal: header === "S.No" ? "center" : "left",
        wrapText: true,
      };
      cell.border = {
        top: { style: "thin", color: { argb: "FFE4E7EC" } },
        left: { style: "thin", color: { argb: "FFE4E7EC" } },
        bottom: { style: "thin", color: { argb: "FFE4E7EC" } },
        right: { style: "thin", color: { argb: "FFE4E7EC" } },
      };
      if (rowIndex % 2 === 1) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF8FAFC" },
        };
      }
    });
  });

  const widths = [8, 14, 22, 26, 14, 18, 12, 20, 14, 14, 16, 14, 14, 14];
  sheet.columns = widths.map((width) => ({ width }));

  const buffer = await workbook.xlsx.writeBuffer();
  const bytes = new Uint8Array(buffer as ArrayBuffer);
  const blob = new Blob([bytes], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  downloadFile(blob, `${filename}.xlsx`, blob.type);
}

export function exportNetworkUsersToCsv(
  users: NetworkUserRecord[],
  filename: string
) {
  const rows = toNetworkUserExportRows(users);
  const headers = Object.keys(rows[0] ?? EMPTY_HEADERS) as (keyof NetworkUserExportRow)[];

  const escapeCsv = (value: string | number) => {
    const text = String(value ?? "");
    if (/[",\n\r]/.test(text)) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  };

  const lines = [
    headers.join(","),
    ...rows.map((row) => headers.map((h) => escapeCsv(row[h])).join(",")),
  ];

  // BOM so Excel opens UTF-8 (₹ / em dash) correctly
  const csv = `\uFEFF${lines.join("\r\n")}`;
  downloadFile(csv, `${filename}.csv`, "text/csv;charset=utf-8");
}

export function buildNetworkUsersStatementHtml(options: {
  users: NetworkUserRecord[];
  kind: AdminNetworkUserKind;
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  generatedAt?: Date;
}): string {
  const {
    users,
    kind,
    search,
    status,
    startDate,
    endDate,
    generatedAt = new Date(),
  } = options;

  const logoUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/images/logo.png`
      : "/images/logo.png";

  const generatedLabel = generatedAt.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const period =
    startDate || endDate
      ? `${startDate || "…"} → ${endDate || "…"}`
      : "All dates";

  const bodyRows = (users || [])
    .map((user, index) => {
      return `
        <tr>
          <td class="center">${index + 1}</td>
          <td>${escapeHtml(display(user.userCode))}</td>
          <td>${escapeHtml(getNetworkUserName(user) || "—")}</td>
          <td>${escapeHtml(display(user.email))}</td>
          <td>${escapeHtml(phoneOf(user))}</td>
          <td class="center">${escapeHtml(display(user.status))}</td>
          <td>${escapeHtml(getUserOutletName(user) || "—")}</td>
          <td>${escapeHtml(outletField(user, "city"))}</td>
          <td>${escapeHtml(outletField(user, "state"))}</td>
          <td class="right">${escapeHtml(walletOf(user))}</td>
          <td>${escapeHtml(safeFormatDate(user.createdAt))}</td>
        </tr>
      `;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${APP_NAME} — ${ADMIN_NETWORK_USER_KIND_LABEL[kind]}</title>
  <style>
    @page { size: A4 landscape; margin: 10mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      color: #0f172a;
      font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
      font-size: 11px;
      line-height: 1.4;
      background: #fff;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      border-bottom: 2px solid #4318FF;
      padding-bottom: 12px;
      margin-bottom: 14px;
    }
    .brand { display: flex; align-items: center; gap: 12px; }
    .brand img { width: 52px; height: 52px; object-fit: contain; }
    .brand h1 {
      margin: 0;
      font-size: 24px;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: #4318FF;
    }
    .brand p { margin: 2px 0 0; color: #64748b; }
    .doc-meta { text-align: right; color: #475569; }
    .doc-meta strong { color: #0f172a; }
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 8px;
      margin-bottom: 14px;
    }
    .meta-card {
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 8px 10px;
      background: #f8fafc;
    }
    .meta-card span { display: block; color: #64748b; font-size: 10px; }
    .meta-card strong { font-size: 12px; }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      border: 1px solid #e2e8f0;
      padding: 6px 8px;
      text-align: left;
      vertical-align: top;
    }
    th {
      background: #4318FF;
      color: #fff;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    tbody tr:nth-child(even) { background: #f8fafc; }
    .center { text-align: center; }
    .right { text-align: right; }
    .footer {
      margin-top: 14px;
      display: flex;
      justify-content: space-between;
      color: #64748b;
      font-size: 10px;
      border-top: 1px solid #e2e8f0;
      padding-top: 8px;
    }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">
      <img src="${logoUrl}" alt="${APP_NAME}" />
      <div>
        <h1>${APP_NAME}</h1>
        <p>${ADMIN_NETWORK_USER_KIND_LABEL[kind]} Report</p>
      </div>
    </div>
    <div class="doc-meta">
      <div><strong>Generated</strong></div>
      <div>${escapeHtml(generatedLabel)}</div>
      <div style="margin-top:6px">${users.length} record(s)</div>
    </div>
  </div>

  <div class="meta-grid">
    <div class="meta-card"><span>Report</span><strong>${escapeHtml(
      ADMIN_NETWORK_USER_KIND_LABEL[kind]
    )}</strong></div>
    <div class="meta-card"><span>Search</span><strong>${escapeHtml(
      search || "—"
    )}</strong></div>
    <div class="meta-card"><span>Status</span><strong>${escapeHtml(
      status || "All"
    )}</strong></div>
    <div class="meta-card"><span>Period</span><strong>${escapeHtml(
      period
    )}</strong></div>
  </div>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Code</th>
        <th>Name</th>
        <th>Email</th>
        <th>Phone</th>
        <th>Status</th>
        <th>Outlet</th>
        <th>City</th>
        <th>State</th>
        <th>Wallet</th>
        <th>Created</th>
      </tr>
    </thead>
    <tbody>
      ${
        bodyRows ||
        `<tr><td colspan="11" class="center">No records found</td></tr>`
      }
    </tbody>
  </table>

  <div class="footer">
    <div>System-generated ${APP_NAME} report. Confidential.</div>
    <div>Use Print → Save as PDF for PDF download.</div>
  </div>
</body>
</html>`;
}

export function openNetworkUsersStatement(options: {
  users: NetworkUserRecord[];
  kind: AdminNetworkUserKind;
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}): { mode: "print" | "download" } {
  const html = buildNetworkUsersStatementHtml(options);

  // Do NOT pass "noopener" in windowFeatures — browsers then return null from window.open
  const printWindow = window.open("", "_blank", "width=1280,height=820");
  if (!printWindow) {
    downloadFile(
      html,
      `paytrue-${ADMIN_NETWORK_USER_KIND_LABEL[options.kind]
        .toLowerCase()
        .replace(/\s+/g, "-")}-statement.html`,
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
      // User can still use Ctrl+P manually
    }
  };

  if (printWindow.document.readyState === "complete") {
    setTimeout(triggerPrint, 350);
  } else {
    printWindow.onload = () => setTimeout(triggerPrint, 350);
  }

  return { mode: "print" };
}
