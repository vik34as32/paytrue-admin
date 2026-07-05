"use client";

import { useCallback, useMemo, useState } from "react";
import { App, Modal } from "antd";
import {
  BulkUpdatePayload,
  CommissionRangeRow,
  CopyCommissionPayload,
} from "@/types/commission";
import {
  MOCK_COMMISSION_ROWS,
  MOCK_RETAILERS,
} from "@/lib/commission/mockData";
import { validateCommissionRow } from "@/lib/commission/validation";
import { createRowId, downloadJson } from "@/lib/commission/utils";
import { FINTECH_SERVICES } from "@/constants/commissionServices";
import {
  bulkUpdateCommissions,
  copyCommissions,
  deleteCommissionRow,
  importCommissions,
  saveCommissionRow,
} from "@/services/commissionApi";

function defaultRow(
  serviceId = "dmt",
  retailerId?: string,
  retailerName?: string
): CommissionRangeRow {
  const service = FINTECH_SERVICES.find((s) => s.id === serviceId);
  return {
    id: createRowId(),
    serviceId,
    serviceName: service?.name ?? "DMT",
    scope: "retailer",
    retailerId,
    retailerName,
    rangeFrom: 1,
    rangeTo: 1000,
    deductionType: "flat",
    deductionValue: 0,
    retailerCommissionType: "flat",
    retailerCommission: 0,
    distributorCommissionType: "flat",
    distributorCommission: 0,
    masterDistributorCommissionType: "flat",
    masterDistributorCommission: 0,
    companyMarginType: "flat",
    companyMargin: 0,
    priority: 1,
    status: "active",
  };
}

/** Retailer view shows all global commission slabs (DMT, AEPS, etc.) */
function getRetailerCommissionRows(
  rows: CommissionRangeRow[],
  retailerId: string
): CommissionRangeRow[] {
  const retailer = MOCK_RETAILERS.find((r) => r.id === retailerId);

  return rows
    .filter((row) => row.scope === "global")
    .map((row) => ({
      ...row,
      retailerId,
      retailerName: retailer?.name,
    }));
}

