"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CircleHelp } from "lucide-react";
import { cn } from "@/lib/utils";

type Side = "top" | "right" | "bottom" | "left";

interface InfoTooltipProps {
  content: string;
  side?: Side;
  className?: string;
  iconClassName?: string;
  children?: React.ReactNode;
}

export function InfoTooltip({
  content,
  side = "top",
  className,
  iconClassName,
  children,
}: InfoTooltipProps) {
  const id = useId();
  const triggerRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  const place = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const gap = 10;
    if (side === "right") {
      setCoords({ top: r.top + r.height / 2, left: r.right + gap });
    } else if (side === "left") {
      setCoords({ top: r.top + r.height / 2, left: r.left - gap });
    } else if (side === "bottom") {
      setCoords({ top: r.bottom + gap, left: r.left + r.width / 2 });
    } else {
      setCoords({ top: r.top - gap, left: r.left + r.width / 2 });
    }
  }, [side]);

  useEffect(() => {
    if (!open) return;
    place();
    const onScroll = () => place();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open, place]);

  const transform =
    side === "right"
      ? "translateY(-50%)"
      : side === "left"
        ? "translate(-100%, -50%)"
        : side === "bottom"
          ? "translateX(-50%)"
          : "translate(-50%, -100%)";

  return (
    <>
      <span
        ref={triggerRef}
        role="note"
        tabIndex={0}
        aria-describedby={open ? id : undefined}
        aria-label="About this section"
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-full text-current/70 transition hover:text-current focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
          className
        )}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        {children ?? (
          <CircleHelp className={cn("h-4 w-4", iconClassName)} />
        )}
      </span>
      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            id={id}
            role="tooltip"
            style={{ top: coords.top, left: coords.left, transform }}
            className="pointer-events-none fixed z-[240] w-72 max-w-[min(18rem,calc(100vw-1.5rem))] animate-tooltip-in rounded-xl border border-white/10 bg-slate-950/95 px-3.5 py-2.5 text-left text-[12px] font-medium leading-relaxed text-slate-100 shadow-2xl shadow-black/40 backdrop-blur-md"
          >
            {content}
          </div>,
          document.body
        )}
    </>
  );
}
