"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Eye, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AdminRecord } from "@/types/superAdmin";
import {
  getAdminDisplayName,
  getAdminBalance,
  getAdminId,
} from "@/services/admin";
import { cn, formatCurrency } from "@/lib/utils";
import {
  EmailCell,
  PhoneCell,
  ProfileCell,
  StatusPill,
} from "@/components/user-management/cells";

interface AdminColumnActions {
  onView: (admin: AdminRecord) => void;
  onEdit: (admin: AdminRecord) => void;
  onDelete: (admin: AdminRecord) => void;
  disabled?: boolean;
}

function AdminActionsMenu({
  admin,
  actions,
}: {
  admin: AdminRecord;
  actions: AdminColumnActions;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const name = getAdminDisplayName(admin);

  useEffect(() => {
    if (!open) return;
    const onDoc = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
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

  const itemClass =
    "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] font-medium text-slate-700 transition-colors duration-150 hover:bg-slate-50 disabled:opacity-50 dark:text-foreground dark:hover:bg-muted/40";

  return (
    <div className="relative inline-flex items-center gap-1.5" ref={rootRef}>
      <button
        type="button"
        aria-label={`View admin ${name}`}
        disabled={actions.disabled}
        onClick={() => actions.onView(admin)}
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors duration-150",
          "hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40",
          "disabled:opacity-50 dark:border-border dark:bg-card"
        )}
      >
        <Eye className="h-4 w-4" />
      </button>
      <button
        type="button"
        aria-label={`More actions for ${name}`}
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={actions.disabled}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors duration-150",
          "hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40",
          "disabled:opacity-50 dark:border-border dark:bg-card"
        )}
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-1.5 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-border dark:bg-card"
        >
          <button
            type="button"
            role="menuitem"
            className={itemClass}
            onClick={() => {
              setOpen(false);
              actions.onEdit(admin);
            }}
          >
            <Pencil className="h-4 w-4 text-slate-400" /> Edit Admin
          </button>
          <div className="my-1 border-t border-slate-100 dark:border-border" />
          <button
            type="button"
            role="menuitem"
            className={cn(
              itemClass,
              "text-rose-600 hover:bg-rose-50 dark:text-accent-red"
            )}
            onClick={() => {
              setOpen(false);
              actions.onDelete(admin);
            }}
          >
            <Trash2 className="h-4 w-4" /> Delete
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function createAdminColumns(
  actions: AdminColumnActions
): ColumnDef<AdminRecord, unknown>[] {
  return [
    {
      id: "profile",
      header: "User",
      enableSorting: false,
      size: 260,
      cell: ({ row }) => (
        <ProfileCell
          user={row.original}
          kind="ADMIN"
          subtitle={getAdminId(row.original)}
        />
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <EmailCell
          email={row.original.email}
          name={getAdminDisplayName(row.original)}
        />
      ),
    },
    {
      accessorKey: "mobile",
      header: "Phone",
      cell: ({ row }) => (
        <PhoneCell
          phone={row.original.mobile}
          name={getAdminDisplayName(row.original)}
        />
      ),
    },
    {
      accessorKey: "userType",
      header: "Role",
      cell: ({ row }) => (
        <span className="inline-flex rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:bg-muted dark:text-muted-foreground">
          {(row.original.userType || "ADMIN").toUpperCase()}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusPill status={row.original.status} />,
    },
    {
      accessorKey: "balance",
      header: "Wallet",
      meta: { align: "right" as const },
      cell: ({ row }) => (
        <span className="font-semibold tabular-nums text-slate-900 dark:text-foreground">
          {formatCurrency(getAdminBalance(row.original))}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      enableSorting: false,
      meta: { align: "center" as const },
      cell: ({ row }) => (
        <AdminActionsMenu admin={row.original} actions={actions} />
      ),
    },
  ];
}
