"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Upload, X } from "lucide-react";
import { ImagePreviewModal } from "@/components/common/ImagePreviewModal";

interface ImageUploadProps {
  label: string;
  file?: File | null;
  existingUrl?: string | null;
  onChange: (file: File | null) => void;
  error?: string;
  className?: string;
  optional?: boolean;
  /** View mode: show image only, no upload/replace/remove */
  readOnly?: boolean;
  /** Tall preview like profile image on edit profile */
  size?: "default" | "tall";
}

export function ImageUpload({
  label,
  file,
  existingUrl,
  onChange,
  error,
  className,
  optional = false,
  readOnly = false,
  size = "default",
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
  const aspectClass = size === "tall" ? "aspect-[16/10] min-h-[220px]" : "aspect-[4/3] min-h-[180px]";

  return (
    <div className={cn("w-full", className)}>
      <label className="mb-1.5 block text-sm font-medium text-muted">
        {displayLabel}
      </label>

      {!file && !displayPreview ? (
        readOnly ? (
          <div className="rounded-xl border border-dashed border-border bg-background/40 p-6 text-center">
            <p className="text-sm font-medium text-muted">No image uploaded</p>
          </div>
        ) : (
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
              aspectClass,
              "flex flex-col items-center justify-center",
              error
                ? "border-accent-red/50 bg-accent-red/5"
                : "border-border bg-slate-50 hover:border-primary/50 hover:bg-primary/5"
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
        )
      ) : (
        <div
          className={cn(
            "relative overflow-hidden rounded-xl bg-[#1e293b]",
            aspectClass
          )}
        >
          {displayPreview ? (
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="absolute inset-0 flex items-center justify-center p-4"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={displayPreview}
                alt={label}
                className="max-h-full max-w-full rounded-md object-contain"
              />
            </button>
          ) : null}

          {!readOnly ? (
            <div className="absolute right-3 top-3 z-10 flex items-center gap-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 shadow-sm transition hover:bg-slate-100"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={removeFile}
                className="flex h-8 w-8 items-center justify-center rounded-md bg-red-500 text-white shadow-sm transition hover:bg-red-600"
                aria-label="Remove image"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : null}

          {!readOnly ? (
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
          ) : null}
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
          editable={!readOnly}
          onApply={
            readOnly
              ? undefined
              : (editedFile) => {
                  onChange(editedFile);
                }
          }
        />
      ) : null}
    </div>
  );
}
