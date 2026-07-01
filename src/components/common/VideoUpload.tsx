"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Upload, X, FileVideo } from "lucide-react";

interface VideoUploadProps {
  label: string;
  file?: File | null;
  existingUrl?: string;
  onChange: (file: File | null) => void;
  error?: string;
  className?: string;
}

export function VideoUpload({
  label,
  file,
  existingUrl,
  onChange,
  error,
  className,
}: VideoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

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

  return (
    <div className={cn("w-full", className)}>
      <label className="mb-1.5 block text-sm font-medium text-foreground">
        {label}
      </label>

      {!file && !preview ? (
        <div
          onClick={() => inputRef.current?.click()}
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
            accept="video/*"
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
            Click to upload video
          </p>
          <p className="mt-1 text-xs text-muted">Short verification video</p>
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-xl border border-border bg-card">
          {preview ? (
            <div className="relative aspect-video max-h-52 w-full overflow-hidden bg-black">
              <video src={preview} controls className="h-full w-full object-contain" />
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileVideo className="h-5 w-5" />
              </div>
              <p className="truncate text-sm font-medium">{file?.name}</p>
            </div>
          )}
          <div className="flex items-center justify-between border-t border-border px-4 py-2">
            <p className="truncate text-xs text-muted">
              {file?.name || "Existing video"}
            </p>
            <button
              type="button"
              onClick={removeFile}
              className="rounded-lg p-1 text-muted hover:bg-accent-red/10 hover:text-accent-red"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {error && <p className="mt-1 text-xs text-accent-red">{error}</p>}
    </div>
  );
}
