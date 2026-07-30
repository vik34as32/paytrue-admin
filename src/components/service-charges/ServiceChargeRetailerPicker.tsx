"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, Search, X } from "lucide-react";
import { Input } from "@/components/common/Input";
import { cn } from "@/lib/utils";
import { listAllRetailers } from "@/services/superAdminApi";

export interface ServiceChargeRetailerOption {
  id: string;
  label: string;
  name: string;
  userCode?: string;
  mobile?: string;
}

interface ServiceChargeRetailerPickerProps {
  value: string[];
  onChange: (ids: string[]) => void;
  error?: string;
  disabled?: boolean;
}

function toOption(raw: {
  id: string;
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  userCode?: string | null;
  mobile?: string | null;
}): ServiceChargeRetailerOption {
  const name =
    raw.name ||
    [raw.firstName, raw.lastName].filter(Boolean).join(" ") ||
    raw.userCode ||
    "Retailer";
  return {
    id: raw.id,
    name,
    userCode: raw.userCode || undefined,
    mobile: raw.mobile || undefined,
    label: [name, raw.userCode, raw.mobile].filter(Boolean).join(" · "),
  };
}

export function ServiceChargeRetailerPicker({
  value,
  onChange,
  error,
  disabled,
}: ServiceChargeRetailerPickerProps) {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(search.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  const { data = [], isLoading, isError, error: loadError } = useQuery({
    queryKey: ["service-charge-retailers"],
    queryFn: async () => {
      const list = await listAllRetailers({ status: "ACTIVE" });
      return list.map(toOption);
    },
    staleTime: 60_000,
  });

  const selectedSet = useMemo(() => new Set(value), [value]);

  const filtered = useMemo(() => {
    if (!debounced) return data;
    const q = debounced.toLowerCase();
    return data.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        (item.userCode || "").toLowerCase().includes(q) ||
        (item.mobile || "").includes(q)
    );
  }, [data, debounced]);

  const selectedOptions = useMemo(
    () => data.filter((item) => selectedSet.has(item.id)),
    [data, selectedSet]
  );

  const toggle = (id: string) => {
    if (disabled) return;
    if (selectedSet.has(id)) {
      onChange(value.filter((item) => item !== id));
    } else {
      onChange([...value, id]);
    }
  };

  const selectAllFiltered = () => {
    if (disabled) return;
    const next = new Set(value);
    filtered.forEach((item) => next.add(item.id));
    onChange(Array.from(next));
  };

  const clearAll = () => {
    if (disabled) return;
    onChange([]);
  };

  return (
    <div className="space-y-3 rounded-xl border border-border bg-background/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-foreground">
            Select Retailers *
          </p>
          <p className="text-xs text-muted">
            Charge sirf selected retailers par lagega. Multiple select = har
            retailer ke liye alag plan create hoga.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <button
            type="button"
            className="font-medium text-primary hover:underline disabled:opacity-50"
            onClick={selectAllFiltered}
            disabled={disabled || filtered.length === 0}
          >
            Select all{debounced ? " filtered" : ""}
          </button>
          <button
            type="button"
            className="font-medium text-muted hover:text-foreground hover:underline disabled:opacity-50"
            onClick={clearAll}
            disabled={disabled || value.length === 0}
          >
            Clear
          </button>
        </div>
      </div>

      <Input
        placeholder="Search retailer name, code, mobile..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        disabled={disabled}
        icon={<Search className="h-4 w-4" />}
      />

      {selectedOptions.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {selectedOptions.map((item) => (
            <span
              key={item.id}
              className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
            >
              {item.name}
              {item.userCode ? (
                <span className="text-primary/70">· {item.userCode}</span>
              ) : null}
              <button
                type="button"
                aria-label={`Remove ${item.name}`}
                className="rounded-full p-0.5 hover:bg-primary/20 disabled:opacity-50"
                onClick={() => toggle(item.id)}
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      ) : null}

      <div className="max-h-56 overflow-y-auto rounded-xl border border-border bg-card">
        {isLoading ? (
          <p className="px-4 py-6 text-center text-sm text-muted">
            Loading retailers...
          </p>
        ) : isError ? (
          <p className="px-4 py-6 text-center text-sm text-accent-red">
            {loadError instanceof Error
              ? loadError.message
              : "Failed to load retailers"}
          </p>
        ) : filtered.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-muted">
            No retailers found
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((item) => {
              const active = selectedSet.has(item.id);
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => toggle(item.id)}
                    disabled={disabled}
                    className={cn(
                      "flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition hover:bg-muted/60 disabled:opacity-50",
                      active && "bg-primary/5"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border",
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card"
                      )}
                    >
                      {active ? <Check className="h-3.5 w-3.5" /> : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-foreground">
                        {item.name}
                      </span>
                      <span className="block truncate text-xs text-muted">
                        {[item.userCode, item.mobile].filter(Boolean).join(" · ") ||
                          "—"}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <p className="text-xs text-muted">
        <span className="font-semibold text-foreground">{value.length}</span>{" "}
        retailer{value.length === 1 ? "" : "s"} selected
      </p>

      {error ? <p className="text-xs text-accent-red">{error}</p> : null}
    </div>
  );
}
