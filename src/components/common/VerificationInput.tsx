"use client";

import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface VerificationInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  onValueChange: (value: string) => void;
  isVerified: boolean;
  sending?: boolean;
  canVerify: boolean;
  onVerify: () => void;
  verifyLabel?: string;
  verifiedLabel?: string;
}

export function VerificationInput({
  label,
  error,
  icon,
  value,
  onValueChange,
  placeholder,
  isVerified,
  sending = false,
  canVerify,
  onVerify,
  verifyLabel = "Verify",
  verifiedLabel = "Verified",
  className,
  disabled,
  ...props
}: VerificationInputProps) {
  return (
    <div className={cn("w-full", className)}>
      {label ? (
        <label className="mb-1.5 block text-sm font-medium text-foreground">
          {label}
        </label>
      ) : null}
      <div className="relative">
        {icon ? (
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
            {icon}
          </div>
        ) : null}
        <input
          value={value}
          placeholder={placeholder}
          disabled={disabled || isVerified}
          onChange={(event) => onValueChange(event.target.value)}
          className={cn(
            "w-full rounded-xl border border-border bg-card py-2.5 text-sm text-foreground outline-none",
            "placeholder:text-muted",
            icon ? "pl-10" : "pl-4",
            "pr-[6.75rem]",
            isVerified && "text-foreground",
            error && "border-accent-red"
          )}
          {...props}
        />
        {isVerified ? (
          <span className="absolute right-2.5 top-1/2 inline-flex -translate-y-1/2 items-center gap-1 rounded-md px-1.5 text-xs font-semibold text-emerald-600">
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white">
              <Check className="h-3 w-3" strokeWidth={3} />
            </span>
            {verifiedLabel}
          </span>
        ) : (
          <button
            type="button"
            onClick={onVerify}
            disabled={!canVerify || sending}
            className="absolute right-1.5 top-1/2 inline-flex -translate-y-1/2 items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-primary transition hover:bg-primary/8 disabled:cursor-not-allowed disabled:text-muted disabled:hover:bg-transparent"
          >
            {sending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <span className="flex h-4 w-4 items-center justify-center rounded-full border border-primary/40">
                <Check className="h-3 w-3" />
              </span>
            )}
            {verifyLabel}
          </button>
        )}
      </div>
      {error ? <p className="mt-1 text-xs text-accent-red">{error}</p> : null}
    </div>
  );
}
