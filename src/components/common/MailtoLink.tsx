"use client";

import { cn } from "@/lib/utils";

interface MailtoLinkProps {
  email?: string | null;
  className?: string;
}

/** Opens the default mail client on click. Styled like Bank Account number cells. */
export function MailtoLink({ email, className }: MailtoLinkProps) {
  const value = (email || "").trim();
  if (!value) return <span className={className}>—</span>;

  return (
    <a
      href={`mailto:${value}`}
      title={`Send email to ${value}`}
      className={cn(
        "whitespace-nowrap font-mono text-xs text-foreground hover:text-primary hover:underline",
        className
      )}
      onClick={(event) => event.stopPropagation()}
    >
      {value}
    </a>
  );
}
