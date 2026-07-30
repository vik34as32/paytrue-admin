"use client";

import { useParams, useRouter } from "next/navigation";
import { Card, Button, Alert } from "antd";
import { PageHeader } from "@/components/common/PageHeader";
import { CommissionAntdProvider } from "@/components/commission/CommissionAntdProvider";
import { LedgerDrawerSkeleton } from "@/components/ledger/LedgerSkeleton";
import { LedgerStatusBadge } from "@/components/ledger/LedgerStatusBadge";
import { LedgerTypeBadge } from "@/components/ledger/LedgerTypeBadge";
import { LedgerTimeline } from "@/components/ledger/LedgerTimeline";
import { useLedgerDetails } from "@/hooks/useLedgerDetails";
import { formatCurrency } from "@/lib/utils";
import { ROUTES } from "@/constants";
import dayjs from "dayjs";

export default function LedgerDetailPage() {
  const params = useParams<{ ledgerId: string }>();
  const router = useRouter();
  const ledgerId = params?.ledgerId;

  const { data, isLoading, isError, error, refetch } = useLedgerDetails(
    ledgerId || null,
    !!ledgerId
  );

  return (
    <CommissionAntdProvider>
      <div className="space-y-6">
        <PageHeader
          breadcrumb="Ledger"
          title="Ledger Entry"
          subtitle={data?.transactionId || ledgerId}
          action={
            <Button onClick={() => router.push(ROUTES.ledger)}>
              Back to Ledger
            </Button>
          }
        />

        {isLoading ? (
          <Card className="rounded-2xl">
            <LedgerDrawerSkeleton />
          </Card>
        ) : isError ? (
          <Alert
            type="error"
            showIcon
            message="Unable to load ledger entry"
            description={error?.message}
            action={
              <Button size="small" onClick={() => refetch()}>
                Retry
              </Button>
            }
          />
        ) : data ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="rounded-2xl lg:col-span-2" title="Transaction">
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-muted">Transaction ID: </span>
                  <strong>{data.transactionId}</strong>
                </p>
                <p>
                  <span className="text-muted">Reference: </span>
                  {data.referenceId || "—"}
                </p>
                <p className="flex flex-wrap items-center gap-2">
                  <span className="text-muted">Status:</span>
                  <LedgerStatusBadge status={data.status} />
                  <LedgerTypeBadge type={data.transactionType} />
                </p>
                <p>
                  <span className="text-muted">User: </span>
                  {data.userName} ({data.role || "—"})
                </p>
                <p>
                  <span className="text-muted">Amount: </span>
                  {formatCurrency(data.credit || data.debit)}
                </p>
                <p>
                  <span className="text-muted">Opening / Closing: </span>
                  {data.openingBalance != null
                    ? formatCurrency(data.openingBalance)
                    : "—"}{" "}
                  →{" "}
                  {data.closingBalance != null
                    ? formatCurrency(data.closingBalance)
                    : "—"}
                </p>
                <p>
                  <span className="text-muted">Created: </span>
                  {data.createdAt
                    ? dayjs(data.createdAt).format("DD MMM YYYY, HH:mm:ss")
                    : "—"}
                </p>
                <p>
                  <span className="text-muted">Narration: </span>
                  {data.narration || "—"}
                </p>
              </div>
            </Card>
            <Card className="rounded-2xl" title="Timeline">
              <LedgerTimeline items={data.timeline || []} />
            </Card>
          </div>
        ) : null}
      </div>
    </CommissionAntdProvider>
  );
}
