"use client";

import { useMemo, useState } from "react";
import { Check, Mail, Phone, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { NetworkUserAvatar } from "@/components/super-admin/NetworkUserAvatar";
import {
  getUserKycDocuments,
  type KycDocumentItem,
} from "@/components/verification/DocumentThumbStack";
import { ImagePreviewModal } from "@/components/common/ImagePreviewModal";
import { NetworkUserRecord, UserDetailRecord } from "@/types/superAdmin";
import {
  formatUserTypeLabel,
  getHierarchyLabel,
  getNetworkUserName,
  getUserFirstName,
} from "@/lib/normalizeUser";

/** Opens Gmail compose with the given address as recipient. */
export function openGmailCompose(email: string) {
  const url = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

function formatPhoneDisplay(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  if (digits.length === 12 && digits.startsWith("91")) {
    return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  }
  return raw;
}

function telHref(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length === 10) return `tel:+91${digits}`;
  if (digits.startsWith("91") && digits.length >= 12) return `tel:+${digits}`;
  return `tel:${digits}`;
}

type AvatarUser = Parameters<typeof NetworkUserAvatar>[0]["user"];

export function ProfileCell({
  user,
  kind,
  subtitle,
}: {
  user: AvatarUser & {
    id?: string;
    userCode?: string;
    userType?: string;
    role?: string;
  };
  kind?: "RETAILER" | "DISTRIBUTOR" | "MASTER_DISTRIBUTOR" | "ADMIN";
  /** Optional secondary line (e.g. Admin ID). Defaults to userCode. */
  subtitle?: string;
}) {
  const name =
    kind === "RETAILER"
      ? getUserFirstName(user as NetworkUserRecord)
      : getNetworkUserName(user as NetworkUserRecord);
  const code =
    subtitle ||
    user.userCode ||
    (user.id ? `${String(user.id).slice(0, 8)}…` : "");
  const roleLabel = formatUserTypeLabel(user.userType || user.role);

  return (
    <div className="flex min-w-[200px] max-w-[280px] items-center gap-3">
      <NetworkUserAvatar user={user} size="md" className="shrink-0 !ring-1 !ring-slate-200/80" />
      <div className="min-w-0">
        <p
          className="truncate text-[14px] font-semibold leading-snug text-slate-900 dark:text-foreground"
          title={name}
        >
          {name}
        </p>
        {code ? (
          <p
            className="mt-0.5 truncate font-mono text-[11px] font-medium tracking-wide text-slate-500"
            title={String(code)}
          >
            {code}
          </p>
        ) : null}
        {roleLabel && roleLabel !== "—" ? (
          <span className="mt-1 inline-flex rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600 dark:bg-muted dark:text-muted-foreground">
            {roleLabel}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function EmailCell({
  email,
  name,
}: {
  email?: string | null;
  name?: string;
}) {
  const value = (email || "").trim();
  if (!value) {
    return <span className="text-sm text-slate-400">—</span>;
  }

  const label = name ? `Email ${name}` : `Email ${value}`;

  return (
    <button
      type="button"
      title={value}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        openGmailCompose(value);
      }}
      className={cn(
        "group inline-flex max-w-[240px] items-center gap-2 text-left transition-colors duration-150",
        "text-[13px] font-medium text-sky-700 hover:text-sky-900 dark:text-sky-400 dark:hover:text-sky-300"
      )}
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600 ring-1 ring-sky-100 dark:bg-sky-950/40 dark:ring-sky-900/50">
        <Mail className="h-3.5 w-3.5" />
      </span>
      <span className="min-w-0 truncate underline-offset-2 group-hover:underline">
        {value}
      </span>
    </button>
  );
}

export function PhoneCell({
  phone,
  name,
}: {
  phone?: string | null;
  name?: string;
}) {
  const raw = (phone || "").trim();
  if (!raw || raw === "—") {
    return <span className="text-sm text-slate-400">—</span>;
  }

  const href = telHref(raw);
  const display = formatPhoneDisplay(raw);
  const label = name ? `Call ${name}` : `Call ${display}`;

  if (!href) {
    return (
      <span className="inline-flex items-center gap-2 text-[13px] font-medium tabular-nums text-slate-800 dark:text-foreground">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-50 text-slate-500 ring-1 ring-slate-100 dark:bg-muted">
          <Phone className="h-3.5 w-3.5" />
        </span>
        {display}
      </span>
    );
  }

  return (
    <a
      href={href}
      title="Call"
      aria-label={label}
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "group inline-flex max-w-[200px] items-center gap-2 transition-colors duration-150",
        "text-[13px] font-medium tabular-nums text-slate-800 hover:text-slate-950 dark:text-foreground"
      )}
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-950/30 dark:ring-emerald-900/40">
        <Phone className="h-3.5 w-3.5" />
      </span>
      <span className="truncate underline-offset-2 group-hover:underline">
        {display}
      </span>
    </a>
  );
}

function DocChip({
  label,
  uploaded,
  onClick,
}: {
  label: string;
  uploaded: boolean;
  onClick?: () => void;
}) {
  const content = (
    <>
      {uploaded ? (
        <Check className="h-3 w-3 text-emerald-600" strokeWidth={2.5} />
      ) : (
        <X className="h-3 w-3 text-slate-400" strokeWidth={2.5} />
      )}
      <span>{label}</span>
    </>
  );

  const className = cn(
    "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold tracking-wide",
    uploaded
      ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:ring-emerald-900/40"
      : "bg-slate-50 text-slate-500 ring-1 ring-slate-100 dark:bg-muted dark:text-muted-foreground"
  );

  if (uploaded && onClick) {
    return (
      <button
        type="button"
        className={cn(className, "transition hover:ring-emerald-200")}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        aria-label={`View ${label}`}
      >
        {content}
      </button>
    );
  }

  return <span className={className}>{content}</span>;
}

/** Compact document status — only upload presence from existing KYC URLs. */
export function DocumentStatusCell({ user }: { user: NetworkUserRecord }) {
  const docs = useMemo(() => getUserKycDocuments(user), [user]);
  const [preview, setPreview] = useState<KycDocumentItem | null>(null);

  const pan = docs.find((d) => d.key === "panCard");
  const aadhaarFront = docs.find((d) => d.key === "aadhaarFront");
  const aadhaarBack = docs.find((d) => d.key === "aadhaarBack");
  const aadhaarUploaded = Boolean(aadhaarFront?.src || aadhaarBack?.src);
  const aadhaarSrc = aadhaarFront?.src || aadhaarBack?.src || null;

  const uploadedCount = docs.filter((d) => Boolean(d.src)).length;
  const total = docs.length;

  return (
    <>
      <div className="min-w-[140px] space-y-1.5">
        <div className="flex flex-wrap gap-1">
          <DocChip
            label="PAN"
            uploaded={Boolean(pan?.src)}
            onClick={
              pan?.src
                ? () => setPreview(pan)
                : undefined
            }
          />
          <DocChip
            label="Aadhaar"
            uploaded={aadhaarUploaded}
            onClick={
              aadhaarSrc
                ? () =>
                    setPreview({
                      key: "aadhaar",
                      label: "Aadhaar",
                      short: "Aadhaar",
                      src: aadhaarSrc,
                    })
                : undefined
            }
          />
        </div>
        <p className="text-[11px] font-medium text-slate-500">
          {uploadedCount} / {total} uploaded
        </p>
      </div>
      <ImagePreviewModal
        open={Boolean(preview?.src)}
        onClose={() => setPreview(null)}
        src={preview?.src || ""}
        title={preview?.label || "Document"}
      />
    </>
  );
}

export function StatusPill({ status }: { status?: string | null }) {
  const value = String(status || "").toUpperCase() || "—";
  const tone =
    value === "ACTIVE"
      ? "bg-emerald-50 text-emerald-800 ring-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400"
      : value === "PENDING"
        ? "bg-amber-50 text-amber-800 ring-amber-100 dark:bg-amber-950/30 dark:text-amber-400"
        : value === "SUSPENDED"
          ? "bg-orange-50 text-orange-800 ring-orange-100 dark:bg-orange-950/30 dark:text-orange-400"
          : value === "INACTIVE"
            ? "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-muted dark:text-muted-foreground"
            : "bg-slate-100 text-slate-600 ring-slate-200";

  const dot =
    value === "ACTIVE"
      ? "bg-emerald-500"
      : value === "PENDING"
        ? "bg-amber-500"
        : value === "SUSPENDED"
          ? "bg-orange-500"
          : "bg-slate-400";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ring-1",
        tone
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />
      {value === "—" ? "—" : value.toLowerCase()}
    </span>
  );
}

