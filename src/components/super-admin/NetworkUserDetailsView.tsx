"use client";

import { useEffect, useMemo, useState, type ComponentType, type ReactNode } from "react";
import {
  Activity,
  Building2,
  CalendarDays,
  CircleDollarSign,
  FileText,
  Hash,
  IndianRupee,
  Landmark,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  User,
  Wallet,
} from "lucide-react";
import { Modal } from "@/components/modals/Modal";
import { Badge } from "@/components/common/Badge";
import { MailtoLink } from "@/components/common/MailtoLink";
import { NetworkUserAvatar } from "@/components/super-admin/NetworkUserAvatar";
import {
  DetailField,
  DetailGrid,
  DetailSection,
  StatusBadge,
} from "@/components/super-admin/NetworkUserDetailSections";
import { DocumentGallery } from "@/components/verification/DocumentThumbStack";
import { VerificationBadge } from "@/components/verification/VerificationBadge";
import { VerificationCard } from "@/components/verification/VerificationCard";
import { useUserWalletBalances } from "@/hooks/useWalletDetails";
import { getUserVerificationStatus } from "@/lib/idVerification";
import {
  formatUserTypeLabel,
  getNetworkUserName,
  getUserAadhaarNumber,
  getUserFirstName,
  getUserOutletField,
  getUserOutletId,
  getUserOutletName,
  getUserPanNumber,
  getWalletBalance,
} from "@/lib/normalizeUser";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { UserDetailRecord } from "@/types/superAdmin";

type DetailsTab =
  | "overview"
  | "kyc"
  | "personal"
  | "address"
  | "bank"
  | "documents"
  | "activity";

const TABS: { id: DetailsTab; label: string; icon: ComponentType<{ className?: string }> }[] = [
  { id: "overview", label: "Overview", icon: User },
  { id: "kyc", label: "KYC & Verification", icon: ShieldCheck },
  { id: "personal", label: "Personal Details", icon: FileText },
  { id: "address", label: "Address", icon: MapPin },
  { id: "bank", label: "Bank Details", icon: Landmark },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "activity", label: "Activity Log", icon: Activity },
];

interface NetworkUserDetailsViewProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserDetailRecord | null;
  isLoading?: boolean;
}

function InfoRow({
  icon: Icon,
  label,
  children,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-border/70 py-3 last:border-b-0">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
          {label}
        </p>
        <div className="mt-0.5 text-sm font-medium text-foreground">{children}</div>
      </div>
    </div>
  );
}

function WalletStatCard({
  label,
  value,
  icon: Icon,
  accent,
  loading,
}: {
  label: string;
  value: number;
  icon: ComponentType<{ className?: string }>;
  accent: string;
  loading?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <span className={cn("rounded-xl p-2", accent)}>
          <Icon className="h-4 w-4" />
        </span>
        <p className="text-xs font-semibold text-muted">{label}</p>
      </div>
      {loading ? (
        <div className="h-7 w-28 animate-pulse rounded-md bg-muted/40" />
      ) : (
        <p className="text-xl font-bold tracking-tight text-foreground">
          {formatCurrency(value)}
        </p>
      )}
    </div>
  );
}

function MetaDateCard({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div className="min-w-[140px] rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
      <div className="mb-1 flex items-center gap-1.5 text-muted">
        <CalendarDays className="h-3.5 w-3.5" />
        <p className="text-[10px] font-semibold uppercase tracking-wide">{label}</p>
      </div>
      <p className="text-sm font-semibold text-foreground">
        {value ? formatDate(value, "dd MMM yyyy") : "—"}
      </p>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: ReactNode;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/70 py-2.5 last:border-b-0">
      <p className="text-sm text-muted">{label}</p>
      <p className={cn("text-sm font-semibold text-foreground", valueClassName)}>
        {value}
      </p>
    </div>
  );
}

