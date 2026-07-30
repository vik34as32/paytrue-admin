"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { IdVerificationStatus } from "@/types/idVerification";

export type VerificationQuickFilter = "ALL" | IdVerificationStatus;

const PILLS: { value: VerificationQuickFilter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "VERIFIED", label: "Verified" },
  { value: "REJECTED", label: "Rejected" },
];

interface VerificationQuickFiltersProps {
  value: VerificationQuickFilter;
  onChange: (value: VerificationQuickFilter) => void;
  counts?: Partial<Record<VerificationQuickFilter, number>>;
}

export function VerificationQuickFilters({
  value,
  onChange,
  counts,
}: VerificationQuickFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Quick filters">
      {PILLS.map((pill) => {
        const active = value === pill.value;
        const count = counts?.[pill.value];
        return (
          <motion.button
            key={pill.value}
            type="button"
            role="tab"
            aria-selected={active}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onChange(pill.value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors",
              active
                ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/25"
                : "border-border bg-card text-muted hover:border-primary/30 hover:text-foreground"
            )}
          >
            {pill.label}
            {typeof count === "number" ? (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                  active
                    ? "bg-white/20 text-primary-foreground"
                    : "bg-muted/30 text-muted"
                )}
              >
                {count}
              </span>
            ) : null}
          </motion.button>
        );
      })}
    </div>
  );
}
