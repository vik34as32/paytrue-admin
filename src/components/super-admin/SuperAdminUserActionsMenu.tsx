"use client";

import { useEffect, useRef, useState } from "react";
import {
  Copy,
  Eye,
  KeyRound,
  MoreVertical,
  Pencil,
  Power,
  PowerOff,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { NetworkUserRecord } from "@/types/superAdmin";
import { cn } from "@/lib/utils";
import { getNetworkUserName } from "@/lib/normalizeUser";

export interface SuperAdminUserActions {
  onView: (user: NetworkUserRecord) => void;
  onEdit: (user: NetworkUserRecord) => void;
  onDelete: (user: NetworkUserRecord) => void;
  onActivate: (user: NetworkUserRecord) => void;
  onDeactivate: (user: NetworkUserRecord) => void;
  onResetPassword: (user: NetworkUserRecord) => void;
  onVerify?: (user: NetworkUserRecord) => void;
  onReject?: (user: NetworkUserRecord) => void;
  onViewVerification?: (user: NetworkUserRecord) => void;
  onViewRejectReason?: (user: NetworkUserRecord) => void;
  onTransfer?: (user: NetworkUserRecord) => void;
  onDeduct?: (user: NetworkUserRecord) => void;
  showVerificationActions?: boolean;
  disabled?: boolean;
}

function copyText(label: string, value?: string | null) {
  if (!value) {
    toast.error(`${label} not available`);
    return;
  }
  void navigator.clipboard.writeText(value).then(
    () => toast.success(`${label} copied`),
    () => toast.error(`Unable to copy ${label}`)
  );
}

export function SuperAdminUserActionsMenu({
  user,
  actions,
  ariaLabel,
}: {
  user: NetworkUserRecord;
  actions: SuperAdminUserActions;
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const status = String(user.status || "").toUpperCase();
  const isActive = status === "ACTIVE";
  const name = getNetworkUserName(user);

  useEffect(() => {
    if (!open) return;
    const onDoc = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const phone =
    user.mobile || (typeof user.phone === "string" ? user.phone : "") || "";

  const itemClass =
    "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] font-medium text-slate-700 transition-colors duration-150 hover:bg-slate-50 disabled:opacity-50 dark:text-foreground dark:hover:bg-muted/40";

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        aria-label={ariaLabel || `More actions for ${name}`}
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={actions.disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors duration-150",
          "hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "dark:border-border dark:bg-card dark:text-foreground dark:hover:bg-muted/40"
        )}
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {open ? (
        <div
          role="menu"
          className={cn(
            "absolute right-0 z-40 mt-1.5 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-border dark:bg-card"
          )}
        >
          <button
            type="button"
            role="menuitem"
            className={itemClass}
            onClick={() => {
              setOpen(false);
              actions.onView(user);
            }}
          >
            <Eye className="h-4 w-4 text-slate-400" /> View Profile
          </button>
          <button
            type="button"
            role="menuitem"
            className={itemClass}
            onClick={() => {
              setOpen(false);
              actions.onEdit(user);
            }}
          >
            <Pencil className="h-4 w-4 text-slate-400" /> Edit User
          </button>
          <button
            type="button"
            role="menuitem"
            className={itemClass}
            disabled={actions.disabled || isActive}
            onClick={() => {
              setOpen(false);
              actions.onActivate(user);
            }}
          >
            <Power className="h-4 w-4 text-emerald-600" /> Activate
          </button>
          <button
            type="button"
            role="menuitem"
            className={itemClass}
            disabled={actions.disabled || !isActive}
            onClick={() => {
              setOpen(false);
              actions.onDeactivate(user);
            }}
          >
            <PowerOff className="h-4 w-4 text-amber-600" /> Deactivate
          </button>
          <button
            type="button"
            role="menuitem"
            className={itemClass}
            onClick={() => {
              setOpen(false);
              actions.onResetPassword(user);
            }}
          >
            <KeyRound className="h-4 w-4 text-slate-400" /> Reset Password
          </button>
          <button
            type="button"
            role="menuitem"
            className={itemClass}
            onClick={() => {
              setOpen(false);
              copyText("User ID", user.id);
            }}
          >
            <Copy className="h-4 w-4 text-slate-400" /> Copy User ID
          </button>
          <button
            type="button"
            role="menuitem"
            className={itemClass}
            onClick={() => {
              setOpen(false);
              copyText("Phone", phone);
            }}
          >
            <Copy className="h-4 w-4 text-slate-400" /> Copy Phone
          </button>
          <div className="my-1 border-t border-slate-100 dark:border-border" />
          <button
            type="button"
            role="menuitem"
            className={cn(
              itemClass,
              "text-rose-600 hover:bg-rose-50 dark:text-accent-red dark:hover:bg-accent-red/10"
            )}
            onClick={() => {
              setOpen(false);
              actions.onDelete(user);
            }}
          >
            <Trash2 className="h-4 w-4" /> Delete
          </button>
        </div>
      ) : null}
    </div>
  );
}