export function useCommissionManagement(selectedRetailerId: string | null) {
  const { message } = App.useApp();
  const [rows, setRows] = useState<CommissionRangeRow[]>(MOCK_COMMISSION_ROWS);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerRow, setDrawerRow] = useState<CommissionRangeRow | null>(null);
  const [historyRow, setHistoryRow] = useState<CommissionRangeRow | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [copyOpen, setCopyOpen] = useState(false);

  const selectedRetailer = useMemo(
    () => MOCK_RETAILERS.find((r) => r.id === selectedRetailerId),
    [selectedRetailerId]
  );

  const filteredRows = useMemo(() => {
    if (!selectedRetailerId) return [];
    return getRetailerCommissionRows(rows, selectedRetailerId);
  }, [rows, selectedRetailerId]);

  const updateRow = useCallback(
    (updated: CommissionRangeRow) => {
      const error = validateCommissionRow(
        updated,
        rows.map((r) => (r.id === updated.id ? updated : r))
      );
      if (error) {
        message.warning(error);
        return;
      }
      setRows((prev) =>
        prev.map((r) =>
          r.id === updated.id
            ? { ...updated, updatedAt: new Date().toISOString() }
            : r
        )
      );
      void saveCommissionRow(updated);
    },
    [rows, message]
  );

  const handleAddCommission = () => {
    if (!selectedRetailerId || !selectedRetailer) return;
    const row = defaultRow("dmt", selectedRetailerId, selectedRetailer.name);
    setRows((prev) => [row, ...prev]);
    message.success("New commission slab added");
  };

  const handleAddRange = () => {
    if (!selectedRetailerId || !selectedRetailer) return;
    const last = filteredRows[0] ?? defaultRow("dmt", selectedRetailerId, selectedRetailer.name);
    const maxTo = Math.max(
      ...filteredRows
        .filter((r) => r.serviceId === last.serviceId)
        .map((r) => r.rangeTo),
      0
    );
    const row: CommissionRangeRow = {
      ...defaultRow(last.serviceId, selectedRetailerId, selectedRetailer.name),
      serviceId: last.serviceId,
      serviceName: last.serviceName,
      rangeFrom: maxTo + 1,
      rangeTo: maxTo + 5000,
      priority: (last.priority ?? 0) + 1,
    };
    setRows((prev) => [...prev, row]);
    message.success(`Range slab added for ${last.serviceName}`);
  };

  const handleDuplicate = (row: CommissionRangeRow) => {
    const copy: CommissionRangeRow = {
      ...row,
      id: createRowId(),
      rangeFrom: row.rangeTo + 1,
      rangeTo: row.rangeTo + 5000,
      priority: row.priority + 1,
    };
    setRows((prev) => [...prev, copy]);
    message.success("Slab duplicated");
  };

  const handleDelete = (row: CommissionRangeRow) => {
    Modal.confirm({
      title: "Delete commission slab?",
      content: `Remove ${row.serviceName} (${row.rangeFrom}–${row.rangeTo})?`,
      okType: "danger",
      onOk: async () => {
        setRows((prev) => prev.filter((r) => r.id !== row.id));
        await deleteCommissionRow(row.id);
        message.success("Slab deleted");
      },
    });
  };

  const handleExport = () => {
    if (!selectedRetailerId) return;
    downloadJson(
      `commissions-${selectedRetailerId}-${Date.now()}.json`,
      filteredRows
    );
    message.success("Commission data exported");
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const parsed = JSON.parse(text) as CommissionRangeRow[];
        if (!Array.isArray(parsed)) throw new Error("Invalid format");
        setRows((prev) => [...prev, ...parsed]);
        await importCommissions(file);
        message.success(`Imported ${parsed.length} slab(s)`);
      } catch {
        message.error("Failed to import commission file");
      }
    };
    input.click();
  };

  const handleBulkUpdate = async (payload: BulkUpdatePayload) => {
    if (!selectedRowKeys.length) {
      message.warning("Select rows to bulk update");
      return;
    }
    setRows((prev) =>
      prev.map((row) => {
        if (!selectedRowKeys.includes(row.id)) return row;
        const next = { ...row };
        const typeKey =
          payload.target === "retailer"
            ? "retailerCommissionType"
            : payload.target === "distributor"
              ? "distributorCommissionType"
              : payload.target === "master_distributor"
                ? "masterDistributorCommissionType"
                : "companyMarginType";
        const valueKey =
          payload.target === "retailer"
            ? "retailerCommission"
            : payload.target === "distributor"
              ? "distributorCommission"
              : payload.target === "master_distributor"
                ? "masterDistributorCommission"
                : "companyMargin";
        if (payload.commissionType) {
          (next as Record<string, unknown>)[typeKey] = payload.commissionType;
        }
        if (payload.commissionValue !== undefined) {
          (next as Record<string, unknown>)[valueKey] = payload.commissionValue;
        }
        if (payload.status) next.status = payload.status;
        if (payload.priority !== undefined) next.priority = payload.priority;
        return next;
      })
    );
    await bulkUpdateCommissions(selectedRowKeys, payload);
    message.success(`Updated ${selectedRowKeys.length} row(s)`);
    setSelectedRowKeys([]);
  };

  const handleCopy = async (payload: CopyCommissionPayload) => {
    setLoading(true);
    try {
      let sourceRows: CommissionRangeRow[] = [];

      if (payload.mode === "service" && payload.sourceServiceId) {
        sourceRows = rows.filter((r) => r.serviceId === payload.sourceServiceId);
      } else if (payload.mode === "full" && payload.sourceRetailerId) {
        sourceRows = getRetailerCommissionRows(rows, payload.sourceRetailerId);
      } else if (
        payload.mode === "clone_retailer" &&
        payload.sourceRetailerId &&
        payload.targetRetailerId
      ) {
        const target = MOCK_RETAILERS.find(
          (r) => r.id === payload.targetRetailerId
        );
        sourceRows = getRetailerCommissionRows(
          rows,
          payload.sourceRetailerId
        ).map((r) => ({
          ...r,
          id: createRowId(),
          scope: "retailer" as const,
          retailerId: payload.targetRetailerId,
          retailerName: target?.name,
        }));
      }

      if (!sourceRows.length) {
        message.warning("No matching commission slabs to copy");
        return;
      }

      const copied = sourceRows.map((r) => ({
        ...r,
        id: createRowId(),
        scope: "retailer" as const,
        updatedAt: new Date().toISOString(),
      }));

      await copyCommissions(payload);
      setRows((prev) => [...prev, ...copied]);
      message.success(`Copied ${copied.length} slab(s)`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDrawer = (row: CommissionRangeRow) => {
    updateRow(row);
    message.success("Commission updated");
  };

  return {
    filteredRows,
    selectedRowKeys,
    setSelectedRowKeys,
    loading,
    drawerRow,
    setDrawerRow,
    historyRow,
    setHistoryRow,
    bulkOpen,
    setBulkOpen,
    copyOpen,
    setCopyOpen,
    handleAddCommission,
    handleAddRange,
    updateRow,
    handleDuplicate,
    handleDelete,
    handleExport,
    handleImport,
    handleBulkUpdate,
    handleCopy,
    handleSaveDrawer,
    totalSlabs: filteredRows.length,
    activeSlabs: filteredRows.filter((r) => r.status === "active").length,
  };
}
