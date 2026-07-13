"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { Trash2, Plus, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardHeader } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { DataTable } from "@/components/tables/DataTable";
import { Badge } from "@/components/common/Badge";
import { Modal } from "@/components/modals/Modal";
import { AdminAssignBankAccountModal } from "@/components/admin/AdminAssignBankAccountModal";
import { removeBankAccountAssignment } from "@/services/adminApi";
import {
  getAdminBankAccounts,
  getBankAccountAssignments,
} from "@/services/bankAccountApi";
import { createBankAccountListColumns } from "@/lib/bankAccountColumns";
import { formatDate } from "@/lib/utils";
import {
  BankAccountAssignmentRecord,
  BankAccountRecord,
} from "@/types/bankAccount";

export function AdminAssignBankAccountView() {
  const [removeTarget, setRemoveTarget] =
    useState<BankAccountAssignmentRecord | null>(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const [bankAccounts, setBankAccounts] = useState<BankAccountRecord[]>([]);
  const [isLoadingBanks, setIsLoadingBanks] = useState(false);
  const [banksError, setBanksError] = useState<string | null>(null);

  const [assignments, setAssignments] = useState<BankAccountAssignmentRecord[]>(
    []
  );
  const [assignmentsTotal, setAssignmentsTotal] = useState(0);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);
  const [assignmentsError, setAssignmentsError] = useState<string | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");

  const bankColumns = useMemo(() => createBankAccountListColumns(), []);

  const loadBankAccounts = useCallback(async () => {
    setIsLoadingBanks(true);
    setBanksError(null);
    try {
      const accounts = await getAdminBankAccounts({ page: 1, pageSize: 100 });
      setBankAccounts(accounts);
    } catch (error) {
      setBanksError(
        error instanceof Error ? error.message : "Failed to load bank accounts"
      );
    } finally {
      setIsLoadingBanks(false);
    }
  }, []);

  const loadAssignments = useCallback(async () => {
    setIsLoadingAssignments(true);
    setAssignmentsError(null);
    try {
      const result = await getBankAccountAssignments({
        page: pageIndex + 1,
        pageSize,
        search: search || undefined,
      });
      setAssignments(result.data);
      setAssignmentsTotal(result.total);
    } catch (error) {
      setAssignments([]);
      setAssignmentsTotal(0);
      setAssignmentsError(
        error instanceof Error
          ? error.message
          : "Failed to load bank account assignments"
      );
    } finally {
      setIsLoadingAssignments(false);
    }
  }, [pageIndex, pageSize, search]);

  useEffect(() => {
    void loadBankAccounts();
  }, [loadBankAccounts]);

  useEffect(() => {
    void loadAssignments();
  }, [loadAssignments]);

  const handleRemove = async () => {
    if (!removeTarget?.userId || !removeTarget.bankAccountId) {
      toast.error("Missing assignment details");
      return;
    }

    setIsRemoving(true);
    try {
      const result = await removeBankAccountAssignment({
        userId: removeTarget.userId,
        bankAccountId: removeTarget.bankAccountId,
      });
      toast.success(result.message);
      setRemoveTarget(null);
      await loadAssignments();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to remove bank assignment"
      );
    } finally {
      setIsRemoving(false);
    }
  };

  const columns: ColumnDef<BankAccountAssignmentRecord, unknown>[] = [
    {
      accessorKey: "userTypeLabel",
      header: "User Type",
      cell: ({ row }) => (
        <Badge variant="default">{row.original.userTypeLabel || "—"}</Badge>
      ),
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-foreground">{row.original.name}</p>
          {row.original.userCode ? (
            <p className="text-xs text-muted">{row.original.userCode}</p>
          ) : null}
        </div>
      ),
    },
    {
      accessorKey: "mobile",
      header: "Mobile",
      cell: ({ row }) => row.original.mobile || "—",
    },
    {
      accessorKey: "bankName",
      header: "Assigned Bank",
      cell: ({ row }) => row.original.bankName || "—",
    },
    {
      accessorKey: "accountNumber",
      header: "Account Number",
      cell: ({ row }) => (
        <span className="font-mono text-xs">
          {row.original.accountNumber || "—"}
        </span>
      ),
    },
    {
      accessorKey: "ifscCode",
      header: "IFSC",
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.ifscCode || "—"}</span>
      ),
    },
    {
      accessorKey: "assignedAt",
      header: "Assigned On",
      cell: ({ row }) =>
        row.original.assignedAt ? formatDate(row.original.assignedAt) : "—",
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          aria-label="Remove assignment"
          onClick={() => setRemoveTarget(row.original)}
        >
          <Trash2 className="h-4 w-4 text-accent-red" />
        </Button>
      ),
    },
  ];

  const pageCount = Math.max(1, Math.ceil(assignmentsTotal / pageSize));

  return (
    <div className="page-container space-y-6">
      <PageHeader
        breadcrumb="Admin"
        title="Assign Bank Account"
        subtitle="Assign super admin system bank accounts to your network users"
        action={
          <Button onClick={() => setAssignModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Assign Bank Account
          </Button>
        }
      />

      <AdminAssignBankAccountModal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        onSuccess={() => {
          void loadAssignments();
          void loadBankAccounts();
        }}
        bankAccounts={bankAccounts}
        isLoadingBanks={isLoadingBanks}
      />

      <Card>
        <CardHeader
          title="System Bank Accounts"
          subtitle="Active bank accounts from PayTrue (used for assignment)"
        />
        {banksError ? (
          <div className="mb-4 rounded-xl border border-accent-red/30 bg-accent-red/10 px-4 py-3 text-sm text-accent-red">
            {banksError}
          </div>
        ) : null}
        <DataTable
          data={bankAccounts}
          columns={bankColumns}
          isLoading={isLoadingBanks}
          hideSearch
          pageSize={10}
        />
      </Card>

      <Card>
        <CardHeader
          title="Assigned Bank Accounts"
          subtitle="Users who already have a system bank account assigned"
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => void loadAssignments()}
              disabled={isLoadingAssignments}
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoadingAssignments ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          }
        />
        {assignmentsError ? (
          <div className="mb-4 rounded-xl border border-accent-red/30 bg-accent-red/10 px-4 py-3 text-sm text-accent-red">
            {assignmentsError}
          </div>
        ) : null}
        <DataTable
          data={assignments}
          columns={columns}
          isLoading={isLoadingAssignments}
          searchPlaceholder="Search assignments..."
          onSearch={(value) => {
            setSearch(value);
            setPageIndex(0);
          }}
          manualPagination
          pageCount={pageCount}
          pageIndex={pageIndex}
          onPageChange={setPageIndex}
          pageSize={pageSize}
        />
      </Card>

      <Modal
        isOpen={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        title="Remove Bank Assignment"
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setRemoveTarget(null)}
              disabled={isRemoving}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => void handleRemove()}
              isLoading={isRemoving}
            >
              Remove
            </Button>
          </div>
        }
      >
        <p className="text-sm text-foreground">
          Remove bank assignment for{" "}
          <span className="font-semibold">
            {removeTarget?.name || "this user"}
          </span>
          {removeTarget?.bankName ? (
            <>
              {" "}
              from <span className="font-semibold">{removeTarget.bankName}</span>
            </>
          ) : null}
          ?
        </p>
      </Modal>
    </div>
  );
}
