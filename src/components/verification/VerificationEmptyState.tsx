"use client";

import { motion } from "framer-motion";
import {
  FileSearch,
  Inbox,
  SearchX,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/common/Button";

type EmptyKind = "verification" | "pending" | "search";

const COPY: Record<
  EmptyKind,
  { title: string; description: string; icon: LucideIcon }
> = {
  verification: {
    title: "No Verification Found",
    description:
      "There are no users with verification records for the selected filters.",
    icon: Inbox,
  },
  pending: {
    title: "No Pending Users",
    description:
      "All caught up — there are no users waiting for ID verification.",
    icon: FileSearch,
  },
  search: {
    title: "No Search Results",
    description:
      "Try a different name, email, mobile or user code, or clear filters.",
    icon: SearchX,
  },
};

interface VerificationEmptyStateProps {
  kind: EmptyKind;
  onClear?: () => void;
}

export function VerificationEmptyState({
  kind,
  onClear,
}: VerificationEmptyStateProps) {
  const content = COPY[kind];
  const Icon = content.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-background/50 px-6 py-16 text-center"
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="text-lg font-bold text-foreground">{content.title}</h3>
      <p className="mt-2 max-w-md text-sm text-muted">{content.description}</p>
      {onClear ? (
        <Button
          type="button"
          variant="outline"
          className="mt-5"
          onClick={onClear}
        >
          Clear filters
        </Button>
      ) : null}
    </motion.div>
  );
}
