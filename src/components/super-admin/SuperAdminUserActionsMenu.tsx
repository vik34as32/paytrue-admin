"use client";

import { useEffect, useRef, useState } from "react";
import {
  Copy,
  Eye,
  KeyRound,
  MoreHorizontal,
  Pencil,
  Power,
  PowerOff,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/common/Button";
import { NetworkUserRecord } from "@/types/superAdmin";
import { cn } from "@/lib/utils";

export interface SuperAdminUserActions {
  onView: (user: NetworkUserRecord) => void;
  onEdit: (user: NetworkUserRecord) => void;
  onDelete: (user: NetworkUserRecord) => void;
  onActivate: (user: NetworkUserRecord) => void;
  onDeactivate: (user: NetworkUserRecord) => void;
  onResetPassword: (user: NetworkUserRecord) => void;
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
}: {
  user: NetworkUserRecord;
  actions: SuperAdminUserActions;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const status = String(user.status || "").toUpperCase();
  const isActive = status === "ACTIVE";

  useEffect(() => {
    if (!open) return;
    const onDoc = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const phone =
    user.mobile || (typeof user.phone === "string" ? user.phone : "") || "";

  const itemClass =
    "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-foreground hover:bg-primary/10 disabled:opacity-50";

  return (
    <div className="relative" ref={rootRef}>
      <Button
        variant="ghost"
        size="sm"
        aria-label="User actions"
        disabled={actions.disabled}
        onClick={() => setOpen((prev) => !prev)}
      >
        <MoreHorizontal className="h-4 w-4" />
      </Button>

      {open ? (
        <div
          className={cn(
            "absolute right-0 z-30 mt-1 w-56 rounded-xl border border-border bg-card p-1.5 shadow-xl",
            "animate-in fade-in-0 zoom-in-95"
          )}
        >
          <button
            type="button"
            className={itemClass}
            onClick={() => {
              setOpen(false);
              actions.onView(user);
            }}
          >
            <Eye className="h-4 w-4 text-muted" /> View
          </button>
          <button
            type="button"
            className={itemClass}
            onClick={() => {
              setOpen(false);
              actions.onEdit(user);
            }}
          >
            <Pencil className="h-4 w-4 text-muted" /> Edit
          </button>
          {isActive ? (
            <button
              type="button"
              className={itemClass}
              onClick={() => {
                setOpen(false);
                actions.onDeactivate(user);
              }}
            >
              <PowerOff className="h-4 w-4 text-amber-600" /> Deactivate
            </button>
          ) : (
            <button
              type="button"
              className={itemClass}
              onClick={() => {
                setOpen(false);
                actions.onActivate(user);
              }}
            >
              <Power className="h-4 w-4 text-emerald-600" /> Activate
            </button>
          )}
          <button
            type="button"
            className={itemClass}
            onClick={() => {
              setOpen(false);
              actions.onResetPassword(user);
            }}
          >
            <KeyRound className="h-4 w-4 text-muted" /> Reset Password
          </button>
          <button
            type="button"
            className={itemClass}
            onClick={() => {
              setOpen(false);
              copyText("User ID", user.id);
            }}
          >
            <Copy className="h-4 w-4 text-muted" /> Copy User ID
          </button>
          <button
            type="button"
            className={itemClass}
            onClick={() => {
              setOpen(false);
              copyText("Phone", phone);
            }}
          >
            <Copy className="h-4 w-4 text-muted" /> Copy Phone
          </button>
          <div className="my-1 border-t border-border" />
          <button
            type="button"
            className={cn(itemClass, "text-accent-red hover:bg-accent-red/10")}
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
