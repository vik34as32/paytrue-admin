"use client";

import { Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { openGmailCompose } from "@/components/user-management/cells";

interface MailtoLinkProps {
  email?: string | null;
  className?: string;
  /** Display name for accessibility */
  name?: string;
}

/** Opens Gmail compose with this email as recipient. */
export function MailtoLink({ email, className, name }: MailtoLinkProps) {
  const value = (email || "").trim();
  if (!value) return <span className={className}>—</span>;

  return (
    <button
      type="button"
      title={value}
      aria-label={name ? `Email ${name}` : `Email ${value}`}
      className={cn(
        "group inline-flex max-w-[240px] items-center gap-1.5 text-left text-[13px] font-medium text-sky-700 transition-colors duration-150 hover:text-sky-900 dark:text-sky-400",
        className
      )}
      onClick={(event) => {
        event.stopPropagation();
        openGmailCompose(value);
      }}
    >
      <Mail className="h-3.5 w-3.5 shrink-0 opacity-80" />
      <span className="truncate underline-offset-2 group-hover:underline">
        {value}
      </span>
    </button>
  );
}
