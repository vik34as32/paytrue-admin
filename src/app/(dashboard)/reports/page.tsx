"use client";

import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppStore";
import { fetchTransactions } from "@/store/slices/balanceSlice";
import { fetchLedger } from "@/store/slices/ledgerSlice";
import { fetchHistory } from "@/store/slices/reportSlice";
import { Card, CardHeader } from "@/components/common/Card";
import { Select } from "@/components/common/Select";
import { Button } from "@/components/common/Button";
import { BarChartCard } from "@/components/charts/BarChartCard";
import { PieChartCard } from "@/components/charts/PieChartCard";
import { exportToExcel, exportToCSV } from "@/utils/export";
import { formatCurrency, formatDate, getDateRange } from "@/lib/utils";
import { toast } from "sonner";
import { Input } from "@/components/common/Input";

export default function ReportsPage() {
  const dispatch = useAppDispatch();
  const { transactions } = useAppSelector((state) => state.balance);
  const { entries } = useAppSelector((state) => state.ledger);
  const { history } = useAppSelector((state) => state.reports);
  const [period, setPeriod] = useState("monthly");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    dispatch(fetchTransactions({ page: 1, pageSize: 100 }));
    dispatch(fetchLedger({ page: 1, pageSize: 100 }));
    dispatch(fetchHistory({ page: 1, pageSize: 100 }));
  }, [dispatch]);

  const chartData = [
    { name: "Success", value: transactions?.data.filter((t) => t.status === "success").length || 0 },
    { name: "Pending", value: transactions?.data.filter((t) => t.status === "pending").length || 0 },
    { name: "Rejected", value: transactions?.data.filter((t) => t.status === "rejected").length || 0 },
  ];

  const barData = transactions?.data.slice(0, 6).map((t) => ({
    name: t.id.slice(-6),
    value: t.amount,
  })) || [];

  const handleExport = (format: "excel" | "csv") => {
    const reportData = (transactions?.data || []).map((t) => ({
      "Transaction ID": t.id,
      From: t.fromUserName,
      To: t.toUserName,
      Amount: t.amount,
      Status: t.status,
      Remarks: t.remarks,
      Date: formatDate(t.createdAt),
    }));

    if (reportData.length === 0) {
      toast.error("No data to export");
      return;
    }

    const filename = `paytrue-report-${period}-${Date.now()}`;
    if (format === "excel") {
      exportToExcel(reportData, filename);
      toast.success("Excel report downloaded");
    } else {
      exportToCSV(reportData, filename);
      toast.success("CSV report downloaded");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-sm text-muted">Generate and export financial reports</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleExport("excel")}>
            Export Excel
          </Button>
          <Button variant="outline" onClick={() => handleExport("csv")}>
            Export CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader title="Filters" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Select
            label="Period"
            options={[
              { value: "today", label: "Today" },
              { value: "yesterday", label: "Yesterday" },
              { value: "weekly", label: "Weekly" },
              { value: "monthly", label: "Monthly" },
              { value: "custom", label: "Custom Date" },
            ]}
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          />
          {period === "custom" && (
            <>
              <Input
                label="Start Date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <Input
                label="End Date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </>
          )}
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <PieChartCard title="Transaction Status Distribution" data={chartData} />
        <BarChartCard title="Recent Transaction Amounts" data={barData} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-muted">Total Transactions</p>
          <p className="text-2xl font-bold">{transactions?.total || 0}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted">Ledger Entries</p>
          <p className="text-2xl font-bold">{entries?.total || 0}</p>
        </Card>
        <Card>
          <p className="text-sm text-muted">History Records</p>
          <p className="text-2xl font-bold">{history?.total || 0}</p>
        </Card>
      </div>
    </div>
  );
}
