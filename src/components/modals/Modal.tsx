"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/common/Button";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
}

const sizes = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  "2xl": "max-w-6xl",
};

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = "md",
}: ModalProps) {
  useEffect(() => {
    if (!isOpen || typeof document === "undefined") return;

    const html = document.documentElement;
    const main = document.querySelector("main");

    html.classList.add("modal-open");
    const previousMainOverflow = main instanceof HTMLElement ? main.style.overflow : "";

    if (main instanceof HTMLElement) {
      main.style.overflow = "hidden";
    }

    return () => {
      html.classList.remove("modal-open");
      if (main instanceof HTMLElement) {
        main.style.overflow = previousMainOverflow;
      }
    };
  }, [isOpen]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "relative flex w-full max-h-[90vh] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl",
              sizes[size]
            )}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex shrink-0 items-start justify-between border-b border-border px-6 py-4">
              <div className="min-w-0 pr-4">
                <h2 id="modal-title" className="text-lg font-bold text-foreground">
                  {title}
                </h2>
                {subtitle && (
                  <p className="mt-0.5 text-sm text-muted">{subtitle}</p>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close modal">
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div
              className={cn(
                "min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-4",
                "[&_form>div:last-child]:sticky [&_form>div:last-child]:bottom-0 [&_form>div:last-child]:z-10",
                "[&_form>div:last-child]:-mx-6 [&_form>div:last-child]:border-t [&_form>div:last-child]:border-border",
                "[&_form>div:last-child]:bg-card [&_form>div:last-child]:px-6 [&_form>div:last-child]:py-4",
                "[&_form>div:last-child]:mt-4"
              )}
            >
              {children}
            </div>

            {footer && (
              <div className="sticky bottom-0 shrink-0 border-t border-border bg-card px-6 py-4">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
