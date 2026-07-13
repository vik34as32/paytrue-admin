import { APP_NAME } from "@/constants";
import {
  formatOperationType,
  formatWalletMoney,
  formatWalletUserType,
  resolveActivityDate,
  resolveActivityTime,
} from "@/lib/walletSummaryFormat";
import {
  WalletSummaryActivityRecord,
  WalletSummaryHeader,
} from "@/types/walletSummary";

export interface WalletSummaryStatementOptions {
  records: WalletSummaryActivityRecord[];
  header?: WalletSummaryHeader | null;
  totals: {
    currentBalance: number;
    totalCreditAmount: number;
    totalDeductAmount: number;
    recordCount: number;
  };
  scopeLabel: string;
  userTypeLabel: string;
  selectedUserName?: string;
  accountName?: string;
  accountEmail?: string;
  state?: string;
  city?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  status?: string;
  type?: string;
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

export function buildWalletSummaryStatementHtml(
  options: WalletSummaryStatementOptions
): string {
  const {
    records,
    header,
    totals,
    scopeLabel,
    userTypeLabel,
    selectedUserName,
    accountName = "—",
    accountEmail = "—",
    state = "—",
    city = "—",
    startDate,
    endDate,
    search,
    status,
    type,
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

  const targetName = header?.name || selectedUserName || "—";
  const targetState = header?.state || state;
  const targetCity = header?.city || city;

  const rows = records
    .map((record, index) => {
      const op = formatOperationType(record.operationType);
      const amountClass =
        op === "CREDIT" ? "credit" : op === "DEDUCT" ? "debit" : "right";
      return `
        <tr>
          <td class="center">${index + 1}</td>
          <td>${escapeHtml(resolveActivityDate(record))}</td>
          <td>${escapeHtml(resolveActivityTime(record))}</td>
          <td>${escapeHtml(record.reference || "—")}</td>
          <td class="center">${escapeHtml(op)}</td>
          <td class="right ${amountClass}">${escapeHtml(
            formatWalletMoney(record.amount)
          )}</td>
          <td class="center">${escapeHtml(record.status || "—")}</td>
          <td>${escapeHtml(record.performedByName || "—")}</td>
          <td>${escapeHtml(formatWalletUserType(record.performedByRole))}</td>
          <td>${escapeHtml(record.remarks || "—")}</td>
        </tr>
      `;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${APP_NAME} — User Wallet Summary</title>
  <style>
    @page { size: A4 landscape; margin: 12mm; }
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
      border-bottom: 2px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 14px;
    }
    .brand { display: flex; align-items: center; gap: 12px; }
    .brand img { width: 48px; height: 48px; object-fit: contain; }
    .brand h1 {
      margin: 0;
      font-size: 24px;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    .brand p { margin: 2px 0 0; color: #64748b; }
    .doc-meta { text-align: right; }
    .doc-meta .title {
      font-size: 15px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .doc-meta .sub { color: #64748b; margin-top: 3px; }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px 24px;
      margin-bottom: 14px;
      padding-bottom: 12px;
      border-bottom: 1px solid #cbd5e1;
    }
    .info-row {
      display: grid;
      grid-template-columns: 130px 1fr;
      gap: 8px;
      margin-bottom: 4px;
    }
    .label { color: #64748b; font-weight: 600; }
    .value { font-weight: 600; }
    .summary {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      margin-bottom: 14px;
    }
    .summary-card {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 8px 10px;
      background: #f8fafc;
    }
    .summary-card .label {
      display: block;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 4px;
      color: #64748b;
      font-weight: 600;
    }
    .summary-card .value { font-size: 14px; font-weight: 700; }
    table { width: 100%; border-collapse: collapse; }
    thead th {
      background: #0f172a;
      color: #fff;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      padding: 7px 6px;
      text-align: left;
      border: 1px solid #0f172a;
    }
    tbody td {
      padding: 6px;
      border: 1px solid #cbd5e1;
      vertical-align: top;
    }
    tbody tr:nth-child(even) { background: #f8fafc; }
    .center { text-align: center; }
    .right { text-align: right; white-space: nowrap; }
    .credit { color: #047857; font-weight: 700; }
    .debit { color: #b91c1c; font-weight: 700; }
    .footer {
      margin-top: 16px;
      padding-top: 10px;
      border-top: 1px solid #cbd5e1;
      display: flex;
      justify-content: space-between;
      color: #64748b;
      font-size: 10px;
    }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      thead { display: table-header-group; }
    }
  </style>
</head>
<body>
  <div>
    <div class="header">
      <div class="brand">
        <img src="${logoUrl}" alt="${APP_NAME} Logo" />
        <div>
          <h1>${APP_NAME}</h1>
          <p>Enterprise FinTech Management</p>
        </div>
      </div>
      <div class="doc-meta">
        <div class="title">Wallet Summary Statement</div>
        <div class="sub">${escapeHtml(scopeLabel)} · ${escapeHtml(userTypeLabel)}</div>
        <div class="sub">Generated: ${escapeHtml(generatedLabel)}</div>
      </div>
    </div>

    <div class="info-grid">
      <div>
        <div class="info-row"><span class="label">Target User</span><span class="value">${escapeHtml(targetName)}</span></div>
        <div class="info-row"><span class="label">User Code</span><span class="value">${escapeHtml(header?.userCode || "—")}</span></div>
        <div class="info-row"><span class="label">Mobile</span><span class="value">${escapeHtml(header?.mobile || "—")}</span></div>
        <div class="info-row"><span class="label">Email</span><span class="value">${escapeHtml(header?.email || "—")}</span></div>
        <div class="info-row"><span class="label">City</span><span class="value">${escapeHtml(targetCity || "—")}</span></div>
        <div class="info-row"><span class="label">State</span><span class="value">${escapeHtml(targetState || "—")}</span></div>
      </div>
      <div>
        <div class="info-row"><span class="label">Prepared By</span><span class="value">${escapeHtml(accountName)}</span></div>
        <div class="info-row"><span class="label">Email</span><span class="value">${escapeHtml(accountEmail)}</span></div>
        <div class="info-row"><span class="label">Period</span><span class="value">${escapeHtml(formatPeriod(startDate, endDate))}</span></div>
        <div class="info-row"><span class="label">Type</span><span class="value">${escapeHtml(type || "ALL")}</span></div>
        <div class="info-row"><span class="label">Status</span><span class="value">${escapeHtml(status || "All")}</span></div>
        <div class="info-row"><span class="label">Search</span><span class="value">${escapeHtml(search || "—")}</span></div>
      </div>
    </div>

    <div class="summary">
      <div class="summary-card">
        <span class="label">Current Balance</span>
        <span class="value">${escapeHtml(formatWalletMoney(totals.currentBalance))}</span>
      </div>
      <div class="summary-card">
        <span class="label">Total Credit</span>
        <span class="value">${escapeHtml(formatWalletMoney(totals.totalCreditAmount))}</span>
      </div>
      <div class="summary-card">
        <span class="label">Total Deduct</span>
        <span class="value">${escapeHtml(formatWalletMoney(totals.totalDeductAmount))}</span>
      </div>
      <div class="summary-card">
        <span class="label">Records</span>
        <span class="value">${totals.recordCount}</span>
      </div>
    </div>

    ${
      records.length === 0
        ? `<div style="text-align:center;padding:24px;color:#64748b;border:1px dashed #cbd5e1;">No wallet activity found for the selected filters.</div>`
        : `<table>
      <thead>
        <tr>
          <th class="center">#</th>
          <th>Date</th>
          <th>Time</th>
          <th>Reference</th>
          <th class="center">Type</th>
          <th class="right">Amount</th>
          <th class="center">Status</th>
          <th>Performed By</th>
          <th>Role</th>
          <th>Remarks</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`
    }

    <div class="footer">
      <div>This is a system-generated ${APP_NAME} wallet summary for the selected user.</div>
      <div>Use browser Print → Save as PDF for PDF download.</div>
    </div>
  </div>
</body>
</html>`;
}

export function openWalletSummaryStatement(
  options: WalletSummaryStatementOptions
) {
  const html = buildWalletSummaryStatementHtml(options);
  const printWindow = window.open(
    "",
    "_blank",
    "noopener,noreferrer,width=1200,height=800"
  );
  if (!printWindow) {
    throw new Error("Unable to open print window. Please allow pop-ups.");
  }
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  const triggerPrint = () => printWindow.print();
  if (printWindow.document.readyState === "complete") {
    setTimeout(triggerPrint, 250);
  } else {
    printWindow.onload = () => setTimeout(triggerPrint, 250);
  }
}
