"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { App } from "antd";
import {
  BulkUpdatePayload,
  CommissionRangeRow,
  CopyCommissionPayload,
  FintechService,
} from "@/types/commission";
import { validateCommissionRow } from "@/lib/commission/validation";
import { createRowId, downloadJson } from "@/lib/commission/utils";
import {
  bulkUpdateCommissions,
  copyCommissions,
  deleteCommissionRow,
  fetchRetailerCommissions,
  importCommissions,
  saveRetailerCommissions,
} from "@/services/commissionApi";

export interface CommissionRetailerOption {
  id: string;
  name: string;
  code?: string;
}

function defaultRow(
  service: FintechService | undefined,
  retailerId: string,
  retailerName?: string
): CommissionRangeRow {
  return {
    id: createRowId(),
    serviceId: service?.id ?? "",
    serviceName: service?.name ?? "",
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
    isNew: true,
  };
}

export function useCommissionManagement(
  selectedRetailerId: string | null,
  selectedRetailer: CommissionRetailerOption | undefined,
  services: FintechService[]
) {
  const { message } = App.useApp();
  const [rows, setRows] = useState<CommissionRangeRow[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [drawerRow, setDrawerRow] = useState<CommissionRangeRow | null>(null);
  const [historyRow, setHistoryRow] = useState<CommissionRangeRow | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [copyOpen, setCopyOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const loadCommissions = useCallback(async () => {
    if (!selectedRetailerId) {
      setRows([]);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchRetailerCommissions(
        selectedRetailerId,
        selectedRetailer?.name
      );
      setRows(data);
      setHasUnsavedChanges(false);
      setSelectedRowKeys([]);
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : "Failed to load commissions"
      );
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [message, selectedRetailer?.name, selectedRetailerId]);

  useEffect(() => {
    void loadCommissions();
  }, [loadCommissions]);

  const filteredRows = useMemo(() => {
    if (!selectedRetailerId) return [];
    return rows.filter((row) => row.retailerId === selectedRetailerId);
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
      setHasUnsavedChanges(true);
    },
    [rows, message]
  );

  const handleAddCommission = (service?: FintechService) => {
    if (!selectedRetailerId) return;
    const selectedService = service ?? services[0];
    if (!selectedService) {
      message.warning("No active services found. Add services in Service Master.");
      return;
    }
    const row = defaultRow(
      selectedService,
      selectedRetailerId,
      selectedRetailer?.name
    );
    setRows((prev) => [row, ...prev]);
    setHasUnsavedChanges(true);
    message.success(`Commission slab added for ${selectedService.name}`);
  };

  const handleAddRange = (forRow?: CommissionRangeRow) => {
    if (!selectedRetailerId) return;

    const selectedRows = selectedRowKeys.length
      ? filteredRows.filter((row) => selectedRowKeys.includes(row.id))
      : [];

    const referenceRow =
      forRow ??
      selectedRows[0] ??
      filteredRows[filteredRows.length - 1];

    if (!referenceRow) {
      message.warning("Add a service commission first, then add more slabs.");
      return;
    }

    const sameServiceRows = filteredRows.filter(
      (row) => row.serviceId === referenceRow.serviceId
    );
    const maxTo = Math.max(...sameServiceRows.map((row) => row.rangeTo), 0);
    const maxPriority = Math.max(
      ...sameServiceRows.map((row) => row.priority),
      0
    );

    const row: CommissionRangeRow = {
      ...defaultRow(
        services.find((s) => s.id === referenceRow.serviceId),
        selectedRetailerId,
        selectedRetailer?.name
      ),
      serviceId: referenceRow.serviceId,
      serviceName: referenceRow.serviceName,
      rangeFrom: maxTo + 1,
      rangeTo: maxTo + 5000,
      priority: maxPriority + 1,
    };

    setRows((prev) => [...prev, row]);
    setHasUnsavedChanges(true);
    message.success(`New slab added for ${referenceRow.serviceName}`);
  };

  const handleDuplicate = (row: CommissionRangeRow) => {
    const copy: CommissionRangeRow = {
      ...row,
      id: createRowId(),
      rangeFrom: row.rangeTo + 1,
      rangeTo: row.rangeTo + 5000,
      priority: row.priority + 1,
      isNew: true,
    };
    setRows((prev) => [...prev, copy]);
    setHasUnsavedChanges(true);
    message.success("Slab duplicated");
  };

  const handleDelete = async (row: CommissionRangeRow) => {
    try {
      if (!row.isNew && !row.id.startsWith("comm_")) {
        await deleteCommissionRow(row.id);
      }
      setRows((prev) => prev.filter((r) => r.id !== row.id));
      setSelectedRowKeys((prev) => prev.filter((id) => id !== row.id));
      if (row.isNew || row.id.startsWith("comm_")) {
        setHasUnsavedChanges(true);
      }
      message.success("Slab removed");
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : "Failed to remove slab"
      );
    }
  };

  const handleSaveAll = async () => {
    if (!selectedRetailerId) return;

    for (const row of filteredRows) {
      const error = validateCommissionRow(row, filteredRows);
      if (error) {
        message.error(`${row.serviceName}: ${error}`);
        return;
      }
    }

    setSaving(true);
    try {
      const saved = await saveRetailerCommissions(
        selectedRetailerId,
        filteredRows
      );
      setRows(saved);
      setHasUnsavedChanges(false);
      message.success("Commission slabs saved successfully");
      await loadCommissions();
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : "Failed to save commissions"
      );
    } finally {
      setSaving(false);
    }
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
      if (!file || !selectedRetailerId) return;
      try {
        const text = await file.text();
        const parsed = JSON.parse(text) as CommissionRangeRow[];
        if (!Array.isArray(parsed)) throw new Error("Invalid format");
        const imported = parsed.map((row) => ({
          ...row,
          id: createRowId(),
          retailerId: selectedRetailerId,
          retailerName: selectedRetailer?.name,
          isNew: true,
        }));
        setRows((prev) => [...prev, ...imported]);
        setHasUnsavedChanges(true);
        await importCommissions(file);
        message.success(`Imported ${imported.length} slab(s)`);
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
    setHasUnsavedChanges(true);
    message.success(`Updated ${selectedRowKeys.length} row(s)`);
    setSelectedRowKeys([]);
  };

  const handleCopy = async (payload: CopyCommissionPayload) => {
    setLoading(true);
    try {
      await copyCommissions(payload);
      message.info("Copy commission will be available after backend wiring");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDrawer = (row: CommissionRangeRow) => {
    updateRow(row);
    message.success("Commission updated locally — click Save Changes to persist");
  };

  return {
    filteredRows,
    selectedRowKeys,
    setSelectedRowKeys,
    loading,
    saving,
    hasUnsavedChanges,
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
    handleSaveAll,
    updateRow,
    handleDuplicate,
    handleDelete,
    handleExport,
    handleImport,
    handleBulkUpdate,
    handleCopy,
    handleSaveDrawer,
    reload: loadCommissions,
    totalSlabs: filteredRows.length,
    activeSlabs: filteredRows.filter((r) => r.status === "active").length,
  };
}
