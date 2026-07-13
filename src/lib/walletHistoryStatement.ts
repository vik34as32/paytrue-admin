import { APP_NAME } from "@/constants";
import {
  formatMoney,
  resolveCurrentBalance,
  resolveHistoryDate,
  resolveHistoryTime,
  resolveTopupAmount,
  resolveUpdatedBalance,
} from "@/lib/walletHistoryFormat";
import { WalletHistoryRecord, WalletHistorySummary } from "@/types/superAdmin";

export interface WalletStatementPrintOptions {
  records: WalletHistoryRecord[];
  summary?: WalletHistorySummary | null;
  accountName?: string;
  accountEmail?: string;
  accountMobile?: string;
  state?: string;
  city?: string;
  address?: string;
  startDate?: string;
  endDate?: string;
  generatedAt?: Date;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatPeriod(startDate?: string, endDate?: string): string {
  if (startDate && endDate) return `${startDate} to ${endDate}`;
  if (startDate) return `From ${startDate}`;
  if (endDate) return `Until ${endDate}`;
  return "All available records";
}

export function buildWalletStatementHtml(
  options: WalletStatementPrintOptions
): string {
  const {
    records,
    summary,
    accountName = "Super Admin",
    accountEmail = "—",
    accountMobile = "—",
    state = "—",
    city = "—",
    address = "—",
    startDate,
    endDate,
    generatedAt = new Date(),
  } = options;

  const rows = records
    .map((record, index) => {
      const current = resolveCurrentBalance(record);
      const topup = resolveTopupAmount(record);
      const updated = resolveUpdatedBalance(record);
      return `
        <tr>
          <td class="center">${index + 1}</td>
          <td>${escapeHtml(resolveHistoryDate(record))}</td>
          <td>${escapeHtml(resolveHistoryTime(record))}</td>
          <td class="right muted">${escapeHtml(formatMoney(current))}</td>
          <td class="right credit">${escapeHtml(formatMoney(topup))}</td>
          <td class="right balance">${escapeHtml(formatMoney(updated))}</td>
          <td>${escapeHtml(record.remarks || "—")}</td>
        </tr>
      `;
    })
    .join("");

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

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${APP_NAME} — Wallet Account Statement</title>
  <style>
    @page { size: A4; margin: 14mm 12mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      color: #111827;
      font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
      font-size: 12px;
      line-height: 1.45;
      background: #fff;
    }
    .sheet { width: 100%; max-width: 900px; margin: 0 auto; }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 14px;
      margin-bottom: 16px;
    }
    .brand { display: flex; align-items: center; gap: 12px; }
    .brand img { width: 52px; height: 52px; object-fit: contain; }
    .brand h1 {
      margin: 0;
      font-size: 26px;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: #0f172a;
    }
    .brand p { margin: 2px 0 0; color: #64748b; font-size: 11px; }
    .doc-meta { text-align: right; }
    .doc-meta .title {
      font-size: 16px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .doc-meta .sub { color: #64748b; margin-top: 4px; }
    .info-grid {
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      gap: 12px 24px;
      margin-bottom: 16px;
      padding: 12px 0;
      border-bottom: 1px solid #cbd5e1;
    }
    .info-block h3 {
      margin: 0 0 8px;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #64748b;
    }
    .info-row {
      display: grid;
      grid-template-columns: 110px 1fr;
      gap: 8px;
      margin-bottom: 4px;
    }
    .info-row .label { color: #64748b; font-weight: 600; }
    .info-row .value { color: #0f172a; font-weight: 600; }
    .summary {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-bottom: 18px;
    }
    .summary-card {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 10px 12px;
      background: #f8fafc;
    }
    .summary-card .label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #64748b;
    }
    .summary-card .value {
      margin-top: 4px;
      font-size: 15px;
      font-weight: 700;
      color: #0f172a;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 4px;
    }
    thead th {
      background: #0f172a;
      color: #fff;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 8px 6px;
      text-align: left;
      border: 1px solid #0f172a;
    }
    tbody td {
      padding: 7px 6px;
      border: 1px solid #cbd5e1;
      vertical-align: top;
    }
    tbody tr:nth-child(even) { background: #f8fafc; }
    .center { text-align: center; }
    .right { text-align: right; white-space: nowrap; }
    .muted { color: #1d4ed8; font-weight: 600; }
    .credit { color: #047857; font-weight: 700; }
    .balance { color: #7c3aed; font-weight: 700; }
    .footer {
      margin-top: 22px;
      padding-top: 12px;
      border-top: 1px solid #cbd5e1;
      display: flex;
      justify-content: space-between;
      gap: 16px;
      color: #64748b;
      font-size: 10px;
    }
    .sign {
      margin-top: 36px;
      text-align: right;
    }
    .sign .line {
      display: inline-block;
      min-width: 180px;
      border-top: 1px solid #0f172a;
      padding-top: 6px;
      font-size: 11px;
      color: #334155;
    }
    .empty {
      text-align: center;
      padding: 24px;
      color: #64748b;
      border: 1px dashed #cbd5e1;
    }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      thead { display: table-header-group; }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="header">
      <div class="brand">
        <img src="${logoUrl}" alt="${APP_NAME} Logo" />
        <div>
          <h1>${APP_NAME}</h1>
          <p>Enterprise FinTech Management</p>
        </div>
      </div>
      <div class="doc-meta">
        <div class="title">Account Statement</div>
        <div class="sub">Wallet Top-up History</div>
        <div class="sub">Generated: ${escapeHtml(generatedLabel)}</div>
      </div>
    </div>

    <div class="info-grid">
      <div class="info-block">
        <h3>Account Details</h3>
        <div class="info-row"><span class="label">Name</span><span class="value">${escapeHtml(accountName)}</span></div>
        <div class="info-row"><span class="label">Email</span><span class="value">${escapeHtml(accountEmail)}</span></div>
        <div class="info-row"><span class="label">Mobile</span><span class="value">${escapeHtml(accountMobile)}</span></div>
        <div class="info-row"><span class="label">Address</span><span class="value">${escapeHtml(address)}</span></div>
        <div class="info-row"><span class="label">City</span><span class="value">${escapeHtml(city)}</span></div>
        <div class="info-row"><span class="label">State</span><span class="value">${escapeHtml(state)}</span></div>
      </div>
      <div class="info-block">
        <h3>Statement Details</h3>
        <div class="info-row"><span class="label">Period</span><span class="value">${escapeHtml(formatPeriod(startDate, endDate))}</span></div>
        <div class="info-row"><span class="label">Records</span><span class="value">${records.length}</span></div>
        <div class="info-row"><span class="label">Currency</span><span class="value">INR (₹)</span></div>
        <div class="info-row"><span class="label">Product</span><span class="value">${APP_NAME} Wallet</span></div>
      </div>
    </div>

    <div class="summary">
      <div class="summary-card">
        <div class="label">Current Wallet Balance</div>
        <div class="value">${escapeHtml(formatMoney(summary?.currentWalletBalance ?? 0))}</div>
      </div>
      <div class="summary-card">
        <div class="label">Total Top-up Amount</div>
        <div class="value">${escapeHtml(formatMoney(summary?.totalTopupAmount ?? 0))}</div>
      </div>
      <div class="summary-card">
        <div class="label">Total Top-up Count</div>
        <div class="value">${summary?.totalTopupCount ?? records.length}</div>
      </div>
    </div>

    ${
      records.length === 0
        ? `<div class="empty">No transactions found for the selected period.</div>`
        : `<table>
      <thead>
        <tr>
          <th class="center">#</th>
          <th>Date</th>
          <th>Time</th>
          <th class="right">Current Balance</th>
          <th class="right">Top-up Balance</th>
          <th class="right">Updated Balance</th>
          <th>Remarks</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>`
    }

    <div class="sign">
      <div class="line">Authorized Signatory</div>
    </div>

    <div class="footer">
      <div>This is a system-generated statement from ${APP_NAME}. Please verify all entries.</div>
      <div>Page printed from Super Admin Wallet History</div>
    </div>
  </div>
</body>
</html>`;
}

export function printWalletStatement(options: WalletStatementPrintOptions) {
  const html = buildWalletStatementHtml(options);
  const printWindow = window.open("", "_blank", "noopener,noreferrer,width=1024,height=768");
  if (!printWindow) {
    throw new Error("Unable to open print window. Please allow pop-ups.");
  }
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  const triggerPrint = () => {
    printWindow.print();
  };
  if (printWindow.document.readyState === "complete") {
    setTimeout(triggerPrint, 250);
  } else {
    printWindow.onload = () => setTimeout(triggerPrint, 250);
  }
}
