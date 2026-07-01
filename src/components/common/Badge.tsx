import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "success" | "pending" | "rejected" | "active" | "suspended" | "inactive" | "default";
  className?: string;
}

const variantStyles = {
  success: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200/60 dark:bg-emerald-900/30 dark:text-emerald-400 dark:ring-emerald-800/40",
  pending: "bg-amber-100 text-amber-700 ring-1 ring-amber-200/60 dark:bg-amber-900/30 dark:text-amber-400 dark:ring-amber-800/40",
  rejected: "bg-red-100 text-red-700 ring-1 ring-red-200/60 dark:bg-red-900/30 dark:text-red-400 dark:ring-red-800/40",
  active: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200/60 dark:bg-emerald-900/30 dark:text-emerald-400 dark:ring-emerald-800/40",
  suspended: "bg-amber-100 text-amber-700 ring-1 ring-amber-200/60 dark:bg-amber-900/30 dark:text-amber-400 dark:ring-amber-800/40",
  inactive: "bg-gray-100 text-gray-600 ring-1 ring-gray-200/60 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700/40",
  default: "bg-primary/10 text-primary ring-1 ring-primary/20",
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
