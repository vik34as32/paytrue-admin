"use client";

import { lazy, Suspense, useEffect } from "react";
import { Drawer, Button, Descriptions, Divider, Alert } from "antd";
import { toast } from "sonner";
import dayjs from "dayjs";
import { LedgerStatusBadge } from "@/components/ledger/LedgerStatusBadge";
import { LedgerTypeBadge } from "@/components/ledger/LedgerTypeBadge";
import { LedgerDrawerSkeleton } from "@/components/ledger/LedgerSkeleton";
import { useLedgerDetails } from "@/hooks/useLedgerDetails";
import { formatCurrency } from "@/lib/utils";
import { LedgerRow } from "@/types/ledger";

const LedgerTimeline = lazy(() =>
  import("@/components/ledger/LedgerTimeline").then((m) => ({
    default: m.LedgerTimeline,
  }))
);

interface LedgerDrawerProps {
  open: boolean;
  ledgerId: string | null;
  fallbackRow?: LedgerRow | null;
  onClose: () => void;
}

export function LedgerDrawer({
  open,
  ledgerId,
  fallbackRow,
  onClose,
}: LedgerDrawerProps) {
  const { data, isLoading, isError, error, refetch, isFetching } =
    useLedgerDetails(ledgerId, open);

  useEffect(() => {
    if (isError && error && !fallbackRow) {
      toast.error(error.message || "Failed to load ledger details");
    }
  }, [isError, error, fallbackRow]);

  const detail = data || (fallbackRow
    ? {
        ...fallbackRow,
        timeline: [
          { key: "CREATED", label: "Created", at: fallbackRow.createdAt, active: true },
          { key: "PROCESSING", label: "Processing", active: false },
          {
            key: "SUCCESS",
            label: "Success",
            at: fallbackRow.status.toUpperCase() === "SUCCESS" ? fallbackRow.createdAt : null,
            active: fallbackRow.status.toUpperCase() === "SUCCESS",
          },
          {
            key: "FAILED",
            label: "Failed",
            active: fallbackRow.status.toUpperCase() === "FAILED",
          },
          {
            key: "REFUND",
            label: "Refund",
            active: fallbackRow.transactionType.toUpperCase() === "REFUND",
          },
        ],
      }
    : null);

  return (
    <Drawer
      title="Ledger Details"
      placement="right"
      width={520}
      open={open}
      onClose={onClose}
      destroyOnClose
      styles={{ body: { paddingBottom: 24 } }}
      extra={
        <Button onClick={() => refetch()} loading={isFetching}>
          Refresh
        </Button>
      }
    >
      {isLoading && !fallbackRow ? (
        <LedgerDrawerSkeleton />
      ) : isError && !detail ? (
        <Alert
          type="error"
          showIcon
          message="Unable to load ledger details"
          description={error?.message}
          action={
            <Button size="small" onClick={() => refetch()}>
              Retry
            </Button>
          }
        />
      ) : detail ? (
        <div className="space-y-5">
          <section>
            <h3 className="mb-3 text-sm font-bold text-foreground">
              Transaction Information
            </h3>
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="Transaction ID">
                {detail.transactionId}
              </Descriptions.Item>
              <Descriptions.Item label="Reference ID">
                {detail.referenceId || "—"}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <LedgerStatusBadge status={detail.status} />
              </Descriptions.Item>
              <Descriptions.Item label="Service Type">
                {detail.serviceType}
              </Descriptions.Item>
              <Descriptions.Item label="Type">
                <LedgerTypeBadge type={detail.transactionType} />
              </Descriptions.Item>
              <Descriptions.Item label="Narration">
                {detail.narration || "—"}
              </Descriptions.Item>
            </Descriptions>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-bold text-foreground">
              User Information
            </h3>
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="Name">{detail.userName}</Descriptions.Item>
              <Descriptions.Item label="Role">{detail.role || "—"}</Descriptions.Item>
              <Descriptions.Item label="User Code">
                {detail.userCode || "—"}
              </Descriptions.Item>
            </Descriptions>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-bold text-foreground">
              Wallet Details
            </h3>
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="Opening Balance">
                {detail.openingBalance != null
                  ? formatCurrency(detail.openingBalance)
                  : "—"}
              </Descriptions.Item>
              <Descriptions.Item label="Transaction Amount">
                {formatCurrency(detail.credit || detail.debit)}
              </Descriptions.Item>
              <Descriptions.Item label="Charge">
                {formatCurrency(detail.charge)}
              </Descriptions.Item>
              <Descriptions.Item label="Commission">
                {formatCurrency(detail.commission)}
              </Descriptions.Item>
              <Descriptions.Item label="GST">
                {formatCurrency(detail.gst)}
              </Descriptions.Item>
              <Descriptions.Item label="Closing Balance">
                {detail.closingBalance != null
                  ? formatCurrency(detail.closingBalance)
                  : "—"}
              </Descriptions.Item>
            </Descriptions>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-bold text-foreground">
              Audit Information
            </h3>
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="Created By">
                {detail.createdBy || "—"}
                {detail.createdByRole ? ` (${detail.createdByRole})` : ""}
              </Descriptions.Item>
              <Descriptions.Item label="Created At">
                {detail.createdAt
                  ? dayjs(detail.createdAt).format("DD MMM YYYY, HH:mm:ss")
                  : "—"}
              </Descriptions.Item>
              <Descriptions.Item label="Updated At">
                {detail.updatedAt
                  ? dayjs(detail.updatedAt).format("DD MMM YYYY, HH:mm:ss")
                  : "—"}
              </Descriptions.Item>
            </Descriptions>
          </section>

          <Divider />

          <section>
            <h3 className="mb-3 text-sm font-bold text-foreground">Timeline</h3>
            <Suspense fallback={<LedgerDrawerSkeleton />}>
              <LedgerTimeline items={detail.timeline || []} />
            </Suspense>
          </section>
        </div>
      ) : null}
    </Drawer>
  );
}
