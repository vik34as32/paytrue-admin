"use client";

import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/common/Badge";
import {
  formatBooleanLabel,
  formatUserTypeLabel,
  getHierarchyLabel,
  getUserAadhaarNumber,
  getUserDisplayRole,
  getUserOutletField,
  getUserOutletName,
  getUserPanNumber,
  getWalletBalance,
} from "@/lib/normalizeUser";
import { UserDetailRecord } from "@/types/superAdmin";
import { LucideIcon } from "lucide-react";

export function DetailSection({
  title,
  icon: Icon,
  children,
  className,
}: {
  title: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-border bg-background/50 p-5 shadow-sm",
        className
      )}
    >
      <div className="mb-4 flex items-center gap-2 border-b border-border pb-3">
        {Icon && <Icon className="h-4 w-4 text-primary" />}
        <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">
          {title}
        </h3>
      </div>
      {children}
    </section>
  );
}

export function DetailGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
  );
}

export function DetailField({
  label,
  value,
  mono = false,
}: {
  label: string;
  value?: string | number | null;
  mono?: boolean;
}) {
  const display =
    value === null || value === undefined || value === "" ? "—" : String(value);

  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 break-words text-sm font-medium text-foreground",
          mono && "font-mono text-xs"
        )}
      >
        {display}
      </p>
    </div>
  );
}

export function StatusBadge({ status }: { status?: string }) {
  if (!status) return <Badge variant="default">—</Badge>;
  const normalized = status.toLowerCase();
  const variant =
    normalized === "active"
      ? "active"
      : normalized === "suspended"
        ? "suspended"
        : normalized === "inactive"
          ? "inactive"
          : normalized === "pending"
            ? "pending"
            : "default";

  return <Badge variant={variant}>{status}</Badge>;
}

export function VerificationBadge({ verified }: { verified?: boolean }) {
  return (
    <Badge variant={verified ? "success" : "pending"}>
      {formatBooleanLabel(verified)}
    </Badge>
  );
}

export function UserDetailSections({ user }: { user: UserDetailRecord }) {
  const hierarchy = getHierarchyLabel(user);
  const outlet = user.outlet;
  const wallet = user.wallet;
  const hasKyc =
    !!user.kyc ||
    getUserAadhaarNumber(user) !== "—" ||
    getUserPanNumber(user) !== "—";
  const hasBank = !!user.bankAccount;

  return (
    <div className="space-y-5">
      <DetailSection title="Personal Information">
        <DetailGrid>
          <DetailField label="First Name" value={user.firstName} />
          <DetailField label="Last Name" value={user.lastName} />
          <DetailField label="Full Name" value={user.name} />
          <DetailField label="Email" value={user.email} />
          <DetailField label="Mobile Number" value={user.mobile} />
          <DetailField
            label="Alternate Mobile"
            value={user.alternateMobileNumber}
          />
          <DetailField label="User Code" value={user.userCode} mono />
          <DetailField label="User Type" value={formatUserTypeLabel(user.userType)} />
          <DetailField label="Role" value={getUserDisplayRole(user)} />
          <DetailField label="Status" value={user.status} />
        </DetailGrid>
      </DetailSection>

      <DetailSection title="Outlet & Business">
        <DetailGrid>
          <DetailField label="Business Name" value={user.businessName || getUserOutletName(user)} />
          <DetailField label="Outlet Name" value={getUserOutletName(user)} />
          <DetailField label="Business Type" value={outlet?.businessType} />
          <DetailField label="GST Number" value={outlet?.gstNumber} mono />
          <DetailField label="Address" value={getUserOutletField(user, "address")} />
          <DetailField label="State" value={getUserOutletField(user, "state")} />
          <DetailField label="District" value={outlet?.district} />
          <DetailField label="City" value={getUserOutletField(user, "city")} />
          <DetailField label="Village / Area" value={outlet?.village} />
          <DetailField label="Pincode" value={outlet?.pincode} />
          <DetailField label="Latitude" value={outlet?.latitude != null ? String(outlet.latitude) : undefined} />
          <DetailField label="Longitude" value={outlet?.longitude != null ? String(outlet.longitude) : undefined} />
          <DetailField label="Mini KYC Status" value={outlet?.miniKycStatus ?? undefined} />
          <DetailField
            label="KYC Completed At"
            value={outlet?.kycCompletedAt ? formatDate(outlet.kycCompletedAt) : undefined}
          />
        </DetailGrid>
      </DetailSection>

      <DetailSection title="Wallet Details">
        <DetailGrid>
          <DetailField
            label="Wallet Balance"
            value={formatCurrency(getWalletBalance(user))}
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
          <DetailField label="Retailer / User Code" value={wallet?.retailerCode} mono />
        </DetailGrid>
      </DetailSection>

      {hasKyc && (
        <DetailSection title="KYC Details">
          <DetailGrid>
            <DetailField label="Aadhaar Number" value={getUserAadhaarNumber(user)} mono />
            <DetailField label="PAN Number" value={getUserPanNumber(user)} mono />
            <DetailField
              label="KYC Status"
              value={user.kycStatus || user.kyc?.kycStatus || user.kyc?.status}
            />
          </DetailGrid>
        </DetailSection>
      )}

      {hasBank && (
        <DetailSection title="Bank Account">
          <DetailGrid>
            <DetailField label="Account Holder" value={user.bankAccount?.accountHolderName} />
            <DetailField label="Bank Name" value={user.bankAccount?.bankName} />
            <DetailField label="Account Number" value={user.bankAccount?.accountNumber} mono />
            <DetailField label="IFSC Code" value={user.bankAccount?.ifscCode} mono />
          </DetailGrid>
        </DetailSection>
      )}

      <DetailSection title="Verification & Activity">
        <DetailGrid>
          <DetailField label="Email Verified" value={formatBooleanLabel(user.isEmailVerified)} />
          <DetailField label="Mobile Verified" value={formatBooleanLabel(user.mobileVerified)} />
          <DetailField
            label="Mobile Verified At"
            value={user.mobileVerifiedAt ? formatDate(user.mobileVerifiedAt) : undefined}
          />
          <DetailField
            label="Last Login"
            value={user.lastLoginAt ? formatDate(user.lastLoginAt) : undefined}
          />
          <DetailField label="Last Login IP" value={user.lastLoginIp} mono />
        </DetailGrid>
      </DetailSection>

      <DetailSection title="Hierarchy">
        <DetailGrid>
          <DetailField label="Parent User" value={hierarchy.parentUser} />
          <DetailField label="Distributor" value={hierarchy.distributor} />
          <DetailField label="Master Distributor" value={hierarchy.masterDistributor} />
          <DetailField label="Parent ID" value={user.parentId} mono />
          <DetailField label="Created By ID" value={user.createdById} mono />
        </DetailGrid>
      </DetailSection>

      <DetailSection title="Account Metadata">
        <DetailGrid>
          <DetailField label="User ID" value={user.id} mono />
          <DetailField
            label="Created Date"
            value={user.createdAt ? formatDate(user.createdAt) : undefined}
          />
          <DetailField
            label="Updated Date"
            value={user.updatedAt ? formatDate(user.updatedAt) : undefined}
          />
          <DetailField label="Tenant ID" value={user.tenantId ?? undefined} mono />
        </DetailGrid>
      </DetailSection>
    </div>
  );
}
