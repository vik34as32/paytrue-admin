export function getDaypartGreeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour >= 21 || hour < 5) return "Good Night";
  if (hour >= 17) return "Good Evening";
  if (hour >= 12) return "Good Afternoon";
  return "Good Morning";
}

export function formatPortalDate(date: Date): string {
  return date.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatPortalTime(date: Date): string {
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

export function firstName(fullName?: string | null): string {
  const name = (fullName || "").trim();
  if (!name) return "";
  return name.split(/\s+/)[0];
}
