"use client";

import { useEffect, useState } from "react";
import {
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
  RefreshCw,
} from "lucide-react";
import { Modal } from "@/components/modals/Modal";
import { Button } from "@/components/common/Button";
import {
  createEditedImageFile,
  getEditedImageMimeType,
} from "@/lib/imageEditor";

interface ImagePreviewModalProps {
  open: boolean;
  onClose: () => void;
  src: string;
  title: string;
  fileName?: string;
  editable?: boolean;
  onApply?: (file: File) => void;
}

export function ImagePreviewModal({
  open,
  onClose,
  src,
  title,
  fileName = "edited-image.jpg",
  editable = false,
  onApply,
}: ImagePreviewModalProps) {
  const [rotation, setRotation] = useState(0);
  const [scale, setScale] = useState(1);
  const [applying, setApplying] = useState(false);
  const canEdit = editable && Boolean(onApply);

  useEffect(() => {
    if (!open) return;
    setRotation(0);
    setScale(1);
  }, [open, src]);

  const rotateLeft = () => setRotation((value) => value - 90);
  const rotateRight = () => setRotation((value) => value + 90);
  const zoomIn = () => setScale((value) => Math.min(2, Number((value + 0.1).toFixed(2))));
  const zoomOut = () => setScale((value) => Math.max(0.25, Number((value - 0.1).toFixed(2))));
  const resetEdits = () => {
    setRotation(0);
    setScale(1);
  };

  const handleApply = async () => {
    if (!onApply) return;
    setApplying(true);
    try {
      const mimeType = getEditedImageMimeType(fileName);
      const editedFile = await createEditedImageFile(
        src,
        rotation,
        scale,
        fileName,
        mimeType
      );
      onApply(editedFile);
      onClose();
    } finally {
      setApplying(false);
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={title}
      subtitle={canEdit ? "Rotate, resize and apply changes" : undefined}
      size="xl"
      footer={
        canEdit ? (
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void handleApply()}
              isLoading={applying}
            >
              Apply Changes
            </Button>
          </div>
        ) : undefined
      }
    >
      <div className="space-y-4">
        <div className="flex min-h-[320px] items-center justify-center overflow-hidden rounded-xl border border-border bg-gradient-to-br from-slate-100 to-slate-200 p-4 dark:from-slate-900 dark:to-slate-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={title}
            className="max-h-[55vh] max-w-full rounded-lg object-contain transition-transform duration-200"
            style={{
              transform: `rotate(${rotation}deg) scale(${scale})`,
            }}
          />
        </div>

        {canEdit ? (
          <div className="space-y-4 rounded-xl border border-border bg-background/60 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                Rotate
              </span>
              <Button type="button" size="sm" variant="outline" onClick={rotateLeft}>
                <RotateCcw className="h-4 w-4" />
                Left
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={rotateRight}>
                <RotateCw className="h-4 w-4" />
                Right
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={resetEdits}>
                <RefreshCw className="h-4 w-4" />
                Reset
              </Button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Resize
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {Math.round(scale * 100)}%
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Button type="button" size="sm" variant="outline" onClick={zoomOut}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <input
                  type="range"
                  min={25}
                  max={200}
                  step={5}
                  value={Math.round(scale * 100)}
                  onChange={(event) => setScale(Number(event.target.value) / 100)}
                  className="h-2 flex-1 cursor-pointer accent-primary"
                />
                <Button type="button" size="sm" variant="outline" onClick={zoomIn}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
