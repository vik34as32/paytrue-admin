"use client";

import { CalendarClock, Sun, Sunset, Moon, CloudSun } from "lucide-react";
import { useLiveClock } from "@/hooks/useLiveClock";
import {
  firstName,
  formatPortalDate,
  formatPortalTime,
  getDaypartGreeting,
} from "@/lib/portalGreeting";
import { cn } from "@/lib/utils";

export function PortalGreeting({
  name,
  compact,
}: {
  name?: string | null;
  compact?: boolean;
}) {
  const now = useLiveClock();
  const greeting = getDaypartGreeting(now);
  const person = firstName(name);
  const Icon =
    greeting === "Good Night"
      ? Moon
      : greeting === "Good Evening"
        ? Sunset
        : greeting === "Good Afternoon"
          ? Sun
          : CloudSun;

  return (
    <div
      className={cn(
        "min-w-0 rounded-2xl border px-3 py-1.5 shadow-sm",
        "border-[color:var(--portal-line)] bg-[color:var(--portal-chip)]"
      )}
    >
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[color:var(--portal-chip-icon)] text-[color:var(--portal-accent)]">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold leading-tight text-[color:var(--navbar-foreground,#1b2559)]">
            {greeting}
            {person ? `, ${person}` : ""}
          </p>
          <p
            className={cn(
              "flex items-center gap-1.5 text-[11px] font-medium tabular-nums text-[color:var(--navbar-muted,#5b6b8c)]",
              compact && "hidden sm:flex"
            )}
          >
            <CalendarClock className="h-3 w-3 shrink-0" />
            <span className="truncate">
              {formatPortalDate(now)} · {formatPortalTime(now)}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
