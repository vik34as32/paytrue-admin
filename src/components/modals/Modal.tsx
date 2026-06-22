"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/common/Button";
import { HiX } from "react-icons/hi";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
}: ModalProps) {
  if (!isOpen) return null;

  const sizes = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className={cn(
          "relative w-full rounded-2xl border border-border bg-card p-6 shadow-2xl",
          sizes[size]
        )}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">{title}</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <HiX className="h-5 w-5" />
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}
