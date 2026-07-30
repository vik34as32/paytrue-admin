"use client";

import { useState } from "react";
import { FileImage, ImageOff } from "lucide-react";
import { ImagePreviewModal } from "@/components/common/ImagePreviewModal";
import { resolveMediaUrl, cn } from "@/lib/utils";
import {
  mapApiUserToExistingUrls,
} from "@/lib/buildUserFormData";
import { NetworkUserRecord } from "@/types/superAdmin";

export interface KycDocumentItem {
  key: string;
  label: string;
  short: string;
  src: string | null;
}

export function getUserKycDocuments(user: NetworkUserRecord): KycDocumentItem[] {
  const urls = mapApiUserToExistingUrls(user as never);
  const bank =
    user.bankAccount && typeof user.bankAccount === "object"
      ? (user.bankAccount as Record<string, unknown>)
      : {};

  const passbook =
    resolveMediaUrl(urls.passbookImage) ||
    resolveMediaUrl(
      typeof bank.passbookImage === "string" ? bank.passbookImage : null
    ) ||
    resolveMediaUrl(
      typeof bank.passbookUrl === "string" ? bank.passbookUrl : null
    );

  return [
    {
      key: "aadhaarFront",
      label: "Aadhaar Front",
      short: "Aadhaar",
      src: resolveMediaUrl(urls.aadhaarFront),
    },
    {
      key: "aadhaarBack",
      label: "Aadhaar Back",
      short: "Back",
      src: resolveMediaUrl(urls.aadhaarBack),
    },
    {
      key: "panCard",
      label: "PAN Card",
      short: "PAN",
      src: resolveMediaUrl(urls.panCard),
    },
    {
      key: "ownerPhoto",
      label: "Owner Photo",
      short: "Owner",
      src: resolveMediaUrl(urls.ownerPhoto),
    },
    {
      key: "profileImage",
      label: "Profile Image",
      short: "Profile",
      src: resolveMediaUrl(urls.profileImage),
    },
    {
      key: "passbook",
      label: "Passbook",
      short: "Passbook",
      src: passbook,
    },
    {
      key: "cancelledCheque",
      label: "Cancelled Cheque",
      short: "Cheque",
      src: resolveMediaUrl(
        typeof bank.cancelledChequeImage === "string"
          ? bank.cancelledChequeImage
          : null
      ) || resolveMediaUrl(urls.cancelledChequeImage),
    },
  ];
}

function Thumb({
  item,
  onOpen,
}: {
  item: KycDocumentItem;
  onOpen: (item: KycDocumentItem) => void;
}) {
  const [broken, setBroken] = useState(false);

  if (!item.src || broken) {
    return (
      <div
        className="flex h-12 w-12 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 text-[9px] font-semibold text-muted"
        title={`${item.label} not available`}
      >
        <ImageOff className="mb-0.5 h-3.5 w-3.5 opacity-60" />
        {item.short}
      </div>
    );
  }

  return (
    <button
      type="button"
      title={`View ${item.label}`}
      aria-label={`View ${item.label}`}
      onClick={(event) => {
        event.stopPropagation();
        onOpen(item);
      }}
      className="group relative h-12 w-12 overflow-hidden rounded-lg border border-border bg-white shadow-sm transition hover:scale-105 hover:border-primary/40 hover:shadow-md"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.src}
        alt={item.label}
        className="h-full w-full object-cover"
        onError={() => setBroken(true)}
      />
      <span className="absolute inset-x-0 bottom-0 bg-black/55 px-0.5 py-0.5 text-center text-[8px] font-bold uppercase tracking-wide text-white opacity-0 transition group-hover:opacity-100">
        {item.short}
      </span>
    </button>
  );
}

interface DocumentThumbStackProps {
  user: NetworkUserRecord;
  loading?: boolean;
  className?: string;
}

export function DocumentThumbStack({
  user,
  loading,
  className,
}: DocumentThumbStackProps) {
  const [preview, setPreview] = useState<KycDocumentItem | null>(null);
  const docs = getUserKycDocuments(user);
  const available = docs.filter((d) => d.src).length;

  if (loading) {
    return (
      <div className={cn("flex gap-1.5", className)}>
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="h-12 w-12 animate-pulse rounded-lg bg-muted/30"
          />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className={cn("flex min-w-[280px] flex-wrap items-center gap-1.5", className)}>
        {docs.map((item) => (
          <Thumb key={item.key} item={item} onOpen={setPreview} />
        ))}
        <span className="ml-1 hidden text-[10px] font-medium text-muted xl:inline">
          {available}/{docs.length}
        </span>
      </div>

      <ImagePreviewModal
        open={!!preview?.src}
        onClose={() => setPreview(null)}
        src={preview?.src || ""}
        title={preview?.label || "Document"}
      />
    </>
  );
}

export function DocumentGallery({
  user,
  className,
}: {
  user: NetworkUserRecord;
  className?: string;
}) {
  const [preview, setPreview] = useState<KycDocumentItem | null>(null);
  const docs = getUserKycDocuments(user);

  return (
    <>
      <div className={cn("grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4", className)}>
        {docs.map((item) => (
          <button
            key={item.key}
            type="button"
            disabled={!item.src}
            onClick={() => item.src && setPreview(item)}
            className={cn(
              "overflow-hidden rounded-xl border text-left transition",
              item.src
                ? "border-border hover:border-primary/40 hover:shadow-md"
                : "cursor-not-allowed border-dashed border-border opacity-70"
            )}
          >
            {item.src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.src}
                alt={item.label}
                className="h-28 w-full object-cover"
              />
            ) : (
              <div className="flex h-28 w-full flex-col items-center justify-center bg-muted/20 text-muted">
                <FileImage className="mb-1 h-5 w-5" />
                <span className="text-[10px]">Not uploaded</span>
              </div>
            )}
            <p className="px-2 py-1.5 text-[11px] font-semibold text-foreground">
              {item.label}
            </p>
          </button>
        ))}
      </div>

      <ImagePreviewModal
        open={!!preview?.src}
        onClose={() => setPreview(null)}
        src={preview?.src || ""}
        title={preview?.label || "Document"}
      />
    </>
  );
}
