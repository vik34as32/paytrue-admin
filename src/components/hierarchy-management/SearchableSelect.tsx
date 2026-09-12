"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/common/Input";

export interface SearchableOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

interface SearchableSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SearchableOption[];
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  emptyText?: string;
  /** When set, search is server-driven (no local filter). */
  onSearchChange?: (query: string) => void;
  searchValue?: string;
  isLoading?: boolean;
}

export function SearchableSelect({
  label,
  value,
  onChange,
  options,
  placeholder = "Search and select...",
  error,
  disabled,
  emptyText = "No matching users",
  onSearchChange,
  searchValue,
  isLoading,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [localQuery, setLocalQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  const query = onSearchChange ? (searchValue ?? "") : localQuery;
  const selected = options.find((opt) => opt.value === value);

  const filtered = useMemo(() => {
    if (onSearchChange) return options;
    const q = localQuery.trim().toLowerCase();
    if (!q) return options;
    return options.filter((opt) =>
      `${opt.label} ${opt.description || ""}`.toLowerCase().includes(q)
    );
  }, [options, localQuery, onSearchChange]);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const handleQueryChange = (next: string) => {
    if (onSearchChange) {
      onSearchChange(next);
      return;
    }
    setLocalQuery(next);
  };

  return (
    <div ref={rootRef} className="relative w-full">
      <label className="mb-1.5 block text-sm font-medium text-foreground">
        {label}
      </label>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "flex w-full items-center justify-between rounded-xl border border-border bg-card px-4 py-2.5 text-left text-sm shadow-sm outline-none transition-all hover:border-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60",
          error && "border-accent-red"
        )}
      >
        <span className={cn("truncate", !selected && "text-muted")}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted" />
      </button>

      {open ? (
        <div className="absolute z-40 mt-2 w-full overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
          <div className="border-b border-border p-2">
            <Input
              autoFocus
              value={query}
              onChange={(event) => handleQueryChange(event.target.value)}
              placeholder="Type to search..."
              icon={<Search className="h-4 w-4" />}
            />
          </div>
          <ul
            role="listbox"
            className="max-h-64 overflow-y-auto p-1"
            aria-label={label}
          >
            {isLoading ? (
              <li className="px-3 py-6 text-center text-sm text-muted">
                Loading...
              </li>
            ) : filtered.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-muted">
                {emptyText}
              </li>
            ) : (
              filtered.map((opt) => {
                const active = opt.value === value;
                return (
                  <li key={opt.value}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      disabled={opt.disabled}
                      className={cn(
                        "flex w-full items-start gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/60 disabled:cursor-not-allowed disabled:opacity-50",
                        active && "bg-primary/10"
                      )}
                      onClick={() => {
                        onChange(opt.value);
                        setOpen(false);
                        if (!onSearchChange) setLocalQuery("");
                      }}
                    >
                      <Check
                        className={cn(
                          "mt-0.5 h-4 w-4 shrink-0",
                          active ? "opacity-100 text-primary" : "opacity-0"
                        )}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium text-foreground">
                          {opt.label}
                        </span>
                        {opt.description ? (
                          <span className="mt-0.5 block text-xs text-muted">
                            {opt.description}
                          </span>
                        ) : null}
                      </span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ) : null}

      {error ? (
        <p className="mt-1 text-xs text-accent-red">{error}</p>
      ) : null}
    </div>
  );
}
