"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { Trash2, Plus } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardHeader } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { DataTable } from "@/components/tables/DataTable";
import { Badge } from "@/components/common/Badge";
import { Modal } from "@/components/modals/Modal";
import { AdminAssignBankAccountModal } from "@/components/admin/AdminAssignBankAccountModal";
import { useAppDispatch, useAppSelector } from "@/hooks/useAppStore";
import {
  fetchAdminDistributors,
  fetchAdminMasterDistributors,
  fetchAdminRetailers,
} from "@/store/api/adminModuleApi";
import {
  getNetworkUserName,
  removeBankAccountAssignment,
} from "@/services/adminApi";
import { AdminNetworkUser } from "@/types/admin";

interface AssignmentRow {
  id: string;
  userTypeLabel: string;
  name: string;
  mobile?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  user: AdminNetworkUser;
}

export function AdminAssignBankAccountView() {
  const dispatch = useAppDispatch();
  const { masterDistributors, distributors, retailers } = useAppSelector(
    (state) => state.adminModule
  );
  const [removeUser, setRemoveUser] = useState<AdminNetworkUser | null>(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const loadUsers = useCallback(() => {
    dispatch(fetchAdminMasterDistributors({ page: 1, pageSize: 200 }));
    dispatch(fetchAdminDistributors({ page: 1, pageSize: 200 }));
    dispatch(fetchAdminRetailers({ page: 1, pageSize: 200 }));
  }, [dispatch]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const assignedRows = useMemo<AssignmentRow[]>(() => {
    const rows: AssignmentRow[] = [];

    const pushUser = (
      user: AdminNetworkUser,
      userTypeLabel: string,
      userType: string
    ) => {
      if (!user.assignedBankAccount?.bankName) return;
      rows.push({
        id: user.id,
        userTypeLabel,
        name: getNetworkUserName(user),
        mobile: user.mobile,
        bankName: user.assignedBankAccount.bankName,
        accountNumber: user.assignedBankAccount.accountNumber,
        ifscCode: user.assignedBankAccount.ifscCode,
        user: { ...user, userType },
      });
    };

    masterDistributors.data.forEach((user) =>
      pushUser(user, "Master Distributor", "MASTER_DISTRIBUTOR")
    );
    distributors.data.forEach((user) =>
      pushUser(user, "Distributor", "DISTRIBUTOR")
    );
    retailers.data.forEach((user) =>
      pushUser(user, "Retailer", "RETAILER")
    );

    return rows;
  }, [masterDistributors.data, distributors.data, retailers.data]);

  const isLoading =
    masterDistributors.isLoading ||
    distributors.isLoading ||
    retailers.isLoading;

  const handleRemove = async () => {
    const bankAccountId =
      removeUser?.assignedBankAccount?.bankAccountId ||
      removeUser?.assignedBankAccount?.id;
    if (!removeUser?.id || !bankAccountId) return;

    setIsRemoving(true);
    try {
      await removeBankAccountAssignment({
        userId: removeUser.id,
        bankAccountId,
      });
      toast.success("Bank assignment removed");
      setRemoveUser(null);
      loadUsers();
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

  const columns: ColumnDef<AssignmentRow, unknown>[] = [
    {
      accessorKey: "userTypeLabel",
      header: "User Type",
      cell: ({ row }) => (
        <Badge variant="default">{row.original.userTypeLabel}</Badge>
      ),
    },
    { accessorKey: "name", header: "Name" },
    { accessorKey: "mobile", header: "Mobile", cell: ({ row }) => row.original.mobile || "—" },
    { accessorKey: "bankName", header: "Assigned Bank" },
    {
      accessorKey: "accountNumber",
      header: "Account Number",
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.accountNumber || "—"}</span>
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
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          aria-label="Remove assignment"
          onClick={() => setRemoveUser(row.original.user)}
        >
          <Trash2 className="h-4 w-4 text-accent-red" />
        </Button>
      ),
    },
  ];

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
        onSuccess={loadUsers}
      />

      <Card>
        <CardHeader
          title="Assigned Bank Accounts"
          subtitle="Users who already have a system bank account assigned"
        />
        <DataTable
          data={assignedRows}
          columns={columns}
          isLoading={isLoading}
          hideSearch
          pageSize={10}
        />
      </Card>

      <Modal
        isOpen={!!removeUser}
        onClose={() => setRemoveUser(null)}
        title="Remove Bank Assignment"
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setRemoveUser(null)}
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
            {removeUser ? getNetworkUserName(removeUser) : "this user"}
          </span>
          ?
        </p>
      </Modal>
    </div>
  );
}
