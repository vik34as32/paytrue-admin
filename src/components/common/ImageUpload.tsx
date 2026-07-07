"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Pencil, RefreshCw, Upload, X } from "lucide-react";
import { ImagePreviewModal } from "@/components/common/ImagePreviewModal";

interface ImageUploadProps {
  label: string;
  file?: File | null;
  existingUrl?: string;
  onChange: (file: File | null) => void;
  error?: string;
  className?: string;
  optional?: boolean;
}

export function ImageUpload({
  label,
  file,
  existingUrl,
  onChange,
  error,
  className,
  optional = false,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    if (file instanceof File) {
      const url = URL.createObjectURL(file);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreview(existingUrl || null);
  }, [file, existingUrl]);

  const handleFile = useCallback(
    (selected: File) => {
      onChange(selected);
    },
    [onChange]
  );

  const removeFile = () => {
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const displayPreview = preview;
  const displayLabel = optional ? `${label} (Optional)` : label;

  return (
    <div className={cn("w-full", className)}>
      <label className="mb-1.5 block text-sm font-medium text-foreground">
        {displayLabel}
      </label>

      {!file && !displayPreview ? (
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              inputRef.current?.click();
            }
          }}
          className={cn(
            "cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-all",
            error
              ? "border-accent-red/50 bg-accent-red/5"
              : "border-border bg-background/50 hover:border-primary/50 hover:bg-primary/5"
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png"
            className="hidden"
            onChange={(e) => {
              const selected = e.target.files?.[0];
              if (selected) handleFile(selected);
            }}
          />
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Upload className="h-5 w-5" />
          </div>
          <p className="text-sm font-medium text-foreground">
            Click to upload image
          </p>
          <p className="mt-1 text-xs text-muted">JPG, JPEG, PNG up to 5MB</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          {displayPreview ? (
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="group relative block w-full"
            >
              <div className="relative aspect-[4/3] max-h-52 w-full overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={displayPreview}
                  alt={label}
                  className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30">
                  <span className="flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-foreground opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                    <Pencil className="h-3.5 w-3.5" />
                    Edit image
                  </span>
                </div>
              </div>
            </button>
          ) : null}
          <div className="flex items-center justify-between gap-2 border-t border-border px-4 py-2.5">
            <p className="truncate text-xs text-muted">
              {file?.name || "Existing image"}
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPreviewOpen(true)}
                className="rounded-lg p-1.5 text-muted hover:bg-primary/10 hover:text-primary"
                aria-label="Edit image"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="rounded-lg p-1.5 text-muted hover:bg-primary/10 hover:text-primary"
                aria-label="Replace image"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={removeFile}
                className="rounded-lg p-1.5 text-muted hover:bg-accent-red/10 hover:text-accent-red"
                aria-label="Remove image"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png"
            className="hidden"
            onChange={(e) => {
              const selected = e.target.files?.[0];
              if (selected) handleFile(selected);
            }}
          />
        </div>
      )}

      {error && <p className="mt-1 text-xs text-accent-red">{error}</p>}

      {displayPreview ? (
        <ImagePreviewModal
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          src={displayPreview}
          title={label}
          fileName={file?.name || `${label.replace(/\s+/g, "-").toLowerCase()}.jpg`}
          editable
          onApply={(editedFile) => {
            onChange(editedFile);
          }}
        />
      ) : null}
    </div>
  );
}