export function HierarchyCell({ user }: { user: NetworkUserRecord }) {
  const labels = getHierarchyLabel(user as UserDetailRecord);
  const md = labels.masterDistributor;
  const dist = labels.distributor;
  const parent = labels.parentUser;

  if (!md && !dist && !parent) {
    return <span className="text-sm text-slate-400">—</span>;
  }

  return (
    <div className="min-w-[160px] max-w-[220px] space-y-1.5 text-[12px] leading-snug">
      {md ? (
        <div className="rounded-lg border border-indigo-100 bg-indigo-50/80 px-2.5 py-1.5 dark:border-indigo-500/20 dark:bg-indigo-500/10">
          <p className="text-[10px] font-bold uppercase tracking-wide text-indigo-500">
            Master Distributor
          </p>
          <p
            className="truncate font-semibold text-slate-900 dark:text-foreground"
            title={md}
          >
            {md}
          </p>
        </div>
      ) : null}
      {dist ? (
        <div className="rounded-lg border border-sky-100 bg-sky-50/80 px-2.5 py-1.5 dark:border-sky-500/20 dark:bg-sky-500/10">
          <p className="text-[10px] font-bold uppercase tracking-wide text-sky-600">
            Distributor
          </p>
          <p
            className="truncate font-semibold text-slate-900 dark:text-foreground"
            title={dist}
          >
            {dist}
          </p>
        </div>
      ) : null}
      {!md && !dist && parent ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 dark:border-border dark:bg-muted/30">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
            Parent
          </p>
          <p
            className="truncate font-semibold text-slate-900 dark:text-foreground"
            title={parent}
          >
            {parent}
          </p>
        </div>
      ) : null}
    </div>
  );
}

