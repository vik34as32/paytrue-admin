"use client";

import { AdminDetailRecord } from "@/types/superAdmin";
import {
  formatAdminUserType,
  formatBooleanLabel,
  getAdminBalance,
  getAdminDisplayName,
  getAdminId,
} from "@/lib/normalizeAdmin";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  DetailField,
  DetailGrid,
  DetailSection,
  StatusBadge,
} from "@/components/super-admin/NetworkUserDetailSections";

export function AdminDetailSections({ admin }: { admin: AdminDetailRecord }) {
  const wallet = admin.wallet;

  return (
    <div className="space-y-5">
      <DetailSection title="Personal Information">
        <DetailGrid>
          <DetailField label="First Name" value={admin.firstName} />
          <DetailField label="Last Name" value={admin.lastName} />
          <DetailField label="Full Name" value={getAdminDisplayName(admin)} />
          <DetailField label="Email" value={admin.email} />
          <DetailField label="Mobile Number" value={admin.mobile} />
          <DetailField
            label="Alternate Mobile"
            value={admin.alternateMobileNumber}
          />
          <DetailField label="User Type" value={formatAdminUserType(admin.userType)} />
          <DetailField label="Status" value={admin.status} />
        </DetailGrid>
      </DetailSection>

      <DetailSection title="Wallet Details">
        <DetailGrid>
          <DetailField
            label="Wallet Balance"
            value={formatCurrency(getAdminBalance(admin))}
          />
          <DetailField
            label="Hold Amount"
            value={
              wallet?.holdAmount != null
                ? formatCurrency(Number(wallet.holdAmount) || 0)
                : undefined
            }
          />
          <DetailField label="Wallet Status" value={wallet?.status} />
          <DetailField label="Currency" value={wallet?.currency} />
          <DetailField label="Card Number" value={wallet?.cardNumber} mono />
          <DetailField label="Card Holder Name" value={wallet?.cardHolderName} />
          <DetailField label="Expiry Date" value={wallet?.expiryDate} />
          <DetailField label="Retailer Code" value={wallet?.retailerCode} mono />
        </DetailGrid>
      </DetailSection>

      <DetailSection title="Verification & Activity">
        <DetailGrid>
          <DetailField
            label="Email Verified"
            value={formatBooleanLabel(admin.isEmailVerified)}
          />
          <DetailField
            label="Mobile Verified"
            value={formatBooleanLabel(admin.mobileVerified)}
          />
          <DetailField
            label="Mobile Verified At"
            value={
              admin.mobileVerifiedAt
                ? formatDate(admin.mobileVerifiedAt)
                : undefined
            }
          />
          <DetailField
            label="Last Login"
            value={admin.lastLoginAt ? formatDate(admin.lastLoginAt) : undefined}
          />
          <DetailField label="Last Login IP" value={admin.lastLoginIp} mono />
        </DetailGrid>
      </DetailSection>

      <DetailSection title="Account Metadata">
        <DetailGrid>
          <DetailField label="Admin ID" value={getAdminId(admin)} mono />
          <DetailField label="User Code" value={admin.userCode} mono />
          <DetailField label="User ID" value={admin.id} mono />
          <DetailField label="Parent ID" value={admin.parentId} mono />
          <DetailField label="Created By ID" value={admin.createdById} mono />
          <DetailField
            label="Created Date"
            value={admin.createdAt ? formatDate(admin.createdAt) : undefined}
          />
          <DetailField
            label="Updated Date"
            value={admin.updatedAt ? formatDate(admin.updatedAt) : undefined}
          />
          <DetailField label="Tenant ID" value={admin.tenantId ?? undefined} mono />
        </DetailGrid>
      </DetailSection>
    </div>
  );
}

export { StatusBadge, getAdminDisplayName, getAdminBalance, getAdminId };
