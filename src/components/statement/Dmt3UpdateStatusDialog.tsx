"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/modals/Modal";
import { Button } from "@/components/common/Button";
import { Select } from "@/components/common/Select";
import { Textarea } from "@/components/common/Textarea";
import { formatCurrency } from "@/lib/utils";
import { DmtManualStatus, StatementRow } from "@/types/serviceStatement";

const STATUS_OPTIONS = [
  { value: "SUCCESS", label: "SUCCESS" },
  { value: "FAILED", label: "FAILED" },
];

interface Dmt3UpdateStatusDialogProps {
  isOpen: boolean;
  row: StatementRow | null;
  variant?: "DMT" | "DMT3";
  isSubmitting?: boolean;
  onClose: () => void;
  onConfirm: (status: DmtManualStatus, remark?: string) => void | Promise<void>;
}

export function Dmt3UpdateStatusDialog({
  isOpen,
  row,
  variant = "DMT3",
  isSubmitting,
  onClose,
  onConfirm,
}: Dmt3UpdateStatusDialogProps) {
  const [status, setStatus] = useState<DmtManualStatus>("FAILED");
  const [remark, setRemark] = useState("");
  const [error, setError] = useState("");
  const isDmt = variant === "DMT";
  const remarkMax = isDmt ? 255 : 240;
  const remarkMin = isDmt ? 1 : 3;

  useEffect(() => {
    if (!isOpen) return;
    setStatus("FAILED");
    setRemark("");
    setError("");
  }, [isOpen, row?.id]);

  const trimmed = remark.trim();
  const remarkRequired = status === "FAILED";

  const submit = async () => {
    if (remarkRequired && trimmed.length < remarkMin) {
      setError(
        `Remark is required (min ${remarkMin} character${remarkMin > 1 ? "s" : ""}) for FAILED`
      );
      return;
    }
    if (trimmed && (trimmed.length < remarkMin || trimmed.length > remarkMax)) {
      setError(`Remark must be ${remarkMin}–${remarkMax} characters`);
      return;
    }
    setError("");
    await onConfirm(status, trimmed || undefined);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isSubmitting) onClose();
      }}
      title={isDmt ? "Change DMT status" : "Change DMT3 status"}
      subtitle="Only PROCESSING transactions can be marked SUCCESS or FAILED."
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant={status === "FAILED" ? "danger" : "primary"}
            isLoading={isSubmitting}
            disabled={isSubmitting || !row}
            onClick={() => void submit()}
          >
            {status === "FAILED" ? "Mark Failed & Refund" : "Mark Success"}
          </Button>
        </div>
      }
    >
      {row ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-muted/40 px-3 py-3 text-sm">
            <p className="font-mono text-xs text-muted">Txn ID</p>
            <p className="font-medium text-foreground">{row.ledgerNo}</p>
            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-xs text-muted">Amount</p>
                <p className="font-semibold tabular-nums">
                  {formatCurrency(row.txnAmount)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted">Current status</p>
                <p className="font-semibold">{row.status}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-muted">Retailer</p>
                <p className="font-medium">
                  {row.retailer?.name || "—"}
                  {row.retailer?.mobile ? ` · ${row.retailer.mobile}` : ""}
                </p>
              </div>
            </div>
          </div>

          <Select
            label="New status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as DmtManualStatus);
              setError("");
            }}
            options={STATUS_OPTIONS}
          />

          <Textarea
            label={remarkRequired ? "Remark (required)" : "Remark (optional)"}
            value={remark}
            maxLength={remarkMax}
            error={error}
            placeholder={
              status === "FAILED"
                ? "Why this payout is being failed and refunded"
                : "Optional note for SUCCESS"
            }
            onChange={(e) => {
              setRemark(e.target.value);
              setError("");
            }}
          />

          <p className="text-xs leading-relaxed text-muted">
            {status === "FAILED"
              ? isDmt
                ? "FAILED refunds the original MAIN debit (amount + charge). Repeat FAILED will not refund again."
                : "FAILED refunds the wallet and rolls back commission (same as fail API). Repeat FAILED will not refund again."
              : "SUCCESS does not debit or refund. Use this only when the bank payout is already complete."}
          </p>
        </div>
      ) : null}
    </Modal>
  );
}
