import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, isToday, parseISO, startOfDay, subDays } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string | Date, pattern = "dd MMM yyyy, HH:mm"): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, pattern);
}

export function generateId(prefix = "TXN"): string {
  return `${prefix}${Date.now()}${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
}

export function getDateRange(period: string): { start: Date; end: Date } {
  const now = new Date();
  const end = now;
  switch (period) {
    case "today":
      return { start: startOfDay(now), end };
    case "yesterday": {
      const yesterday = subDays(now, 1);
      return { start: startOfDay(yesterday), end: startOfDay(now) };
    }
    case "weekly":
      return { start: subDays(startOfDay(now), 7), end };
    case "monthly":
      return { start: subDays(startOfDay(now), 30), end };
    default:
      return { start: subDays(startOfDay(now), 30), end };
  }
}

export function isCreatedToday(dateStr: string): boolean {
  return isToday(parseISO(dateStr));
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const API_ORIGIN = (
  process.env.NEXT_PUBLIC_API_URL || "https://apis.paytrue.co.in/api/v1"
).replace(/\/api\/v1\/?$/, "");

export function resolveMediaUrl(url?: string | null): string | null {
  if (!url) return null;
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("data:") ||
    url.startsWith("blob:")
  ) {
    return url;
  }
  return url.startsWith("/") ? `${API_ORIGIN}${url}` : `${API_ORIGIN}/${url}`;
}

export function downloadFile(content: string | Blob, filename: string, mimeType: string) {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
