"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { VerifyUserDialog } from "@/components/verification/VerifyUserDialog";
import { RejectUserDialog } from "@/components/verification/RejectUserDialog";
import { ReasonDialog } from "@/components/verification/ReasonDialog";
import { VerificationDetailsDialog } from "@/components/verification/VerificationDetailsDialog";
import { WalletTransferActionModal } from "@/components/wallet-management/WalletTransferActionModal";
import { WalletDeductActionModal } from "@/components/wallet-management/WalletDeductActionModal";
import {
  useRejectUser,
  useVerification,
  useVerifyUser,
} from "@/hooks/useIdVerification";
import { getUserVerificationStatus } from "@/lib/idVerification";
import { getNetworkUserName } from "@/lib/normalizeUser";
import {
  deductWalletBalance,
  transferWalletBalance,
} from "@/services/wallet.service";
import { NetworkUserRecord } from "@/types/superAdmin";
import { IdVerificationStatus, UserVerificationInfo } from "@/types/idVerification";
import { WalletUser, WalletUserRole } from "@/types/wallet";
import { WalletActionAmountFormValues } from "@/schemas/wallet-action.schema";

type DialogMode =
  | "verify"
  | "reject"
  | "details"
  | "reason"
  | "transfer"
  | "deduct"
  | null;

function getVerificationDisplayName(user: NetworkUserRecord): string {
  const first = (user.firstName || "").trim();
  if (first) return first;
  const fromFull = (user.name || getNetworkUserName(user) || "").trim();
  if (!fromFull) return "—";
  return fromFull.split(/\s+/)[0] || fromFull;
}

function toWalletUser(user: NetworkUserRecord): WalletUser {
  const role = String(user.userType || user.role || "RETAILER").toUpperCase();
  const balance =
    typeof user.walletBalance === "number" && Number.isFinite(user.walletBalance)
      ? user.walletBalance
      : 0;

  return {
    userId: user.id,
    id: user.id,
    userCode: user.userCode || null,
    name: getNetworkUserName(user) || user.name || null,
    firstName: user.firstName || null,
    lastName: user.lastName || null,
    email: user.email || null,
    mobile: user.mobile || (typeof user.phone === "string" ? user.phone : null),
    role: role as WalletUserRole,
    status: String(user.status || "ACTIVE"),
    verificationStatus: String(user.verificationStatus || "VERIFIED"),
    createdAt: user.createdAt || new Date().toISOString(),
    updatedAt: user.updatedAt,
    mainWallet: balance,
    commissionWallet: 0,
    aepsWallet: 0,
    holdBalance: 0,
    frozenBalance: 0,
    availableBalance: balance,
    totalBalance: balance,
    outlet: user.outlet
      ? {
          outletName: user.outlet.outletName,
          address: user.outlet.address,
          shopName: user.businessName || user.outlet.outletName,
        }
      : null,
  };
}

export function useVerificationWorkflow(onUpdated?: () => void) {
  const [user, setUser] = useState<NetworkUserRecord | null>(null);
  const [mode, setMode] = useState<DialogMode>(null);
  const [cachedInfo, setCachedInfo] = useState<UserVerificationInfo | null>(
    null
  );
  const [walletSubmitting, setWalletSubmitting] = useState(false);

  const verifyMutation = useVerifyUser();
  const rejectMutation = useRejectUser();
  const detailQuery = useVerification(
    user?.id,
    mode === "details" || mode === "reason"
  );

  const close = useCallback(() => {
    setMode(null);
    setUser(null);
    setCachedInfo(null);
    setWalletSubmitting(false);
  }, []);

  const openVerify = useCallback((target: NetworkUserRecord) => {
    setUser(target);
    setMode("verify");
  }, []);

  const openReject = useCallback((target: NetworkUserRecord) => {
    setUser(target);
    setMode("reject");
  }, []);

  const openDetails = useCallback(
    (target: NetworkUserRecord, info?: UserVerificationInfo | null) => {
      setUser(target);
      setCachedInfo(info || null);
      setMode("details");
    },
    []
  );

  const openReason = useCallback(
    (target: NetworkUserRecord, info?: UserVerificationInfo | null) => {
      setUser(target);
      setCachedInfo(info || null);
      setMode("reason");
    },
    []
  );

  const openTransfer = useCallback((target: NetworkUserRecord) => {
    setUser(target);
    setMode("transfer");
  }, []);

  const openDeduct = useCallback((target: NetworkUserRecord) => {
    setUser(target);
    setMode("deduct");
  }, []);

  const getStatus = useCallback((target: NetworkUserRecord): IdVerificationStatus => {
    return getUserVerificationStatus(target);
  }, []);

  const walletUser = user ? toWalletUser(user) : null;

  const dialogs = (
    <>
      <VerifyUserDialog
        isOpen={mode === "verify" && !!user}
        onClose={close}
        userName={user ? getVerificationDisplayName(user) : undefined}
        isSubmitting={verifyMutation.isPending}
        onConfirm={async (remark) => {
          if (!user) return;
          await verifyMutation.mutateAsync({
            userId: user.id,
            payload: { remark },
          });
          close();
          onUpdated?.();
        }}
      />
      <RejectUserDialog
        isOpen={mode === "reject" && !!user}
        onClose={close}
        userName={user ? getVerificationDisplayName(user) : undefined}
        isSubmitting={rejectMutation.isPending}
        onConfirm={async (reason) => {
          if (!user) return;
          await rejectMutation.mutateAsync({
            userId: user.id,
            payload: { reason },
          });
          close();
          onUpdated?.();
        }}
      />
      <VerificationDetailsDialog
        isOpen={mode === "details" && !!user}
        onClose={close}
        verification={detailQuery.data || cachedInfo}
      />
      <ReasonDialog
        isOpen={mode === "reason" && !!user}
        onClose={close}
        verification={detailQuery.data || cachedInfo}
      />
      <WalletTransferActionModal
        open={mode === "transfer" && !!walletUser}
        user={walletUser}
        isSubmitting={walletSubmitting}
        onClose={close}
        onSubmit={async (values: WalletActionAmountFormValues) => {
          if (!user) return;
          setWalletSubmitting(true);
          try {
            await transferWalletBalance({
              receiverId: user.id,
              amount: values.amount,
              description: values.description,
            });
            toast.success("Balance transferred successfully");
            close();
            onUpdated?.();
          } catch (err) {
            toast.error(
              err instanceof Error ? err.message : "Transfer failed"
            );
          } finally {
            setWalletSubmitting(false);
          }
        }}
      />
      <WalletDeductActionModal
        open={mode === "deduct" && !!walletUser}
        user={walletUser}
        isSubmitting={walletSubmitting}
        onClose={close}
        onSubmit={async (values: WalletActionAmountFormValues) => {
          if (!user) return;
          setWalletSubmitting(true);
          try {
            await deductWalletBalance({
              userId: user.id,
              amount: values.amount,
              description: values.description,
            });
            toast.success("Balance deducted successfully");
            close();
            onUpdated?.();
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Deduct failed");
          } finally {
            setWalletSubmitting(false);
          }
        }}
      />
    </>
  );

  return {
    dialogs,
    openVerify,
    openReject,
    openDetails,
    openReason,
    openTransfer,
    openDeduct,
    getStatus,
    isBusy:
      verifyMutation.isPending ||
      rejectMutation.isPending ||
      walletSubmitting,
  };
}
