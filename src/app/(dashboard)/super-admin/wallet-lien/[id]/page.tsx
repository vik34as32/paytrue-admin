"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Unlock } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardHeader } from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { WalletLienStatusBadge } from "@/components/wallet-lien/WalletLienStatusBadge";
import { WalletLienHistoryTable } from "@/components/wallet-lien/WalletLienHistoryTable";
import { ReleaseWalletLienModal } from "@/components/wallet-lien/ReleaseWalletLienModal";
import {
  useWalletLienDetails,
  useWalletLienMutations,
} from "@/hooks/useWalletLien";
import { useSuperAdminAuth } from "@/hooks/useSuperAdminAuth";
import { WalletLienApiError } from "@/services/walletLien.service";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ROUTES } from "@/constants";

export default function WalletLienDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { hasSuperAdminWalletAccess } = useSuperAdminAuth();
  const id = params?.id;
  const [releaseOpen, setReleaseOpen] = useState(false);

  useEffect(() => {
    if (!hasSuperAdminWalletAccess) {
      router.replace(ROUTES.superAdminLogin);
    }
  }, [hasSuperAdminWalletAccess, router]);

  const { data, isLoading, isError, error, refetch, isFetching } =
    useWalletLienDetails(id || null, !!id && hasSuperAdminWalletAccess);
  const { releaseMutation } = useWalletLienMutations();

  useEffect(() => {
    if (!isError || !error) return;
    const status =
      error instanceof WalletLienApiError ? error.status : undefined;
    const message = error instanceof Error ? error.message : "";
    if (status === 403 || /permission|forbidden|403/i.test(message)) {
      router.replace(ROUTES.unauthorized);
    }
  }, [isError, error, router]);

  if (!hasSuperAdminWalletAccess) return null;

  const canRelease =
    data &&
    ["ACTIVE", "PARTIALLY_RELEASED"].includes(data.status.toUpperCase());

  return (
    <div className="page-container space-y-6">
      <PageHeader
        breadcrumb="Super Admin"
        title="Lien Details"
        subtitle={data?.userName || id}
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={() => router.push(ROUTES.superAdminWalletLien)}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            {canRelease ? (
              <Button
                type="button"
                className="gap-2"
                onClick={() => setReleaseOpen(true)}
              >
                <Unlock className="h-4 w-4" />
                Release Lien
              </Button>
            ) : null}
          </div>
        }
      />

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-2xl border border-border bg-muted/20"
            />
          ))}
        </div>
      ) : isError ? (
        <Card>
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-accent-red">
              {error instanceof Error
                ? error.message
                : "Unable to load lien details"}
            </p>
            <Button className="mt-3" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        </Card>
      ) : data ? (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <SummaryCard
              label="Main Wallet Balance"
              value={formatCurrency(
                data.wallet?.mainWalletBalance ?? data.mainWalletBalance
              )}
            />
            <SummaryCard
              label="Lien Amount"
              value={formatCurrency(
                data.wallet?.lienAmount ?? data.remainingAmount
              )}
            />
            <SummaryCard
              label="Available Balance"
              value={formatCurrency(
                data.wallet?.availableBalance ?? data.availableBalance
              )}
            />
          </div>

          <Card>
            <CardHeader title="Lien Information" />
            <div className="grid grid-cols-1 gap-4 px-1 sm:grid-cols-2">
              <Field label="Reason" value={data.reason} />
              <Field label="Remarks" value={data.remarks} />
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                  Status
                </p>
                <div className="mt-1">
                  <WalletLienStatusBadge status={data.status} />
                </div>
              </div>
              <Field label="Applied By" value={data.createdBy} />
              <Field label="Released By" value={data.releasedBy} />
              <Field
                label="Created Time"
                value={formatDate(data.createdAt, "dd MMM yyyy, HH:mm:ss")}
              />
              <Field
                label="Released Time"
                value={formatDate(data.releasedAt, "dd MMM yyyy, HH:mm:ss")}
              />
              <Field
                label="User"
                value={`${data.userName} (${data.mobile || "—"})`}
              />
              <Field label="Role" value={data.role} />
            </div>
            <div className="mt-4 flex justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => refetch()}
                disabled={isFetching}
              >
                Refresh
              </Button>
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Lien History"
              subtitle="Audit trail of lien actions"
            />
            <WalletLienHistoryTable
              rows={
                data.history.length
                  ? data.history
                  : [
                      {
                        id: `${data.id}-apply`,
                        date: data.createdAt,
                        action: "APPLY",
                        amount: data.lienAmount,
                        remainingAmount: data.remainingAmount,
                        status: data.status,
                        performedBy: data.createdBy,
                      },
                    ]
              }
            />
          </Card>
        </>
      ) : null}

      <ReleaseWalletLienModal
        isOpen={releaseOpen}
        lien={data || null}
        isSubmitting={releaseMutation.isPending}
        onClose={() => setReleaseOpen(false)}
        onSubmit={async (values) => {
          if (!data) return false;
          try {
            await releaseMutation.mutateAsync({
              lienId: data.id,
              amount: values.amount,
              remarks: values.remarks,
            });
            await refetch();
            return true;
          } catch {
            return false;
          }
        }}
      />
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}

function Field({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-foreground">
        {value?.trim() ? value : "—"}
      </p>
    </div>
  );
}