export function NetworkUserDetailsView({
  isOpen,
  onClose,
  user,
  isLoading = false,
}: NetworkUserDetailsViewProps) {
  const [tab, setTab] = useState<DetailsTab>("overview");

  useEffect(() => {
    if (isOpen) setTab("overview");
  }, [isOpen, user?.id]);

  const isRetailer = useMemo(() => {
    const role = String(user?.userType || user?.role || "").toUpperCase();
    return role === "RETAILER";
  }, [user?.userType, user?.role]);

  const userRole = String(user?.userType || user?.role || "").toUpperCase();

  const walletSearch = useMemo(() => {
    if (!user) return undefined;
    return (
      user.userCode?.trim() ||
      user.email?.trim() ||
      user.mobile?.trim() ||
      user.id
    );
  }, [user]);

  const walletQuery = useUserWalletBalances(
    {
      userId: user?.id || null,
      role: userRole || undefined,
      search: walletSearch,
    },
    isOpen && !!user?.id
  );

  const displayName = useMemo(() => {
    if (!user) return "—";
    return isRetailer ? getUserFirstName(user) : getNetworkUserName(user);
  }, [user, isRetailer]);

  const verificationStatus = user
    ? getUserVerificationStatus(user)
    : "PENDING";

  const wallets = walletQuery.data;
  const walletsLoading = walletQuery.isLoading || walletQuery.isFetching;
  const mainBalance =
    wallets?.mainWallet ??
    (user ? getWalletBalance(user) : 0);
  const commissionBalance = wallets?.commissionWallet ?? 0;
  const aepsBalance = wallets?.aepsWallet ?? 0;
  const holdBalance =
    wallets?.holdBalance ??
    (user?.wallet?.holdAmount != null
      ? Number(user.wallet.holdAmount) || 0
      : 0);

  const phone =
    user?.mobile ||
    (typeof user?.phone === "string" ? user.phone : "") ||
    "";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="View User Details"
      subtitle="Detailed information of the selected user."
      size="full"
    >
      {isLoading || (!user && isOpen) ? (
        <div className="flex min-h-[420px] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : !user ? (
        <p className="py-16 text-center text-sm text-muted">
          No user details available.
        </p>
      ) : (
        <div className="space-y-5">
          {/* Profile header */}
          <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/[0.04] via-card to-card p-5 shadow-sm">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start">
                <NetworkUserAvatar user={user} size="lg" className="!h-20 !w-20 !text-xl" />
                <div className="min-w-0 space-y-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-2xl font-bold text-foreground">
                      {displayName}
                    </h3>
                    <StatusBadge status={user.status} />
                    <VerificationBadge status={verificationStatus} />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="default">
                      {formatUserTypeLabel(user.userType || user.role)}
                    </Badge>
                    {user.userCode ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-2.5 py-0.5 font-mono text-xs font-semibold text-foreground">
                        <Hash className="h-3 w-3 text-muted" />
                        {user.userCode}
                      </span>
                    ) : null}
                    {isRetailer ? (
                      <span className="inline-flex items-center rounded-full bg-sky-50 px-2.5 py-0.5 font-mono text-xs font-semibold text-sky-700 ring-1 ring-sky-200/60">
                        Outlet {getUserOutletId(user)}
                      </span>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Phone className="h-4 w-4 text-muted" />
                      {phone || "—"}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Mail className="h-4 w-4 text-muted" />
                      <MailtoLink email={user.email} />
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 lg:justify-end">
                <MetaDateCard label="Joined On" value={user.createdAt} />
                <MetaDateCard label="Last Updated" value={user.updatedAt} />
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="overflow-x-auto border-b border-border">
            <div className="flex min-w-max gap-1">
              {TABS.map((item) => {
                const Icon = item.icon;
                const active = tab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTab(item.id)}
                    className={cn(
                      "inline-flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors",
                      active
                        ? "border-primary text-primary"
                        : "border-transparent text-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Wallet cards — same data as Wallet Management (role + search filter). AEPS only for retailer */}
          {(tab === "overview" || tab === "activity") && (
            <div
              className={cn(
                "grid gap-3",
                isRetailer
                  ? "sm:grid-cols-2 xl:grid-cols-4"
                  : "sm:grid-cols-2 xl:grid-cols-3"
              )}
            >
              <WalletStatCard
                label="Main Wallet Balance"
                value={mainBalance}
                icon={Wallet}
                accent="bg-violet-100 text-violet-700"
                loading={walletsLoading && !wallets}
              />
              <WalletStatCard
                label="Commission Wallet"
                value={commissionBalance}
                icon={CircleDollarSign}
                accent="bg-emerald-100 text-emerald-700"
                loading={walletsLoading && !wallets}
              />
              {isRetailer ? (
                <WalletStatCard
                  label="AEPS Wallet Balance"
                  value={aepsBalance}
                  icon={IndianRupee}
                  accent="bg-sky-100 text-sky-700"
                  loading={walletsLoading && !wallets}
                />
              ) : null}
              <WalletStatCard
                label="Hold Balance"
                value={holdBalance}
                icon={Lock}
                accent="bg-amber-100 text-amber-700"
                loading={walletsLoading && !wallets}
              />
            </div>
          )}

          {tab === "overview" ? (
            <div className="grid gap-5 lg:grid-cols-[1.2fr_0.9fr]">
              <DetailSection title="User Information" icon={User}>
                <div className="space-y-0">
                  <InfoRow icon={User} label="Full Name">
                    {getNetworkUserName(user)}
                  </InfoRow>
                  <InfoRow icon={Hash} label="User Code">
                    <span className="font-mono">{user.userCode || "—"}</span>
                  </InfoRow>
                  <InfoRow icon={ShieldCheck} label="User Type">
                    <Badge variant="default">
                      {formatUserTypeLabel(user.userType || user.role)}
                    </Badge>
                  </InfoRow>
                  <InfoRow icon={Phone} label="Mobile">
                    {phone || "—"}
                  </InfoRow>
                  <InfoRow icon={Phone} label="Alternate Mobile">
                    {user.alternateMobileNumber || "—"}
                  </InfoRow>
                  <InfoRow icon={Mail} label="Email">
                    <MailtoLink email={user.email} />
                  </InfoRow>
                  <InfoRow icon={Activity} label="Status">
                    <StatusBadge status={user.status} />
                  </InfoRow>
                  <InfoRow icon={Building2} label="Business Name">
                    {user.businessName || getUserOutletName(user)}
                  </InfoRow>
                  <InfoRow icon={CalendarDays} label="Created At">
                    {user.createdAt
                      ? formatDate(user.createdAt, "dd MMM yyyy, HH:mm")
                      : "—"}
                  </InfoRow>
                </div>
              </DetailSection>

              <div className="space-y-5">
                <DetailSection title="Financial Summary" icon={Wallet}>
                  <SummaryRow
                    label="Main Wallet"
                    value={formatCurrency(mainBalance)}
                  />
                  <SummaryRow
                    label="Commission Wallet"
                    value={formatCurrency(commissionBalance)}
                  />
                  {isRetailer ? (
                    <SummaryRow
                      label="AEPS Wallet"
                      value={formatCurrency(aepsBalance)}
                    />
                  ) : null}
                  <SummaryRow
                    label="Hold Balance"
                    value={formatCurrency(holdBalance)}
                    valueClassName="text-amber-700"
                  />
                  <SummaryRow
                    label="Available Balance"
                    value={formatCurrency(
                      wallets?.availableBalance ??
                        Math.max(0, mainBalance - holdBalance)
                    )}
                    valueClassName="text-emerald-700"
                  />
                  <SummaryRow
                    label="Last Login"
                    value={
                      user.lastLoginAt
                        ? formatDate(user.lastLoginAt, "dd MMM yyyy, HH:mm")
                        : "—"
                    }
                  />
                  <SummaryRow
                    label="Last Login IP"
                    value={user.lastLoginIp || "—"}
                  />
                </DetailSection>

                <DetailSection title="KYC Verification" icon={ShieldCheck}>
                  <SummaryRow
                    label="Verification Status"
                    value={<VerificationBadge status={verificationStatus} />}
                  />
                  <SummaryRow
                    label="Aadhaar"
                    value={
                      <span className="font-mono text-xs">
                        {getUserAadhaarNumber(user)}
                      </span>
                    }
                  />
                  <SummaryRow
                    label="PAN"
                    value={
                      <span className="font-mono text-xs">
                        {getUserPanNumber(user)}
                      </span>
                    }
                  />
                  <SummaryRow
                    label="Mini KYC"
                    value={user.outlet?.miniKycStatus || user.kycStatus || "—"}
                  />
                  <SummaryRow
                    label="Verified At"
                    value={
                      user.verifiedAt
                        ? formatDate(user.verifiedAt, "dd MMM yyyy, HH:mm")
                        : "—"
                    }
                  />
                </DetailSection>
              </div>
            </div>
          ) : null}

          {tab === "kyc" ? (
            <div className="space-y-5">
              <VerificationCard
                userId={user.id}
                userName={displayName}
                fallbackStatus={user.verificationStatus}
                canManage={false}
                showHistory
              />
              <DetailSection title="KYC Identifiers" icon={ShieldCheck}>
                <DetailGrid>
                  <DetailField
                    label="Aadhaar Number"
                    value={getUserAadhaarNumber(user)}
                    mono
                  />
                  <DetailField
                    label="PAN Number"
                    value={getUserPanNumber(user)}
                    mono
                  />
                  <DetailField
                    label="KYC Status"
                    value={
                      user.kycStatus ||
                      user.kyc?.kycStatus ||
                      user.kyc?.status ||
                      user.outlet?.miniKycStatus
                    }
                  />
                  <DetailField
                    label="KYC Completed At"
                    value={
                      user.outlet?.kycCompletedAt
                        ? formatDate(user.outlet.kycCompletedAt)
                        : undefined
                    }
                  />
                </DetailGrid>
              </DetailSection>
            </div>
          ) : null}

          {tab === "personal" ? (
            <DetailSection title="Personal Details" icon={User}>
              <DetailGrid>
                <DetailField label="First Name" value={user.firstName} />
                <DetailField label="Last Name" value={user.lastName} />
                <DetailField label="Full Name" value={getNetworkUserName(user)} />
                <DetailField label="Email" value={user.email} />
                <DetailField label="Mobile" value={phone} />
                <DetailField
                  label="Alternate Mobile"
                  value={user.alternateMobileNumber}
                />
                <DetailField label="User Code" value={user.userCode} mono />
                <DetailField
                  label="User Type"
                  value={formatUserTypeLabel(user.userType || user.role)}
                />
                <DetailField label="Status" value={user.status} />
                <DetailField
                  label="Email Verified"
                  value={
                    user.isEmailVerified === undefined
                      ? undefined
                      : user.isEmailVerified
                        ? "Yes"
                        : "No"
                  }
                />
                <DetailField
                  label="Mobile Verified"
                  value={
                    user.mobileVerified === undefined
                      ? undefined
                      : user.mobileVerified
                        ? "Yes"
                        : "No"
                  }
                />
              </DetailGrid>
            </DetailSection>
          ) : null}

          {tab === "address" ? (
            <DetailSection title="Address & Outlet" icon={MapPin}>
              <DetailGrid>
                <DetailField
                  label="Business Name"
                  value={user.businessName || getUserOutletName(user)}
                />
                <DetailField label="Outlet Name" value={getUserOutletName(user)} />
                <DetailField label="Outlet ID" value={getUserOutletId(user)} mono />
                <DetailField
                  label="Business Type"
                  value={user.outlet?.businessType}
                />
                <DetailField
                  label="GST Number"
                  value={user.outlet?.gstNumber}
                  mono
                />
                <DetailField
                  label="Address"
                  value={getUserOutletField(user, "address")}
                />
                <DetailField
                  label="State"
                  value={getUserOutletField(user, "state")}
                />
                <DetailField label="District" value={user.outlet?.district} />
                <DetailField
                  label="City"
                  value={getUserOutletField(user, "city")}
                />
                <DetailField label="Village / Area" value={user.outlet?.village} />
                <DetailField label="Pincode" value={user.outlet?.pincode} />
                <DetailField
                  label="Latitude"
                  value={
                    user.outlet?.latitude != null
                      ? String(user.outlet.latitude)
                      : undefined
                  }
                />
                <DetailField
                  label="Longitude"
                  value={
                    user.outlet?.longitude != null
                      ? String(user.outlet.longitude)
                      : undefined
                  }
                />
              </DetailGrid>
            </DetailSection>
          ) : null}

          {tab === "bank" ? (
            <DetailSection title="Bank Details" icon={Landmark}>
              {user.bankAccount ? (
                <DetailGrid>
                  <DetailField
                    label="Account Holder"
                    value={user.bankAccount.accountHolderName}
                  />
                  <DetailField label="Bank Name" value={user.bankAccount.bankName} />
                  <DetailField
                    label="Account Number"
                    value={user.bankAccount.accountNumber}
                    mono
                  />
                  <DetailField
                    label="IFSC Code"
                    value={user.bankAccount.ifscCode}
                    mono
                  />
                </DetailGrid>
              ) : (
                <p className="text-sm text-muted">No bank account details found.</p>
              )}
            </DetailSection>
          ) : null}

          {tab === "documents" ? (
            <DetailSection title="Documents" icon={FileText}>
              <DocumentGallery user={user} />
            </DetailSection>
          ) : null}

          {tab === "activity" ? (
            <DetailSection title="Activity Log" icon={Activity}>
              <DetailGrid>
                <DetailField
                  label="Last Login"
                  value={
                    user.lastLoginAt
                      ? formatDate(user.lastLoginAt, "dd MMM yyyy, HH:mm")
                      : undefined
                  }
                />
                <DetailField label="Last Login IP" value={user.lastLoginIp} mono />
                <DetailField
                  label="Created At"
                  value={
                    user.createdAt
                      ? formatDate(user.createdAt, "dd MMM yyyy, HH:mm")
                      : undefined
                  }
                />
                <DetailField
                  label="Updated At"
                  value={
                    user.updatedAt
                      ? formatDate(user.updatedAt, "dd MMM yyyy, HH:mm")
                      : undefined
                  }
                />
                <DetailField
                  label="Mobile Verified At"
                  value={
                    user.mobileVerifiedAt
                      ? formatDate(user.mobileVerifiedAt, "dd MMM yyyy, HH:mm")
                      : undefined
                  }
                />
                <DetailField
                  label="Verified At"
                  value={
                    user.verifiedAt
                      ? formatDate(String(user.verifiedAt), "dd MMM yyyy, HH:mm")
                      : undefined
                  }
                />
              </DetailGrid>
            </DetailSection>
          ) : null}
        </div>
      )}
    </Modal>
  );
}
