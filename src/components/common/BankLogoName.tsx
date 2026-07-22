"use client";

import { useEffect, useMemo, useState } from "react";
import { findIndianBankByName, getBankLogoUrl } from "@/constants/indianBanks";
import {
  findLocalBankByName,
  getLocalBankLogoPath,
} from "@/constants/localIndianBanks";
import { cn } from "@/lib/utils";

interface BankLogoNameProps {
  bankName?: string | null;
  /** Full IFSC code or 4-letter bank code (used to resolve the logo). */
  ifscCode?: string | null;
  /** Hide the bank name text and show only the logo (name moves to tooltip). */
  logoOnly?: boolean;
  className?: string;
  logoClassName?: string;
}

/**
 * Bank logo (local /indian-bank SVG or CDN fallback) with the bank name.
 * Falls back to initials when no logo can be loaded.
 */
export function BankLogoName({
  bankName,
  ifscCode,
  logoOnly = false,
  className,
  logoClassName,
}: BankLogoNameProps) {
  const name = bankName?.trim() || "";
  const code = (ifscCode || "").trim().slice(0, 4);
  const [failed, setFailed] = useState(false);

  // Resolve by bank name first — the IFSC in records can belong to a
  // different bank (user-entered data), which would show the wrong logo.
  const logoSrc = useMemo(() => {
    if (name) {
      const local = findLocalBankByName(name);
      if (local) return getLocalBankLogoPath(local.slug);
      const known = findIndianBankByName(name);
      if (known) return getBankLogoUrl(known.code, name);
    }
    if (code) return getBankLogoUrl(code, name);
    return "";
  }, [code, name]);

  useEffect(() => {
    setFailed(false);
  }, [logoSrc]);

  if (!name && !code) return <span>—</span>;

  const initials = (name || code)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  const logo =
    failed || !logoSrc ? (
      <span
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-[10px] font-bold text-primary",
          logoClassName
        )}
        title={name || undefined}
      >
        {initials || "BK"}
      </span>
    ) : (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoSrc}
        alt={name || code}
        title={name || undefined}
        className={cn(
          "h-8 w-8 shrink-0 rounded-lg border border-border/60 bg-white object-contain p-0.5",
          logoClassName
        )}
        onError={() => setFailed(true)}
      />
    );

  if (logoOnly) return logo;

  return (
    <span className={cn("flex items-center gap-2", className)}>
      {logo}
      <span className="min-w-0 truncate">{name || code}</span>
    </span>
  );
}
