import { cn, formatCurrency } from "@/lib/utils";
import { HiArrowUp, HiArrowDown } from "react-icons/hi";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  gradient: string;
  icon?: React.ReactNode;
  trend?: { value: number; isUp: boolean };
}

export function StatCard({
  title,
  value,
  subtitle,
  gradient,
  icon,
  trend,
}: StatCardProps) {
  const displayValue =
    typeof value === "number" && title.toLowerCase().includes("revenue")
      ? formatCurrency(value)
      : value;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-gradient-to-br p-5 text-white shadow-lg",
        gradient
      )}
    >
      <div className="relative z-10">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-medium text-white/80">{title}</p>
          {icon && (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              {icon}
            </div>
          )}
        </div>
        <p className="text-2xl font-bold lg:text-3xl">{displayValue}</p>
        {subtitle && (
          <p className="mt-1 text-xs text-white/70">{subtitle}</p>
        )}
        {trend && (
          <div className="mt-2 flex items-center gap-1 text-xs">
            {trend.isUp ? (
              <HiArrowUp className="h-3 w-3" />
            ) : (
              <HiArrowDown className="h-3 w-3" />
            )}
            <span>{trend.value}% vs last month</span>
          </div>
        )}
      </div>
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10" />
      <div className="absolute -bottom-6 -right-6 h-32 w-32 rounded-full bg-white/5" />
    </div>
  );
}
