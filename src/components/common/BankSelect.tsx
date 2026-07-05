"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import {
  findIndianBankByName,
  getBankLogoUrl,
  searchIndianBanks,
  type IndianBank,
} from "@/constants/indianBanks";
import { cn } from "@/lib/utils";

interface BankSelectProps {
  label?: string;
  value: string;
  onChange: (bankName: string) => void;
  error?: string;
  placeholder?: string;
}

function BankLogo({
  bank,
  className,
}: {
  bank: Pick<IndianBank, "code" | "name">;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const initials = bank.name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  if (failed) {
    return (
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-lg bg-primary/10 text-[10px] font-bold text-primary",
          className
        )}
      >
        {initials}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={getBankLogoUrl(bank.code)}
      alt={bank.name}
      className={cn("shrink-0 rounded-lg object-contain bg-white", className)}
      onError={() => setFailed(true)}
    />
  );
}

export function BankSelect({
  label = "Bank Name",
  value,
  onChange,
  error,
  placeholder = "Search and select a bank",
}: BankSelectProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selectedBank = useMemo(
    () => (value ? findIndianBankByName(value) : undefined),
    [value]
  );

  const filteredBanks = useMemo(() => searchIndianBanks(query), [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (bank: IndianBank) => {
    onChange(bank.name);
    setQuery("");
    setOpen(false);
  };

  const handleClear = () => {
    onChange("");
    setQuery("");
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-foreground">
          {label}
        </label>
      )}

      <div
        className={cn(
          "flex min-h-[42px] items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 shadow-sm transition-all",
          open && "border-primary ring-2 ring-primary/20",
          error && "border-accent-red"
        )}
      >
        {selectedBank && !open ? (
          <>
            <BankLogo bank={selectedBank} className="h-7 w-7" />
            <button
              type="button"
              className="min-w-0 flex-1 truncate text-left text-sm text-foreground"
              onClick={() => {
                setOpen(true);
                setQuery("");
              }}
            >
              {selectedBank.name}
            </button>
            <button
              type="button"
              aria-label="Clear bank selection"
              className="rounded-md p-1 text-muted hover:bg-muted/20 hover:text-foreground"
              onClick={handleClear}
            >
              <X className="h-4 w-4" />
            </button>
          </>
        ) : value && !open ? (
          <>
            <BankLogo bank={{ code: "BANK", name: value }} className="h-7 w-7" />
            <button
              type="button"
              className="min-w-0 flex-1 truncate text-left text-sm text-foreground"
              onClick={() => {
                setOpen(true);
                setQuery(value);
              }}
            >
              {value}
            </button>
            <button
              type="button"
              aria-label="Clear bank selection"
              className="rounded-md p-1 text-muted hover:bg-muted/20 hover:text-foreground"
              onClick={handleClear}
            >
              <X className="h-4 w-4" />
            </button>
          </>
        ) : (
          <>
            <Search className="h-4 w-4 shrink-0 text-muted" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              placeholder={placeholder}
              className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
              onFocus={() => setOpen(true)}
              onChange={(event) => {
                setQuery(event.target.value);
                setOpen(true);
              }}
            />
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 text-muted transition-transform",
                open && "rotate-180"
              )}
            />
          </>
        )}
      </div>

      {open && (
        <div className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-border bg-card shadow-xl">
          {filteredBanks.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted">No banks found</p>
          ) : (
            filteredBanks.map((bank) => (
              <button
                key={`${bank.code}-${bank.name}`}
                type="button"
                className={cn(
                  "flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-primary/5",
                  value === bank.name && "bg-primary/10"
                )}
                onClick={() => handleSelect(bank)}
              >
                <BankLogo bank={bank} className="h-8 w-8" />
                <span className="min-w-0 flex-1 truncate font-medium text-foreground">
                  {bank.name}
                </span>
                <span className="shrink-0 font-mono text-xs text-muted">
                  {bank.code}
                </span>
              </button>
            ))
          )}
        </div>
      )}

      {error && <p className="mt-1 text-xs text-accent-red">{error}</p>}
    </div>
  );
}
