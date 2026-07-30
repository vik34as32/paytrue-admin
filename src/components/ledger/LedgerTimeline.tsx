"use client";

import { Timeline } from "antd";
import dayjs from "dayjs";

interface TimelineItem {
  key: string;
  label: string;
  at?: string | null;
  active?: boolean;
}

interface LedgerTimelineProps {
  items: TimelineItem[];
}

export function LedgerTimeline({ items }: LedgerTimelineProps) {
  return (
    <Timeline
      items={items.map((item) => ({
        color: item.active
          ? item.key === "FAILED"
            ? "red"
            : item.key === "SUCCESS" || item.key === "REFUND"
              ? "green"
              : "blue"
          : "gray",
        children: (
          <div>
            <p className="font-semibold text-foreground">{item.label}</p>
            <p className="text-xs text-muted">
              {item.at ? dayjs(item.at).format("DD MMM YYYY, HH:mm") : "—"}
            </p>
          </div>
        ),
      }))}
    />
  );
}
