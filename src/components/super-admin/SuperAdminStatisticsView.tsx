"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  Banknote,
  Building2,
  CircleDollarSign,
  Fingerprint,
  Landmark,
  QrCode,
  Store,
  Users,
  Wallet,
  ArrowLeftRight,
  BadgeIndianRupee,
  ClipboardList,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { StatCard } from "@/components/cards/StatCard";
import { Card, CardHeader } from "@/components/common/Card";
import { GRADIENT_CARDS } from "@/constants";
import { formatBalanceFieldLabel } from "@/lib/walletBalance";
import { cn, formatCurrency } from "@/lib/utils";
import {
  SuperAdminServiceStats,
  SuperAdminStatisticsData,
} from "@/types/superAdmin";

function asNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.replace(/,/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function formatCount(value: unknown): string {
  return asNumber(value).toLocaleString("en-IN");
}

function isMoneyLabel(label: string) {
  const lower = label.toLowerCase();
  return (
    lower.includes("balance") ||
    lower.includes("business") ||
    lower.includes("profit") ||
    lower.includes("commission") ||
    lower.includes("earned")
  );
}

const SECTION_META: {
  key: keyof SuperAdminStatisticsData;
  title: string;
  icon: LucideIcon;
}[] = [
  { key: "users", title: "Users", icon: Users },
  { key: "transactions", title: "Transactions", icon: ArrowLeftRight },
  { key: "business", title: "Business", icon: BadgeIndianRupee },
  { key: "wallet", title: "Wallet", icon: Wallet },
  { key: "fundRequests", title: "Fund Requests", icon: ClipboardList },
  { key: "profit", title: "Profit", icon: TrendingUp },
];

const SERVICE_CARDS: {
  key: string;
  aliases: string[];
  title: string;
  subtitle: string;
  icon: LucideIcon;
  tone: string;
  chip: string;
}[] = [
  {
    key: "dmt",
    aliases: ["dmt", "dmt1"],
    title: "DMT",
    subtitle: "Domestic Money Transfer",
    icon: Landmark,
    tone: "from-indigo-600 via-indigo-500 to-sky-500",
    chip: "bg-white/15 text-white",
  },
  {
    key: "dmt3",
    aliases: ["dmt3"],
    title: "DMT3",
    subtitle: "Domestic Money Transfer 3",
    icon: Banknote,
    tone: "from-emerald-600 via-teal-500 to-cyan-500",
    chip: "bg-white/15 text-white",
  },
  {
    key: "aeps",
    aliases: ["aeps", "apes"],
    title: "AEPS",
    subtitle: "Aadhaar Enabled Payments",
    icon: Fingerprint,
    tone: "from-violet-600 via-fuchsia-500 to-rose-500",
    chip: "bg-white/15 text-white",
  },
  {
    key: "upiAtm",
    aliases: ["upiAtm", "upi_atm", "upiatm", "upi"],
    title: "UPI ATM",
    subtitle: "UPI cash / ATM",
    icon: QrCode,
    tone: "from-amber-500 via-orange-500 to-rose-500",
    chip: "bg-white/15 text-white",
  },
];

function pickService(
  services: Record<string, SuperAdminServiceStats> | undefined,
  aliases: string[]
): SuperAdminServiceStats | null {
  if (!services) return null;
  const entries = Object.entries(services);
  for (const alias of aliases) {
    const match = entries.find(
      ([key]) => key.toLowerCase() === alias.toLowerCase()
    );
    if (match) return match[1];
  }
  return null;
}

function ServiceMetricRow({
  label,
  business,
  transactions,
}: {
  label: string;
  business: number;
  transactions: number;
}) {
  return (
    <div className="rounded-xl bg-white/12 px-3 py-2.5 backdrop-blur-sm">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-white/70">
        {label}
      </p>
      <div className="mt-1 flex flex-wrap items-end justify-between gap-2">
        <p className="text-lg font-bold tabular-nums tracking-tight text-white sm:text-xl">
          {formatCurrency(business)}
        </p>
        <p className="rounded-full bg-black/15 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-white">
          {formatCount(transactions)} txn
        </p>
      </div>
    </div>
  );
}

export function SuperAdminStatisticsView({
  statistics,
}: {
  statistics: SuperAdminStatisticsData;
}) {
  const reduceMotion = useReducedMotion();
  const periodLabel =
    statistics.period?.monthLabel ||
    [statistics.period?.monthName, statistics.period?.year]
      .filter(Boolean)
      .join(" ");

  const cardMotion = (index: number) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 14, scale: 0.98 },
          animate: { opacity: 1, y: 0, scale: 1 },
          transition: {
            delay: index * 0.05,
            duration: 0.35,
            ease: [0.22, 1, 0.36, 1] as const,
          },
        };

  return (
    <div className="space-y-8">
      {periodLabel ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-1 text-xs font-semibold text-[color:var(--muted)]">
            <Building2 className="h-3.5 w-3.5 text-primary" />
            Reporting period
          </span>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            {periodLabel}
          </span>
        </div>
      ) : null}

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-bold text-foreground">Service business</h2>
          <p className="text-sm text-muted">
            Today business and today success transactions together, plus monthly
            and all-time totals in Indian Rupees.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {SERVICE_CARDS.map((service, index) => {
            const data = pickService(statistics.services, service.aliases);
            const Icon = service.icon;
            const tx = data?.successTransactions;
            const month =
              data?.monthLabel || periodLabel || "Current period";

            return (
              <motion.article
                key={service.key}
                {...cardMotion(index)}
                className={cn(
                  "relative overflow-hidden rounded-2xl bg-gradient-to-br p-5 text-white shadow-lg",
                  service.tone
                )}
              >
                <div className="relative z-10 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-bold tracking-tight">
                        {service.title}
                      </p>
                      <p className="text-xs text-white/75">{service.subtitle}</p>
                    </div>
                    <span className={cn("rounded-xl p-2.5", service.chip)}>
                      <Icon className="h-5 w-5" />
                    </span>
                  </div>
                  <span className="inline-flex rounded-full bg-black/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/90">
                    {month}
                  </span>
                  <div className="space-y-2">
                    <ServiceMetricRow
                      label="Today"
                      business={asNumber(data?.todayBusiness)}
                      transactions={asNumber(tx?.today)}
                    />
                    <ServiceMetricRow
                      label="This month"
                      business={asNumber(data?.monthlyBusiness)}
                      transactions={asNumber(tx?.monthly)}
                    />
                    <ServiceMetricRow
                      label="All time"
                      business={asNumber(data?.totalBusiness)}
                      transactions={asNumber(tx?.total)}
                    />
                  </div>
                </div>
                <div className="pointer-events-none absolute -right-6 -top-8 h-28 w-28 rounded-full bg-white/10" />
                <div className="pointer-events-none absolute -bottom-10 -left-8 h-32 w-32 rounded-full bg-black/10" />
              </motion.article>
            );
          })}
        </div>
      </section>

      {SECTION_META.map((section, sectionIndex) => {
        const group = statistics[section.key];
        if (!group || typeof group !== "object") return null;
        const entries = Object.entries(group as Record<string, unknown>).filter(
          ([, value]) => typeof value === "number" || typeof value === "string"
        );
        if (!entries.length) return null;
        const Icon = section.icon;

        return (
          <section key={section.key} className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="rounded-xl bg-primary/10 p-2 text-primary">
                <Icon className="h-4 w-4" />
              </span>
              <h2 className="text-lg font-bold text-foreground">
                {section.title}
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {entries.map(([field, value], index) => {
                const label = formatBalanceFieldLabel(field);
                const numeric = asNumber(value);
                return (
                  <motion.div
                    key={`${section.key}-${field}`}
                    {...cardMotion(sectionIndex + index)}
                  >
                    <StatCard
                      title={label}
                      value={
                        isMoneyLabel(label)
                          ? formatCurrency(numeric)
                          : formatCount(numeric)
                      }
                      gradient={`bg-gradient-to-br ${
                        GRADIENT_CARDS[
                          (sectionIndex + index) % GRADIENT_CARDS.length
                        ]
                      }`}
                      icon={
                        isMoneyLabel(label) ? (
                          <CircleDollarSign className="h-5 w-5" />
                        ) : section.key === "users" ? (
                          <Store className="h-5 w-5" />
                        ) : (
                          <Icon className="h-5 w-5" />
                        )
                      }
                    />
                  </motion.div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

export function SuperAdminStatisticsEmpty() {
  return (
    <Card>
      <CardHeader
        title="No statistics available"
        subtitle="The API returned no statistics data"
      />
    </Card>
  );
}
