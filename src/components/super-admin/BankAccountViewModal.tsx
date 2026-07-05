"use client";

import { Modal } from "@/components/modals/Modal";
import { Badge } from "@/components/common/Badge";
import {
  DetailField,
  DetailSection,
} from "@/components/super-admin/NetworkUserDetailSections";
import { BankAccountRecord } from "@/types/bankAccount";
import { formatDate } from "@/lib/utils";

interface BankAccountViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: BankAccountRecord | null;
  isLoading?: boolean;
}

export function BankAccountViewModal({
  isOpen,
  onClose,
  account,
  isLoading = false,
}: BankAccountViewModalProps) {
  const status =
    account?.status || (account?.isActive ? "ACTIVE" : account ? "INACTIVE" : "—");

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Bank Account Details"
      subtitle="System bank account information"
      size="lg"
    >
      {isLoading ? (
        <p className="text-sm text-muted">Loading bank account details...</p>
      ) : account ? (
        <DetailSection title="Account Information">
          <div className="grid gap-4 sm:grid-cols-2">
            <DetailField label="Account Holder" value={account.accountHolderName} />
            <DetailField label="Bank Name" value={account.bankName} />
            <DetailField label="Account Number" value={account.accountNumber} mono />
            <DetailField label="IFSC Code" value={account.ifscCode} mono />
            <DetailField label="Branch Name" value={account.branchName || "—"} />
            <DetailField label="UPI ID" value={account.upiId || "—"} />
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted">
                Status
              </p>
              <div className="mt-1">
                <Badge
                  variant={status.toUpperCase() === "ACTIVE" ? "success" : "default"}
                >
                  {status}
                </Badge>
              </div>
            </div>
            <DetailField
              label="Created At"
              value={account.createdAt ? formatDate(account.createdAt) : "—"}
            />
            <DetailField
              label="Updated At"
              value={account.updatedAt ? formatDate(account.updatedAt) : "—"}
            />
          </div>
        </DetailSection>
      ) : (
        <p className="text-sm text-muted">No bank account data available.</p>
      )}
    </Modal>
  );
}
