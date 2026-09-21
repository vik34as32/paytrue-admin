"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PermissionPanelProps {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
}

export function PermissionPanel({
  open,
  title,
  subtitle,
  onClose,
  children,
  footer,
  wide = false,
}: PermissionPanelProps) {
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const timer = window.setTimeout(() => panelRef.current?.focus(), 50);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus();
    };
  }, [open, onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[90]">
          <motion.button
            type="button"
            aria-label="Close panel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/40"
            onClick={onClose}
          />
          <motion.aside
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="permission-panel-title"
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 40, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "absolute inset-y-0 right-0 flex w-full flex-col bg-white shadow-2xl outline-none",
              wide ? "max-w-3xl" : "max-w-lg"
            )}
          >
            <div className="flex items-start justify-between border-b border-border px-5 py-4">
              <div>
                <h2
                  id="permission-panel-title"
                  className="text-lg font-semibold text-foreground"
                >
                  {title}
                </h2>
                {subtitle ? (
                  <p className="mt-1 text-sm text-muted">{subtitle}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 text-muted hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
            {footer ? (
              <div className="sticky bottom-0 border-t border-border bg-white px-5 py-4">
                {footer}
              </div>
            ) : null}
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
