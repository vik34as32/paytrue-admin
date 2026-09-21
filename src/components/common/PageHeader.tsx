"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { InfoTooltip } from "@/components/common/InfoTooltip";
import { getSectionHelp } from "@/lib/sectionHelp";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  breadcrumb?: string;
  className?: string;
  hint?: string;
}

export function PageHeader({
  title,
  subtitle,
  action,
  breadcrumb,
  className,
  hint,
}: PageHeaderProps) {
  const pathname = usePathname();
  const help = hint ?? getSectionHelp(pathname);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
        className
      )}
    >
      <div>
        {breadcrumb && (
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-primary">
            {breadcrumb}
          </p>
        )}
        <div className="flex items-center gap-2">
          <h1 className="page-title">{title}</h1>
          {help ? (
            <InfoTooltip
              content={help}
              className="mt-1 text-muted hover:text-primary"
            />
          ) : null}
        </div>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </motion.div>
  );
}
