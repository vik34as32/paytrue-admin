"use client";

import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Upload, X, FileImage, FileVideo, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type FileUploadType = "image" | "video" | "document";

interface FileUploadProps {
  label: string;
  accept?: string;
  type?: FileUploadType;
  hint?: string;
  className?: string;
}

export function FileUpload({
  label,
  accept,
  type = "image",
  hint,
  className,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const simulateProgress = useCallback(() => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 80);
  }, []);

  const handleFile = useCallback(
    (selected: File) => {
      setFile(selected);
      simulateProgress();

      if (type === "image" || selected.type.startsWith("image/")) {
        const url = URL.createObjectURL(selected);
        setPreview(url);
      } else if (type === "video" || selected.type.startsWith("video/")) {
        const url = URL.createObjectURL(selected);
        setPreview(url);
      } else {
        setPreview(null);
      }
    },
    [type, simulateProgress]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped) handleFile(dropped);
    },
    [handleFile]
  );

  const removeFile = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    setProgress(0);
    if (inputRef.current) inputRef.current.value = "";
  };

  const Icon =
    type === "video" ? FileVideo : type === "document" ? FileText : FileImage;

  return (
    <div className={cn("w-full", className)}>
      <label className="mb-1.5 block text-sm font-medium text-foreground">
        {label}
      </label>

      <AnimatePresence mode="wait">
        {!file ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={cn(
              "group relative cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-all",
              isDragging
                ? "border-primary bg-primary/5 scale-[1.01]"
                : "border-border bg-background/50 hover:border-primary/50 hover:bg-primary/5"
            )}
          >
            <input
              ref={inputRef}
              type="file"
              accept={accept}
              className="hidden"
              onChange={(e) => {
                const selected = e.target.files?.[0];
                if (selected) handleFile(selected);
              }}
            />
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
              <Upload className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-foreground">
              Drag & drop or click to upload
            </p>
            {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="relative overflow-hidden rounded-xl border border-border bg-card"
          >
            {preview && (type === "image" || file.type.startsWith("image/")) && (
              <div className="relative aspect-video max-h-40 w-full overflow-hidden bg-background">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview}
                  alt="Preview"
                  className="h-full w-full object-cover"
                />
              </div>
            )}

            {preview && (type === "video" || file.type.startsWith("video/")) && (
              <div className="relative aspect-video max-h-40 w-full overflow-hidden bg-black">
                <video src={preview} controls className="h-full w-full object-contain" />
              </div>
            )}

            {!preview && (
              <div className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
            )}

            {progress < 100 && (
              <div className="px-4 pb-3">
                <div className="h-1.5 overflow-hidden rounded-full bg-border">
                  <motion.div
                    className="h-full rounded-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                  />
                </div>
                <p className="mt-1 text-right text-[10px] text-muted">{progress}%</p>
              </div>
            )}

            {preview && progress >= 100 && (
              <div className="flex items-center justify-between border-t border-border px-4 py-2">
                <p className="truncate text-xs text-muted">{file.name}</p>
                <button
                  type="button"
                  onClick={removeFile}
                  className="rounded-lg p-1 text-muted hover:bg-accent-red/10 hover:text-accent-red"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {!preview && (
              <button
                type="button"
                onClick={removeFile}
                className="absolute right-2 top-2 rounded-lg bg-card/80 p-1 text-muted backdrop-blur-sm hover:text-accent-red"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