/** Dedicated Master Distributor column cell */
export function MasterDistributorCell({ user }: { user: NetworkUserRecord }) {
  const labels = getHierarchyLabel(user as UserDetailRecord);
  const md = labels.masterDistributor;
  if (!md) return <span className="text-xs text-slate-400">—</span>;
  const code = (user as UserDetailRecord).masterDistributor?.userCode;
  return (
    <div className="min-w-[140px] max-w-[200px] rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white px-3 py-2 shadow-sm dark:border-indigo-500/20 dark:from-indigo-500/10 dark:to-card">
      <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-indigo-500">
        Master Dist.
      </p>
      <p
        className="mt-0.5 truncate text-sm font-semibold text-slate-900 dark:text-foreground"
        title={md}
      >
        {md}
      </p>
      {code ? (
        <p className="mt-0.5 font-mono text-[10px] text-slate-500">{code}</p>
      ) : null}
    </div>
  );
}

/** Dedicated Distributor column cell */
export function DistributorCell({ user }: { user: NetworkUserRecord }) {
  const labels = getHierarchyLabel(user as UserDetailRecord);
  const dist = labels.distributor || (!labels.masterDistributor ? labels.parentUser : undefined);
  if (!dist) return <span className="text-xs text-slate-400">—</span>;
  const code =
    (user as UserDetailRecord).distributor?.userCode ||
    (user as UserDetailRecord).parentUser?.userCode;
  return (
    <div className="min-w-[140px] max-w-[200px] rounded-xl border border-sky-100 bg-gradient-to-br from-sky-50 to-white px-3 py-2 shadow-sm dark:border-sky-500/20 dark:from-sky-500/10 dark:to-card">
      <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-sky-600">
        Distributor
      </p>
      <p
        className="mt-0.5 truncate text-sm font-semibold text-slate-900 dark:text-foreground"
        title={dist}
      >
        {dist}
      </p>
      {code ? (
        <p className="mt-0.5 font-mono text-[10px] text-slate-500">{code}</p>
      ) : null}
    </div>
  );
}

export function getRecordPhone(user: {
  mobile?: string;
  phone?: string;
}): string {
  return (
    user.mobile ||
    (typeof user.phone === "string" ? user.phone : undefined) ||
    ""
  );
}

/** Small clickable doc thumbnail or empty dash. */
export function DocImageCell({
  src,
  label,
}: {
  src?: string | null;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const url = (src || "").trim();

  if (!url) {
    return <span className="text-xs text-slate-400">—</span>;
  }

  return (
    <>
      <button
        type="button"
        title={`View ${label}`}
        aria-label={`View ${label}`}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        className="group relative h-10 w-10 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:border-sky-300 dark:border-border"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={label}
          className="h-full w-full object-cover"
        />
      </button>
      <ImagePreviewModal
        open={open}
        onClose={() => setOpen(false)}
        src={url}
        title={label}
      />
    </>
  );
}

